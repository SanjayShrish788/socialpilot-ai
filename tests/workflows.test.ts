import test from "node:test";
import assert from "node:assert/strict";
import { demoWorkspace } from "../src/lib/demo";
import { classify, transition, guard } from "../src/lib/engine";
import { runAgent, executeTool } from "../src/lib/agent";
import { workspaceSchema } from "../src/lib/validation";
import {
  DemoSocialAdapter,
  UnconnectedSocialAdapter,
} from "../src/lib/integrations";
test("demo data validates and mutations do not modify the original", () => {
  const w = demoWorkspace();
  assert.ok(workspaceSchema.parse(w));
  const next = transition(w, {
    type: "reviewPost",
    id: "seed-1",
    decision: "Approved",
  });
  assert.equal(w.posts[0].status, "In review");
  assert.equal(next.posts[0].status, "Approved");
  assert.equal(next.approvals.length, 1);
});
test("unapproved posts cannot schedule; complete review and scheduling is idempotent", () => {
  let w = demoWorkspace();
  assert.throws(
    () => transition(w, { type: "schedule", id: "seed-2" }),
    /approval/,
  );
  w = transition(w, { type: "reviewPost", id: "seed-1", decision: "Approved" });
  w = transition(w, { type: "schedule", id: "seed-1" });
  w = transition(w, { type: "tick" });
  assert.equal(w.posts[0].status, "Published (demo)");
  const next = transition(w, { type: "tick" });
  assert.equal(
    next.posts.filter((p) => p.status === "Published (demo)").length,
    1,
  );
});
test("editing approved content invalidates approval and scheduling", () => {
  let w = transition(demoWorkspace(), {
    type: "reviewPost",
    id: "seed-1",
    decision: "Approved",
  });
  w = transition(w, {
    type: "savePost",
    post: { ...w.posts[0], caption: "A different message" },
  });
  assert.equal(w.posts[0].status, "Draft");
  assert.throws(() => transition(w, { type: "schedule", id: "seed-1" }));
});
test("sensitive language is classified before less severe intent", () => {
  assert.equal(
    classify("Love this, but my lawyer will contact you about the injury"),
    "sensitive",
  );
  assert.equal(classify("Could I get a quote?"), "sales enquiry");
  assert.equal(classify("Free money click here"), "spam");
  assert.equal(classify("My delivery is late"), "negative");
});
test("triage escalates sensitive messages, never sends, and preserves approvals", async () => {
  let { workspace: w } = await runAgent(
    demoWorkspace(),
    "engage",
    "Triage",
    "Instagram",
    "2026-11-18",
  );
  assert.ok(w.alerts.some((a) => a.engagementId === "e3"));
  assert.ok(w.engagements.every((e) => e.status === "Drafted"));
  assert.throws(
    () => transition(w, { type: "sendReply", id: "e3" }),
    /approval/,
  );
  w = transition(w, { type: "reviewReply", id: "e3" });
  w = transition(w, { type: "sendReply", id: "e3" });
  assert.equal(w.engagements.find((e) => e.id === "e3")?.status, "Sent (demo)");
  const next = await runAgent(w, "engage", "Triage", "Instagram", "2026-11-18");
  assert.equal(
    next.workspace.engagements.find((e) => e.id === "e3")?.status,
    "Sent (demo)",
  );
});
test("edited replies must be approved again", async () => {
  let { workspace: w } = await runAgent(
    demoWorkspace(),
    "engage",
    "Triage",
    "Instagram",
    "2026-11-18",
  );
  w = transition(w, { type: "reviewReply", id: "e1" });
  w = transition(w, { type: "reply", id: "e1", reply: "Changed reply" });
  assert.throws(() => transition(w, { type: "sendReply", id: "e1" }));
});
test("30 days per configured channel and rerun preserves existing slots", async () => {
  const w = demoWorkspace();
  w.posts = [];
  const first = await runAgent(
    w,
    "plan",
    "Useful habits",
    "Instagram",
    "2026-12-01",
  );
  assert.equal(first.workspace.posts.length, 60);
  const next = await runAgent(
    first.workspace,
    "plan",
    "Useful habits",
    "Instagram",
    "2026-12-01",
  );
  assert.equal(next.workspace.posts.length, 60);
  assert.ok(next.workspace.posts.every((p) => p.status === "Draft"));
});
test("brand prohibited phrases and fake engagement are blocked", () => {
  const w = demoWorkspace();
  assert.throws(() => guard(w, "guaranteed results"), /Brand policy/);
  assert.throws(() => guard(w, "Write fake reviews"), /Authenticity/);
});
test("tool errors are logged and schemas reject invalid channels", async () => {
  const w = demoWorkspace();
  await assert.rejects(
    executeTool(w, "generate_content", {
      channel: "X",
      topic: "a",
      date: "bad",
    }),
  );
  assert.equal(w.logs[0].status, "error");
});
test("real adapters fail explicitly and demo delivery has no external ID", async () => {
  await assert.rejects(
    new UnconnectedSocialAdapter("Instagram").publish(),
    /not connected/,
  );
  const p = { ...demoWorkspace().posts[0], status: "Scheduled" as const };
  const result = await new DemoSocialAdapter().publish(p);
  assert.equal(result.mode, "demo");
  assert.equal(result.externalId, null);
});
test("unconfigured model fails without fabricated success", async () => {
  const previous = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    await assert.rejects(
      runAgent(
        demoWorkspace(),
        "create",
        "A topic",
        "Instagram",
        "2026-11-18",
        "claude",
      ),
      /Missing/,
    );
  } finally {
    if (previous) process.env.ANTHROPIC_API_KEY = previous;
  }
});

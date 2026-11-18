import assert from "node:assert/strict";
import { demoWorkspace } from "../src/lib/demo";
import { sections } from "../src/lib/workspace";
const base = process.env.BASE_URL || "http://localhost:3000";
for (const path of [
  "/",
  ...Object.keys(sections).map((s) => "/" + s),
  "/api/health",
]) {
  const r = await fetch(base + path);
  assert.equal(r.status, 200, path);
  console.log("PASS GET", path);
}
let workspace = demoWorkspace();
async function action(
  a: unknown,
  status = 200,
  provider = "demo",
  origin = base,
) {
  const r = await fetch(base + "/api/action", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ workspace, action: a, provider }),
  });
  const data = await r.json();
  assert.equal(r.status, status, JSON.stringify(data));
  if (data.workspace) workspace = data.workspace;
  return data;
}
await action({ type: "schedule", id: "seed-2" }, 400);
await action({
  type: "agent",
  task: "create",
  topic: "Simple habits",
  channel: "Instagram",
  date: new Date().toISOString().slice(0, 10),
});
const post = workspace.posts[0];
assert.equal(post.status, "Draft");
await action({ type: "reviewPost", id: post.id, decision: "In review" });
await action({ type: "reviewPost", id: post.id, decision: "Approved" });
await action({ type: "schedule", id: post.id });
await action({ type: "tick" });
assert.equal(workspace.posts[0].status, "Published (demo)");
await action({
  type: "agent",
  task: "engage",
  topic: "Triage inbox",
  channel: "Instagram",
});
await action({ type: "sendReply", id: "e3" }, 400);
await action({ type: "reviewReply", id: "e3" });
await action({ type: "sendReply", id: "e3" });
await action({
  type: "agent",
  task: "insights",
  topic: "Report",
  channel: "Instagram",
});
assert.match(workspace.insight, /Demo analysis/);
await action({ type: "tick" }, 403, "demo", "https://untrusted.example");
await action(
  { type: "agent", task: "create", topic: "Test", channel: "Instagram" },
  401,
  "claude",
);
console.log(
  "PASS HTTP workflow, approval guards, crisis reply, insights, origin and paid-AI authentication",
);

import test from "node:test";
import assert from "node:assert/strict";
import { runAgent } from "../src/lib/agent";
import { demoWorkspace } from "../src/lib/demo";
test("Claude tool protocol executes and saves model-authored drafts", async () => {
  const originalFetch = globalThis.fetch;
  const key = process.env.ANTHROPIC_API_KEY,
    model = process.env.ANTHROPIC_MODEL;
  process.env.ANTHROPIC_API_KEY = "test-key";
  process.env.ANTHROPIC_MODEL = "test-model";
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(String(options?.body));
    assert.equal(body.model, "test-model");
    calls++;
    if (calls === 1)
      return Response.json({
        content: [
          { type: "tool_use", id: "tool1", name: "read_brand", input: {} },
        ],
      });
    if (calls === 2) {
      assert.equal(body.messages[2].content[0].type, "tool_result");
      return Response.json({
        content: [
          {
            type: "tool_use",
            id: "tool2",
            name: "write_content",
            input: {
              title: "A thoughtful habit",
              caption: "Pick one reusable essential for tomorrow.",
              hashtags: "#ThoughtfulHabits",
              slides: "1. Start small",
              channel: "Instagram",
              date: "2026-11-18",
            },
          },
        ],
      });
    }
    return Response.json({
      content: [{ type: "text", text: "Saved one draft for human review." }],
    });
  };
  try {
    const result = await runAgent(
      demoWorkspace(),
      "create",
      "Habits",
      "Instagram",
      "2026-11-18",
      "claude",
    );
    assert.equal(result.workspace.posts[0].title, "A thoughtful habit");
    assert.equal(result.workspace.posts[0].status, "Draft");
    assert.equal(calls, 3);
    assert.equal(result.workspace.approvals.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (key) process.env.ANTHROPIC_API_KEY = key;
    else delete process.env.ANTHROPIC_API_KEY;
    if (model) process.env.ANTHROPIC_MODEL = model;
    else delete process.env.ANTHROPIC_MODEL;
  }
});

import type { Workspace, Post, Channel } from "./workspace";
import type { Action } from "./validation";
import { DemoScheduler } from "./integrations";
import { postSchema } from "./validation";
export const id = () => crypto.randomUUID();
export function audit(
  w: Workspace,
  tool: string,
  detail: string,
  status: "success" | "error" = "success",
) {
  w.logs.unshift({
    id: id(),
    time: new Date().toISOString(),
    tool,
    detail,
    status,
  });
  w.logs = w.logs.slice(0, 1000);
}
export function classify(text: string) {
  if (
    /lawyer|legal|sue\b|lawsuit|injur|harm|unsafe|racis|discriminat|harass|fraud|data breach|suicid|death|kill|threat|hospital|recall|poison|assault/i.test(
      text,
    )
  )
    return "sensitive";
  if (/free money|crypto|click here|win cash/i.test(text)) return "spam";
  if (/quote|price|buy|purchase|bulk|pricing/i.test(text))
    return "sales enquiry";
  if (/disappoint|late|bad|terrible|refund|broken|complaint/i.test(text))
    return "negative";
  if (/love|great|thank|amazing/i.test(text)) return "positive";
  return "general";
}
export function guard(w: Workspace, text: string) {
  if (
    /fake reviews?|fake engagement|invent.*(metrics|testimonial)|buy.*followers/i.test(
      text,
    )
  )
    throw new Error(
      "Authenticity policy: fake reviews, engagement and metrics are prohibited.",
    );
  const phrase = w.brand.prohibited
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)
    .find((p) => text.toLowerCase().includes(p));
  if (phrase)
    throw new Error(`Brand policy: remove prohibited phrase “${phrase}”.`);
}
function record(
  w: Workspace,
  targetId: string,
  decision: string,
  content: string,
) {
  w.approvals.unshift({
    id: id(),
    targetId,
    decision,
    content,
    actor: "Human reviewer",
    time: new Date().toISOString(),
  });
}
function checkPostApproval(w: Workspace, post: Post) {
  const approval = w.approvals.find((a) => a.targetId === post.id);
  const revision = JSON.stringify(
    postSchema.parse({ ...post, status: "Approved" }),
  );
  if (approval?.decision !== "Approved" || approval.content !== revision) {
    throw new Error("Human approval of the current post revision is required");
  }
  guard(w, [post.title, post.caption, post.hashtags, post.slides].join(" "));
}
export function transition(
  workspace: Workspace,
  action: Exclude<Action, { type: "agent" }>,
): Workspace {
  const w = structuredClone(workspace);
  const post =
    "id" in action ? w.posts.find((p) => p.id === action.id) : undefined;
  const item =
    "id" in action ? w.engagements.find((e) => e.id === action.id) : undefined;
  switch (action.type) {
    case "brand":
      w.brand = action.brand;
      break;
    case "savePost": {
      const existing = w.posts.find((p) => p.id === action.post.id);
      if (existing?.status === "Published (demo)")
        throw new Error(
          "Published demo content is immutable. Create a new draft.",
        );
      const draft = { ...action.post, status: "Draft" as const };
      w.posts = existing
        ? w.posts.map((p) => (p.id === draft.id ? draft : p))
        : [draft, ...w.posts];
      if (existing)
        record(w, draft.id, "Approval invalidated by edit", draft.caption);
      break;
    }
    case "reviewPost":
      if (!post) throw new Error("Post not found");
      if (post.status === "Published (demo)")
        throw new Error("Published content cannot be reviewed again");
      if (action.decision === "In review") {
        if (post.status !== "Draft" && post.status !== "Changes requested")
          throw new Error(
            "Only drafts and posts needing changes can be submitted",
          );
      } else if (post.status !== "In review") {
        throw new Error("Submit the draft for review first");
      }
      if (action.decision === "Approved") {
        guard(
          w,
          [post.title, post.caption, post.hashtags, post.slides].join(" "),
        );
        if (!post.caption.trim()) throw new Error("A caption is required");
      }
      post.status = action.decision;
      record(
        w,
        post.id,
        action.decision,
        JSON.stringify(postSchema.parse(post)),
      );
      break;
    case "schedule":
      if (!post || post.status !== "Approved")
        throw new Error("Human approval is required before scheduling");
      checkPostApproval(w, post);
      post.status = "Scheduled";
      break;
    case "tick":
      for (const p of new DemoScheduler().due(w.posts, new Date())) {
        try {
          checkPostApproval(w, p);
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : "Approval check failed";
          p.status = "Changes requested";
          record(w, p.id, "Scheduling blocked", reason);
          audit(w, "scheduler.publish", `${p.title}: ${reason}`, "error");
          continue;
        }
        p.status = "Published (demo)";
        audit(
          w,
          "scheduler.publish",
          `${p.title}: simulated delivery only; no platform API called`,
        );
      }
      break;
    case "reply":
      if (!item || item.status === "Sent (demo)")
        throw new Error("Reply cannot be edited");
      item.reply = action.reply;
      item.status = "Drafted";
      record(w, item.id, "Approval invalidated by edit", item.reply);
      break;
    case "reviewReply":
      if (!item || item.status !== "Drafted" || !item.reply.trim())
        throw new Error("Draft a reply first");
      guard(w, item.reply);
      item.status = "Approved";
      record(w, item.id, "Approved", item.reply);
      break;
    case "sendReply":
      if (
        !item ||
        item.status !== "Approved" ||
        !w.approvals.some(
          (a) =>
            a.targetId === item.id &&
            a.decision === "Approved" &&
            a.content === item.reply,
        )
      )
        throw new Error("Human approval of the current reply is required");
      guard(w, item.reply);
      item.status = "Sent (demo)";
      item.respondedAt = new Date().toISOString();
      break;
    case "resolve": {
      const alert = w.alerts.find((a) => a.id === action.id);
      if (!alert) throw new Error("Alert not found");
      alert.status = "Resolved";
      record(w, alert.id, "Resolved by human", alert.reason);
      break;
    }
  }
  audit(
    w,
    action.type,
    "Action completed" +
      (action.type === "sendReply" ? " in demo mode. No message sent." : ""),
  );
  return w;
}
export function makePost(
  w: Workspace,
  topic: string,
  channel: Channel,
  date: string,
  index = 0,
): Post {
  guard(w, topic);
  const angles = [
    "A practical guide",
    "Behind the scenes",
    "One question worth asking",
    "A small experiment",
    "What we are learning",
    "Your next step",
  ];
  const angle = angles[index % angles.length];
  const caption =
    channel === "LinkedIn"
      ? `${angle}: ${topic}\n\nAt ${w.brand.name}, we are exploring what ${topic.toLowerCase()} means for ${w.brand.audience}.\n\nStart with one specific challenge. Try a small change, collect feedback, and share what you learn.\n\nOur focus: ${w.brand.goals}. What would you test first?`
      : `${angle} 🌿\n\nLet’s talk about ${topic.toLowerCase()}. A little intention goes a long way.\n\n1. Pick one habit that fits your day.\n2. Make it easy to repeat.\n3. Notice what works for you.\n\nWhat would you add? Tell ${w.brand.name} below.`;
  return {
    id: id(),
    title: `${angle}: ${topic}`.slice(0, 300),
    caption,
    hashtags: `#${w.brand.name.replace(/[^a-zA-Z0-9]/g, "")} #${topic.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35)} ${channel === "LinkedIn" ? "#ProfessionalGrowth" : "#EverydayInspiration"}`,
    slides: `1. ${topic}\n2. The challenge: make it specific\n3. A practical first step\n4. A question for your community\n5. Save this guide from ${w.brand.name}`,
    channel,
    date,
    status: "Draft",
  };
}

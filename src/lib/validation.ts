import { z } from "zod";
const text = z.string().max(20000);
export const channelSchema = z.enum(["Instagram", "LinkedIn", "Facebook"]);
export const brandSchema = z.object({
  name: z.string().trim().min(1).max(120),
  industry: text,
  voice: z.string().min(1).max(4000),
  audience: z.string().min(1).max(4000),
  goals: text,
  prohibited: text,
  channels: z.array(channelSchema).min(1).max(3),
});
export const postSchema = z.object({
  id: text,
  title: z.string().min(1).max(300),
  caption: text,
  hashtags: text,
  slides: text,
  channel: channelSchema,
  date: z.iso.date(),
  status: z.enum([
    "Draft",
    "In review",
    "Changes requested",
    "Approved",
    "Scheduled",
    "Published (demo)",
  ]),
});
export const workspaceSchema = z.object({
  brand: brandSchema,
  posts: z.array(postSchema).max(1000),
  engagements: z
    .array(
      z.object({
        id: text,
        author: text,
        channel: channelSchema,
        kind: z.enum(["Comment", "DM", "Mention"]),
        text,
        category: text,
        reply: text,
        status: z.enum(["New", "Drafted", "Approved", "Sent (demo)"]),
        receivedAt: z.iso.datetime(),
        respondedAt: z.iso.datetime().optional(),
      }),
    )
    .max(1000),
  alerts: z
    .array(
      z.object({
        id: text,
        engagementId: text,
        reason: text,
        status: z.enum(["Open", "Resolved"]),
        owner: text,
      }),
    )
    .max(1000),
  logs: z
    .array(
      z.object({
        id: text,
        time: text,
        tool: text,
        status: z.enum(["success", "error"]),
        detail: text,
      }),
    )
    .max(3000),
  approvals: z
    .array(
      z.object({
        id: text,
        targetId: text,
        decision: text,
        actor: text,
        time: text,
        content: text,
      }),
    )
    .max(3000),
  insight: text,
});
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("brand"), brand: brandSchema }),
  z.object({ type: z.literal("savePost"), post: postSchema }),
  z.object({
    type: z.literal("reviewPost"),
    id: text,
    decision: z.enum(["Approved", "Changes requested", "In review"]),
  }),
  z.object({ type: z.literal("schedule"), id: text }),
  z.object({ type: z.literal("tick") }),
  z.object({
    type: z.literal("reply"),
    id: text,
    reply: z.string().trim().min(1).max(4000),
  }),
  z.object({ type: z.literal("reviewReply"), id: text }),
  z.object({ type: z.literal("sendReply"), id: text }),
  z.object({ type: z.literal("resolve"), id: text }),
  z.object({
    type: z.literal("agent"),
    task: z.enum(["plan", "create", "engage", "insights"]),
    topic: z.string().max(2000).default("Everyday sustainability"),
    channel: channelSchema.default("Instagram"),
    date: z.iso.date().optional(),
  }),
]);
export type Action = z.infer<typeof actionSchema>;

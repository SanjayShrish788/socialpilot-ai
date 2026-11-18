export const channels = ["Instagram", "LinkedIn", "Facebook"] as const;
export type Channel = (typeof channels)[number];
export type PostStatus =
  | "Draft"
  | "In review"
  | "Changes requested"
  | "Approved"
  | "Scheduled"
  | "Published (demo)";
export type Post = {
  id: string;
  title: string;
  caption: string;
  hashtags: string;
  slides: string;
  channel: Channel;
  date: string;
  status: PostStatus;
};
export type Brand = {
  name: string;
  voice: string;
  audience: string;
  goals: string;
  channels: Channel[];
  industry: string;
  prohibited: string;
};
export type Engagement = {
  id: string;
  author: string;
  channel: Channel;
  kind: "Comment" | "DM" | "Mention";
  text: string;
  category: string;
  reply: string;
  status: "New" | "Drafted" | "Approved" | "Sent (demo)";
  receivedAt: string;
  respondedAt?: string;
};
export type Log = {
  id: string;
  time: string;
  tool: string;
  status: "success" | "error";
  detail: string;
};
export type Approval = {
  id: string;
  targetId: string;
  decision: string;
  actor: string;
  time: string;
  content: string;
};
export type Alert = {
  id: string;
  engagementId: string;
  reason: string;
  status: "Open" | "Resolved";
  owner: string;
};
export type Workspace = {
  brand: Brand;
  posts: Post[];
  engagements: Engagement[];
  alerts: Alert[];
  logs: Log[];
  approvals: Approval[];
  insight: string;
};
export const emptyWorkspace: Workspace = {
  brand: {
    name: "",
    voice: "",
    audience: "",
    goals: "",
    channels: [],
    industry: "",
    prohibited: "",
  },
  posts: [],
  engagements: [],
  alerts: [],
  logs: [],
  approvals: [],
  insight: "",
};
export const sections = {
  "brand-profile": {
    title: "Brand Profile",
    description:
      "Define your voice, audience, channels, and goals before creating content.",
  },
  "ai-agent": {
    title: "AI Agent",
    description: "Review the agent’s role and its human approval boundaries.",
  },
  "content-calendar": {
    title: "Content Calendar",
    description: "Plan a month of content and filter it by channel.",
  },
  "content-studio": {
    title: "Content Studio",
    description: "Write captions, organize hashtags, and outline carousels.",
  },
  "approval-inbox": {
    title: "Approval Inbox",
    description: "Review public content before it moves forward.",
  },
  engagement: {
    title: "Engagement",
    description: "Track comments, direct messages, and brand mentions.",
  },
  "crisis-center": {
    title: "Crisis Center",
    description:
      "Keep crisis replies, legal matters, and public statements under human review.",
  },
  analytics: {
    title: "Analytics",
    description:
      "Track reach, engagement, follower growth, and response performance.",
  },
  integrations: {
    title: "Integrations",
    description:
      "See which services will power publishing, engagement, and reporting.",
  },
} as const;
export type Section = keyof typeof sections;

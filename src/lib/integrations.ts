import type { Engagement, Post } from "./workspace";
export type Delivery = {
  mode: "demo" | "live";
  externalId: string | null;
  message: string;
};
export interface SocialAdapter {
  publish(post: Post): Promise<Delivery>;
  reply(item: Engagement): Promise<Delivery>;
}
export class DemoSocialAdapter implements SocialAdapter {
  async publish(post: Post): Promise<Delivery> {
    if (post.status !== "Scheduled")
      throw new Error("Only approved scheduled posts can be delivered");
    return {
      mode: "demo",
      externalId: null,
      message: "Simulated post. No platform request made.",
    };
  }
  async reply(item: Engagement): Promise<Delivery> {
    if (item.status !== "Approved")
      throw new Error("Reply requires human approval");
    return {
      mode: "demo",
      externalId: null,
      message: "Simulated reply. No platform request made.",
    };
  }
}
export class UnconnectedSocialAdapter implements SocialAdapter {
  constructor(readonly platform: "Instagram" | "LinkedIn" | "Meta") {}
  async publish(): Promise<Delivery> {
    throw new Error(
      `${this.platform} is not connected. Configure OAuth, permissions and a tested delivery implementation.`,
    );
  }
  async reply(): Promise<Delivery> {
    throw new Error(`${this.platform} is not connected.`);
  }
}
export interface SocialListeningAdapter {
  readMentions(): Promise<Engagement[]>;
}
export class DemoListeningAdapter implements SocialListeningAdapter {
  constructor(private items: Engagement[]) {}
  async readMentions() {
    return this.items.filter((e) => e.kind === "Mention");
  }
}
export interface Scheduler {
  due(posts: Post[], now: Date): Post[];
}
export class DemoScheduler implements Scheduler {
  due(posts: Post[], now: Date) {
    return posts.filter(
      (p) =>
        p.status === "Scheduled" && p.date <= now.toISOString().slice(0, 10),
    );
  }
}

import { emptyWorkspace, type Workspace } from "./workspace";
export function demoWorkspace(): Workspace {
  const date = new Date().toISOString().slice(0, 10);
  return {
    ...structuredClone(emptyWorkspace),
    brand: {
      name: "Bloom & Co.",
      industry: "Sustainable lifestyle",
      voice:
        "Warm, practical and optimistic. Clear language, specific advice, no exaggerated claims.",
      audience:
        "Mindful professionals aged 25–40 who want sustainable everyday habits",
      goals:
        "Build trust, start meaningful conversations, and introduce our reusable essentials",
      prohibited: "guaranteed, planet-saving, best in the world",
      channels: ["Instagram", "LinkedIn"],
    },
    posts: [
      {
        id: "seed-1",
        title: "Small rituals. Lasting change.",
        caption:
          "One reusable cup. One less decision each morning. Start with a habit that fits your day, then build from there. What is one small change you have kept?",
        hashtags: "#MindfulLiving #EverydayHabits #BloomAndCo",
        slides:
          "1. Start with your morning\n2. Choose one reusable essential\n3. Keep it where you need it\n4. Make it your ritual",
        channel: "Instagram",
        date,
        status: "In review",
      },
      {
        id: "seed-2",
        title: "A more thoughtful workplace",
        caption:
          "A practical sustainability initiative starts with listening. Ask your team which everyday habit feels easiest to change. Pilot one idea, gather feedback, and share what you learned.",
        hashtags: "#SustainableWorkplace #TeamCulture",
        slides: "",
        channel: "LinkedIn",
        date,
        status: "Draft",
      },
    ],
    engagements: [
      {
        id: "e1",
        author: "Maya Chen",
        channel: "Instagram",
        kind: "Comment",
        text: "Love the reusable cup! Does it fit in a standard cup holder?",
        category: "general",
        reply: "",
        status: "New",
        receivedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "e2",
        author: "Arjun Mehta",
        channel: "LinkedIn",
        kind: "DM",
        text: "We would love a quote for 100 welcome kits for our team.",
        category: "sales enquiry",
        reply: "",
        status: "New",
        receivedAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "e3",
        author: "Jordan Lee",
        channel: "Instagram",
        kind: "Comment",
        text: "My order caused an injury. I am contacting my lawyer and taking legal action.",
        category: "sensitive",
        reply: "",
        status: "New",
        receivedAt: new Date(Date.now() - 2400000).toISOString(),
      },
      {
        id: "e4",
        author: "Sofia Patel",
        channel: "Instagram",
        kind: "Mention",
        text: "A week with my new cup and I love it. Thank you Bloom & Co!",
        category: "positive",
        reply: "",
        status: "New",
        receivedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: "e5",
        author: "Chris Miller",
        channel: "LinkedIn",
        kind: "Comment",
        text: "Disappointed that my delivery is late. Can someone help?",
        category: "negative",
        reply: "",
        status: "New",
        receivedAt: new Date(Date.now() - 900000).toISOString(),
      },
    ],
    alerts: [
      {
        id: "a1",
        engagementId: "e3",
        reason: "Potential injury and legal threat. Human review required.",
        status: "Open",
        owner: "Brand manager",
      },
    ],
  };
}

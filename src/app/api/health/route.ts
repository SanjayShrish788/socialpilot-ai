export function GET() {
  return Response.json({
    status: "ok",
    mode: "demo",
    ai: {
      claude: !!process.env.ANTHROPIC_API_KEY,
      compatible: !!process.env.AI_API_KEY,
    },
    publishing: "simulated only",
  });
}

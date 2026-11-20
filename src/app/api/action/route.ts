import { NextResponse } from "next/server";
import { z } from "zod";
import { actionSchema, workspaceSchema } from "@/lib/validation";
import { transition } from "@/lib/engine";
import { runAgent } from "@/lib/agent";
export const maxDuration = 300;
const requestSchema = z.object({
  workspace: workspaceSchema,
  action: actionSchema,
  provider: z.enum(["demo", "claude", "compatible"]).default("demo"),
});
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    const requestUrl = new URL(req.url);
    const host = req.headers.get("host") ?? requestUrl.host;
    const protocol =
      req.headers.get("x-forwarded-proto") ?? requestUrl.protocol.slice(0, -1);
    if (origin && origin !== `${protocol}://${host}`)
      return NextResponse.json(
        { error: "Cross-origin request refused" },
        { status: 403 },
      );
    const raw = await req.text();
    if (raw.length > 2000000)
      return NextResponse.json(
        { error: "Workspace too large" },
        { status: 413 },
      );
    const { workspace, action, provider } = requestSchema.parse(
      JSON.parse(raw),
    );
    // Paid model access is never exposed anonymously on a public demo deployment.
    if (action.type === "agent" && provider !== "demo") {
      const secret = process.env.APP_ACCESS_TOKEN;
      if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
        return NextResponse.json(
          {
            error:
              "Server AI access token is required. Configure it in Settings.",
          },
          { status: 401 },
        );
    }
    const result =
      action.type === "agent"
        ? await runAgent(
            workspace,
            action.task,
            action.topic,
            action.channel,
            action.date || new Date().toISOString().slice(0, 10),
            provider,
          )
        : {
            workspace: transition(workspace, action),
            message: "Saved successfully",
          };
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "Invalid input: " +
              e.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ")
            : e instanceof Error
              ? e.message
              : "Operation failed",
      },
      { status: 400 },
    );
  }
}

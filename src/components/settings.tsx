"use client";
import { useEffect, useState } from "react";
import { Download, Upload, Sparkles, ShieldCheck } from "lucide-react";
import { useWorkspace } from "./workspace-provider";
import { Card } from "./ui";
import { demoWorkspace } from "@/lib/demo";
import { workspaceSchema } from "@/lib/validation";
import { getSupabase } from "@/lib/supabase";
function download(data: string) {
  const url = URL.createObjectURL(
    new Blob([data], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "socialpilot-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Settings() {
  const { workspace, provider, setProvider, replace, busy } = useWorkspace();
  const [token, setToken] = useState(""),
    [email, setEmail] = useState(""),
    [user, setUser] = useState(""),
    [message, setMessage] = useState(""),
    [working, setWorking] = useState(false),
    [health, setHealth] = useState<{
      ai: { claude: boolean; compatible: boolean };
    } | null>(null);
  const db = getSupabase();
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setMessage("Unable to check server configuration"));
    if (db) {
      void db.auth
        .getSession()
        .then(({ data }) => setUser(data.session?.user.email || ""));
      const { data } = db.auth.onAuthStateChange((_, s) =>
        setUser(s?.user.email || ""),
      );
      return () => data.subscription.unsubscribe();
    }
  }, [db]);
  async function cloud(action: "login" | "save" | "load" | "logout") {
    if (!db) return;
    setWorking(true);
    setMessage("");
    try {
      if (action === "login") {
        const { error } = await db.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: location.origin + "/integrations" },
        });
        if (error) throw error;
        setMessage("Check your email for a sign-in link.");
      }
      if (action === "logout") {
        const { error } = await db.auth.signOut();
        if (error) throw error;
        setUser("");
        setMessage("Signed out. Local demo data remains in this browser.");
      }
      if (action === "save" || action === "load") {
        const {
          data: { user },
          error: authError,
        } = await db.auth.getUser();
        if (authError || !user) throw new Error("Sign in first");
        if (action === "save") {
          const { error } = await db.rpc("save_workspace", {
            payload: workspaceSchema.parse(workspace),
          });
          if (error) throw error;
          setMessage(
            "Snapshot saved to Supabase. Normalized records and audit snapshot updated.",
          );
        } else {
          const { data, error } = await db
            .from("workspace_snapshots")
            .select("payload")
            .eq("user_id", user.id)
            .single();
          if (error) throw error;
          replace(workspaceSchema.parse(data.payload));
          setMessage("Cloud snapshot loaded into this browser.");
        }
      }
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Cloud operation failed. Check database migration and policies.",
      );
    } finally {
      setWorking(false);
    }
  }
  return (
    <>
      <div className="hint">
        Demo mode is active for social channels. No social credentials are
        configured or requested here; publishing and replies are simulations.
      </div>
      <div className="integrations-grid">
        {[
          {
            name: "Instagram",
            logo: "◎",
            text: "Posts, captions, comments and carousel drafts.",
          },
          {
            name: "LinkedIn",
            logo: "in",
            text: "Professional content, conversations and channel insights.",
          },
          {
            name: "Meta / Facebook",
            logo: "f",
            text: "Page content and comments through the Meta adapter.",
          },
          {
            name: "Social listening",
            logo: "◉",
            text: "Seeded brand mentions. Live listening requires a licensed provider.",
          },
        ].map((c) => (
          <Card
            key={c.name}
            title={c.name}
            aside={<span className="badge">Demo adapter</span>}
          >
            <div className="integration-logo">{c.logo}</div>
            <p>{c.text}</p>
            <details>
              <summary className="text-action">Connection requirements</summary>
              <p className="muted">
                Create a developer application, obtain approved account scopes,
                configure server-only OAuth credentials and implement the
                adapter in src/lib/integrations.ts. See README for setup. Live
                delivery is intentionally disabled until connected and tested.
              </p>
            </details>
          </Card>
        ))}
      </div>
      <div className="two-column">
        <Card
          title="AI provider"
          description="Keys stay on the server. Missing credentials produce an explicit error."
          aside={<Sparkles size={20} />}
        >
          <label>
            Generation mode
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as typeof provider)}
            >
              <option value="demo">Demo · deterministic templates</option>
              <option value="claude">Claude · server API</option>
              <option value="compatible">OpenAI-compatible · server API</option>
            </select>
          </label>
          <p className="muted">
            Claude: {health?.ai.claude ? "Configured" : "Not configured"} ·
            Compatible:{" "}
            {health?.ai.compatible ? "Configured" : "Not configured"}
          </p>
          <label>
            AI access token
            <input
              type="password"
              autoComplete="off"
              placeholder="Session-only token; required for paid model access"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <button
            className="button"
            onClick={() => {
              sessionStorage.setItem("socialpilot.ai-token", token);
              setToken("");
              setMessage("Access token saved for this tab session.");
            }}
          >
            Save session token
          </button>
          <div className="hint" style={{ marginTop: 18 }}>
            Set server variables ANTHROPIC_API_KEY / ANTHROPIC_MODEL or
            AI_API_KEY / AI_MODEL, and APP_ACCESS_TOKEN. Never place API keys in
            browser code.
          </div>
        </Card>
        <Card
          title="Supabase workspace backup"
          description="Optional authenticated cloud persistence"
          aside={<ShieldCheck size={20} />}
        >
          <span className="badge">
            {db ? "Supabase configured" : "Local persistence active"}
          </span>
          <p style={{ marginTop: 16 }}>
            Your demo workspace is saved in this browser after every action.
            Cloud snapshots require the SQL migration and an authenticated user.
            Saving replaces your own latest cloud snapshot; loading replaces
            local data.
          </p>
          {db ? (
            <>
              {user ? (
                <>
                  <p>Signed in as {user}</p>
                  <div className="toolbar">
                    <button
                      disabled={working || busy}
                      className="button"
                      onClick={() => void cloud("save")}
                    >
                      <Upload size={14} />
                      Save to cloud
                    </button>
                    <button
                      disabled={working || busy}
                      className="button"
                      onClick={() => {
                        if (
                          confirm(
                            "Replace local workspace with your cloud snapshot?",
                          )
                        )
                          void cloud("load");
                      }}
                    >
                      <Download size={14} />
                      Load cloud
                    </button>
                    <button
                      disabled={working}
                      className="button"
                      onClick={() => void cloud("logout")}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void cloud("login");
                  }}
                >
                  <label>
                    Email
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <button disabled={working} className="button primary">
                    Email sign-in link
                  </button>
                </form>
              )}
            </>
          ) : (
            <p className="muted">
              Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY,
              run the migration and restart. No service-role key is needed.
            </p>
          )}
        </Card>
      </div>
      <Card
        title="Workspace data"
        description="Portable backups and a repeatable demonstration"
      >
        <div className="toolbar">
          <button
            className="button"
            onClick={() => download(JSON.stringify(workspace, null, 2))}
          >
            <Download size={14} />
            Export backup
          </button>
          <label className="button" style={{ margin: 0, cursor: "pointer" }}>
            <Upload size={14} />
            Import backup
            <input
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  if (file.size > 2000000)
                    throw new Error("Backup is too large");
                  const parsed = workspaceSchema.parse(
                    JSON.parse(await file.text()),
                  );
                  if (
                    confirm(
                      "Replace this browser workspace with the selected backup?",
                    )
                  ) {
                    replace(parsed);
                    setMessage("Backup restored.");
                  }
                } catch {
                  setMessage(
                    "Invalid backup. Your current workspace was preserved.",
                  );
                }
                e.target.value = "";
              }}
            />
          </label>
          <button
            className="button danger"
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "Reset local data to the original demo? Export a backup first.",
                )
              ) {
                replace(demoWorkspace());
                setMessage("Demo workspace reset.");
              }
            }}
          >
            Reset demo data
          </button>
        </div>
        {message && (
          <div className="hint" role="status">
            {message}
          </div>
        )}
      </Card>
    </>
  );
}

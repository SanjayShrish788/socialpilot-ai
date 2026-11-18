"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Workspace } from "@/lib/workspace";
import type { Action } from "@/lib/validation";
import { workspaceSchema } from "@/lib/validation";
import { demoWorkspace } from "@/lib/demo";
const key = "socialpilot.workspace.v2";
type Context = {
  workspace: Workspace;
  busy: boolean;
  ready: boolean;
  notice: string;
  error: string;
  act: (action: Action) => Promise<boolean>;
  provider: "demo" | "claude" | "compatible";
  setProvider: (p: "demo" | "claude" | "compatible") => void;
  replace: (w: Workspace) => void;
};
const WorkspaceContext = createContext<Context | null>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => demoWorkspace());
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [provider, setProvider] = useState<"demo" | "claude" | "compatible">(
    "demo",
  );
  const lock = useRef(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setWorkspace(workspaceSchema.parse(JSON.parse(stored)));
    } catch {
      setError(
        "Stored data could not be read. Demo data loaded; export a backup before resetting.",
      );
    }
    setReady(true);
  }, []);
  function replace(w: Workspace) {
    try {
      localStorage.setItem(key, JSON.stringify(w));
      setWorkspace(w);
    } catch {
      throw new Error(
        "Browser storage is full or unavailable. Export a backup and free space.",
      );
    }
  }
  async function act(action: Action) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(sessionStorage.getItem("socialpilot.ai-token")
            ? {
                authorization: `Bearer ${sessionStorage.getItem("socialpilot.ai-token")}`,
              }
            : {}),
        },
        body: JSON.stringify({ workspace, action, provider }),
        signal: AbortSignal.timeout(280000),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Action failed");
      replace(workspaceSchema.parse(result.workspace));
      setNotice(result.message);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Action failed";
      setError(message);
      try {
        replace({
          ...workspace,
          logs: [
            {
              id: crypto.randomUUID(),
              time: new Date().toISOString(),
              tool:
                action.type === "agent" ? `agent.${action.task}` : action.type,
              status: "error" as const,
              detail: message,
            },
            ...workspace.logs,
          ].slice(0, 1000),
        });
      } catch {
        /* Preserve the original error when storage is unavailable. */
      }
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        busy,
        ready,
        notice,
        error,
        act,
        provider,
        setProvider,
        replace,
      }}
    >
      {children}
      {busy && (
        <div className="working" role="status">
          <span className="spinner" /> Working · executing validated actions
        </div>
      )}
      {(notice || error) && (
        <div
          className={"toast " + (error ? "error" : "")}
          role={error ? "alert" : "status"}
        >
          <span>{error || notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => {
              setError("");
              setNotice("");
            }}
          >
            ×
          </button>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace provider missing");
  return value;
}

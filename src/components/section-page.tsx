"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Download,
  MessageSquare,
  Plus,
  ShieldAlert,
  Sparkles,
  X,
  CalendarDays,
  Play,
  Save,
  Bot,
} from "lucide-react";
import {
  channels,
  sections,
  type Brand,
  type Channel,
  type Post,
  type Section,
} from "@/lib/workspace";
import { useWorkspace } from "./workspace-provider";
import { Card, EmptyState, PageHeader } from "./ui";
import { Performance } from "./performance";
import { ContentPerformance } from "./content-performance";
import { Settings } from "./settings";
const today = () => new Date().toISOString().slice(0, 10);
export function Badge({ value }: { value: string }) {
  return (
    <span className={"badge " + value.toLowerCase().replaceAll(" ", "-")}>
      {value}
    </span>
  );
}
export function exportFile(
  name: string,
  data: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function BrandProfile() {
  const { workspace, act, busy } = useWorkspace();
  const [brand, setBrand] = useState<Brand>(workspace.brand);
  function field(key: keyof Brand, value: string) {
    setBrand({ ...brand, [key]: value });
  }
  return (
    <div className="two-column">
      <Card
        title="Your brand, thoughtfully defined"
        description="A shared source of truth for every draft and reply."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void act({ type: "brand", brand });
          }}
        >
          <div className="form-grid">
            <label>
              Brand name
              <input
                required
                maxLength={120}
                value={brand.name}
                onChange={(e) => field("name", e.target.value)}
              />
            </label>
            <label>
              Industry
              <input
                value={brand.industry}
                onChange={(e) => field("industry", e.target.value)}
              />
            </label>
          </div>
          <label>
            Brand voice & tone
            <textarea
              required
              value={brand.voice}
              onChange={(e) => field("voice", e.target.value)}
            />
          </label>
          <label>
            Target audience
            <textarea
              required
              value={brand.audience}
              onChange={(e) => field("audience", e.target.value)}
            />
          </label>
          <label>
            Business goals
            <textarea
              value={brand.goals}
              onChange={(e) => field("goals", e.target.value)}
            />
          </label>
          <label>
            Prohibited phrases · comma separated
            <input
              value={brand.prohibited}
              onChange={(e) => field("prohibited", e.target.value)}
            />
          </label>
          <label>Social channels</label>
          <div className="check-row">
            {channels.map((c) => (
              <label key={c}>
                <input
                  type="checkbox"
                  checked={brand.channels.includes(c)}
                  onChange={(e) =>
                    setBrand({
                      ...brand,
                      channels: e.target.checked
                        ? [...brand.channels, c]
                        : brand.channels.filter((x) => x !== c),
                    })
                  }
                />
                {c}
              </label>
            ))}
          </div>
          <button className="button primary" disabled={busy}>
            <Save size={15} />
            Save brand profile
          </button>
        </form>
      </Card>
      <div>
        <Card
          title="A voice worth remembering"
          description="Good direction makes useful content."
        >
          <div className="preview-art">
            <span>BRAND PLAYBOOK</span>
            <strong>
              {brand.name || "Your brand"}
              <br />A little intention.
              <br />A lasting impression.
            </strong>
          </div>
          <hr className="divider" />
          <p>{brand.voice}</p>
          <div className="hint">
            AI providers receive this profile before generating content. Demo
            mode uses editable templates and cannot fully interpret a custom
            voice.
          </div>
          <Link className="text-action" href="/ai-agent">
            Put your brand to work <ArrowRight size={15} />
          </Link>
        </Card>
        <Card title="Approval policy">
          <ul className="plain-list">
            <li>
              <Check size={16} />
              Every public post needs human approval.
            </li>
            <li>
              <Check size={16} />
              Edits invalidate earlier approval.
            </li>
            <li>
              <ShieldAlert size={16} />
              Crisis and legal issues are escalated.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
function Generator({ task = "create" }: { task?: "create" | "plan" }) {
  const { workspace, act, busy, provider } = useWorkspace();
  const [topic, setTopic] = useState("Mindful everyday habits"),
    [channel, setChannel] = useState<Channel>(
      workspace.brand.channels[0] || "Instagram",
    ),
    [date, setDate] = useState(today());
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void act({ type: "agent", task, topic, channel, date });
      }}
    >
      <label>
        {task === "plan"
          ? "Campaign theme"
          : "What would you like to talk about?"}
        <textarea
          required
          maxLength={500}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </label>
      <div className="form-grid">
        <label>
          Channel
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
          >
            {channels.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          {task === "plan" ? "Start date" : "Planned date"}
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>
      <div className="hint">
        {task === "plan"
          ? `Creates a draft for each day across ${workspace.brand.channels.join(", ")}. Existing dates are preserved.`
          : provider === "demo"
            ? "Demo generator · editable templates, captions, hashtags and carousel outlines. Connect an AI provider in Settings for original AI writing."
            : "AI writing · your brand profile and guardrails guide generation."}
      </div>
      <button disabled={busy} className="button primary">
        <Sparkles size={16} />
        {task === "plan" ? "Generate 30-day calendar" : "Generate content"}
      </button>
    </form>
  );
}
function PostEditor({ post, onClose }: { post: Post; onClose: () => void }) {
  const { act, busy } = useWorkspace();
  const [draft, setDraft] = useState(post);
  const published = post.status === "Published (demo)";
  const modalRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const nodes = modalRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,textarea,select",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        role="dialog"
        ref={modalRef}
        aria-modal="true"
        aria-label={published ? "Published demo post" : "Edit post"}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">
          <h2>{published ? "Published demo post" : "Edit & reschedule"}</h2>
          <button
            onClick={onClose}
            className="icon-button"
            aria-label="Close editor"
          >
            <X size={20} />
          </button>
        </div>
        <p className="muted">
          {published
            ? "Simulated delivery. This revision is read-only."
            : "Saving changes returns this post to Draft and clears its approval."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (published) return;
            if (await act({ type: "savePost", post: draft })) onClose();
          }}
        >
          <fieldset disabled={published || busy}>
            <label>
              Title
              <input
                autoFocus
                required
                maxLength={300}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label>
                Channel
                <select
                  value={draft.channel}
                  onChange={(e) =>
                    setDraft({ ...draft, channel: e.target.value as Channel })
                  }
                >
                  {channels.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Planned date
                <input
                  required
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </label>
            </div>
            <label>
              Caption
              <textarea
                required
                rows={7}
                value={draft.caption}
                onChange={(e) =>
                  setDraft({ ...draft, caption: e.target.value })
                }
              />
            </label>
            <label>
              Hashtags
              <input
                value={draft.hashtags}
                onChange={(e) =>
                  setDraft({ ...draft, hashtags: e.target.value })
                }
              />
            </label>
            <label>
              Carousel slides
              <textarea
                rows={5}
                value={draft.slides}
                onChange={(e) => setDraft({ ...draft, slides: e.target.value })}
              />
            </label>
            {!published && (
              <button className="button primary" disabled={busy}>
                Save draft
              </button>
            )}
          </fieldset>
        </form>
      </section>
    </div>
  );
}
function PostCard({
  post,
  onEdit,
  review = false,
}: {
  post: Post;
  onEdit: (p: Post) => void;
  review?: boolean;
}) {
  const { act, busy } = useWorkspace();
  return (
    <article className="card post-card">
      <div className="post-meta">
        <b>{post.channel}</b>
        <span>{post.date}</span>
      </div>
      <h3>{post.title}</h3>
      <div>
        <Badge value={post.status} />
      </div>
      <p>{post.caption}</p>
      <div className="toolbar">
        {post.status !== "Published (demo)" && (
          <button className="button" onClick={() => onEdit(post)}>
            Edit
          </button>
        )}
        {["Draft", "Changes requested"].includes(post.status) && (
          <button
            disabled={busy}
            className="button primary"
            onClick={() =>
              void act({
                type: "reviewPost",
                id: post.id,
                decision: "In review",
              })
            }
          >
            Submit for review
          </button>
        )}
        {review && post.status === "In review" && (
          <>
            <button
              disabled={busy}
              className="button primary"
              onClick={() =>
                void act({
                  type: "reviewPost",
                  id: post.id,
                  decision: "Approved",
                })
              }
            >
              <Check size={14} />
              Approve
            </button>
            <button
              disabled={busy}
              className="button danger"
              onClick={() =>
                void act({
                  type: "reviewPost",
                  id: post.id,
                  decision: "Changes requested",
                })
              }
            >
              Reject
            </button>
          </>
        )}
        {post.status === "Approved" && (
          <button
            disabled={busy}
            className="button primary"
            onClick={() => void act({ type: "schedule", id: post.id })}
          >
            Schedule demo
          </button>
        )}
      </div>
    </article>
  );
}
function Studio() {
  const { workspace } = useWorkspace();
  const [editing, setEditing] = useState<Post | null>(null);
  const latest = workspace.posts[0];
  return (
    <>
      <div className="two-column">
        <Card
          title="From idea to on-brand content"
          description="Draft once. Shape it for every channel."
          aside={
            <span className="tile-icon">
              <Sparkles size={18} />
            </span>
          }
        >
          <Generator />
        </Card>
        <Card
          title="Post preview"
          description="Illustrative layout · your latest draft"
          aside={<Badge value="Human review required" />}
        >
          {latest ? (
            <div className="preview-post">
              <header>
                <span className="avatar">
                  {workspace.brand.name.slice(0, 2)}
                </span>
                <div>
                  <b>{workspace.brand.name}</b>
                  <div className="muted">{latest.channel} · Draft preview</div>
                </div>
              </header>
              <div className="preview-art">
                <span>{workspace.brand.name}</span>
                <strong>{latest.title}</strong>
              </div>
              <div className="preview-caption">
                {latest.caption}
                <br />
                <span className="channel-label">{latest.hashtags}</span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Your next story starts here"
              description="Generate or write a draft to preview it."
            />
          )}
        </Card>
      </div>
      <div className="section-heading">
        <h2>
          Your content library{" "}
          <span className="badge">{workspace.posts.length}</span>
        </h2>
        <button
          className="button"
          onClick={() =>
            setEditing({
              id: crypto.randomUUID(),
              title: "New post",
              caption: "",
              hashtags: "",
              slides: "",
              channel: "Instagram",
              date: today(),
              status: "Draft",
            })
          }
        >
          <Plus size={15} />
          Write a draft
        </button>
      </div>
      <div className="post-grid">
        {workspace.posts.slice(0, 18).map((p) => (
          <PostCard key={p.id} post={p} onEdit={setEditing} />
        ))}
      </div>
      {workspace.posts.length > 18 && (
        <Link href="/content-calendar" className="text-action">
          See all posts in calendar <ArrowRight size={15} />
        </Link>
      )}
      {editing && (
        <PostEditor post={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
function Calendar() {
  const { workspace, act, busy } = useWorkspace();
  const [month, setMonth] = useState(today().slice(0, 7)),
    [channel, setChannel] = useState("All channels"),
    [view, setView] = useState<"grid" | "list">("grid"),
    [plan, setPlan] = useState(false),
    [editing, setEditing] = useState<Post | null>(null);
  const posts = workspace.posts
    .filter(
      (p) =>
        p.date.startsWith(month) &&
        (channel === "All channels" || p.channel === channel),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(month + "-01T12:00:00Z");
  const count = new Date(
    first.getUTCFullYear(),
    first.getUTCMonth() + 1,
    0,
  ).getDate();
  return (
    <>
      <div className="toolbar">
        <input
          aria-label="Calendar month"
          type="month"
          value={month}
          onChange={(e) => {
            if (e.target.value) setMonth(e.target.value);
          }}
        />
        <select
          aria-label="Filter channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option>All channels</option>
          {channels.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          className="button"
          onClick={() => setView(view === "grid" ? "list" : "grid")}
        >
          {view === "grid" ? "List view" : "Month view"}
        </button>
        <span className="spacer" />
        <button
          disabled={busy}
          className="button"
          onClick={() => void act({ type: "tick" })}
        >
          <Play size={14} />
          Run demo scheduler
        </button>
        <button className="button primary" onClick={() => setPlan(!plan)}>
          <Sparkles size={15} />
          Plan 30 days
        </button>
      </div>
      {plan && (
        <Card title="A month of purposeful content">
          <Generator task="plan" />
        </Card>
      )}
      <div className="hint">
        All times use UTC dates. The demo scheduler delivers approved, scheduled
        posts due today or earlier only when you run it. No social network
        receives a post.
      </div>
      {view === "grid" ? (
        <div className="calendar-scroll">
          <div className="calendar-grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div className="weekday" key={d}>
                {d}
              </div>
            ))}
            {Array.from({ length: first.getUTCDay() }, (_, i) => (
              <div className="calendar-day" key={"blank" + i} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const date = month + "-" + String(i + 1).padStart(2, "0");
              return (
                <div className="calendar-day" key={date}>
                  <span>{i + 1}</span>
                  {posts
                    .filter((p) => p.date === date)
                    .map((p) => (
                      <button
                        key={p.id}
                        className="calendar-item"
                        onClick={() => setEditing(p)}
                      >
                        <strong>{p.title}</strong>
                        {p.channel} · {p.status}
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="post-grid">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onEdit={setEditing} />
          ))}
        </div>
      )}
      {!posts.length && (
        <EmptyState
          icon={CalendarDays}
          title="A fresh page for your brand"
          description="Plan a campaign or choose a month with existing content."
        />
      )}
      {editing && (
        <PostEditor post={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
function Approvals() {
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState("In review"),
    [editing, setEditing] = useState<Post | null>(null);
  const posts = workspace.posts.filter((p) => p.status === tab);
  return (
    <>
      <div className="pill-tabs">
        {[
          "In review",
          "Approved",
          "Changes requested",
          "Scheduled",
          "Published (demo)",
        ].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            {t} · {workspace.posts.filter((p) => p.status === t).length}
          </button>
        ))}
      </div>
      <div className="hint">
        Approval applies to the exact saved content. Review captions, hashtags
        and carousel slides using Edit before approving. Sensitive content
        always stays under human control.
      </div>
      <div className="post-grid">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onEdit={setEditing} review />
        ))}
      </div>
      {!posts.length && (
        <Card title="Review queue">
          <EmptyState
            icon={Check}
            title="Nothing waiting here"
            description="Submit a draft from Content Studio to begin the approval workflow."
          />
        </Card>
      )}
      <Card
        title="Approval audit trail"
        description="Local demo audit records; cloud snapshots are protected by Supabase row policies."
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Reviewer</th>
                <th>Decision</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {workspace.approvals.slice(0, 25).map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.time).toLocaleString()}</td>
                  <td>{a.actor}</td>
                  <td>{a.decision}</td>
                  <td>{a.targetId.slice(0, 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!workspace.approvals.length && (
          <p className="muted">Your first review will be recorded here.</p>
        )}
      </Card>
      {editing && (
        <PostEditor post={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
function Engagement() {
  const { workspace, act, busy } = useWorkspace();
  const [filter, setFilter] = useState("All"),
    [replies, setReplies] = useState<Record<string, string>>({});
  const list = workspace.engagements.filter(
    (e) => filter === "All" || e.category === filter,
  );
  useEffect(() => {
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }, []);
  return (
    <>
      <div className="toolbar">
        <span className="badge">Demo conversations · no live messages</span>
        <span className="spacer" />
        <button
          disabled={busy}
          className="button primary"
          onClick={() =>
            void act({
              type: "agent",
              task: "engage",
              topic: "Classify inbox and draft contextual replies",
              channel: "Instagram",
            })
          }
        >
          <Sparkles size={15} />
          Triage inbox
        </button>
      </div>
      <div className="pill-tabs">
        {[
          "All",
          "general",
          "positive",
          "negative",
          "sales enquiry",
          "sensitive",
          "spam",
        ].map((t) => (
          <button
            key={t}
            className={filter === t ? "active" : ""}
            onClick={() => setFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {list.map((e) => (
        <article className="card" key={e.id} id={`conversation-${e.id}`}>
          <div className="row">
            <span className="avatar">
              {e.author
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <div className="row-body">
              <div className="row-heading">
                <div>
                  <b>{e.author}</b>
                  <div className="muted">
                    {e.channel} · {e.kind} ·{" "}
                    {new Date(e.receivedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Badge value={e.category} /> <Badge value={e.status} />
                </div>
              </div>
              <p>{e.text}</p>
              {e.category === "sensitive" && (
                <div className="hint warning">
                  <ShieldAlert size={14} /> Sensitive issue escalated. A human
                  must review and approve any reply.
                </div>
              )}
              <div className="reply">
                <label>
                  Reply draft
                  <textarea
                    aria-label={"Reply to " + e.author}
                    disabled={e.status === "Sent (demo)"}
                    value={replies[e.id] ?? e.reply}
                    placeholder="Triage the inbox or write a thoughtful response…"
                    onChange={(x) =>
                      setReplies({ ...replies, [e.id]: x.target.value })
                    }
                  />
                </label>
                <div className="toolbar">
                  {e.status !== "Sent (demo)" && (
                    <button
                      className="button"
                      disabled={busy || !(replies[e.id] ?? e.reply).trim()}
                      onClick={async () => {
                        if (
                          await act({
                            type: "reply",
                            id: e.id,
                            reply: replies[e.id] ?? e.reply,
                          })
                        ) {
                          setReplies((current) => {
                            const next = { ...current };
                            delete next[e.id];
                            return next;
                          });
                        }
                      }}
                    >
                      Save reply
                    </button>
                  )}
                  {e.status === "Drafted" && (
                    <button
                      disabled={busy || replies[e.id] !== undefined}
                      className="button primary"
                      onClick={() =>
                        void act({ type: "reviewReply", id: e.id })
                      }
                    >
                      Approve reply
                    </button>
                  )}
                  {e.status === "Approved" && (
                    <button
                      disabled={busy || replies[e.id] !== undefined}
                      className="button primary"
                      onClick={() => void act({ type: "sendReply", id: e.id })}
                    >
                      Simulate sending
                    </button>
                  )}
                  <small>
                    {e.respondedAt
                      ? "Demo delivered " +
                        new Date(e.respondedAt).toLocaleString()
                      : "Nothing is sent automatically."}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
      {!list.length && (
        <EmptyState
          icon={MessageSquare}
          title="No messages in this category"
          description="Try another filter."
        />
      )}
    </>
  );
}
function Crisis() {
  const { workspace, act, busy } = useWorkspace();
  return (
    <>
      <div className="hint warning">
        Human checkpoint · Crisis replies, legal matters and public statements
        require explicit review. Keyword detection is a conservative first pass
        and can miss context; people remain responsible for review.
      </div>
      {workspace.alerts.map((a) => {
        const e = workspace.engagements.find((e) => e.id === a.engagementId);
        return (
          <Card
            key={a.id}
            title={a.reason}
            description={`Owner: ${a.owner}`}
            aside={<Badge value={a.status} />}
          >
            <p>{e?.text}</p>
            <div className="toolbar">
              {e && (
                <Link
                  href={`/engagement#conversation-${e.id}`}
                  className="button"
                >
                  Review conversation <ArrowRight size={14} />
                </Link>
              )}
              {a.status === "Open" && (
                <button
                  disabled={busy}
                  className="button"
                  onClick={() => void act({ type: "resolve", id: a.id })}
                >
                  Mark resolved
                </button>
              )}
            </div>
            <small>Resolving an alert does not approve or send a reply.</small>
          </Card>
        );
      })}
      {!workspace.alerts.length && (
        <EmptyState
          icon={ShieldAlert}
          title="No escalations"
          description="Sensitive messages detected by inbox triage appear here."
        />
      )}
    </>
  );
}
function Agent() {
  const { workspace, act, busy, provider } = useWorkspace();
  const [task, setTask] = useState<"plan" | "create" | "engage" | "insights">(
      "plan",
    ),
    [topic, setTopic] = useState("Everyday habits that make a difference");
  return (
    <div className="two-column">
      <div>
        <Card
          title="Meet your social media copilot"
          description="Tools that do the work. You keep the final say."
          aside={
            <Badge
              value={provider === "demo" ? "Demo agent" : provider + " agent"}
            />
          }
        >
          <div className="agent-orb">
            <Bot />
          </div>
          <label>
            Workflow
            <select
              value={task}
              onChange={(e) => setTask(e.target.value as typeof task)}
            >
              <option value="plan">PLAN · Build a 30-day calendar</option>
              <option value="create">
                CREATE · Write a channel-specific post
              </option>
              <option value="engage">
                ENGAGE · Classify and draft replies
              </option>
              <option value="insights">INSIGHTS · Summarize performance</option>
            </select>
          </label>
          <label>
            Campaign or request
            <textarea
              maxLength={500}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>
          <button
            disabled={busy}
            className="button primary"
            onClick={() =>
              void act({
                type: "agent",
                task,
                topic,
                channel: workspace.brand.channels[0] || "Instagram",
                date: today(),
              })
            }
          >
            <Play size={15} />
            Run workflow
          </button>
          <hr className="divider" />
          <div className="hint">
            {provider === "demo"
              ? "The demo controller runs real application tools with deterministic templates. It does not call a language model."
              : "The configured model selects tools; structured inputs are validated before execution."}{" "}
            No agent tool can approve or publish.
          </div>
        </Card>
        <Card title="Available tools">
          <div className="pill-tabs">
            {[
              "read_brand",
              "write_content",
              "create_calendar",
              "read_engagement",
              "classify_and_draft",
              "escalate",
              "analytics_summary",
            ].map((t) => (
              <span key={t} className="badge">
                {t}
              </span>
            ))}
          </div>
        </Card>
      </div>
      <Card
        title="Execution timeline"
        description="Actual actions and structured results"
        aside={<Badge value={`${workspace.logs.length} events`} />}
      >
        {workspace.logs.length ? (
          workspace.logs.slice(0, 30).map((l) => (
            <div className="log" key={l.id}>
              <small>{new Date(l.time).toLocaleTimeString()}</small>
              <code>{l.tool}</code> <Badge value={l.status} />
              <pre>{l.detail}</pre>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Bot}
            title="Ready when you are"
            description="Run a workflow to see each tool execution and its result."
          />
        )}
      </Card>
    </div>
  );
}
function Analytics() {
  const { workspace, act, busy } = useWorkspace();
  return (
    <>
      <div className="toolbar">
        <Badge value="Demo metrics · illustrative dataset" />
        <span className="spacer" />
        <button
          className="button"
          onClick={() =>
            exportFile(
              "socialpilot-report.json",
              JSON.stringify(
                {
                  mode: "demo",
                  exportedAt: new Date().toISOString(),
                  summary: workspace.insight,
                  posts: workspace.posts,
                  engagement: workspace.engagements,
                },
                null,
                2,
              ),
            )
          }
        >
          <Download size={14} />
          Export report
        </button>
        <button
          disabled={busy}
          className="button primary"
          onClick={() =>
            void act({
              type: "agent",
              task: "insights",
              topic: "Summarize performance",
              channel: "Instagram",
            })
          }
        >
          <Sparkles size={15} />
          Generate insights
        </button>
      </div>
      <Performance />
      <ContentPerformance />
      <Card
        title="Agent insights"
        aside={
          <span className="tile-icon">
            <Sparkles size={17} />
          </span>
        }
      >
        <p>
          {workspace.insight ||
            "Generate insights to summarize your current content pipeline, response times, and illustrative channel trends."}
        </p>
      </Card>
      <Card
        title="Workspace activity"
        description="Computed from your demo actions, separate from illustrative platform metrics"
      >
        <div className="report-stats">
          <div>
            <small>Planned content</small>
            <strong>{workspace.posts.length}</strong>
          </div>
          <div>
            <small>Demo published</small>
            <strong>
              {
                workspace.posts.filter((p) => p.status === "Published (demo)")
                  .length
              }
            </strong>
          </div>
          <div>
            <small>Replies simulated</small>
            <strong>
              {
                workspace.engagements.filter((e) => e.status === "Sent (demo)")
                  .length
              }
            </strong>
          </div>
          <div>
            <small>Open escalations</small>
            <strong>
              {workspace.alerts.filter((a) => a.status === "Open").length}
            </strong>
          </div>
        </div>
      </Card>
      <Card title="Content pipeline by channel">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Drafts</th>
              <th>In review</th>
              <th>Scheduled</th>
              <th>Demo published</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c}>
                <td>{c}</td>
                {["Draft", "In review", "Scheduled", "Published (demo)"].map(
                  (s) => (
                    <td key={s}>
                      {
                        workspace.posts.filter(
                          (p) => p.channel === c && p.status === s,
                        ).length
                      }
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
export function SectionPage({ section }: { section: Section }) {
  const { ready } = useWorkspace();
  const components: Record<Section, React.ReactNode> = {
    "brand-profile": <BrandProfile />,
    "ai-agent": <Agent />,
    "content-calendar": <Calendar />,
    "content-studio": <Studio />,
    "approval-inbox": <Approvals />,
    engagement: <Engagement />,
    "crisis-center": <Crisis />,
    analytics: <Analytics />,
    integrations: <Settings />,
  };
  return (
    <>
      <PageHeader {...sections[section]} />
      {ready ? (
        components[section]
      ) : (
        <Card title="Loading workspace">
          <p>Restoring your saved content…</p>
        </Card>
      )}
    </>
  );
}

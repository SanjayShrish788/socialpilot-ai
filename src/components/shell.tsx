"use client";

import {
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PanelTop,
  PencilLine,
  Plug,
  Radio,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWorkspace } from "./workspace-provider";

const groups = [
  {
    label: "Workspace",
    links: [
      ["/", "Dashboard", LayoutDashboard],
      ["/brand-profile", "Brand Profile", PanelTop],
      ["/ai-agent", "AI Agent", Sparkles],
    ],
  },
  {
    label: "Content",
    links: [
      ["/content-calendar", "Content Calendar", CalendarDays],
      ["/content-studio", "Content Studio", PencilLine],
      ["/approval-inbox", "Approval Inbox", ClipboardCheck],
    ],
  },
  {
    label: "Monitor",
    links: [
      ["/engagement", "Engagement", MessageSquare],
      ["/crisis-center", "Crisis Center", CircleAlert],
      ["/analytics", "Analytics", ChartNoAxesCombined],
      ["/integrations", "Integrations", Plug],
    ],
  },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { workspace } = useWorkspace();
  const pending = workspace.posts.filter(
    (post) => post.status === "In review",
  ).length;
  const title =
    groups
      .flatMap((group) => [...group.links])
      .find(([href]) => href === path)?.[1] ?? "Page";
  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside id="navigation" className={"sidebar" + (menuOpen ? " open" : "")}>
        <Link href="/" className="wordmark" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">
            <Radio size={22} />
          </span>
          <span>
            SocialPilot <b>AI</b>
          </span>
        </Link>
        <nav aria-label="Main navigation">
          {groups.map(({ label, links }) => (
            <div className="nav-group" key={label}>
              <p>{label}</p>
              {links.map(([href, name, Icon]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={href === path ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon size={17} />
                  <span>{name}</span>
                  {href === "/approval-inbox" && pending > 0 && (
                    <small>{pending}</small>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <Link
          className="workspace-link"
          href="/brand-profile"
          onClick={() => setMenuOpen(false)}
        >
          <span className="avatar">
            {workspace.brand.name.trim().slice(0, 2).toUpperCase() || "SP"}
          </span>
          <span className="workspace-name">
            <strong>{workspace.brand.name || "My workspace"}</strong>
            <small>Browser-local demo</small>
          </span>
          <ChevronRight size={15} />
        </Link>
      </aside>
      <div className="work-area">
        <header className="topbar">
          <button
            type="button"
            className="menu-button icon-button"
            aria-expanded={menuOpen}
            aria-controls="navigation"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <span className="breadcrumb">
            Workspace <ChevronRight size={14} /> <strong>{title}</strong>
          </span>
          <span className="status">
            <i /> Demo workspace
          </span>
        </header>
        <main id="main" className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  Clock3,
  FileText,
  Plus,
  Radio,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { samplePerformance } from "@/lib/sample-analytics";
import { Card, EmptyState, PageHeader } from "./ui";
import { useWorkspace } from "./workspace-provider";

const metrics = [
  {
    label: "Published on schedule",
    value: "18 / 20",
    detail: "90% on time",
    icon: CalendarDays,
    color: "blue",
  },
  {
    label: "Engagement rate",
    value: "4.82%",
    detail: "+0.74 pts vs. prior period",
    icon: TrendingUp,
    color: "purple",
  },
  {
    label: "Follower growth",
    value: "+1,286",
    detail: "+8.4% vs. prior period",
    icon: Users,
    color: "green",
  },
  {
    label: "Avg. comment response",
    value: "42 min",
    detail: "12 min faster",
    icon: Clock3,
    color: "orange",
  },
];

export function Performance() {
  const [channel, setChannel] = useState("All channels");
  const [period, setPeriod] = useState("Full period");
  const factor =
    channel === "Instagram"
      ? 0.6
      : channel === "LinkedIn"
        ? 0.3
        : channel === "Facebook"
          ? 0.1
          : 1;
  const data = (
    period === "Recent week" ? samplePerformance.slice(4) : samplePerformance
  ).map((r) => ({
    ...r,
    reach: Math.round(r.reach * factor),
    interactions: Math.round(r.interactions * factor * 0.2),
  }));
  const reach = data.reduce((n, r) => n + r.reach, 0),
    interactions = data.reduce((n, r) => n + r.interactions, 0);
  return (
    <>
      <div className="toolbar">
        <select
          aria-label="Analytics channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          {["All channels", "Instagram", "LinkedIn", "Facebook"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Analytics period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option>Full period</option>
          <option>Recent week</option>
        </select>
        <span className="muted">
          Demo reach: {reach.toLocaleString()} · Impressions:{" "}
          {Math.round(reach * 1.3).toLocaleString()} · Engagement:{" "}
          {((interactions / reach) * 100).toFixed(2)}%
        </span>
      </div>
      <div className="metric-grid">
        {metrics.map(({ label, value, detail, icon: Icon, color }) => (
          <div className="card metric" key={label}>
            <span className={`tile-icon ${color}`}>
              <Icon size={18} />
            </span>
            <p>{label}</p>
            <strong>
              {label === "Engagement rate"
                ? `${((interactions / reach) * 100).toFixed(2)}%`
                : label === "Follower growth"
                  ? `+${Math.round(1286 * factor * (period === "Recent week" ? 0.5 : 1)).toLocaleString()}`
                  : value}
            </strong>
            <small>
              {label === "Engagement rate"
                ? "Interactions ÷ reach · demo"
                : label === "Follower growth"
                  ? "Illustrative net new followers"
                  : detail}
            </small>
          </div>
        ))}
      </div>
      <Card
        title="Channel performance"
        description="Sample reach and interactions · Nov 1–15"
        aside={<span className="badge">Sample data</span>}
      >
        <div className="chart">
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            initialDimension={{ width: 540, height: 255 }}
          >
            <AreaChart
              data={data}
              margin={{ top: 12, right: 8, left: -22, bottom: 0 }}
            >
              <defs>
                <linearGradient id="reach-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4f55eb" stopOpacity={0.24} />
                  <stop offset="100%" stopColor="#4f55eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#e8edf5"
                strokeDasharray="3 4"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#5e6b82" }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                minTickGap={17}
              />
              <YAxis
                tickFormatter={(value: number) =>
                  value ? `${value / 1000}k` : "0"
                }
                tick={{ fontSize: 11, fill: "#5e6b82" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 13 }}
              />
              <Area
                name="Reach"
                dataKey="reach"
                type="monotone"
                stroke="#4f55eb"
                strokeWidth={2.5}
                fill="url(#reach-fill)"
              />
              <Area
                name="Interactions"
                dataKey="interactions"
                type="monotone"
                stroke="#0e8f85"
                strokeWidth={2}
                fill="#0e8f8512"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <details className="chart-table">
          <summary>View sample data table</summary>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reach</th>
                <th>Interactions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.day}>
                  <td>{row.day}</td>
                  <td>{row.reach}</td>
                  <td>{row.interactions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </Card>
    </>
  );
}

export function Dashboard() {
  const { workspace } = useWorkspace();
  const pending = workspace.posts.filter((post) => post.status === "In review");
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Plan content, manage approvals, and review channel performance."
        action={
          <Link href="/content-studio" className="button primary">
            <Plus size={17} /> New draft
          </Link>
        }
      />
      <section className="hero">
        <div className="hero-art" aria-hidden="true">
          <span />
          <span />
          <span />
          <Radio size={61} />
        </div>
        <div className="hero-body">
          <span className="hero-label">
            <Radio size={14} /> Social media workspace
          </span>
          <h2>
            {workspace.brand.name
              ? `Welcome, ${workspace.brand.name}`
              : "Build a consistent brand presence"}
          </h2>
          <p>
            Give every post a clear voice, a place on the calendar, and a human
            review before it goes public.
          </p>
          <Link
            href={workspace.brand.name ? "/content-calendar" : "/brand-profile"}
            className="button hero-button"
          >
            {workspace.brand.name ? "Open calendar" : "Set up brand profile"}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <h2>Performance overview</h2>
          <p>Illustrative demo metrics · not connected to live channels</p>
        </div>
        <Link href="/analytics" className="text-action">
          Analytics <ArrowDownRight size={16} />
        </Link>
      </div>
      <Performance />
      <div className="two-column bottom-cards">
        <Card
          title="Approval queue"
          description="Drafts awaiting human review"
          aside={
            <span className="tile-icon purple">
              <ClipboardCheck size={18} />
            </span>
          }
        >
          {pending.length ? (
            <ul className="plain-list">
              {pending.slice(0, 3).map((post) => (
                <li key={post.id}>
                  <FileText size={16} />
                  <span>{post.title}</span>
                  <small>{post.channel}</small>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="You’re all caught up"
              description="Submitted drafts will appear here."
            />
          )}
          <Link href="/approval-inbox" className="text-action">
            Open approval inbox <ArrowRight size={15} />
          </Link>
        </Card>
        <Card
          title="Publishing guardrails"
          description="Review rules from the contest brief"
          aside={
            <span className="tile-icon green">
              <ShieldCheck size={18} />
            </span>
          }
        >
          <ul className="plain-list">
            <li>
              <ShieldCheck size={16} /> Human approval for public statements
            </li>
            <li>
              <ShieldCheck size={16} /> Escalation for crisis and legal matters
            </li>
            <li>
              <ChartNoAxesCombined size={16} /> Authentic engagement and brand
              voice
            </li>
          </ul>
          <Link href="/ai-agent" className="text-action">
            View agent policy <ArrowRight size={15} />
          </Link>
        </Card>
      </div>
    </>
  );
}

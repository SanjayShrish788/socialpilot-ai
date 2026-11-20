"use client";

import { useState } from "react";
import { CalendarDays, Clock3, TrendingUp, Users } from "lucide-react";
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
import { Card } from "./ui";

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

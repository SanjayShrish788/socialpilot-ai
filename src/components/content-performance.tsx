"use client";
import { Card } from "./ui";
const rows = [
  {
    title: "Small rituals, lasting change",
    channel: "Instagram",
    format: "Carousel",
    reach: 8400,
    impressions: 10920,
    interactions: 504,
  },
  {
    title: "A more thoughtful workplace",
    channel: "LinkedIn",
    format: "Text post",
    reach: 4200,
    impressions: 5460,
    interactions: 210,
  },
  {
    title: "One habit for a better morning",
    channel: "Instagram",
    format: "Image post",
    reach: 6100,
    impressions: 7930,
    interactions: 305,
  },
];
export function ContentPerformance() {
  return (
    <Card
      title="Content performance"
      description="Fictional published examples · separate from your workspace drafts"
      aside={<span className="badge">Demo dataset</span>}
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Content</th>
              <th>Channel / format</th>
              <th>Reach</th>
              <th>Impressions</th>
              <th>Engagement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.title}>
                <td>{r.title}</td>
                <td>
                  {r.channel} · {r.format}
                </td>
                <td>{r.reach.toLocaleString()}</td>
                <td>{r.impressions.toLocaleString()}</td>
                <td>{((r.interactions / r.reach) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

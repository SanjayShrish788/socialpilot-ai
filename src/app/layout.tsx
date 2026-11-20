import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { WorkspaceProvider } from "@/components/workspace-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SocialPilot AI",
    template: "%s | SocialPilot AI",
  },
  description:
    "A social media executive workspace for planning, creation, and approvals.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WorkspaceProvider>
          <Shell>{children}</Shell>
        </WorkspaceProvider>
      </body>
    </html>
  );
}

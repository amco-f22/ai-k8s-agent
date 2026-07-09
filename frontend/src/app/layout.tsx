import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Kubernetes Agent — Intelligent Cluster Troubleshooting",
  description:
    "AI-powered Kubernetes troubleshooting platform. Investigate cluster failures, identify root causes, and get actionable fixes powered by LLM reasoning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased gradient-bg min-h-screen">
        {children}
      </body>
    </html>
  );
}

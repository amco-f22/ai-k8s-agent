"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<"checking" | "healthy" | "offline">("checking");
  const router = useRouter();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/health`
        );
        if (res.ok) {
          setBackendStatus("healthy");
        } else {
          setBackendStatus("offline");
        }
      } catch {
        setBackendStatus("offline");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <div className="text-center max-w-2xl animate-fade-in">
        {/* Logo / Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            AI Kubernetes
          </span>
          <br />
          <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            Agent
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          Troubleshoot Kubernetes clusters with AI-powered root cause analysis.
          <br />
          Get actionable fixes in seconds.
        </p>

        {/* CTA Button */}
        <button
          id="investigate-button"
          onClick={() => router.push("/dashboard")}
          className="glow-button inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl text-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/25"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          Investigate Cluster
        </button>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🔍",
              title: "Deep Investigation",
              desc: "Pods, logs, events, deployments, networking",
            },
            {
              icon: "🧠",
              title: "AI Root Cause",
              desc: "LLM-powered failure correlation",
            },
            {
              icon: "🔧",
              title: "Actionable Fixes",
              desc: "kubectl commands & YAML patches",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-5 text-left animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="fixed bottom-6 right-6 glass-card rounded-full px-4 py-2 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            backendStatus === "healthy"
              ? "bg-green-400 status-dot"
              : backendStatus === "checking"
              ? "bg-yellow-400 animate-pulse"
              : "bg-red-400"
          }`}
          style={backendStatus === "healthy" ? { animation: "statusPulse 2s ease-in-out infinite" } : {}}
        />
        <span className="text-xs text-slate-400 font-medium">
          {backendStatus === "healthy"
            ? "System Ready"
            : backendStatus === "checking"
            ? "Connecting..."
            : "Backend Offline"}
        </span>
      </div>
    </main>
  );
}

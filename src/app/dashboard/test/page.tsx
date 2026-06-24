"use client";

import { FlaskConical, ExternalLink } from "lucide-react";

const GS = "var(--font-geist-sans)";

// The agent server (Fastify) serves the test console at /test. It runs on its
// own origin (default localhost:8080), separate from this Next.js app, so the
// link must be absolute — a relative "/test" would 404 against the dashboard.
const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:8080";

export default function TestMelloPage() {
  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #20183C" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#8C86A8" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#8C86A8" }} />
            Developer tools
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F3F1FB", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Test Mello</h1>
          <p className="mt-2 text-sm" style={{ color: "#8C86A8" }}>Send text or voice to the AI agent and inspect the response.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-9 py-12">
        <div className="flex flex-col items-center gap-8 max-w-md text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", boxShadow: "0 0 40px rgba(167,139,250,0.08)" }}>
            <FlaskConical size={32} style={{ color: "#A78BFA" }} />
          </div>
          <div>
            <div style={{ fontFamily: GS, fontSize: 24, fontWeight: 400, color: "#F3F1FB", letterSpacing: "-0.02em" }}>
              Interactive test console
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#8C86A8" }}>
              The test console lets you send messages directly to the mello AI agent and see responses in real time. It runs against your live facility configuration.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <a href={`${AGENT_URL}/test`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-opacity"
              style={{ background: "linear-gradient(135deg, #34D6E0 0%, #2585A8 100%)", color: "#04222A", boxShadow: "0 4px 16px rgba(52,214,224,0.28)", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.88")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}>
              <ExternalLink size={15} />
              Open Test Console
            </a>
            <p className="text-xs" style={{ color: "#8C86A8" }}>
              Opens {AGENT_URL}/test in a new tab · the agent server must be running
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FlaskConical, ExternalLink } from "lucide-react";

const GS = "var(--font-geist-sans)";

export default function TestMelloPage() {
  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            Developer tools
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Test Mello</h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>Send text or voice to the AI agent and inspect the response.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-9 py-12">
        <div className="flex flex-col items-center gap-8 max-w-md text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", boxShadow: "0 0 40px rgba(52,211,153,0.08)" }}>
            <FlaskConical size={32} style={{ color: "#34D399" }} />
          </div>
          <div>
            <div style={{ fontFamily: GS, fontSize: 24, fontWeight: 400, color: "#F4F8F6", letterSpacing: "-0.02em" }}>
              Interactive test console
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "#7E908A" }}>
              The test console lets you send messages directly to the mello AI agent and see responses in real time. It runs against your live facility configuration.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <a href="/test"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-opacity"
              style={{ background: "linear-gradient(135deg, #F0AE5A 0%, #E2902F 100%)", color: "#1A0D00", boxShadow: "0 4px 16px rgba(236,161,75,0.25)", textDecoration: "none" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.88")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}>
              <ExternalLink size={15} />
              Open Test Console
            </a>
            <p className="text-xs" style={{ color: "#7E908A" }}>
              Opens in current tab · requires the agent server to be running locally or via ngrok
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

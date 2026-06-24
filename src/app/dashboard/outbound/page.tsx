import { Bell, Search } from "lucide-react";
import { OutboundView } from "./OutboundView";

const GS = "var(--font-geist-sans)";

export default function OutboundPage() {
  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #20183C" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#8C86A8" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#8C86A8" }} />
            Outbound campaigns
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F3F1FB", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>
            Outbound
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#8C86A8" }}>
            Mello calls your contacts toward one goal — confirmations, renewals, follow-ups, and more
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ background: "#181030", border: "1px solid #2A2348", color: "#8C86A8", width: 220 }}>
            <Search size={14} />
            <span className="flex-1 text-xs">Search calls, members…</span>
          </div>
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#181030", border: "1px solid #2A2348" }}>
            <Bell size={16} style={{ color: "#8C86A8" }} />
          </button>
        </div>
      </div>

      <OutboundView />
    </div>
  );
}

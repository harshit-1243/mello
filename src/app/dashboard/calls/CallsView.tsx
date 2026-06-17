"use client";

import { useState } from "react";
import { CheckCircle2, Phone } from "lucide-react";
import type { CallDetail } from "@/lib/dashboard/data";
import { formatPhone, timeAgo, clockFromSeconds, rupees } from "@/lib/dashboard/format";

const GS = "var(--font-geist-sans)";
type Filter = "All" | "Booked" | "Missed";

const STATUS = {
  booked:  { label: "Booked",  color: "#34D399", bg: "rgba(52,211,153,0.14)", border: "rgba(52,211,153,0.2)" },
  handled: { label: "Handled", color: "#7E908A", bg: "rgba(126,144,138,0.12)", border: "#1B2722" },
  missed:  { label: "Missed",  color: "#ECA14B", bg: "rgba(236,161,75,0.14)", border: "rgba(236,161,75,0.2)" },
} as const;

function initials(name: string | undefined, phone: string): string {
  if (name) return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return phone.replace(/\D/g, "").slice(-2) || "··";
}

function StatusChip({ status }: { status: CallDetail["status"] }) {
  const s = STATUS[status];
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

function CallRow({ call, selected, onClick }: { call: CallDetail; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-3 rounded-xl transition-all duration-150 flex items-center gap-3"
      style={{ background: selected ? "rgba(52,211,153,0.08)" : "transparent", border: selected ? "1px solid rgba(52,211,153,0.2)" : "1px solid transparent" }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ background: "#16201B", color: "#7E908A" }}>
        {initials(call.name, call.phone)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium truncate" style={{ color: "#F4F8F6" }}>{call.name || formatPhone(call.phone)}</span>
          {call.isMember && (
            <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.18)" }}>member</span>
          )}
        </div>
        <div className="text-xs truncate" style={{ color: "#7E908A" }}>{call.intent}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusChip status={call.status} />
        <span className="text-[11px]" style={{ color: "#7E908A", fontVariantNumeric: "tabular-nums" }}>{timeAgo(call.at)}</span>
      </div>
    </button>
  );
}

function DetailPanel({ call }: { call: CallDetail }) {
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Caller card */}
      <div className="rounded-2xl p-5 shrink-0" style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-semibold shrink-0"
              style={{ background: "#16201B", color: "#B0C4BB" }}>
              {initials(call.name, call.phone)}
            </div>
            <div>
              <div className="mb-0.5" style={{ fontFamily: GS, fontSize: 22, fontWeight: 400, color: "#F4F8F6" }}>
                {call.name || formatPhone(call.phone)}
              </div>
              <div className="text-sm mb-1" style={{ color: "#7E908A" }}>
                {formatPhone(call.phone)} · {call.isMember ? "Member" : "Non-member"}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(126,144,138,0.15)", color: "#7E908A" }}>
                  {call.language} · {clockFromSeconds(call.durationSeconds)}
                </span>
              </div>
            </div>
          </div>
          <StatusChip status={call.status} />
        </div>
      </div>

      {/* Booking made (if any) */}
      {call.booking && (
        <div className="rounded-2xl px-5 py-4 shrink-0 flex items-center gap-4 flex-wrap"
          style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}>
          <span className="text-[10px] tracking-[0.12em] uppercase shrink-0" style={{ color: "#34D399" }}>Booking made</span>
          <span className="text-sm" style={{ color: "#F4F8F6" }}>{call.booking.sport} · {call.booking.court}</span>
          <span className="text-sm" style={{ color: "#B0C4BB" }}>{call.booking.when}</span>
          <span className="text-sm font-medium ml-auto" style={{ color: "#ECA14B" }}>
            {call.booking.amountInr === 0 ? "Member · ₹0" : rupees(call.booking.amountInr)}
          </span>
        </div>
      )}

      {/* Transcript (text only — audio is never stored) */}
      <div className="flex-1 rounded-2xl p-5 overflow-y-auto"
        style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset", minHeight: 0 }}>
        <div className="text-[10px] tracking-[0.12em] uppercase mb-4" style={{ color: "#7E908A" }}>Transcript</div>
        {call.transcript.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm" style={{ color: "#7E908A" }}>No transcript — caller hung up.</div>
        ) : (
          <div className="space-y-3">
            {call.transcript.map((line, i) => {
              const isMello = line.role === "mello";
              return (
                <div key={i} className={`flex ${isMello ? "justify-start" : "justify-end"}`}>
                  <div className={`flex items-start gap-2 max-w-[82%] ${isMello ? "" : "flex-row-reverse"}`}>
                    <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 shrink-0 tracking-wide uppercase"
                      style={isMello ? { background: "rgba(52,211,153,0.15)", color: "#34D399", fontWeight: 600 } : { background: "rgba(126,144,138,0.15)", color: "#7E908A", fontWeight: 600 }}>
                      {isMello ? "mello" : "caller"}
                    </span>
                    <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={isMello
                        ? { background: "rgba(52,211,153,0.08)", color: "#D4EDE6", border: "1px solid rgba(52,211,153,0.15)", borderTopLeftRadius: 4 }
                        : { background: "rgba(126,144,138,0.1)", color: "#B0C4BB", border: "1px solid #1B2722", borderTopRightRadius: 4 }}>
                      {line.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tool trace */}
      {call.toolCalls.length > 0 && (
        <div className="rounded-2xl px-5 py-3.5 shrink-0 flex items-start gap-3 flex-wrap"
          style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
          <span className="text-[10px] tracking-[0.12em] uppercase shrink-0 mt-1" style={{ color: "#7E908A" }}>Tool Calls</span>
          <div className="w-px self-stretch shrink-0" style={{ background: "#16201B" }} />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {call.toolCalls.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 size={11} style={{ color: t.ok ? "#34D399" : "#ECA14B", flexShrink: 0 }} />
                <code className="font-semibold" style={{ fontFamily: "monospace", color: "#F4F8F6" }}>{t.tool}</code>
                <span className="truncate" style={{ color: "#7E908A" }}>{t.summary}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CallsView({ calls }: { calls: CallDetail[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [selectedId, setSelectedId] = useState<string | null>(calls[0]?.id ?? null);

  const filtered = calls.filter((c) => {
    if (filter === "Booked") return c.status === "booked";
    if (filter === "Missed") return c.status === "missed";
    return true;
  });

  const selected = calls.find((c) => c.id === selectedId) ?? filtered[0] ?? null;
  const filters: Filter[] = ["All", "Booked", "Missed"];

  return (
    <div className="flex flex-1 min-h-0" style={{ height: "calc(100vh - 150px)" }}>
      {/* Left — call list */}
      <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: "38%", borderRight: "1px solid #16201B" }}>
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
            {filters.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{ background: filter === f ? "#16201B" : "transparent", color: filter === f ? "#F4F8F6" : "#7E908A", border: filter === f ? "1px solid #1B2722" : "1px solid transparent" }}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-sm gap-2" style={{ color: "#7E908A" }}>
              <Phone size={24} style={{ color: "#1B2722" }} />
              No calls match this filter.
            </div>
          ) : (
            filtered.map((call) => (
              <CallRow key={call.id} call={call} selected={selected?.id === call.id} onClick={() => setSelectedId(call.id)} />
            ))
          )}
        </div>
      </div>

      {/* Right — detail */}
      <div className="flex-1 min-w-0 overflow-hidden p-6" style={{ minHeight: 0 }}>
        {selected ? (
          <DetailPanel call={selected} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm" style={{ color: "#7E908A" }}>Select a call to see its transcript.</div>
        )}
      </div>
    </div>
  );
}

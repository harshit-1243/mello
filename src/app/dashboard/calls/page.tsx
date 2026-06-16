"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Sparkles, CheckCircle2, Globe } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

const GS = "var(--font-geist-sans)";

type CallStatus = "LIVE" | "COMPLETED" | "MISSED";
type Filter = "All" | "Live" | "Today" | "Missed";

interface Call {
  id: number;
  initials: string;
  gradientFrom: string;
  gradientTo: string;
  name: string;
  phone: string;
  lang: string;
  sport: string;
  duration: string;
  status: CallStatus;
  tier?: string;
  transcript: { speaker: "mello" | "caller"; text: string }[];
  tools: { label: string; done: boolean }[];
  amount?: string;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const CALLS: Call[] = [
  {
    id: 1, initials: "MS", gradientFrom: "#5FF0B0", gradientTo: "#1E7A55",
    name: "Manan Shah", phone: "+91 96536 79703", lang: "EN→HI", sport: "Badminton",
    duration: "04:12", status: "LIVE", tier: "Member · Tier 2",
    transcript: [
      { speaker: "mello", text: "Hi Manan! How can I help you today?" },
      { speaker: "caller", text: "Kal raat 9 baje court milega?" },
      { speaker: "mello", text: "Tomorrow 9 PM — Court 1 is free for one hour. Shall I lock it in for you?" },
      { speaker: "caller", text: "Haan, ek ghanta book kar do." },
      { speaker: "mello", text: "Perfect! I've blocked Court 1, 9 to 10 PM tomorrow. Booking confirmed — WhatsApp confirmation on its way." },
      { speaker: "caller", text: "Amount kitna hoga?" },
      { speaker: "mello", text: "As a Tier 2 member you get 25% off — so ₹450 instead of ₹600. Pay at venue." },
    ],
    tools: [
      { label: "check_slot", done: true },
      { label: "create_booking", done: true },
      { label: "send_whatsapp", done: true },
      { label: "apply_discount", done: true },
    ],
    amount: "₹450",
  },
  {
    id: 2, initials: "RV", gradientFrom: "#93C5FD", gradientTo: "#3B82F6",
    name: "Rahul Verma", phone: "+91 98765 12345", lang: "EN→HI", sport: "Badminton",
    duration: "1:14", status: "COMPLETED", tier: "Non-member",
    transcript: [
      { speaker: "mello", text: "Hello, Smash Arena! How can I help?" },
      { speaker: "caller", text: "Aaj 8 PM par ek court chahiye badminton ke liye." },
      { speaker: "mello", text: "8 PM tonight — Court 2 is available. Shall I book it?" },
      { speaker: "caller", text: "Yes please." },
      { speaker: "mello", text: "Done! Court 2 at 8 PM, ₹600. Confirmation WhatsApp pe aa raha hai." },
    ],
    tools: [
      { label: "check_slot", done: true },
      { label: "create_booking", done: true },
      { label: "send_whatsapp", done: true },
    ],
    amount: "₹600",
  },
  {
    id: 3, initials: "PS", gradientFrom: "#FCA5A5", gradientTo: "#EF4444",
    name: "Priya Sharma", phone: "+91 99001 23456", lang: "EN", sport: "Tennis",
    duration: "0:52", status: "MISSED", tier: "Non-member",
    transcript: [], tools: [],
  },
  {
    id: 4, initials: "AK", gradientFrom: "#C4B5FD", gradientTo: "#7C3AED",
    name: "Arjun Kumar", phone: "+91 97543 87654", lang: "EN→HI", sport: "Badminton",
    duration: "2:03", status: "COMPLETED", tier: "Member · Tier 1",
    transcript: [
      { speaker: "mello", text: "Smash Arena, this is mello. How can I assist?" },
      { speaker: "caller", text: "Sunday morning, 7 AM — any squash court free?" },
      { speaker: "mello", text: "Yes, Court 3 is open Sunday 7 to 8 AM. Want me to reserve it?" },
      { speaker: "caller", text: "Yes, book it." },
      { speaker: "mello", text: "Booked! Court 3, Sunday 7–8 AM. As a Tier 1 member it's complimentary. See you then!" },
    ],
    tools: [
      { label: "check_slot", done: true },
      { label: "create_booking", done: true },
      { label: "send_whatsapp", done: true },
    ],
    amount: "₹0",
  },
  {
    id: 5, initials: "NK", gradientFrom: "#FDE68A", gradientTo: "#F59E0B",
    name: "Neha Kapoor", phone: "+91 96321 55789", lang: "EN", sport: "Squash",
    duration: "1:38", status: "COMPLETED", tier: "Non-member",
    transcript: [
      { speaker: "mello", text: "Hi! Smash Arena here. How can I help you?" },
      { speaker: "caller", text: "Do you have squash courts?" },
      { speaker: "mello", text: "Yes! We have 2 squash courts available most evenings." },
      { speaker: "caller", text: "What's the pricing?" },
      { speaker: "mello", text: "Non-member rate is ₹700 per hour. Members get up to 30% off." },
    ],
    tools: [{ label: "check_slot", done: true }],
    amount: "₹700",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusChip({ status }: { status: CallStatus }) {
  if (status === "LIVE") return (
    <span className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase"
      style={{ background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
      Live
    </span>
  );
  if (status === "MISSED") return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase"
      style={{ background: "rgba(236,161,75,0.14)", color: "#ECA14B", border: "1px solid rgba(236,161,75,0.2)" }}>
      Missed
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide uppercase"
      style={{ background: "rgba(126,144,138,0.12)", color: "#7E908A", border: "1px solid #1B2722" }}>
      Done
    </span>
  );
}

function CallRow({ call, selected, onClick }: { call: Call; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-3 rounded-xl transition-all duration-150 flex items-center gap-3"
      style={{
        background: selected ? "rgba(52,211,153,0.08)" : "transparent",
        border: selected ? "1px solid rgba(52,211,153,0.2)" : "1px solid transparent",
      }}
      onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
      onMouseLeave={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ background: `linear-gradient(135deg, ${call.gradientFrom} 0%, ${call.gradientTo} 100%)`, color: "#07100C", boxShadow: call.status === "LIVE" ? "0 0 10px rgba(52,211,153,0.4)" : "none" }}>
        {call.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium truncate" style={{ color: "#F4F8F6" }}>{call.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(126,144,138,0.15)", color: "#7E908A" }}>{call.lang}</span>
        </div>
        <div className="text-xs truncate" style={{ color: "#7E908A" }}>{call.phone} · {call.sport}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <StatusChip status={call.status} />
        <span className="text-[11px]" style={{ color: "#7E908A", fontVariantNumeric: "tabular-nums" }}>{call.duration}</span>
      </div>
    </button>
  );
}

function EqualizerBars() {
  const [heights, setHeights] = useState([40, 70, 50, 90, 60, 80, 45, 75]);
  useEffect(() => {
    const t = setInterval(() => setHeights(Array.from({ length: 8 }, () => 20 + Math.random() * 80)), 220);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {heights.map((h, i) => (
        <div key={i} className="w-1 rounded-sm transition-all duration-200"
          style={{ height: `${h}%`, background: "#34D399", opacity: 0.7 + (i % 3) * 0.1 }} />
      ))}
    </div>
  );
}

function LiveTimer() {
  const [elapsed, setElapsed] = useState(4 * 60 + 12);
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return <>{m}:{s}</>;
}

function DetailPanel({ call }: { call: Call }) {
  const isLive = call.status === "LIVE";
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Caller card */}
      <div className="rounded-2xl p-5 shrink-0"
        style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset" }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-base font-semibold shrink-0"
              style={{ background: `linear-gradient(135deg, ${call.gradientFrom} 0%, ${call.gradientTo} 100%)`, color: "#07100C", boxShadow: isLive ? "0 0 20px rgba(52,211,153,0.45)" : "none" }}>
              {call.initials}
            </div>
            <div>
              <div className="mb-0.5" style={{ fontFamily: GS, fontSize: 22, fontWeight: 400, color: "#F4F8F6" }}>{call.name}</div>
              <div className="text-sm mb-1" style={{ color: "#7E908A" }}>{call.phone} · {call.tier}</div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1.5"
                  style={{ background: "rgba(126,144,138,0.15)", color: "#7E908A" }}>
                  <Globe size={11} /> {call.lang} · {call.sport}
                </span>
                {call.amount && call.status !== "MISSED" && (
                  <span className="text-sm font-medium" style={{ color: "#F4F8F6" }}>{call.amount}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            {isLive ? (
              <>
                <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium"
                  style={{ background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.25)" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
                  LIVE NOW · <LiveTimer />
                </div>
                <EqualizerBars />
              </>
            ) : (
              <StatusChip status={call.status} />
            )}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 rounded-2xl p-5 overflow-y-auto"
        style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset", minHeight: 0 }}>
        <div className="text-[10px] tracking-[0.12em] uppercase mb-4" style={{ color: "#7E908A" }}>
          {isLive ? "Streaming Transcript" : "Transcript"}
        </div>
        {call.transcript.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm" style={{ color: "#7E908A" }}>No transcript — call was missed.</div>
        ) : (
          <div className="space-y-3">
            {call.transcript.map((line, i) => {
              const isMello = line.speaker === "mello";
              return (
                <div key={i} className={`flex ${isMello ? "justify-start" : "justify-end"}`}>
                  <div className={`flex items-start gap-2 max-w-[82%] ${isMello ? "" : "flex-row-reverse"}`}>
                    <span className="text-[10px] px-1.5 py-0.5 rounded mt-1 shrink-0 tracking-wide uppercase"
                      style={isMello ? { background: "rgba(52,211,153,0.15)", color: "#34D399", fontWeight: 600 }
                        : { background: "rgba(126,144,138,0.15)", color: "#7E908A", fontWeight: 600 }}>
                      {line.speaker}
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
            {isLive && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded tracking-wide uppercase"
                    style={{ background: "rgba(52,211,153,0.15)", color: "#34D399", fontWeight: 600 }}>mello</span>
                  <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", borderTopLeftRadius: 4 }}>
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: "#34D399", animationDelay: `${d * 0.15}s`, opacity: 0.7 }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tool trace */}
      {call.tools.length > 0 && (
        <div className="rounded-2xl px-5 py-3.5 shrink-0 flex items-center gap-3 flex-wrap"
          style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
          <span className="text-[10px] tracking-[0.12em] uppercase shrink-0" style={{ color: "#7E908A" }}>Tool Calls</span>
          <div className="w-px h-4 shrink-0" style={{ background: "#16201B" }} />
          <div className="flex items-center gap-2 flex-wrap">
            {call.tools.map((tool) => (
              <span key={tool.label} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg"
                style={{ background: tool.done ? "rgba(52,211,153,0.1)" : "rgba(126,144,138,0.1)", color: tool.done ? "#34D399" : "#7E908A", border: `1px solid ${tool.done ? "rgba(52,211,153,0.2)" : "#1B2722"}`, fontFamily: "monospace" }}>
                {tool.label}
                {tool.done && <CheckCircle2 size={11} style={{ color: "#34D399" }} />}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LiveCallsPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const [selectedId, setSelectedId] = useState<number>(1);

  const filtered = CALLS.filter((c) => {
    if (filter === "Live") return c.status === "LIVE";
    if (filter === "Missed") return c.status === "MISSED";
    return true;
  });

  const selectedCall = CALLS.find((c) => c.id === selectedId) ?? CALLS[0];
  const filters: Filter[] = ["All", "Live", "Today", "Missed"];

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            Live &amp; Recent
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>
            Live Calls
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>Real-time call activity · AI handling every ring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-full font-medium"
            style={{ background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
            1 Call Live Now
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ background: "#0E1714", border: "1px solid #1B2722", color: "#7E908A", width: 220 }}>
            <Search size={14} />
            <span className="flex-1 text-xs">Search calls, members…</span>
          </div>
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
            <Bell size={16} style={{ color: "#7E908A" }} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #F0AE5A 0%, #E2902F 100%)", color: "#1A0D00", boxShadow: "0 4px 16px rgba(236,161,75,0.25)" }}>
            <Sparkles size={14} />
            Tune AI
          </button>
        </div>
      </div>

      {/* Split view */}
      <div className="flex flex-1 min-h-0">
        {/* Left list */}
        <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: "38%", borderRight: "1px solid #16201B" }}>
          <div className="px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
            <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
              {filters.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{ background: filter === f ? "#16201B" : "transparent", color: filter === f ? "#F4F8F6" : "#7E908A", border: filter === f ? "1px solid #1B2722" : "1px solid transparent" }}>
                  {f}
                  {f === "Live" && <span className="inline-block w-1.5 h-1.5 rounded-full ml-1.5 animate-pulse align-middle" style={{ background: "#34D399" }} />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-sm" style={{ color: "#7E908A" }}>No calls match this filter.</div>
            ) : (
              filtered.map((call) => (
                <CallRow key={call.id} call={call} selected={selectedId === call.id} onClick={() => setSelectedId(call.id)} />
              ))
            )}
          </div>
        </div>

        {/* Right detail */}
        <div className="flex-1 min-w-0 overflow-hidden p-6" style={{ minHeight: 0 }}>
          <DetailPanel call={selectedCall} />
        </div>
      </div>
    </div>
  );
}

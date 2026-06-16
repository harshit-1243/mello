"use client";

import { Bell, Search, Sparkles, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

const GS = "var(--font-geist-sans)";

const seed = (n: number) =>
  Array.from({ length: 10 }, (_, i) => ({
    v: 30 + Math.abs(Math.sin((i + n) * 0.9) * 45) + (i % 3) * 8,
  }));

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  trend,
  subtext,
  seedN,
}: {
  label: string;
  value: string;
  trend: string;
  subtext: string;
  seedN: number;
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "#0E1714",
        border: "1px solid #1B2722",
        boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)",
      }}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-[11px] tracking-[0.12em] uppercase"
          style={{ color: "#7E908A" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: "rgba(52,211,153,0.12)", color: "#34D399" }}
        >
          {trend}
        </span>
      </div>
      <div style={{ fontFamily: GS, fontSize: 44, fontWeight: 400, color: "#F4F8F6", lineHeight: 1, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "#7E908A" }}>{subtext}</div>
      <div className="h-8 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={seed(seedN)}>
            <Line type="monotone" dataKey="v" stroke="#ECA14B" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Live Call Banner ────────────────────────────────────────────────────────

function EqualizerBars() {
  const [heights, setHeights] = useState([40, 70, 50, 90, 60, 80, 45, 75, 55, 85, 65, 35]);
  useEffect(() => {
    const t = setInterval(() => setHeights(Array.from({ length: 12 }, () => 15 + Math.random() * 85)), 220);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-end gap-[2px] h-7">
      {heights.map((h, i) => (
        <div key={i} className="w-[3px] rounded-sm transition-all duration-200"
          style={{ height: `${h}%`, background: "#34D399", opacity: 0.6 + (i % 4) * 0.1 }} />
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

function LiveCallBanner() {
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-5"
      style={{
        background: "rgba(52,211,153,0.06)",
        border: "1px solid rgba(52,211,153,0.2)",
        boxShadow: "0 0 40px rgba(52,211,153,0.06)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
        style={{
          background: "linear-gradient(135deg, #5FF0B0 0%, #1E7A55 100%)",
          color: "#07100C",
          boxShadow: "0 0 20px rgba(52,211,153,0.45)",
        }}
      >
        MS
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base font-semibold" style={{ color: "#F4F8F6", fontFamily: GS }}>Manan Shah</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(126,144,138,0.15)", color: "#7E908A" }}>EN→HI</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>Member · Tier 2</span>
        </div>
        <p className="text-sm truncate" style={{ color: "#7E908A" }}>
          "Kal raat 9 baje court milega?" — booking badminton, checking availability
        </p>
      </div>
      <EqualizerBars />
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium"
          style={{ background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.25)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
          LIVE · <LiveTimer />
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {["check_slot", "create_booking", "send_whatsapp"].map((t) => (
            <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded"
              style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)", fontFamily: "monospace" }}>
              {t} <CheckCircle2 size={9} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Activity Card ───────────────────────────────────────────────────────────

const RECENT_CALLS = [
  { initials: "RV", name: "Rahul Verma",  phone: "+91 98765 12345", lang: "EN→HI", sport: "Badminton", duration: "1:14", status: "Booked",  statusColor: "#34D399" },
  { initials: "PS", name: "Priya Sharma", phone: "+91 99001 23456", lang: "EN",    sport: "Tennis",    duration: "0:52", status: "Missed",  statusColor: "#ECA14B" },
  { initials: "AK", name: "Arjun Kumar",  phone: "+91 97543 87654", lang: "EN→HI", sport: "Badminton", duration: "2:03", status: "Booked",  statusColor: "#34D399" },
  { initials: "NK", name: "Neha Kapoor",  phone: "+91 96321 55789", lang: "EN",    sport: "Squash",    duration: "1:38", status: "Enquiry", statusColor: "#7E908A" },
];

function ActivityCard() {
  return (
    <div className="rounded-2xl p-5 flex flex-col"
      style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.3)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.12em] uppercase mb-0.5" style={{ color: "#7E908A" }}>Activity</div>
          <div className="text-sm font-medium" style={{ color: "#F4F8F6" }}>Recent Calls</div>
        </div>
        <button className="text-xs" style={{ color: "#34D399" }}>View all →</button>
      </div>
      <div className="space-y-1">
        {RECENT_CALLS.map((c, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ background: "#16201B", color: "#7E908A" }}>{c.initials}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: "#F4F8F6" }}>{c.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(126,144,138,0.15)", color: "#7E908A" }}>{c.lang}</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#7E908A" }}>{c.phone} · {c.sport}</div>
            </div>
            <div className="text-xs shrink-0" style={{ color: "#7E908A" }}>{c.duration}</div>
            <div className="text-[11px] px-2 py-0.5 rounded-full shrink-0 font-medium"
              style={{ background: `${c.statusColor}18`, color: c.statusColor }}>{c.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Upcoming Card ───────────────────────────────────────────────────────────

const UPCOMING = [
  { time: "8:00 PM", name: "Rahul Verma",  sport: "Badminton", type: "non-member", price: "₹600" },
  { time: "9:00 PM", name: "Manan Shah",   sport: "Badminton", type: "member",     price: "₹450" },
  { time: "9:30 PM", name: "Priya Sharma", sport: "Tennis",    type: "non-member", price: "₹750" },
  { time: "10:00 PM", name: "Arjun Kumar", sport: "Squash",    type: "member",     price: "₹400" },
];

function UpcomingCard() {
  return (
    <div className="rounded-2xl p-5 flex flex-col"
      style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.3)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[10px] tracking-[0.12em] uppercase mb-0.5" style={{ color: "#7E908A" }}>Up Next</div>
          <div className="text-sm font-medium" style={{ color: "#F4F8F6" }}>Upcoming Bookings</div>
        </div>
        <button className="text-xs" style={{ color: "#34D399" }}>Calendar →</button>
      </div>
      <div className="space-y-1">
        {UPCOMING.map((b, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}>
            <div className="text-xs font-medium shrink-0 w-14 text-right" style={{ color: "#34D399", fontVariantNumeric: "tabular-nums" }}>{b.time}</div>
            <div className="w-px h-6 shrink-0" style={{ background: "#16201B" }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: "#F4F8F6" }}>{b.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "#7E908A" }}>{b.sport} · {b.type}</div>
            </div>
            <div className="text-sm font-medium shrink-0" style={{ color: "#ECA14B", fontVariantNumeric: "tabular-nums" }}>{b.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const KPI_DATA = [
  { label: "Calls Today",     trend: "↑ +18%", value: "24",     subtext: "vs last Sunday · same window", seedN: 1 },
  { label: "Answer Rate",     trend: "↑ +4%",  value: "92%",    subtext: "22 of 24 picked up under 2 rings", seedN: 3 },
  { label: "Bookings Made",   trend: "↑ +50%", value: "6",      subtext: "5 paid · 1 member", seedN: 5 },
  { label: "Revenue Booked",  trend: "↑ +22%", value: "₹3,600", subtext: "pay-at-venue ₹1,800", seedN: 7 },
];

export default function OverviewPage() {
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="px-9 py-9 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            {today} &nbsp;·&nbsp; 8:00 AM – 12:00 AM
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>
            Overview
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>Your AI receptionist · live and answering</p>
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
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#16201B", color: "#7E908A", border: "1px solid #1B2722" }}>⌘K</span>
          </div>
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
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

      <div className="mb-6">
        <LiveCallBanner />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {KPI_DATA.map((k) => <KpiCard key={k.label} label={k.label} value={k.value} trend={k.trend} subtext={k.subtext} seedN={k.seedN} />)}
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-4">
        <ActivityCard />
        <UpcomingCard />
      </div>
    </div>
  );
}

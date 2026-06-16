"use client";

import { Bell } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from "recharts";

const GS = "var(--font-geist-sans)";
const GRID = "#16201B";
const TICK = "#7E908A";
const AMBER = "#ECA14B";
const EMERALD = "#34D399";

function KpiTile({ label, value, trend, sub }: { label: string; value: string; trend: string; sub: string }) {
  return (
    <div className="flex-1 rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}>
      <div className="flex items-start justify-between">
        <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: "#7E908A" }}>{label}</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(52,211,153,0.12)", color: EMERALD }}>↑ {trend}</span>
      </div>
      <div style={{ fontFamily: GS, fontSize: 44, fontWeight: 400, color: "#F4F8F6", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-xs" style={{ color: "#7E908A" }}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, caption, children }: { title: string; caption?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col gap-4"
      style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}>
      <div className="text-sm font-medium" style={{ color: "#F4F8F6" }}>{title}</div>
      <div className="flex-1">{children}</div>
      {caption && <p className="text-xs leading-relaxed" style={{ color: "#7E908A" }}>{caption}</p>}
    </div>
  );
}

const HOURLY = [
  { h: "7 AM", v: 4 }, { h: "8 AM", v: 9 }, { h: "9 AM", v: 13 }, { h: "10 AM", v: 8 },
  { h: "11 AM", v: 6 }, { h: "12 PM", v: 5 }, { h: "1 PM", v: 3 }, { h: "2 PM", v: 2 },
  { h: "3 PM", v: 4 }, { h: "4 PM", v: 6 }, { h: "5 PM", v: 10 }, { h: "6 PM", v: 14 },
  { h: "7 PM", v: 18 }, { h: "8 PM", v: 16 }, { h: "9 PM", v: 11 }, { h: "10 PM", v: 7 }, { h: "11 PM", v: 3 },
];
const PEAK = "7 PM";

const SPORTS_DATA = [
  { sport: "Badminton", v: 58 }, { sport: "Football Turf", v: 34 }, { sport: "Cricket Turf", v: 27 },
  { sport: "Tennis", v: 14 }, { sport: "Squash", v: 9 },
];

const HOT_MISSES = [
  { slot: "Badminton · 7 PM", count: 12 }, { slot: "Football · 6 PM", count: 9 },
  { slot: "Badminton · 8 PM", count: 8 }, { slot: "Cricket · 9 PM", count: 6 }, { slot: "Tennis · 5 PM", count: 4 },
];

const LEAD_TIME = [
  { id: 0, label: "Same Day", v: 42 }, { id: 1, label: "1 Day Prior", v: 28 },
  { id: 2, label: "2–3 Days", v: 16 }, { id: 3, label: "4–7 Days", v: 9 }, { id: 4, label: "7+ Days", v: 5 },
];

export default function ReportsPage() {
  const sportsMax = SPORTS_DATA[0].v;
  const missesMax = HOT_MISSES[0].count;

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            Analytics · your facility
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Reports</h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>Real outcomes — no vanity metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-full font-medium"
            style={{ background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
            1 Call Live Now
          </div>
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
            <Bell size={16} style={{ color: "#7E908A" }} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
          </button>
        </div>
      </div>

      <div className="px-9 py-7 space-y-5">
        {/* KPI row */}
        <div className="flex gap-4">
          <KpiTile label="Call → Booking Conversion"   value="38%"    trend="+6 pts"  sub="vs 32% last month" />
          <KpiTile label="After-Hours Calls Caught"    value="14"     trend="+14"     sub="would have gone to voicemail" />
          <KpiTile label="Avg Answer Time"             value="1.8s"   trend="−0.4s"   sub="under 2 rings, every call" />
          <KpiTile label="Missed-Call Revenue Recovered" value="₹9,200" trend="+₹2,100" sub="bookings from after-hours calls" />
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard title="Demand by Hour" caption="Booking starts by hour — your real peak windows.">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={HOURLY} barSize={14} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="h" tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                  {HOURLY.map((d, i) => <Cell key={i} fill={d.h === PEAK ? EMERALD : AMBER} fillOpacity={d.h === PEAK ? 1 : 0.7} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Bookings by Sport">
            <div className="flex flex-col gap-3 py-1">
              {SPORTS_DATA.map((d) => (
                <div key={d.sport} className="flex items-center gap-3">
                  <span className="text-xs w-28 shrink-0 text-right" style={{ color: "#7E908A" }}>{d.sport}</span>
                  <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: "#16201B" }}>
                    <div className="h-full rounded-sm transition-all" style={{ width: `${(d.v / sportsMax) * 100}%`, background: AMBER, opacity: 0.85 }} />
                  </div>
                  <span className="text-xs w-6 text-right shrink-0" style={{ color: "#F4F8F6", fontVariantNumeric: "tabular-nums" }}>{d.v}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard title="Member vs Non-member">
            <div className="flex flex-col gap-5 py-2">
              <div className="flex items-end justify-between">
                <div>
                  <div style={{ fontFamily: GS, fontSize: 48, fontWeight: 400, color: EMERALD, lineHeight: 1, letterSpacing: "-0.02em" }}>62%</div>
                  <div className="text-xs mt-1" style={{ color: "#7E908A" }}>Member bookings</div>
                </div>
                <div className="text-right">
                  <div style={{ fontFamily: GS, fontSize: 48, fontWeight: 400, color: "#7E908A", lineHeight: 1, letterSpacing: "-0.02em" }}>38%</div>
                  <div className="text-xs mt-1" style={{ color: "#7E908A" }}>Non-member</div>
                </div>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: "#16201B" }}>
                <div className="h-full rounded-l-full" style={{ width: "62%", background: EMERALD, opacity: 0.85 }} />
                <div className="h-full rounded-r-full" style={{ width: "38%", background: "#2A4A3A" }} />
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: "#7E908A" }}>
                <span><span style={{ color: "#F4F8F6", fontWeight: 600 }}>87</span> bookings by members</span>
                <span><span style={{ color: "#F4F8F6", fontWeight: 600 }}>55</span> by non-members</span>
              </div>
            </div>
          </ChartCard>
          <ChartCard title="Hot Misses" caption="Unmet demand — consider expanding these slots or premium pricing.">
            <div className="flex flex-col gap-3 py-1">
              {HOT_MISSES.map((d, i) => (
                <div key={d.slot} className="flex items-center gap-3">
                  <span className="text-xs w-36 shrink-0 text-right" style={{ color: "#7E908A" }}>{d.slot}</span>
                  <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: "#16201B" }}>
                    <div className="h-full rounded-sm" style={{ width: `${(d.count / missesMax) * 100}%`, background: i === 0 ? "#EF4444" : i === 1 ? "#F97316" : AMBER, opacity: 0.8 }} />
                  </div>
                  <span className="text-xs shrink-0" style={{ color: "#F4F8F6", fontVariantNumeric: "tabular-nums", width: 56 }}>×{d.count} missed</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-2 gap-4">
          <ChartCard title="Slot Lead Time" caption="Helps you decide when to open slots and run promotions.">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={LEAD_TIME} barSize={32} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="label" tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: TICK, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Bar dataKey="v" fill={AMBER} fillOpacity={0.8} radius={[4, 4, 0, 0]}>
                  {LEAD_TIME.map((d) => <Cell key={d.id} fill={AMBER} fillOpacity={0.8} />)}
                  <LabelList dataKey="v" position="top" style={{ fill: "#7E908A", fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Before vs After Mello">
            <div className="flex flex-col gap-6 py-2">
              <div className="flex items-stretch gap-6">
                <div className="flex-1 rounded-xl p-4 flex flex-col gap-2"
                  style={{ background: "#0A120E", border: "1px solid #16201B" }}>
                  <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "#7E908A" }}>Before Mello</div>
                  <div style={{ fontFamily: GS, fontSize: 52, fontWeight: 400, color: "#7E908A", lineHeight: 1, letterSpacing: "-0.02em" }}>47</div>
                  <div className="text-xs" style={{ color: "#7E908A" }}>missed calls / month</div>
                </div>
                <div className="flex-1 rounded-xl p-4 flex flex-col gap-2"
                  style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)" }}>
                  <div className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "#34D399" }}>With Mello</div>
                  <div style={{ fontFamily: GS, fontSize: 52, fontWeight: 400, color: EMERALD, lineHeight: 1, letterSpacing: "-0.02em" }}>44</div>
                  <div className="text-xs" style={{ color: "#7E908A" }}>calls caught & answered</div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div style={{ height: 1, background: "#16201B", width: "100%" }} />
                <div className="pt-3 text-center">
                  <div style={{ fontFamily: GS, fontSize: 40, fontWeight: 400, color: EMERALD, letterSpacing: "-0.02em", lineHeight: 1 }}>93.6%</div>
                  <div className="text-xs mt-1" style={{ color: "#7E908A" }}>missed-call recovery rate</div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

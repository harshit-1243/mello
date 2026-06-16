"use client";

import { useState } from "react";
import { Bell, Search, Plus, Calendar, ChevronDown, Sparkles } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const GS = "var(--font-geist-sans)";

type PaymentStatus = "Paid" | "Pay-at-venue";
type CustomerType = "Member" | "Non-member";
type BookingSource = "Mello" | "Hudle" | "Walk-in";
type Sport = "Badminton" | "Cricket Turf" | "Football Turf" | "Squash" | "Tennis";

interface Booking {
  id: number; time: string; date: string; customer: string; initials: string;
  type: CustomerType; sport: Sport; court: string; duration: string;
  amount: string; payment: PaymentStatus; source: BookingSource;
}

const ALL_BOOKINGS: Booking[] = [
  { id: 1,  time: "7:00 AM",  date: "Sun, 14 Jun", customer: "Arjun Kumar",  initials: "AK", type: "Member",     sport: "Badminton",     court: "Court 1",  duration: "1 hr",   amount: "₹450",   payment: "Paid",         source: "Mello"   },
  { id: 2,  time: "8:00 AM",  date: "Sun, 14 Jun", customer: "Rahul Verma",  initials: "RV", type: "Non-member", sport: "Badminton",     court: "Court 2",  duration: "1 hr",   amount: "₹600",   payment: "Pay-at-venue", source: "Mello"   },
  { id: 3,  time: "8:30 AM",  date: "Sun, 14 Jun", customer: "Sneha Patel",  initials: "SP", type: "Member",     sport: "Cricket Turf",  court: "Turf A",   duration: "1 hr",   amount: "₹900",   payment: "Paid",         source: "Hudle"   },
  { id: 4,  time: "9:00 AM",  date: "Sun, 14 Jun", customer: "Manan Shah",   initials: "MS", type: "Member",     sport: "Badminton",     court: "Court 1",  duration: "1 hr",   amount: "₹450",   payment: "Pay-at-venue", source: "Mello"   },
  { id: 5,  time: "10:00 AM", date: "Sun, 14 Jun", customer: "Vikram Nair",  initials: "VN", type: "Non-member", sport: "Football Turf", court: "Turf B",   duration: "1.5 hr", amount: "₹1,350", payment: "Paid",         source: "Hudle"   },
  { id: 6,  time: "11:00 AM", date: "Sun, 14 Jun", customer: "Priya Sharma", initials: "PS", type: "Non-member", sport: "Tennis",        court: "Court 3",  duration: "1 hr",   amount: "₹750",   payment: "Pay-at-venue", source: "Walk-in" },
  { id: 7,  time: "5:00 PM",  date: "Sun, 14 Jun", customer: "Rohan Mehta",  initials: "RM", type: "Member",     sport: "Squash",        court: "Squash 1", duration: "45 min", amount: "₹350",   payment: "Paid",         source: "Mello"   },
  { id: 8,  time: "6:00 PM",  date: "Sun, 14 Jun", customer: "Aisha Khan",   initials: "AK", type: "Non-member", sport: "Badminton",     court: "Court 2",  duration: "1 hr",   amount: "₹600",   payment: "Paid",         source: "Mello"   },
  { id: 9,  time: "7:30 PM",  date: "Sun, 14 Jun", customer: "Dev Joshi",    initials: "DJ", type: "Member",     sport: "Cricket Turf",  court: "Turf A",   duration: "1 hr",   amount: "₹720",   payment: "Paid",         source: "Hudle"   },
  { id: 10, time: "9:00 PM",  date: "Sun, 14 Jun", customer: "Neha Kapoor",  initials: "NK", type: "Non-member", sport: "Badminton",     court: "Court 1",  duration: "1 hr",   amount: "₹600",   payment: "Pay-at-venue", source: "Mello"   },
];

const SPORTS: Sport[] = ["Badminton", "Cricket Turf", "Football Turf", "Squash", "Tennis"];
const spark = (n: number) => Array.from({ length: 10 }, (_, i) => ({ v: 30 + Math.abs(Math.sin((i + n) * 0.9) * 45) + (i % 3) * 8 }));

function SummaryTile({ label, value, sub, seedN }: { label: string; value: string; sub: string; seedN: number }) {
  return (
    <div className="flex-1 rounded-2xl p-5 flex flex-col justify-between"
      style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.3)", minHeight: 136 }}>
      <div className="text-[11px] tracking-[0.12em] uppercase" style={{ color: "#7E908A" }}>{label}</div>
      <div style={{ fontFamily: GS, fontSize: 44, fontWeight: 400, color: "#F4F8F6", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-xs" style={{ color: "#7E908A" }}>{sub}</div>
      <div className="h-8 -mx-1 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={spark(seedN)}>
            <Line type="monotone" dataKey="v" stroke="#ECA14B" strokeWidth={1.5} dot={false} strokeLinecap="round" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const TypeChip = ({ type }: { type: CustomerType }) =>
  type === "Member"
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>Member</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(126,144,138,0.12)", color: "#7E908A", border: "1px solid #1B2722" }}>Non-member</span>;

const PaymentChip = ({ status }: { status: PaymentStatus }) =>
  status === "Paid"
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>Paid</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(236,161,75,0.12)", color: "#ECA14B", border: "1px solid rgba(236,161,75,0.2)" }}>Pay-at-venue</span>;

const SourceChip = ({ source }: { source: BookingSource }) =>
  source === "Mello"
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.18)" }}>Mello</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(126,144,138,0.1)", color: "#7E908A", border: "1px solid #1B2722" }}>{source}</span>;

export default function BookingsPage() {
  const [sportFilter, setSportFilter] = useState<Sport | "All">("All");
  const [rangeFilter, setRangeFilter] = useState<"Today" | "Week">("Today");
  const [sportOpen, setSportOpen] = useState(false);

  const filtered = ALL_BOOKINGS.filter((b) => sportFilter === "All" || b.sport === sportFilter);

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <div className="flex items-end justify-between px-9 pt-9 pb-6 shrink-0" style={{ borderBottom: "1px solid #16201B" }}>
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#7E908A" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#7E908A" }} />
            8:00 AM – 12:00 AM
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F4F8F6", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>Bookings</h1>
          <p className="mt-2 text-sm" style={{ color: "#7E908A" }}>All court reservations · managed by mello</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-full font-medium"
            style={{ background: "rgba(52,211,153,0.14)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#34D399" }} />
            1 Call Live Now
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ background: "#0E1714", border: "1px solid #1B2722", color: "#7E908A", width: 220 }}>
            <Search size={14} /><span className="flex-1 text-xs">Search calls, members…</span>
          </div>
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#0E1714", border: "1px solid #1B2722" }}>
            <Bell size={16} style={{ color: "#7E908A" }} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #F0AE5A 0%, #E2902F 100%)", color: "#1A0D00", boxShadow: "0 4px 16px rgba(236,161,75,0.25)" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}>
            <Plus size={15} />New Booking
          </button>
        </div>
      </div>

      <div className="flex-1 px-9 py-7 space-y-6">
        <div className="flex gap-4">
          <SummaryTile label="Today"     value="6"       sub="bookings confirmed"       seedN={2} />
          <SummaryTile label="This Week" value="28"      sub="vs 22 last week · +27%"   seedN={5} />
          <SummaryTile label="Revenue"   value="₹14,400" sub="this week · ₹9,800 paid" seedN={8} />
        </div>

        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #16201B" }}>
            <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: "#16201B", border: "1px solid #1B2722" }}>
              {(["Today", "Week"] as const).map((r) => (
                <button key={r} onClick={() => setRangeFilter(r)} className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                  style={{ background: rangeFilter === r ? "#0E1714" : "transparent", color: rangeFilter === r ? "#F4F8F6" : "#7E908A", border: rangeFilter === r ? "1px solid #1B2722" : "1px solid transparent" }}>
                  {r}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "#16201B", border: "1px solid #1B2722", color: "#7E908A" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#B0C4BB")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#7E908A")}>
              <Calendar size={13} />14 Jun 2025
            </button>
            <div className="relative">
              <button onClick={() => setSportOpen((v) => !v)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "#16201B", border: sportOpen ? "1px solid rgba(52,211,153,0.3)" : "1px solid #1B2722", color: sportFilter === "All" ? "#7E908A" : "#F4F8F6" }}>
                <Sparkles size={12} style={{ color: sportFilter === "All" ? "#7E908A" : "#34D399" }} />
                {sportFilter === "All" ? "All Sports" : sportFilter}
                <ChevronDown size={12} style={{ color: "#7E908A", transform: sportOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
              </button>
              {sportOpen && (
                <div className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20 min-w-[160px]"
                  style={{ background: "#0A120E", border: "1px solid #1B2722", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                  {(["All", ...SPORTS] as const).map((s) => (
                    <button key={s} onClick={() => { setSportFilter(s as Sport | "All"); setSportOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs"
                      style={{ color: sportFilter === s ? "#34D399" : "#7E908A", background: sportFilter === s ? "rgba(52,211,153,0.08)" : "transparent" }}
                      onMouseEnter={(e) => { if (sportFilter !== s) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                      onMouseLeave={(e) => { if (sportFilter !== s) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                      {s === "All" ? "All Sports" : s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1" />
            <span className="text-xs" style={{ color: "#7E908A" }}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid #16201B" }}>
                  {["Time", "Date", "Customer", "Type", "Sport", "Court", "Duration", "Amount", "Payment", "Source"].map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-[10px] tracking-[0.1em] uppercase font-medium" style={{ color: "#7E908A" }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #16201B", cursor: "default" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}>
                    <td className="px-4 py-3.5"><span style={{ color: "#34D399", fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 500 }}>{b.time}</span></td>
                    <td className="px-4 py-3.5"><span style={{ color: "#7E908A", fontSize: 13 }}>{b.date}</span></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "#16201B", color: "#7E908A" }}>{b.initials}</div>
                        <span style={{ color: "#F4F8F6", fontWeight: 500 }}>{b.customer}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><TypeChip type={b.type} /></td>
                    <td className="px-4 py-3.5"><span style={{ color: "#B0C4BB", fontSize: 13 }}>{b.sport}</span></td>
                    <td className="px-4 py-3.5"><span style={{ color: "#7E908A", fontSize: 13 }}>{b.court}</span></td>
                    <td className="px-4 py-3.5"><span style={{ color: "#7E908A", fontSize: 13 }}>{b.duration}</span></td>
                    <td className="px-4 py-3.5"><span style={{ color: "#F4F8F6", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{b.amount}</span></td>
                    <td className="px-4 py-3.5"><PaymentChip status={b.payment} /></td>
                    <td className="px-4 py-3.5"><SourceChip source={b.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex items-center justify-center py-16 text-sm" style={{ color: "#7E908A" }}>No bookings match this filter.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

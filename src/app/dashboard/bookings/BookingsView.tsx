"use client";

import { useState } from "react";
import { ChevronDown, Calendar, CalendarDays } from "lucide-react";
import type { BookingRow } from "@/lib/dashboard/data";
import { rupees } from "@/lib/dashboard/format";

const GS = "var(--font-geist-sans)";

function SummaryTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex-1 rounded-2xl p-5 flex flex-col gap-2 justify-center"
      style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.3)", minHeight: 120 }}>
      <div className="text-[11px] tracking-[0.12em] uppercase" style={{ color: "#7E908A" }}>{label}</div>
      <div style={{ fontFamily: GS, fontSize: 40, fontWeight: 400, color: "#F4F8F6", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-xs" style={{ color: "#7E908A" }}>{sub}</div>
    </div>
  );
}

const TypeChip = ({ member }: { member: boolean }) =>
  member
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(52,211,153,0.12)", color: "#34D399", border: "1px solid rgba(52,211,153,0.2)" }}>Member</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(126,144,138,0.12)", color: "#7E908A", border: "1px solid #1B2722" }}>Non-member</span>;

const SourceChip = ({ source }: { source: string }) =>
  source === "mello"
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(52,211,153,0.1)", color: "#34D399", border: "1px solid rgba(52,211,153,0.18)" }}>Mello</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: "rgba(126,144,138,0.1)", color: "#7E908A", border: "1px solid #1B2722" }}>{source}</span>;

export function BookingsView({ upcoming, past }: { upcoming: BookingRow[]; past: BookingRow[] }) {
  const all = [...upcoming, ...past];
  const sports = ["All", ...Array.from(new Set(all.map((b) => b.sport)))];
  const [sportFilter, setSportFilter] = useState("All");
  const [sportOpen, setSportOpen] = useState(false);

  const filtered = all.filter((b) => sportFilter === "All" || b.sport === sportFilter);

  const revenue = all.reduce((sum, b) => sum + (b.member ? 0 : b.amountInr), 0);
  const melloCount = all.filter((b) => b.source === "mello").length;

  return (
    <div className="flex-1 px-9 py-7 space-y-6">
      {/* Summary tiles */}
      <div className="flex gap-4">
        <SummaryTile label="Upcoming" value={String(upcoming.length)} sub="bookings ahead" />
        <SummaryTile label="Total" value={String(all.length)} sub={`${melloCount} booked by Mello`} />
        <SummaryTile label="Revenue booked" value={rupees(revenue)} sub="non-member · to collect at venue" />
      </div>

      {/* Table card */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#0E1714", border: "1px solid #1B2722", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.3)" }}>
        {/* Filter bar */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #16201B" }}>
          <div className="relative">
            <button onClick={() => setSportOpen((v) => !v)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "#16201B", border: sportOpen ? "1px solid rgba(52,211,153,0.3)" : "1px solid #1B2722", color: sportFilter === "All" ? "#7E908A" : "#F4F8F6" }}>
              <Calendar size={12} style={{ color: sportFilter === "All" ? "#7E908A" : "#34D399" }} />
              {sportFilter === "All" ? "All Sports" : sportFilter}
              <ChevronDown size={12} style={{ color: "#7E908A", transform: sportOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
            </button>
            {sportOpen && (
              <div className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20 min-w-[160px]"
                style={{ background: "#0A120E", border: "1px solid #1B2722", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                {sports.map((s) => (
                  <button key={s} onClick={() => { setSportFilter(s); setSportOpen(false); }}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid #16201B" }}>
                {["Date", "Time", "Customer", "Type", "Sport", "Court", "Amount", "Source"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-[10px] tracking-[0.1em] uppercase font-medium" style={{ color: "#7E908A" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #16201B" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}>
                  <td className="px-4 py-3.5"><span style={{ color: "#7E908A", fontSize: 13 }}>{b.dateLabel}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#34D399", fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 500 }}>{b.when}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#F4F8F6", fontWeight: 500 }}>{b.who}</span></td>
                  <td className="px-4 py-3.5"><TypeChip member={b.member} /></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#B0C4BB", fontSize: 13 }}>{b.sport}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#7E908A", fontSize: 13 }}>{b.court}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#F4F8F6", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{b.member ? "₹0" : rupees(b.amountInr)}</span></td>
                  <td className="px-4 py-3.5"><SourceChip source={b.source} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-sm gap-2" style={{ color: "#7E908A" }}>
              <CalendarDays size={24} style={{ color: "#1B2722" }} />
              No bookings match this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

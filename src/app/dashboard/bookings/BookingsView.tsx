"use client";

import { useState } from "react";
import { ChevronDown, Calendar, CalendarDays } from "lucide-react";
import type { BookingRow } from "@/lib/dashboard/data";
import { rupees } from "@/lib/dashboard/format";

const GS = "var(--font-geist-sans)";

function SummaryTile({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="flex-1 rounded-2xl p-5 flex flex-col gap-2 justify-center"
      style={{ background: "#181030", border: "1px solid #2A2348", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.3)", minHeight: 120 }}>
      <div className="text-[11px] tracking-[0.12em] uppercase" style={{ color: "#8C86A8" }}>{label}</div>
      <div style={{ fontFamily: GS, fontSize: 40, fontWeight: 400, color: accent ?? "#F3F1FB", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-xs" style={{ color: "#8C86A8" }}>{sub}</div>
    </div>
  );
}

const TypeChip = ({ member }: { member: boolean }) =>
  member
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.2)" }}>Member</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(126,144,138,0.12)", color: "#8C86A8", border: "1px solid #2A2348" }}>Non-member</span>;

const SourceChip = ({ source }: { source: string }) =>
  source === "mello"
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.18)" }}>Mello</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize" style={{ background: "rgba(126,144,138,0.1)", color: "#8C86A8", border: "1px solid #2A2348" }}>{source}</span>;

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
        <SummaryTile label="Revenue booked" value={rupees(revenue)} sub="non-member · to collect at venue" accent="#34D6E0" />
      </div>

      {/* Table card */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "#181030", border: "1px solid #2A2348", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 32px rgba(0,0,0,0.3)" }}>
        {/* Filter bar */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid #20183C" }}>
          <div className="relative">
            <button onClick={() => setSportOpen((v) => !v)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "#20183C", border: sportOpen ? "1px solid rgba(167,139,250,0.3)" : "1px solid #2A2348", color: sportFilter === "All" ? "#8C86A8" : "#F3F1FB" }}>
              <Calendar size={12} style={{ color: sportFilter === "All" ? "#8C86A8" : "#A78BFA" }} />
              {sportFilter === "All" ? "All Sports" : sportFilter}
              <ChevronDown size={12} style={{ color: "#8C86A8", transform: sportOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
            </button>
            {sportOpen && (
              <div className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-20 min-w-[160px]"
                style={{ background: "#0E0A1E", border: "1px solid #2A2348", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                {sports.map((s) => (
                  <button key={s} onClick={() => { setSportFilter(s); setSportOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs"
                    style={{ color: sportFilter === s ? "#A78BFA" : "#8C86A8", background: sportFilter === s ? "rgba(167,139,250,0.08)" : "transparent" }}
                    onMouseEnter={(e) => { if (sportFilter !== s) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (sportFilter !== s) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                    {s === "All" ? "All Sports" : s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1" />
          <span className="text-xs" style={{ color: "#8C86A8" }}>{filtered.length} booking{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid #20183C" }}>
                {["Date", "Time", "Customer", "Type", "Sport", "Court", "Amount", "Source"].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-[10px] tracking-[0.1em] uppercase font-medium" style={{ color: "#8C86A8" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #20183C" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.04)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}>
                  <td className="px-4 py-3.5"><span style={{ color: "#8C86A8", fontSize: 13 }}>{b.dateLabel}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#A78BFA", fontVariantNumeric: "tabular-nums", fontSize: 13, fontWeight: 500 }}>{b.when}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#F3F1FB", fontWeight: 500 }}>{b.who}</span></td>
                  <td className="px-4 py-3.5"><TypeChip member={b.member} /></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#C2BCE0", fontSize: 13 }}>{b.sport}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#8C86A8", fontSize: 13 }}>{b.court}</span></td>
                  <td className="px-4 py-3.5"><span style={{ color: "#F3F1FB", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontSize: 13 }}>{b.member ? "₹0" : rupees(b.amountInr)}</span></td>
                  <td className="px-4 py-3.5"><SourceChip source={b.source} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-sm gap-2" style={{ color: "#8C86A8" }}>
              <CalendarDays size={24} style={{ color: "#2A2348" }} />
              No bookings match this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

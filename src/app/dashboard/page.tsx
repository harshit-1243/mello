import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { getOverview } from "@/lib/dashboard/data";
import { formatPhone, timeAgo, rupees } from "@/lib/dashboard/format";

const GS = "var(--font-geist-sans)";

const STATUS_COLOR: Record<string, string> = { booked: "#A78BFA", handled: "#8C86A8", missed: "#F87171" };
const STATUS_LABEL: Record<string, string> = { booked: "Booked", handled: "Handled", missed: "Missed" };

function KpiCard({ label, value, subtext, accent }: { label: string; value: string; subtext: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "#181030", border: "1px solid #2A2348", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)" }}>
      <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: "#8C86A8" }}>{label}</span>
      <div style={{ fontFamily: GS, fontSize: 44, fontWeight: 400, color: accent ?? "#F3F1FB", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-xs" style={{ color: "#8C86A8" }}>{subtext}</div>
    </div>
  );
}

export default async function OverviewPage() {
  const { hoursLabel, stats, recentCalls, upcoming } = await getOverview();

  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long",
  }).format(new Date());

  return (
    <div className="px-9 py-9 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="text-[11px] tracking-[0.12em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#8C86A8" }}>
            <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#8C86A8" }} />
            {today} &nbsp;·&nbsp; {hoursLabel}
          </div>
          <h1 style={{ fontFamily: GS, fontSize: 56, fontWeight: 400, color: "#F3F1FB", lineHeight: 1.05, letterSpacing: "-0.025em", margin: 0 }}>
            Overview
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#8C86A8" }}>Your AI receptionist · answering and booking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{ background: "#181030", border: "1px solid #2A2348", color: "#8C86A8", width: 220 }}>
            <Search size={14} />
            <span className="flex-1 text-xs">Search calls, members…</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#20183C", color: "#8C86A8", border: "1px solid #2A2348" }}>⌘K</span>
          </div>
          <button className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#181030", border: "1px solid #2A2348" }}>
            <Bell size={16} style={{ color: "#8C86A8" }} />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard label="Calls Today"    value={String(stats.callsToday)} subtext={`${stats.answered} answered`} />
        <KpiCard label="Answer Rate"    value={`${stats.answerRatePct}%`} subtext={`${stats.answered} of ${stats.callsToday} answered`} />
        <KpiCard label="Bookings Made"  value={String(stats.bookingsMade)} subtext={`${stats.bookingsMade - stats.bookingsMember} non-member · ${stats.bookingsMember} member`} />
        <KpiCard label="Revenue Booked" value={rupees(stats.revenueBookedInr)} subtext={`${stats.bookingsMade - stats.bookingsMember} to collect at venue`} accent="#34D6E0" />
      </div>

      {/* Activity + Upcoming */}
      <div className="grid grid-cols-[1fr_380px] gap-4">
        {/* Recent calls */}
        <div className="rounded-2xl p-5 flex flex-col"
          style={{ background: "#181030", border: "1px solid #2A2348", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.3)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.12em] uppercase mb-0.5" style={{ color: "#8C86A8" }}>Activity</div>
              <div className="text-sm font-medium" style={{ color: "#F3F1FB" }}>Recent Calls</div>
            </div>
            <Link href="/dashboard/calls" className="text-xs" style={{ color: "#A78BFA" }}>View all →</Link>
          </div>
          <div className="space-y-1">
            {recentCalls.length === 0 && (
              <div className="text-sm py-6 text-center" style={{ color: "#8C86A8" }}>No calls yet today.</div>
            )}
            {recentCalls.map((c) => (
              <Link key={c.id} href={`/dashboard/calls`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.03]">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "#F3F1FB" }}>{formatPhone(c.phone)}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: "#8C86A8" }}>{c.summary}</div>
                </div>
                <div className="text-xs shrink-0" style={{ color: "#8C86A8" }}>{timeAgo(c.at)}</div>
                <div className="text-[11px] px-2 py-0.5 rounded-full shrink-0 font-medium"
                  style={{ background: `${STATUS_COLOR[c.status]}18`, color: STATUS_COLOR[c.status] }}>
                  {STATUS_LABEL[c.status]}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming bookings */}
        <div className="rounded-2xl p-5 flex flex-col"
          style={{ background: "#181030", border: "1px solid #2A2348", boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.3)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] tracking-[0.12em] uppercase mb-0.5" style={{ color: "#8C86A8" }}>Up Next</div>
              <div className="text-sm font-medium" style={{ color: "#F3F1FB" }}>Upcoming Bookings</div>
            </div>
            <Link href="/dashboard/bookings" className="text-xs" style={{ color: "#A78BFA" }}>Calendar →</Link>
          </div>
          <div className="space-y-1">
            {upcoming.length === 0 && (
              <div className="text-sm py-6 text-center" style={{ color: "#8C86A8" }}>No upcoming bookings.</div>
            )}
            {upcoming.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
                <div className="text-xs font-medium shrink-0 w-16 text-right" style={{ color: "#A78BFA", fontVariantNumeric: "tabular-nums" }}>{b.when}</div>
                <div className="w-px h-6 shrink-0" style={{ background: "#20183C" }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#F3F1FB" }}>{b.sport}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: "#8C86A8" }}>{b.who}</div>
                </div>
                <div className="text-[11px] px-2 py-0.5 rounded-full shrink-0" style={{ background: "#20183C", color: "#8C86A8" }}>{b.court}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

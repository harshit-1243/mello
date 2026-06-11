import { getOverview } from "@/lib/dashboard/data";
import { formatPhone, rupees, timeAgo } from "@/lib/dashboard/format";
import { StatCard, Panel, StatusTag, LivePill } from "@/components/dashboard/DashUI";

export default async function OverviewPage() {
  const { hoursLabel, stats, recentCalls, upcoming, live } = await getOverview();
  const today = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-tightest text-ink">Overview</h1>
          <p className="mt-1.5 text-[14px] text-ink-muted">
            {today} · {hoursLabel}
          </p>
        </div>
        {live && <LivePill count={1} />}
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Calls today" value={String(stats.callsToday)} note={`${stats.answered} answered`} />
        <StatCard label="Answered" value={String(stats.answered)} note={`${stats.answerRatePct}% answer rate`} />
        <StatCard
          label="Bookings made"
          value={String(stats.bookingsMade)}
          note={`${stats.bookingsMade - stats.bookingsMember} non-member · ${stats.bookingsMember} member`}
        />
        <StatCard
          label="Revenue booked"
          value={rupees(stats.revenueBookedInr)}
          note={`${stats.bookingsMade - stats.bookingsMember} to collect`}
          noteTone="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.45fr_1fr]">
        <Panel title="Recent calls" action={{ label: "View all", href: "/dashboard/calls" }}>
          {recentCalls.map((c) => (
            <div key={c.id} className="flex items-center gap-3.5 border-b border-line px-5 py-3 text-[14px] last:border-0">
              <span className="tabular w-[124px] shrink-0 font-semibold text-ink">{formatPhone(c.phone)}</span>
              <span className="min-w-0 flex-1 truncate text-ink-muted">{c.summary}</span>
              <span className="hidden shrink-0 text-[12px] text-ink-muted sm:block">{timeAgo(c.at)}</span>
              <StatusTag status={c.status} />
            </div>
          ))}
        </Panel>

        <Panel title="Upcoming bookings" action={{ label: "Calendar", href: "/dashboard/bookings" }}>
          {upcoming.map((b) => (
            <div key={b.id} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-0">
              <span className="tabular w-[74px] shrink-0 text-[14px] font-semibold text-ink">{b.when}</span>
              <span className="min-w-0 flex-1 text-[14px]">
                <span className="text-ink">{b.sport}</span>
                <span className="mt-0.5 block text-[12.5px] text-ink-muted">{b.who}</span>
              </span>
              <span className="shrink-0 rounded-lg border border-line bg-paper px-2.5 py-1 text-[12px] font-semibold text-ink-muted">
                {b.court}
              </span>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );
}

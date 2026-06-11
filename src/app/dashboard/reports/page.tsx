import { getReports } from "@/lib/dashboard/data";
import { rupees } from "@/lib/dashboard/format";
import { StatCard, Panel, PageHeader } from "@/components/dashboard/DashUI";

export default async function ReportsPage() {
  const r = await getReports();
  const maxHour = Math.max(1, ...r.byHour.map((h) => h.count));
  const maxSport = Math.max(1, ...r.bySport.map((s) => s.count));
  const mixTotal = Math.max(1, r.memberMix.member + r.memberMix.nonMember);

  return (
    <>
      <PageHeader title="Reports" subtitle={`Last ${r.periodDays} days`} />

      {/* Headline metrics — all derived from real calls + bookings. */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Calls handled" value={String(r.calls)} note={`${r.answerRatePct}% answered, 24/7`} />
        <StatCard label="Call → booking" value={`${r.conversionPct}%`} note={`${r.bookings} bookings`} />
        <StatCard label="After-hours calls caught" value={String(r.afterHoursCalls)} note="would've been missed" noteTone="amber" />
        <StatCard label="Revenue booked" value={rupees(r.revenueInr)} note="non-member, this period" noteTone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.4fr_1fr]">
        {/* Demand by hour */}
        <Panel title="Demand by hour">
          <div className="px-5 pb-5 pt-4">
            <div className="flex h-[170px] items-end gap-1.5">
              {r.byHour.map((h) => (
                <div key={h.hour} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <div
                    className="w-full max-w-[20px] rounded-t-md bg-gradient-to-t from-green to-signal"
                    style={{ height: `${Math.max(4, (h.count / maxHour) * 100)}%` }}
                    title={`${h.count} bookings at ${hourShort(h.hour)}`}
                  />
                  <span className="tabular text-[9.5px] text-ink-muted">{hourShort(h.hour)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] text-ink-muted">Booking starts by hour — your real peak windows for staffing &amp; pricing.</p>
          </div>
        </Panel>

        <div className="flex flex-col gap-[18px]">
          {/* Bookings by sport */}
          <Panel title="Bookings by sport">
            <div className="py-2">
              {r.bySport.map((s) => (
                <div key={s.sport} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="w-[88px] shrink-0 text-[13px] text-ink">{s.sport}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
                    <div className="h-full rounded-full bg-green" style={{ width: `${(s.count / maxSport) * 100}%` }} />
                  </div>
                  <span className="tabular w-[36px] shrink-0 text-right text-[13px] font-semibold text-ink">{s.count}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Member mix */}
          <Panel title="Member vs non-member">
            <div className="p-5">
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink/[0.07]">
                <div className="bg-green" style={{ width: `${(r.memberMix.member / mixTotal) * 100}%` }} />
                <div className="bg-green/30" style={{ width: `${(r.memberMix.nonMember / mixTotal) * 100}%` }} />
              </div>
              <div className="mt-3 flex justify-between text-[12.5px] text-ink-muted">
                <span><b className="text-ink">{r.memberMix.member}</b> member</span>
                <span><b className="text-ink">{r.memberMix.nonMember}</b> non-member</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Before vs after Mello — dormant until the facility provides a baseline. */}
      <div className="mt-[18px]">
        <Panel title="Before vs after Mello">
          {r.baseline ? (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <Compare label="Missed / month before" value={String(r.baseline.missedPerMonth)} tone="muted" />
              <Compare label="Calls caught after-hours" value={String(r.afterHoursCalls)} tone="green" />
              <Compare
                label="Recovery vs baseline"
                value={`${Math.round((r.afterHoursCalls / Math.max(1, r.baseline.missedPerMonth)) * 100)}%`}
                tone="green"
              />
            </div>
          ) : (
            <div className="p-5">
              <p className="max-w-[640px] text-[13.5px] text-ink-muted">
                Add this facility&rsquo;s pre-Mello numbers (average missed calls per month before Mello) to unlock the
                before-and-after view — calls recovered, bookings saved, and the real uplift. We capture this at
                onboarding, never estimate it.
              </p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12.5px] font-semibold text-ink-muted">
                <span className="h-[7px] w-[7px] rounded-full bg-ink-muted/60" /> Baseline not set
              </span>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function Compare({ label, value, tone }: { label: string; value: string; tone: "green" | "muted" }) {
  return (
    <div className="rounded-xl border border-line bg-paper p-4">
      <div className="text-[11.5px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`tabular mt-1.5 text-[26px] font-semibold ${tone === "green" ? "text-green" : "text-ink"}`}>{value}</div>
    </div>
  );
}

/** 8 → "8a", 18 → "6p", 0 → "12a". */
function hourShort(h: number): string {
  const ampm = h < 12 || h === 24 ? "a" : "p";
  const hr = h % 12 || 12;
  return `${hr}${ampm}`;
}

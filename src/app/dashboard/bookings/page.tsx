import { getBookings, type BookingRow } from "@/lib/dashboard/data";
import { rupees } from "@/lib/dashboard/format";
import { PageHeader, Panel, Badge } from "@/components/dashboard/DashUI";

export default async function BookingsPage() {
  const { upcoming, past } = await getBookings();

  return (
    <>
      <PageHeader title="Bookings" subtitle={`${upcoming.length} upcoming · ${past.length} recent`} />

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <Panel title="Upcoming">
          {upcoming.map((b) => (
            <BookingLine key={b.id} b={b} />
          ))}
        </Panel>
        <Panel title="Recent">
          {past.map((b) => (
            <BookingLine key={b.id} b={b} muted />
          ))}
        </Panel>
      </div>
    </>
  );
}

function BookingLine({ b, muted }: { b: BookingRow; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3.5 border-b border-line px-5 py-3.5 last:border-0">
      <div className="w-[96px] shrink-0">
        <div className="text-[13px] font-semibold text-ink">{b.dateLabel}</div>
        <div className="tabular text-[12px] text-ink-muted">{b.when}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          {b.sport}
          <span className="text-[12px] font-medium text-ink-muted">· {b.court}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-ink-muted">
          {b.who}
          {b.source === "hudle" ? (
            <Badge tone="amber">Hudle</Badge>
          ) : b.member ? (
            <Badge tone="green">member</Badge>
          ) : null}
        </div>
      </div>
      <div className={`shrink-0 text-[13px] font-semibold ${muted ? "text-ink-muted" : "text-ink"}`}>
        {b.source === "hudle" ? "—" : b.amountInr === 0 ? "₹0" : rupees(b.amountInr)}
      </div>
    </div>
  );
}

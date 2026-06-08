import Link from "next/link";
import { getCalls } from "@/lib/dashboard/data";
import { formatPhone, timeAgo, clockFromSeconds } from "@/lib/dashboard/format";
import { PageHeader, Panel, StatusTag, Badge } from "@/components/dashboard/DashUI";

export default async function CallsPage() {
  const calls = await getCalls();

  return (
    <>
      <PageHeader title="Calls" subtitle={`${calls.length} calls today · every inbound call, answered`} />

      <Panel title="Today">
        {/* column header */}
        <div className="hidden items-center gap-3.5 border-b border-line px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted md:flex">
          <span className="w-[124px]">Caller</span>
          <span className="flex-1">Intent</span>
          <span className="w-[108px]">Language</span>
          <span className="w-[64px]">Length</span>
          <span className="w-[78px]">When</span>
          <span className="w-[84px] text-right">Outcome</span>
        </div>

        {calls.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/calls/${c.id}`}
            className="flex flex-wrap items-center gap-3.5 border-b border-line px-5 py-3.5 text-[14px] transition-colors last:border-0 hover:bg-ink/[0.025]"
          >
            <span className="flex w-[124px] shrink-0 flex-col">
              <span className="tabular font-semibold text-ink">{formatPhone(c.phone)}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-muted">
                {c.name ?? "Unknown"}
                {c.isMember && <Badge tone="green">member</Badge>}
              </span>
            </span>
            <span className="min-w-0 flex-1 truncate text-ink">{c.intent}</span>
            <span className="w-[108px] shrink-0 text-[13px] text-ink-muted">{c.language}</span>
            <span className="tabular w-[64px] shrink-0 text-[13px] text-ink-muted">{clockFromSeconds(c.durationSeconds)}</span>
            <span className="w-[78px] shrink-0 text-[12px] text-ink-muted">{timeAgo(c.at)}</span>
            <span className="w-[84px] shrink-0 text-right">
              <StatusTag status={c.status} />
            </span>
          </Link>
        ))}
      </Panel>
    </>
  );
}

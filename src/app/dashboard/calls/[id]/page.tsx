import Link from "next/link";
import { notFound } from "next/navigation";
import { getCall } from "@/lib/dashboard/data";
import { formatPhone, timeAgo, clockFromSeconds, rupees } from "@/lib/dashboard/format";
import { Panel, StatusTag, Badge } from "@/components/dashboard/DashUI";
import { cn } from "@/lib/cn";

export default async function CallDetailPage({ params }: PageProps<"/dashboard/calls/[id]">) {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) notFound();

  return (
    <>
      <Link href="/dashboard/calls" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-ink">
        ← Calls
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="tabular flex items-center gap-2.5 font-display text-[28px] font-semibold tracking-tightest text-ink">
            {formatPhone(call.phone)}
            {call.name && <span className="text-ink-muted">· {call.name}</span>}
            {call.isMember && <Badge tone="green">member</Badge>}
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-muted">
            {call.intent} · {call.language} · {clockFromSeconds(call.durationSeconds)} · {timeAgo(call.at)}
          </p>
        </div>
        <StatusTag status={call.status} />
      </header>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.5fr_1fr]">
        {/* Transcript */}
        <Panel title="Transcript">
          <div className="flex flex-col gap-3 p-5">
            {call.transcript.map((line, i) => (
              <div key={i} className={cn("flex", line.role === "mello" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed",
                    line.role === "mello"
                      ? "rounded-br-sm bg-green/[0.1] text-ink"
                      : "rounded-bl-sm border border-line bg-paper text-ink",
                  )}
                >
                  <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    {line.role === "mello" ? "Mello" : "Caller"}
                  </div>
                  {line.text}
                </div>
              </div>
            ))}
            {call.transcript.length <= 1 && (
              <p className="py-6 text-center text-[13px] text-ink-muted">Caller hung up — no conversation recorded.</p>
            )}
          </div>
        </Panel>

        {/* Side column */}
        <div className="flex flex-col gap-[18px]">
          {call.booking && (
            <Panel title="Booking made">
              <div className="space-y-2.5 p-5 text-[14px]">
                <Field label="Sport" value={call.booking.sport} />
                <Field label="Court" value={call.booking.court} />
                <Field label="When" value={call.booking.when} />
                <Field
                  label="Amount"
                  value={call.booking.amountInr === 0 ? "Member — ₹0" : `${rupees(call.booking.amountInr)}`}
                />
                <Field label="Source" value={call.booking.source} />
              </div>
              <div className="border-t border-line px-5 py-3 text-[12px] text-ink-muted">
                Court is shown here for staff — it is never spoken on the call, only sent in the WhatsApp confirmation.
              </div>
            </Panel>
          )}

          <Panel title="What Mello did">
            <ol className="p-5">
              {call.toolCalls.length === 0 && <li className="text-[13px] text-ink-muted">No tools were called.</li>}
              {call.toolCalls.map((t, i) => (
                <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green/[0.13] text-[11px] font-semibold text-green">
                    {i + 1}
                  </span>
                  <span className="text-[13.5px]">
                    <code className="font-mono text-[12.5px] font-semibold text-ink">{t.tool}</code>
                    <span className="mt-0.5 block text-ink-muted">{t.summary}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Privacy">
            <div className="space-y-3 p-5 text-[13px] text-ink-muted">
              <p>Audio was never stored. This transcript auto-deletes 90 days after the call.</p>
              <button className="rounded-lg border border-danger/40 px-3 py-2 text-[13px] font-semibold text-danger transition-colors hover:bg-danger/[0.06]">
                Delete this caller&rsquo;s data
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

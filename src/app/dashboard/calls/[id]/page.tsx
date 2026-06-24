import Link from "next/link";
import { notFound } from "next/navigation";
import { getCall } from "@/lib/dashboard/data";
import { formatPhone, timeAgo, clockFromSeconds, rupees } from "@/lib/dashboard/format";

const GS = "var(--font-geist-sans)";

export default async function CallDetailPage({ params }: PageProps<"/dashboard/calls/[id]">) {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) notFound();

  const statusColor = call.status === "booked" ? "#A78BFA" : call.status === "missed" ? "#F87171" : "#8C86A8";
  const statusLabel = call.status === "booked" ? "Booked" : call.status === "missed" ? "Missed" : "Handled";

  return (
    <div className="px-9 py-8">
      <Link href="/dashboard/calls" className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity"
        style={{ color: "#8C86A8" }}
        onMouseEnter={undefined}
        onMouseLeave={undefined}>
        ← Live Calls
      </Link>

      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: GS, fontSize: 36, fontWeight: 400, color: "#F3F1FB", letterSpacing: "-0.02em" }}>
            {formatPhone(call.phone)}
            {call.name && <span style={{ color: "#8C86A8" }}> · {call.name}</span>}
            {call.isMember && (
              <span className="ml-3 text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.2)", verticalAlign: "middle" }}>member</span>
            )}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "#8C86A8" }}>
            {call.intent} · {call.language} · {clockFromSeconds(call.durationSeconds)} · {timeAgo(call.at)}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
          {statusLabel}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Transcript */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#181030", border: "1px solid #2A2348" }}>
          <div className="px-5 py-4 text-sm font-medium" style={{ color: "#F3F1FB", borderBottom: "1px solid #20183C" }}>Transcript</div>
          <div className="flex flex-col gap-3 p-5">
            {call.transcript.map((line, i) => {
              const isMello = line.role === "mello";
              return (
                <div key={i} className={`flex ${isMello ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={isMello
                      ? { background: "rgba(167,139,250,0.08)", color: "#E4DEF5", border: "1px solid rgba(167,139,250,0.15)", borderBottomRightRadius: 4 }
                      : { background: "rgba(126,144,138,0.1)", color: "#C2BCE0", border: "1px solid #2A2348", borderBottomLeftRadius: 4 }}>
                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: isMello ? "#A78BFA" : "#8C86A8" }}>
                      {isMello ? "Mello" : "Caller"}
                    </div>
                    {line.text}
                  </div>
                </div>
              );
            })}
            {call.transcript.length <= 1 && (
              <p className="py-6 text-center text-sm" style={{ color: "#8C86A8" }}>Caller hung up — no conversation recorded.</p>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-4">
          {call.booking && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#181030", border: "1px solid #2A2348" }}>
              <div className="px-5 py-4 text-sm font-medium" style={{ color: "#F3F1FB", borderBottom: "1px solid #20183C" }}>Booking made</div>
              <div className="space-y-2.5 p-5 text-sm">
                {[
                  { label: "Sport", value: call.booking.sport },
                  { label: "Court", value: call.booking.court },
                  { label: "When", value: call.booking.when },
                  { label: "Amount", value: call.booking.amountInr === 0 ? "Member — ₹0" : rupees(call.booking.amountInr) },
                  { label: "Source", value: call.booking.source },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-4">
                    <span style={{ color: "#8C86A8" }}>{label}</span>
                    <span className="font-medium" style={{ color: "#F3F1FB" }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 text-xs" style={{ color: "#8C86A8", borderTop: "1px solid #20183C" }}>
                Court is shown here for staff — it is never spoken on the call, only sent in the WhatsApp confirmation.
              </div>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={{ background: "#181030", border: "1px solid #2A2348" }}>
            <div className="px-5 py-4 text-sm font-medium" style={{ color: "#F3F1FB", borderBottom: "1px solid #20183C" }}>What Mello did</div>
            <ol className="p-5 space-y-3">
              {call.toolCalls.length === 0 && <li className="text-sm" style={{ color: "#8C86A8" }}>No tools were called.</li>}
              {call.toolCalls.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                    style={{ background: "rgba(167,139,250,0.13)", color: "#A78BFA" }}>{i + 1}</span>
                  <span className="text-sm">
                    <code className="text-[12.5px] font-semibold" style={{ fontFamily: "monospace", color: "#F3F1FB" }}>{t.tool}</code>
                    <span className="mt-0.5 block" style={{ color: "#8C86A8" }}>{t.summary}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "#181030", border: "1px solid #2A2348" }}>
            <div className="px-5 py-4 text-sm font-medium" style={{ color: "#F3F1FB", borderBottom: "1px solid #20183C" }}>Privacy</div>
            <div className="space-y-3 p-5 text-sm" style={{ color: "#8C86A8" }}>
              <p>Audio was never stored. This transcript auto-deletes 90 days after the call.</p>
              <button className="rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors"
                style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#F87171" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}>
                Delete this caller&rsquo;s data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

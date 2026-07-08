"use client";

import { useCallback, useEffect, useState } from "react";
import type { OutboundCampaign, OutboundMetrics, OutboundContact, OutboundCall } from "@/lib/dashboard/outbound";

const GS = "var(--font-geist-sans)";
const POLL_MS = 4000;

// Disposition / state → label + colours, on the dashboard's booked/handled/missed palette.
type Pill = { label: string; color: string; bg: string };
const GREEN: Pill["color"] = "#A78BFA";
const ROSE = "#F87171";
const GREY = "#8C86A8";
function pill(color: string, label: string): Pill {
  return { label, color, bg: `${color}1f` };
}
function dispoPill(disposition: string | null, state: string): Pill {
  switch (disposition) {
    case "confirmed": return pill(GREEN, "Confirmed");
    case "rescheduled": return pill(GREEN, "Rescheduled");
    case "callback_requested": return pill(GREY, "Callback");
    case "refused": return pill(ROSE, "Refused");
    case "opt_out": return pill(ROSE, "Opt-out");
    case "wrong_number": return pill(GREY, "Wrong #");
    case "no_answer": return pill(GREY, "No answer");
    case "busy": return pill(GREY, "Busy");
    case "voicemail": return pill(GREY, "Voicemail");
    case "failed": return pill(GREY, "Failed");
  }
  const byState: Record<string, Pill> = {
    pending: pill(GREY, "Pending"),
    in_flight: pill(GREEN, "Calling…"),
    exhausted: pill(ROSE, "Exhausted"),
    skipped: pill(GREY, "Skipped"),
    done: pill(GREY, "Done"),
  };
  return byState[state] ?? pill(GREY, state.replace(/_/g, " "));
}

const CARD: React.CSSProperties = {
  background: "#181030",
  border: "1px solid #2A2348",
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)",
};

function rupees(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}
function mmss(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function clockIST(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

// One field in the Sales Handoff card.
function HField({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.1em]" style={{ color: GREY }}>{label}</div>
      <div className="text-sm mt-0.5" style={{ color: gold ? "#F5B544" : "#F3F1FB", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

// One call in the feed — name · time · duration · outcome, expandable to the full transcript.
function CallRow({ call, open, onToggle }: { call: OutboundCall; open: boolean; onToggle: () => void }) {
  const p = dispoPill(call.disposition, call.answered ? "done" : "no_answer");
  const hasTx = call.transcript.length > 0;
  return (
    <div style={{ borderBottom: "1px solid #20183C" }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-3 text-left"
        style={{ cursor: hasTx ? "pointer" : "default", background: "transparent" }}
      >
        <div className="min-w-0 flex items-center gap-3">
          <span className="text-xs" style={{ color: GREY, width: 12 }}>{hasTx ? (open ? "▾" : "▸") : ""}</span>
          <span className="text-sm font-medium" style={{ color: "#F3F1FB" }}>{call.name ?? call.phone ?? "—"}</span>
          <span className="text-xs" style={{ color: GREY }}>{clockIST(call.created_at)}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {call.duration_s > 0 && <span className="text-xs" style={{ color: GREY, fontVariantNumeric: "tabular-nums" }}>{mmss(call.duration_s)}</span>}
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: p.bg, color: p.color }}>{p.label}</span>
        </div>
      </button>
      {open && hasTx && (
        <div className="pb-4 pl-6 pr-1 flex flex-col gap-2">
          {call.handoff && (
            <div className="rounded-xl p-4 mb-2" style={{ background: "#1C1436", border: "1px solid #2A2348" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] tracking-[0.14em] uppercase" style={{ color: "#A78BFA", fontWeight: 600 }}>⚡ Sales Handoff</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "1px solid rgba(167,139,250,0.25)" }}>↗ Push to Salesforce</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <HField label="Intent" value={call.handoff.intent} />
                <HField label="Interested in" value={call.handoff.property} />
                <HField label="Indicative budget" value={call.handoff.budget} gold />
                <HField label="Objections raised" value={call.handoff.objections.length ? call.handoff.objections.join(" · ") : "None raised"} />
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid #20183C" }}>
                <div className="text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: GREY }}>Recommended follow-up</div>
                <div className="text-sm" style={{ color: "#E9E6F6", lineHeight: 1.5 }}>{call.handoff.followUp}</div>
              </div>
            </div>
          )}
          <div className="text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: GREY }}>Transcript</div>
          {call.transcript.map((t, i) => {
            const isAgent = t.role === "assistant";
            return (
              <div key={i} className="flex flex-col" style={{ alignItems: isAgent ? "flex-start" : "flex-end" }}>
                <span className="text-[10px] uppercase tracking-[0.1em] mb-0.5" style={{ color: GREY }}>{isAgent ? "Mello" : "Caller"}</span>
                <span
                  className="text-sm px-3 py-2 rounded-2xl max-w-[80%]"
                  style={{
                    background: isAgent ? "#20183C" : "rgba(167,139,250,0.14)",
                    color: "#E9E6F6",
                    borderTopLeftRadius: isAgent ? 4 : undefined,
                    borderTopRightRadius: isAgent ? undefined : 4,
                  }}
                >
                  {t.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value, subtext, accent }: { label: string; value: string; subtext: string; accent?: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={CARD}>
      <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: GREY }}>{label}</span>
      <div style={{ fontFamily: GS, fontSize: 40, fontWeight: 400, color: accent ?? "#F3F1FB", lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</div>
      <div className="text-xs" style={{ color: GREY }}>{subtext}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-4 py-3 flex-1 min-w-[140px]" style={{ background: "#20183C", border: "1px solid #2A2348" }}>
      <div className="text-[10px] tracking-[0.12em] uppercase" style={{ color: GREY }}>{label}</div>
      <div className="mt-1.5" style={{ fontFamily: GS, fontSize: 22, color: "#F3F1FB" }}>{value}</div>
    </div>
  );
}

export function OutboundView() {
  const [campaigns, setCampaigns] = useState<OutboundCampaign[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<OutboundMetrics | null>(null);
  const [contacts, setContacts] = useState<OutboundContact[]>([]);
  const [calls, setCalls] = useState<OutboundCall[]>([]);
  const [openCall, setOpenCall] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/outbound?resource=campaigns", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to load campaigns");
      const list: OutboundCampaign[] = await res.json();
      setCampaigns(list);
      setSelected((prev) => prev ?? list[0]?.id ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load campaigns.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshList();
    const id = setInterval(refreshList, POLL_MS);
    return () => clearInterval(id);
  }, [refreshList]);

  useEffect(() => {
    if (selected == null) return;
    let live = true;
    const load = async () => {
      try {
        const [m, c, k] = await Promise.all([
          fetch(`/api/outbound?resource=metrics&id=${selected}`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/outbound?resource=contacts&id=${selected}`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/outbound?resource=calls&id=${selected}`, { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (live && !m.error) setMetrics(m);
        if (live && Array.isArray(c)) setContacts(c);
        if (live && Array.isArray(k)) setCalls(k);
      } catch {
        /* list refresh will surface backend errors */
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => { live = false; clearInterval(id); };
  }, [selected]);

  const isLive = metrics?.status === "active";

  return (
    <div className="px-9 py-8 max-w-[1200px]">
      {error && (
        <div className="rounded-xl px-4 py-3 mb-6 text-sm" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.35)", color: ROSE }}>
          {error} — is the outbound backend running on port 8000?
        </div>
      )}

      {loaded && campaigns.length === 0 && !error && (
        <div className="rounded-2xl p-8 text-center" style={CARD}>
          <div className="text-sm font-medium mb-1" style={{ color: "#F3F1FB" }}>No campaigns yet</div>
          <div className="text-sm" style={{ color: GREY }}>Outbound campaigns dial a contact list toward one objective — respecting the calling window, consent, and do-not-call rules.</div>
        </div>
      )}

      {campaigns.length > 0 && (
        <>
          {/* Campaign selector — real, clickable */}
          <div className="flex flex-wrap gap-2.5 mb-6">
            {campaigns.map((c) => {
              const on = c.id === selected;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className="text-left rounded-xl px-4 py-2.5 transition-colors"
                  style={{
                    background: on ? "rgba(167,139,250,0.14)" : "#181030",
                    border: `1px solid ${on ? "rgba(167,139,250,0.4)" : "#2A2348"}`,
                    color: on ? "#F3F1FB" : GREY,
                    cursor: "pointer",
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: on ? "#F3F1FB" : "#C2BCE0" }}>{c.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: GREY }}>
                    {c.objective_type.replace(/_/g, " ")} · {c.contacts_total} contacts
                  </div>
                </button>
              );
            })}
          </div>

          {metrics && (
            <>
              {isLive && (
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full text-xs" style={{ border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.06)", color: GREEN }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} /> LIVE
                </div>
              )}

              <div className="grid grid-cols-4 gap-4 mb-4">
                <Kpi label="Calls Made" value={String(metrics.calls_made)} subtext={`${metrics.contacts_total} in list`} />
                <Kpi label="Answer Rate" value={`${metrics.answer_rate_pct}%`} subtext={`${metrics.answered} answered`} />
                <Kpi label="Qualified" value={String(metrics.qualified)} subtext="reached a person" />
                <Kpi label="Booked" value={String(metrics.booked)} subtext={`${metrics.goal_completion_rate_pct}% goal completion`} accent="#F5B544" />
              </div>

              <div className="rounded-2xl p-5 mb-4" style={CARD}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-[10px] tracking-[0.12em] uppercase mb-0.5" style={{ color: GREY }}>Campaign</div>
                    <div className="text-sm font-medium" style={{ color: "#F3F1FB" }}>{metrics.name}</div>
                  </div>
                  <div className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: isLive ? "rgba(167,139,250,0.14)" : "#20183C", color: isLive ? GREEN : GREY }}>
                    {metrics.status.toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <Mini label="Avg Handle" value={mmss(metrics.avg_handle_seconds)} />
                  <Mini label="Voicemail" value={String(metrics.amd_voicemail)} />
                  <Mini label="Cost / Success" value={metrics.cost_per_success_inr != null ? rupees(metrics.cost_per_success_inr) : "—"} />
                  <Mini label="Spent" value={`${rupees(metrics.spent_inr)}${metrics.budget_cap_inr ? ` / ${rupees(metrics.budget_cap_inr)}` : ""}`} />
                  <Mini label="Opt-outs" value={`${metrics.opt_outs} (${metrics.opt_out_rate_pct}%)`} />
                </div>
              </div>

              {/* Recent calls — one row per dial, newest first, expand for the transcript */}
              <div className="rounded-2xl p-5 mb-4" style={CARD}>
                <div className="text-[10px] tracking-[0.12em] uppercase mb-3" style={{ color: GREY }}>Recent calls</div>
                {calls.length === 0 && <div className="text-sm py-3" style={{ color: GREY }}>No calls yet for this campaign.</div>}
                {calls.map((call) => (
                  <CallRow key={call.id} call={call} open={openCall === call.id} onToggle={() => setOpenCall((prev) => (prev === call.id ? null : call.id))} />
                ))}
              </div>

              {/* Lead list */}
              <div className="rounded-2xl p-5" style={CARD}>
                <div className="text-[10px] tracking-[0.12em] uppercase mb-3" style={{ color: GREY }}>Contacts · Lead list</div>
                {contacts.length === 0 && <div className="text-sm py-3" style={{ color: GREY }}>No contacts in this campaign.</div>}
                {contacts.map((row) => {
                  const p = dispoPill(row.last_disposition, row.state);
                  return (
                    <div key={row.id} className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: "1px solid #20183C" }}>
                      <div className="min-w-0">
                        <span className="text-sm font-medium" style={{ color: "#F3F1FB" }}>{row.name ?? "—"}</span>
                        <span className="text-xs ml-3" style={{ color: GREY, fontVariantNumeric: "tabular-nums" }}>{row.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {row.attempt_count > 0 && <span className="text-xs" style={{ color: GREY }}>{row.attempt_count} {row.attempt_count === 1 ? "try" : "tries"}</span>}
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

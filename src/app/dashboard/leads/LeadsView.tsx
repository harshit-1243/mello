"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { OutboundCall, OutboundCampaign, OutboundContact } from "@/lib/dashboard/outbound";
import {
  actionable,
  buildLeads,
  countByStage,
  filterLeads,
  lostReasons,
  STAGES,
  toCsv,
  type Lead,
  type LeadStage,
} from "@/lib/dashboard/leads";

const GS = "var(--font-geist-sans)";
const POLL_MS = 8000;

const VIOLET = "#A78BFA";
const GOLD = "#F5B544";
const ROSE = "#F87171";
const GREY = "#8C86A8";
const INK = "#F3F1FB";

const CARD: React.CSSProperties = {
  background: "#181030",
  border: "1px solid #2A2348",
  boxShadow: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.28)",
};

const STAGE_COLOR: Record<LeadStage, string> = {
  new: GREY,
  attempted: GREY,
  interested: GOLD,
  booked: VIOLET,
  closed: ROSE,
};

function clockIST(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

function StagePill({ stage }: { stage: LeadStage }) {
  const color = STAGE_COLOR[stage];
  const label = STAGES.find((s) => s.key === stage)?.label ?? stage;
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] whitespace-nowrap"
      style={{ color, background: `${color}1f`, border: `1px solid ${color}33` }}
    >
      {label}
    </span>
  );
}

/** One stage in the pipeline strip. Clicking filters the table to it. */
function StageCard({
  label, hint, count, color, active, onClick,
}: { label: string; hint: string; count: number; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-xl px-4 py-3 text-left flex-1 min-w-[150px] transition-colors focus:outline-none focus-visible:ring-2"
      style={{
        background: active ? "#20183C" : "#181030",
        border: `1px solid ${active ? color : "#2A2348"}`,
        boxShadow: active ? `0 0 0 1px ${color}55` : undefined,
      }}
    >
      <div className="text-[10px] tracking-[0.12em] uppercase" style={{ color: GREY }}>{label}</div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span style={{ fontFamily: GS, fontSize: 26, color, lineHeight: 1 }}>{count}</span>
        <span className="text-[11px]" style={{ color: GREY }}>{hint}</span>
      </div>
    </button>
  );
}

export function LeadsView() {
  const [campaigns, setCampaigns] = useState<OutboundCampaign[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [contacts, setContacts] = useState<OutboundContact[]>([]);
  const [calls, setCalls] = useState<OutboundCall[]>([]);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<LeadStage | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/outbound?resource=campaigns", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not load campaigns");
      const list: OutboundCampaign[] = await res.json();
      setCampaigns(list);
      setSelected((prev) => prev ?? list[0]?.id ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load campaigns.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  useEffect(() => {
    if (selected == null) return;
    let live = true;
    const load = async () => {
      try {
        const [c, k] = await Promise.all([
          fetch(`/api/outbound?resource=contacts&id=${selected}`, { cache: "no-store" }).then((r) => r.json()),
          fetch(`/api/outbound?resource=calls&id=${selected}`, { cache: "no-store" }).then((r) => r.json()),
        ]);
        if (!live) return;
        if (Array.isArray(c)) setContacts(c);
        if (Array.isArray(k)) setCalls(k);
      } catch {
        /* keep the last good view rather than blanking the page mid-shift */
      }
    };
    load();
    const id = setInterval(load, POLL_MS);
    return () => { live = false; clearInterval(id); };
  }, [selected]);

  const leads = useMemo(() => buildLeads(contacts, calls), [contacts, calls]);
  const counts = useMemo(() => countByStage(leads), [leads]);
  const shown = useMemo(() => filterLeads(leads, query, stage), [leads, query, stage]);
  const tonight = useMemo(() => actionable(leads), [leads]);
  const lost = useMemo(() => lostReasons(leads), [leads]);

  const download = useCallback(() => {
    const blob = new Blob([toCsv(shown)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [shown]);

  if (loaded && error && campaigns.length === 0) {
    return (
      <div className="rounded-2xl p-6" style={CARD}>
        <div style={{ color: ROSE, fontSize: 14 }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* campaign picker + export */}
      <div className="flex flex-wrap items-center justify-end gap-2">
          {campaigns.length > 1 && (
            <select
              value={selected ?? ""}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: "#20183C", border: "1px solid #2A2348", color: INK }}
            >
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          <button
            type="button"
            onClick={download}
            disabled={shown.length === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ background: VIOLET, color: "#160F1E", border: "1px solid transparent" }}
          >
            Export {shown.length > 0 ? `${shown.length} ` : ""}to CSV
          </button>
      </div>

      {/* pipeline */}
      <div className="flex flex-wrap gap-2">
        <StageCard
          label="Everyone" hint="on this list" count={leads.length} color={INK}
          active={stage === "all"} onClick={() => setStage("all")}
        />
        {STAGES.map((s) => (
          <StageCard
            key={s.key}
            label={s.label}
            hint={s.hint}
            count={counts[s.key]}
            color={STAGE_COLOR[s.key]}
            active={stage === s.key}
            onClick={() => setStage(stage === s.key ? "all" : s.key)}
          />
        ))}
      </div>

      {/* work tonight */}
      {tonight.length > 0 && (
        <div className="rounded-2xl p-5" style={CARD}>
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <span className="text-[11px] tracking-[0.14em] uppercase" style={{ color: GOLD, fontWeight: 600 }}>
              Call these back
            </span>
            <span className="text-xs" style={{ color: GREY }}>{tonight.length} waiting</span>
          </div>
          <div className="flex flex-col gap-2">
            {tonight.slice(0, 6).map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
                   style={{ background: "#20183C", border: "1px solid #2A2348" }}>
                <span style={{ color: INK, fontSize: 14, fontWeight: 500, minWidth: 120 }}>{l.name}</span>
                <a href={`tel:${l.phone}`} style={{ color: VIOLET, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{l.phone}</a>
                <StagePill stage={l.stage} />
                {l.note && <span className="text-xs flex-1 min-w-[180px]" style={{ color: GREY }}>“{l.note}”</span>}
                <span className="text-xs" style={{ color: GOLD }}>{l.nextAction}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* search */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, number or what they said"
          className="rounded-lg px-3 py-2 text-sm flex-1 min-w-[240px]"
          style={{ background: "#20183C", border: "1px solid #2A2348", color: INK }}
        />
        {(query || stage !== "all") && (
          <button type="button" onClick={() => { setQuery(""); setStage("all"); }}
                  className="text-xs underline" style={{ color: GREY }}>
            Clear filters
          </button>
        )}
      </div>

      {/* table */}
      <div className="rounded-2xl overflow-hidden" style={CARD}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 }}>
            <thead>
              <tr>
                {["Name", "Phone", "Stage", "Outcome", "Tries", "Last called", "Next action"].map((h) => (
                  <th key={h} className="text-[10px] tracking-[0.12em] uppercase"
                      style={{ color: GREY, textAlign: "left", padding: "12px 16px", background: "#20183C", fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((l: Lead) => (
                <tr key={l.id} style={{ borderTop: "1px solid #2A2348" }}>
                  <td style={{ padding: "12px 16px", color: INK }}>
                    {l.name}
                    {l.note && <div className="text-xs mt-0.5" style={{ color: GREY }}>“{l.note}”</div>}
                  </td>
                  <td style={{ padding: "12px 16px", fontVariantNumeric: "tabular-nums" }}>
                    <a href={`tel:${l.phone}`} style={{ color: VIOLET }}>{l.phone}</a>
                  </td>
                  <td style={{ padding: "12px 16px" }}><StagePill stage={l.stage} /></td>
                  <td style={{ padding: "12px 16px", color: l.lostReason ? ROSE : GREY }}>
                    {l.lostReason ?? l.disposition?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td style={{ padding: "12px 16px", color: GREY, fontVariantNumeric: "tabular-nums" }}>{l.attempts}</td>
                  <td style={{ padding: "12px 16px", color: GREY, whiteSpace: "nowrap" }}>{clockIST(l.lastCalledAt)}</td>
                  <td style={{ padding: "12px 16px", color: l.stage === "closed" ? GREY : GOLD }}>{l.nextAction}</td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "28px 16px", color: GREY, textAlign: "center" }}>
                    {leads.length === 0 ? "No leads imported for this campaign yet." : "No leads match that search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* why leads are lost */}
      {lost.length > 0 && (
        <div className="rounded-2xl p-5" style={CARD}>
          <span className="text-[11px] tracking-[0.14em] uppercase" style={{ color: GREY }}>Why leads close</span>
          <div className="flex flex-wrap gap-2 mt-3">
            {lost.map((r) => (
              <div key={r.reason} className="rounded-xl px-4 py-3 flex-1 min-w-[160px]"
                   style={{ background: "#20183C", border: "1px solid #2A2348" }}>
                <div className="text-xs" style={{ color: GREY }}>{r.reason}</div>
                <div className="mt-1" style={{ fontFamily: GS, fontSize: 22, color: ROSE }}>{r.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Lead pipeline — the CRM view of an outbound campaign.
 *
 * The Outbound page answers "how is the campaign performing?". This answers the question the person
 * paying for it actually asks every evening: "who do I call back, and what do I do about them?"
 *
 * Every lead is placed on a stage and given a next action, because a list of outcomes is not a
 * to-do list. Stages are derived from what already happened on the call rather than stored
 * separately — a stage that can drift out of sync with the call record is worse than no stage.
 */
import type { OutboundCall, OutboundContact } from "./outbound";

export type LeadStage = "new" | "attempted" | "interested" | "booked" | "closed";

export type Lead = {
  id: number;
  name: string;
  phone: string;
  stage: LeadStage;
  /** Raw disposition from the last call, if any. */
  disposition: string | null;
  attempts: number;
  lastCalledAt: string | null;
  durationS: number;
  /** What a human should do next — the column that turns a report into work. */
  nextAction: string;
  /** Why the lead was lost, when it was. */
  lostReason: string | null;
  /** Short context from the call, so the callback opens warm. */
  note: string;
};

export const STAGES: { key: LeadStage; label: string; hint: string }[] = [
  { key: "new", label: "Not yet called", hint: "Still queued" },
  { key: "attempted", label: "Tried, no contact", hint: "Rang out or busy" },
  { key: "interested", label: "Interested", hint: "Wants a callback" },
  { key: "booked", label: "Trial booked", hint: "Committed to a visit" },
  { key: "closed", label: "Closed", hint: "Not proceeding" },
];

/** Dispositions that mean a person engaged and wants more — the ones worth a human's evening. */
const INTERESTED = new Set(["callback_requested"]);
const BOOKED = new Set(["confirmed", "rescheduled"]);
const LOST = new Set(["refused", "opt_out", "wrong_number"]);
/** Reached nobody — the call happened but the person did not. */
const NO_CONTACT = new Set(["no_answer", "busy", "voicemail", "failed"]);

const LOST_LABELS: Record<string, string> = {
  refused: "Not interested",
  opt_out: "Asked not to be contacted",
  wrong_number: "Wrong number",
};

const NEXT_ACTION: Record<LeadStage, string> = {
  new: "Call",
  attempted: "Try again",
  interested: "Call back",
  booked: "Confirm the visit",
  closed: "—",
};

export function stageOf(contact: OutboundContact): LeadStage {
  const d = contact.last_disposition;
  if (d && BOOKED.has(d)) return "booked";
  if (d && INTERESTED.has(d)) return "interested";
  if (d && LOST.has(d)) return "closed";
  if (contact.state === "skipped" || contact.state === "exhausted") return "closed";
  if (d && NO_CONTACT.has(d)) return "attempted";
  if (contact.attempt_count > 0) return "attempted";
  return "new";
}

/** A one-line reminder of what they said, taken from the caller's own words. */
function noteFrom(call: OutboundCall | undefined): string {
  if (!call || !call.transcript?.length) return "";
  const said = call.transcript.filter((t) => t.role !== "assistant").map((t) => t.text.trim()).filter(Boolean);
  const longest = said.sort((a, b) => b.length - a.length)[0] ?? "";
  return longest.length > 90 ? `${longest.slice(0, 88)}…` : longest;
}

export function buildLeads(contacts: OutboundContact[], calls: OutboundCall[]): Lead[] {
  // Newest call per phone — the lead's current situation, not its history.
  const latest = new Map<string, OutboundCall>();
  for (const c of calls) {
    const prev = latest.get(c.phone);
    if (!prev || new Date(c.created_at).getTime() > new Date(prev.created_at).getTime()) latest.set(c.phone, c);
  }

  return contacts.map((contact) => {
    const call = latest.get(contact.phone);
    const stage = stageOf(contact);
    const disposition = contact.last_disposition ?? call?.disposition ?? null;
    return {
      id: contact.id,
      name: contact.name?.trim() || "Unknown",
      phone: contact.phone,
      stage,
      disposition,
      attempts: contact.attempt_count,
      lastCalledAt: call?.created_at ?? null,
      durationS: call?.duration_s ?? 0,
      nextAction: NEXT_ACTION[stage],
      lostReason: disposition && LOST.has(disposition) ? (LOST_LABELS[disposition] ?? disposition) : null,
      note: noteFrom(call),
    };
  });
}

export function countByStage(leads: Lead[]): Record<LeadStage, number> {
  const out: Record<LeadStage, number> = { new: 0, attempted: 0, interested: 0, booked: 0, closed: 0 };
  for (const l of leads) out[l.stage] += 1;
  return out;
}

/** Why leads are being lost — the pattern worth showing a client, not one-off outcomes. */
export function lostReasons(leads: Lead[]): { reason: string; count: number }[] {
  const tally = new Map<string, number>();
  for (const l of leads) if (l.lostReason) tally.set(l.lostReason, (tally.get(l.lostReason) ?? 0) + 1);
  return [...tally.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}

/** Leads a human should work tonight, most committed first. */
export function actionable(leads: Lead[]): Lead[] {
  const rank: Record<LeadStage, number> = { booked: 0, interested: 1, attempted: 2, new: 3, closed: 4 };
  return leads.filter((l) => l.stage === "booked" || l.stage === "interested").sort((a, b) => rank[a.stage] - rank[b.stage]);
}

export function filterLeads(leads: Lead[], query: string, stage: LeadStage | "all"): Lead[] {
  const q = query.trim().toLowerCase();
  return leads.filter((l) => {
    if (stage !== "all" && l.stage !== stage) return false;
    if (!q) return true;
    return l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.note.toLowerCase().includes(q);
  });
}

const CSV_HEADERS = ["Name", "Phone", "Stage", "Outcome", "Attempts", "Last called", "Next action", "What they said"];

function csvCell(value: string | number): string {
  const s = String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

/** Export exactly what is on screen — the columns the client asked to receive. */
export function toCsv(leads: Lead[]): string {
  const stageLabel = new Map(STAGES.map((s) => [s.key, s.label]));
  const rows = leads.map((l) =>
    [
      l.name,
      l.phone,
      stageLabel.get(l.stage) ?? l.stage,
      l.lostReason ?? l.disposition ?? "",
      l.attempts,
      l.lastCalledAt ? new Date(l.lastCalledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "",
      l.nextAction,
      l.note,
    ]
      .map(csvCell)
      .join(","),
  );
  return [CSV_HEADERS.map(csvCell).join(","), ...rows].join("\n");
}

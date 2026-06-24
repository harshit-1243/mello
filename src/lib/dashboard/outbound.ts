/**
 * Outbound campaign data for the dashboard's Outbound section.
 *
 * Source is swappable via OUTBOUND_SOURCE:
 *   - "fastapi" (default, Phase 1): read live from the Python outbound backend's REST endpoints.
 *   - "supabase" (Phase 2): read from Supabase like the rest of the dashboard (stubbed for now).
 *
 * Server-only: the FastAPI base URL + API key never reach the browser. The Outbound page polls our
 * own /api/outbound route handler, which calls these functions. Swapping to Supabase later means
 * implementing the supabase branch here — the page/route handler don't change.
 */
import "server-only";
import { db, DEFAULT_FACILITY_ID } from "./db";

const SOURCE = (process.env.OUTBOUND_SOURCE ?? "fastapi").toLowerCase();
const API_BASE = (process.env.OUTBOUND_API_BASE ?? "http://localhost:8000").replace(/\/$/, "");
const CLIENT_ID = process.env.OUTBOUND_CLIENT_ID ?? "1";
const API_KEY = process.env.OUTBOUND_API_KEY?.trim();

// ---- types (mirror the FastAPI shapes) ----

export type OutboundCampaign = {
  id: number;
  name: string;
  objective_type: string;
  status: string;
  contacts_total: number;
  calls_made: number;
  answer_rate_pct: number;
  booked: number;
  spent_inr: number;
  budget_cap_inr: number;
};

export type OutboundMetrics = {
  campaign_id: number;
  name: string;
  objective_type: string;
  status: string;
  contacts_total: number;
  contacts_pending: number;
  contacts_done: number;
  contacts_exhausted: number;
  calls_made: number;
  answered: number;
  answer_rate_pct: number;
  amd_human: number;
  amd_voicemail: number;
  amd_ivr: number;
  amd_unknown: number;
  qualified: number;
  booked: number;
  goal_completed: number;
  goal_completion_rate_pct: number;
  avg_handle_seconds: number;
  total_cost_inr: number;
  cost_per_success_inr: number | null;
  opt_outs: number;
  opt_out_rate_pct: number;
  spent_inr: number;
  budget_cap_inr: number;
};

export type OutboundContact = {
  id: number;
  name: string | null;
  phone: string;
  state: string;
  last_disposition: string | null;
  attempt_count: number;
};

// ---- FastAPI source (Phase 1) ----

async function fastapi<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {};
  if (API_KEY) headers["X-API-Key"] = API_KEY;
  const res = await fetch(`${API_BASE}/clients/${CLIENT_ID}${path}`, { cache: "no-store", headers });
  if (!res.ok) throw new Error(`outbound backend ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

// ---- Supabase source (Phase 2) ----

const SUCCESS = new Set(["confirmed", "rescheduled"]);
const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

type AttemptRow = { campaign_id: number; contact_id: number; answered: boolean; amd_result: string | null; disposition: string | null; duration_s: number; cost_inr: number };

/** Compute one campaign's metrics from its contacts + attempts (mirrors the Python metrics.py). */
function metricsFromRows(camp: { id: number; name: string; objective_type: string; status: string; spent_inr: number; budget_cap_inr: number }, contacts: OutboundContact[], attempts: AttemptRow[]): OutboundMetrics {
  const answered = attempts.filter((a) => a.answered);
  const amd = (k: string) => answered.filter((a) => a.amd_result === k).length;
  const humanContacts = new Set(attempts.filter((a) => a.amd_result === "human").map((a) => a.contact_id));
  const handle = answered.map((a) => a.duration_s).filter(Boolean);
  const totalCost = attempts.reduce((s, a) => s + Number(a.cost_inr || 0), 0);
  const booked = contacts.filter((c) => c.last_disposition === "confirmed").length;
  const goal = contacts.filter((c) => c.last_disposition && SUCCESS.has(c.last_disposition)).length;
  const optOuts = contacts.filter((c) => c.last_disposition === "opt_out").length;
  const pending = contacts.filter((c) => c.state === "pending" || c.state === "in_flight").length;
  return {
    campaign_id: camp.id, name: camp.name, objective_type: camp.objective_type, status: camp.status,
    contacts_total: contacts.length, contacts_pending: pending,
    contacts_done: contacts.filter((c) => c.state === "done").length,
    contacts_exhausted: contacts.filter((c) => c.state === "exhausted").length,
    calls_made: attempts.length, answered: answered.length, answer_rate_pct: pct(answered.length, attempts.length),
    amd_human: amd("human"), amd_voicemail: amd("voicemail"), amd_ivr: amd("ivr"), amd_unknown: amd("unknown"),
    qualified: humanContacts.size, booked, goal_completed: goal, goal_completion_rate_pct: pct(goal, contacts.length),
    avg_handle_seconds: handle.length ? Math.round(handle.reduce((a, b) => a + b, 0) / handle.length) : 0,
    total_cost_inr: Math.round(totalCost * 100) / 100,
    cost_per_success_inr: goal ? Math.round((totalCost / goal) * 100) / 100 : null,
    opt_outs: optOuts, opt_out_rate_pct: pct(optOuts, contacts.length),
    spent_inr: Number(camp.spent_inr || 0), budget_cap_inr: Number(camp.budget_cap_inr || 0),
  };
}

async function sbContacts(campaignId: number): Promise<OutboundContact[]> {
  const { data } = await db!.from("outbound_contacts")
    .select("id, name, phone, state, last_disposition, attempt_count")
    .eq("campaign_id", campaignId).order("id");
  return (data ?? []) as OutboundContact[];
}
async function sbAttempts(campaignId: number): Promise<AttemptRow[]> {
  const { data } = await db!.from("outbound_call_attempts")
    .select("campaign_id, contact_id, answered, amd_result, disposition, duration_s, cost_inr")
    .eq("campaign_id", campaignId);
  return (data ?? []) as AttemptRow[];
}

// ---- public API (source-agnostic) ----

export async function getCampaigns(): Promise<OutboundCampaign[]> {
  if (SOURCE === "supabase") {
    if (!db) return [];
    const { data: camps } = await db.from("outbound_campaigns")
      .select("id, name, objective_type, status, spent_inr, budget_cap_inr")
      .eq("facility_id", DEFAULT_FACILITY_ID).order("id", { ascending: false });
    const out: OutboundCampaign[] = [];
    for (const c of camps ?? []) {
      const [contacts, attempts] = await Promise.all([sbContacts(c.id), sbAttempts(c.id)]);
      const m = metricsFromRows(c, contacts, attempts);
      out.push({ id: c.id, name: c.name, objective_type: c.objective_type, status: c.status, contacts_total: m.contacts_total, calls_made: m.calls_made, answer_rate_pct: m.answer_rate_pct, booked: m.booked, spent_inr: m.spent_inr, budget_cap_inr: m.budget_cap_inr });
    }
    return out;
  }
  return fastapi<OutboundCampaign[]>("/campaigns");
}

export async function getCampaignMetrics(id: number): Promise<OutboundMetrics> {
  if (SOURCE === "supabase") {
    const { data: c } = await db!.from("outbound_campaigns").select("id, name, objective_type, status, spent_inr, budget_cap_inr").eq("id", id).single();
    const [contacts, attempts] = await Promise.all([sbContacts(id), sbAttempts(id)]);
    return metricsFromRows(c!, contacts, attempts);
  }
  return fastapi<OutboundMetrics>(`/campaigns/${id}/metrics`);
}

export async function getCampaignContacts(id: number): Promise<OutboundContact[]> {
  if (SOURCE === "supabase") return sbContacts(id);
  return fastapi<OutboundContact[]>(`/campaigns/${id}/contacts`);
}

/** True when the configured source is reachable — lets the UI show a clear "backend offline" state. */
export async function outboundSourceLabel(): Promise<string> {
  return SOURCE === "supabase" ? "Supabase" : API_BASE;
}

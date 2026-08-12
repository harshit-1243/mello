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

export type TranscriptTurn = { ts?: string; role: string; text: string };

/** Auto-generated sales-handoff summary for the salesperson taking over the lead. */
export type Handoff = {
  intent: string;
  property: string;
  budget: string;
  objections: string[];
  followUp: string;
};

export type OutboundCall = {
  id: number;
  name: string | null;
  phone: string;
  disposition: string | null;
  answered: boolean;
  duration_s: number;
  created_at: string;
  transcript: TranscriptTurn[];
  handoff: Handoff | null;
};

/**
 * Derive a sales-handoff summary from the call — intent, interested property, indicative budget,
 * objections raised, and a recommended follow-up. Rule-based over the transcript + disposition so
 * it's instant and reliable (no extra LLM call), mirroring the summary a salesperson needs.
 */
function buildHandoff(disposition: string | null, tx: TranscriptTurn[]): Handoff | null {
  if (!tx || tx.length === 0) return null;
  const all = tx.map((t) => t.text).join("  ");
  // Objections/interest must come from the CALLER's words, not Mello's answers (Mello mentions
  // "home loans", "pre-launch price" etc. as proof — scanning those would be a false positive).
  const said = tx.filter((t) => t.role !== "assistant").map((t) => t.text).join("  ");

  // Interested property — BHK the caller asked about (fall back to what was discussed).
  const numMap: Record<string, string> = { one: "1", two: "2", three: "3", four: "4" };
  const bhkFrom = (s: string): Set<string> => {
    const out = new Set<string>();
    const re = /\b(studio|1|2|3|4|one|two|three|four)\s*[- ]?\s*bhk\b/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      const raw = m[1].toLowerCase();
      out.add(raw === "studio" ? "Studio" : `${numMap[raw] ?? m[1]} BHK`);
    }
    return out;
  };
  const bhk = bhkFrom(said).size ? bhkFrom(said) : bhkFrom(all);
  const property = bhk.size ? [...bhk].join(", ") : "—";
  const priceFor: Record<string, string> = { "2 BHK": "~₹85 L", "3 BHK": "~₹1.4 Cr", "4 BHK": "~₹2.6 Cr", "Studio": "~₹65 L" };
  const budgets = [...bhk].map((b) => priceFor[b]).filter(Boolean);
  const budget = budgets.length ? budgets.join(" / ") : "—";

  // Objections raised — genuine concerns the CALLER voiced.
  const objections: string[] = [];
  const has = (r: RegExp, label: string) => { if (r.test(said)) objections.push(label); };
  has(/review|reputation|badnaam|complaint/i, "Reviews / reputation");
  has(/construction|quality|material|structur/i, "Construction quality");
  has(/water|paani|पानी/i, "Water supply");
  has(/mehnga|expensive|costly|zyada|afford|budget se|out of budget/i, "Price too high");
  has(/delay|late|deri|possession.*(nahi|issue|problem)/i, "Possession / delay");

  // Intent from disposition.
  const intentMap: Record<string, string> = {
    confirmed: "Interested — site visit booked",
    rescheduled: "Interested — visit rescheduled",
    callback_requested: "Wants a callback",
    refused: "Not interested (this time)",
    no_answer: "Not reached",
    voicemail: "Voicemail — not reached",
    opt_out: "Do not contact",
    wrong_number: "Wrong number",
  };
  const intent = intentMap[disposition ?? ""] ?? "Enquiry handled";

  // When (for the follow-up line).
  const whenM = all.match(/\b(this weekend|day after tomorrow|tomorrow|parso|kal|saturday|sunday|monday|tuesday|wednesday|thursday|friday)\b/i);
  const when = whenM ? whenM[1].toLowerCase() : "";

  // Follow-up recommendation.
  let followUp: string;
  if (disposition === "confirmed" || disposition === "rescheduled") {
    followUp = `Confirm site visit${when ? ` for ${when}` : ""}; send brochure${objections.includes("Water supply") ? " + water-test report" : ""} on WhatsApp; sales rep to call before the visit.`;
  } else if (disposition === "callback_requested") {
    followUp = "Call back at the requested time with pricing details.";
  } else if (disposition === "refused") {
    followUp = "Nurture — re-engage in 2–4 weeks with new inventory or an offer.";
  } else {
    followUp = "Re-attempt the call; share the brochure on WhatsApp.";
  }
  if (objections.length && disposition !== "refused") followUp += ` Address concerns: ${objections.join(", ")}.`;

  return { intent, property, budget, objections, followUp };
}

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

// ---- seed source (demo — a Plej gym campaign carrying a real call + transcript) ----

const SEED_TRANSCRIPT: TranscriptTurn[] = [
  { role: "assistant", text: "Hi! This is Mello from Plej. We have a special offer on gym membership — would you like to hear about it?" },
  { role: "user", text: "यह जिम किधर है" },
  { role: "assistant", text: "Bandra, Mumbai और Kandivali में है। क्या मैं trial book कर दूँ?" },
  { role: "user", text: "जिम का नाम क्या है" },
  { role: "assistant", text: "जिम का नाम Plej है।" },
  { role: "user", text: "टाइमिंग्स क्या है?" },
  { role: "assistant", text: "Six AM से eleven PM तक, Sunday को two PM तक।" },
  { role: "user", text: "और प्राइस क्या है?" },
  { role: "assistant", text: "Monthly two thousand five hundred, annual eighteen thousand rupees." },
  { role: "user", text: "कुछ डिस्काउंट है" },
  { role: "assistant", text: "Zero joining fee, one month free and free trial इस हफ्ते है।" },
  { role: "user", text: "मैंने सुना है Plej जिम इतना अच्छा नहीं है" },
  { role: "assistant", text: "यह बात सही हो सकती है, पर हमारे certified trainers आपकी मदद करेंगे। क्या आप free trial के लिए आएँगी?" },
  { role: "user", text: "ठीक है, बुक कर दो — मैं day after tomorrow आऊँगा" },
  { role: "assistant", text: "Perfect — day after tomorrow के लिए note कर लिया। WhatsApp पर confirm आ जाएगा। Dhanyavaad!" },
];

const SEED_HANDOFF: Handoff = {
  intent: "Interested — free trial booked (day after tomorrow)",
  property: "Annual membership",
  budget: "₹18,000 / year",
  objections: ["Heard the gym isn't good — reassured on trainers"],
  followUp: "Confirm the free trial for day after tomorrow; send location + offer on WhatsApp; front desk to greet on arrival.",
};

const seedAgo = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

const SEED_CAMPAIGN: OutboundCampaign = {
  id: 1, name: "Plej — Membership & Trial Drive", objective_type: "promo_offer", status: "active",
  contacts_total: 24, calls_made: 22, answer_rate_pct: 86, booked: 7, spent_inr: 0, budget_cap_inr: 0,
};

const SEED_METRICS: OutboundMetrics = {
  campaign_id: 1, name: SEED_CAMPAIGN.name, objective_type: "promo_offer", status: "active",
  contacts_total: 24, contacts_pending: 2, contacts_done: 20, contacts_exhausted: 2,
  calls_made: 22, answered: 19, answer_rate_pct: 86, amd_human: 19, amd_voicemail: 2, amd_ivr: 0, amd_unknown: 1,
  qualified: 19, booked: 7, goal_completed: 7, goal_completion_rate_pct: 29,
  avg_handle_seconds: 78, total_cost_inr: 0, cost_per_success_inr: null,
  opt_outs: 1, opt_out_rate_pct: 4, spent_inr: 0, budget_cap_inr: 0,
};

const SEED_CONTACTS: OutboundContact[] = [
  { id: 44, name: "Manan", phone: "+919653679703", state: "done", last_disposition: "confirmed", attempt_count: 1 },
  { id: 43, name: "Harshit", phone: "+918369851507", state: "done", last_disposition: "confirmed", attempt_count: 1 },
  { id: 42, name: "Rahul", phone: "+919876512345", state: "done", last_disposition: "callback_requested", attempt_count: 1 },
  { id: 41, name: "Priya", phone: "+918826004111", state: "done", last_disposition: "confirmed", attempt_count: 1 },
  { id: 40, name: "Amit", phone: "+917021588222", state: "exhausted", last_disposition: "no_answer", attempt_count: 2 },
];

const SEED_CALLS: OutboundCall[] = [
  { id: 44, name: "Manan", phone: "+919653679703", disposition: "confirmed", answered: true, duration_s: 95, created_at: seedAgo(6), transcript: SEED_TRANSCRIPT, handoff: SEED_HANDOFF },
  { id: 43, name: "Harshit", phone: "+918369851507", disposition: "confirmed", answered: true, duration_s: 82, created_at: seedAgo(24),
    transcript: [
      { role: "assistant", text: "Hi! This is Mello from Plej. We have a special offer on gym membership — would you like to hear about it?" },
      { role: "user", text: "प्राइस क्या है इसका?" },
      { role: "assistant", text: "Monthly two thousand five hundred और annual eighteen thousand है।" },
      { role: "user", text: "ठीक है बुक कर दो" },
      { role: "assistant", text: "Perfect — maine aapki interest note kar li. WhatsApp par confirmation aa jaayega. Dhanyavaad!" },
    ],
    handoff: { intent: "Interested — free trial booked", property: "Annual membership", budget: "₹18,000 / year", objections: [], followUp: "Confirm trial; send offer on WhatsApp." } },
  { id: 42, name: "Rahul", phone: "+919876512345", disposition: "callback_requested", answered: true, duration_s: 40, created_at: seedAgo(58),
    transcript: [
      { role: "assistant", text: "Hi! This is Mello from Plej. We have a special offer on gym membership — would you like to hear about it?" },
      { role: "user", text: "अभी busy हूँ, बाद में call करना" },
      { role: "assistant", text: "बिलकुल, मैं आपको बाद में call कर लूँगी। Dhanyavaad!" },
    ],
    handoff: { intent: "Wants a callback", property: "—", budget: "—", objections: [], followUp: "Call back later with the offer details." } },
];

// ---- public API (source-agnostic) ----

export async function getCampaigns(): Promise<OutboundCampaign[]> {
  if (SOURCE === "seed") return [SEED_CAMPAIGN];
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
  if (SOURCE === "seed") return SEED_METRICS;
  if (SOURCE === "supabase") {
    const { data: c } = await db!.from("outbound_campaigns").select("id, name, objective_type, status, spent_inr, budget_cap_inr").eq("id", id).single();
    const [contacts, attempts] = await Promise.all([sbContacts(id), sbAttempts(id)]);
    return metricsFromRows(c!, contacts, attempts);
  }
  return fastapi<OutboundMetrics>(`/campaigns/${id}/metrics`);
}

export async function getCampaignContacts(id: number): Promise<OutboundContact[]> {
  if (SOURCE === "seed") return SEED_CONTACTS;
  if (SOURCE === "supabase") return sbContacts(id);
  return fastapi<OutboundContact[]>(`/campaigns/${id}/contacts`);
}

/**
 * Per-call feed for one campaign — one row per dial, newest first, each carrying the caller's
 * name (joined from the contact) and the full transcript. Resilient: if the transcript column
 * isn't there yet (migration 005 not run) or the source is FastAPI, returns [] rather than erroring.
 */
export async function getCampaignCalls(id: number, limit = 25): Promise<OutboundCall[]> {
  if (SOURCE === "seed") return SEED_CALLS.slice(0, limit);
  if (SOURCE !== "supabase" || !db) return [];
  try {
    const cols = "id, answered, disposition, duration_s, created_at, outbound_contacts(name, phone)";
    // Prefer the version with transcripts; if migration 005 hasn't run, retry without so the feed
    // (name · time · outcome) still shows — transcripts just stay empty until the column exists.
    let { data, error } = await db.from("outbound_call_attempts")
      .select(`${cols}, transcript`)
      .eq("campaign_id", id).order("created_at", { ascending: false }).limit(limit);
    if (error) {
      ({ data, error } = await db.from("outbound_call_attempts")
        .select(cols)
        .eq("campaign_id", id).order("created_at", { ascending: false }).limit(limit));
      if (error) return [];
    }
    return (data ?? []).map((r: Record<string, unknown>) => {
      const contact = (r.outbound_contacts ?? {}) as { name?: string | null; phone?: string };
      const t = r.transcript;
      const transcript = Array.isArray(t) ? (t as TranscriptTurn[]) : [];
      const disposition = (r.disposition as string | null) ?? null;
      return {
        id: r.id as number,
        name: contact.name ?? null,
        phone: contact.phone ?? "",
        disposition,
        answered: Boolean(r.answered),
        duration_s: (r.duration_s as number) ?? 0,
        created_at: (r.created_at as string) ?? "",
        transcript,
        handoff: buildHandoff(disposition, transcript),
      };
    });
  } catch {
    return [];
  }
}

/** True when the configured source is reachable — lets the UI show a clear "backend offline" state. */
export async function outboundSourceLabel(): Promise<string> {
  return SOURCE === "supabase" ? "Supabase" : API_BASE;
}

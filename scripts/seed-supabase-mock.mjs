/**
 * Seed demo-ready mock data into Supabase so the dashboard looks full.
 * Real-estate builder edition — Paradise Group (Navi Mumbai).
 *
 *   node scripts/seed-supabase-mock.mjs
 *
 * Idempotent: mock rows are tagged (call_sid 'MOCK-*', booking id 'MOCK-*', lead phone +9199xxxxxxxx)
 * and deleted before re-inserting, so re-running won't duplicate. Live calls (inbound mic + outbound
 * to your number) append on top and are never touched. The real "New project launch" outbound
 * campaign (carrying your live-call transcripts) is preserved.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- env ---
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  return env;
}
const E = { ...loadEnv(), ...process.env };
const URL_ = E.SUPABASE_URL, KEY = E.SUPABASE_SERVICE_KEY;
const FAC = E.DASHBOARD_FACILITY_ID || "raheja-ileseum";
if (!URL_ || !KEY) { console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_KEY"); process.exit(1); }
const db = createClient(URL_, KEY, { auth: { persistSession: false } });

// --- helpers ---
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const pad = (n, w = 4) => String(n).padStart(w, "0");
const NAMES = ["Aarav Kapoor","Priya Nair","Rohan Mehta","Sneha Iyer","Vikram Singh","Diya Sharma","Arjun Reddy","Ananya Rao","Karan Patel","Isha Verma","Rahul Joshi","Meera Pillai","Aditya Kumar","Riya Desai","Nikhil Shah","Pooja Gupta","Sahil Khan","Tara Menon","Dev Malhotra","Kavya Nair","Manish Agarwal","Neha Bhat","Yash Thakur","Sara Ali","Aman Bose"];
// Unit types double as the "sport" column (display form; live.ts lowercases for the price lookup).
const UNITS = ["Studio","2 BHK","2 BHK","3 BHK","3 BHK","4 BHK"];
const TOWERS = ["tower_a","tower_b","tower_c","tower_d"];
const STAGES = ["Hot","Warm","Warm","Cold"];
// Site-visit slots (day-time viewings), stored in the start/end columns.
const TIMES = [["11:00","12:00"],["12:00","13:00"],["16:00","17:00"],["17:00","18:00"],["10:00","11:00"],["15:00","16:00"]];
const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
function mockPhone(i) { return `+9199${pad(1000000 + i, 8)}`; }
function isoTodayAt(hour, min = 0) {
  return `${todayIST()}T${pad(hour, 2)}:${pad(min, 2)}:00+05:30`;
}

async function seedLeads() {
  await db.from("members").delete().like("phone", "+9199%").eq("facility_id", FAC);
  const rows = NAMES.map((name, i) => ({
    facility_id: FAC, name, phone: mockPhone(i),
    tier: rand(STAGES), active: true,     // tier column repurposed as lead stage (Hot/Warm/Cold)
    joined_at: `2025-${pad(1 + (i % 12), 2)}-${pad(1 + (i % 27), 2)}`,
  }));
  const { error } = await db.from("members").insert(rows);
  if (error) throw error;
  return rows;
}

// Real-estate enquiry snippets for the call detail view.
function reTranscript(unit, booked) {
  return [
    { role: "caller", content: `Hi, I saw your ad for the new Paradise Group project in Navi Mumbai.` },
    { role: "mello", content: `Welcome! Are you looking at a ${unit.toUpperCase()} or a different configuration?` },
    { role: "caller", content: `${unit.toUpperCase()} — what's the starting price and possession date?` },
    { role: "mello", content: booked
        ? `It starts at a special pre-launch price with possession in 2027. Shall I book you a site visit this weekend?`
        : `Let me have our sales team share the full price sheet and floor plans on WhatsApp — is that okay?` },
  ];
}

async function seedInbound(leads) {
  await db.from("call_logs").delete().like("call_sid", "MOCK-%").eq("facility_id", FAC);
  const N = 50;
  const outcomes = [..."booked ".repeat(18).trim().split(" "), ..."no_booking ".repeat(16).trim().split(" "), ..."escalated ".repeat(7).trim().split(" "), ..."missed ".repeat(9).trim().split(" ")];
  const calls = [];
  for (let i = 0; i < N; i++) {
    const lead = Math.random() < 0.5 ? rand(leads) : null;
    const hour = 9 + Math.floor((i / N) * 12);            // spread 09:00–21:00
    const min = (i * 7) % 60;
    const startedAt = isoTodayAt(hour, min);
    const outcome = rand(outcomes);
    const dur = outcome === "missed" ? 0 : 40 + Math.floor(Math.random() * 170);
    calls.push({
      facility_id: FAC, call_sid: `MOCK-${pad(i)}`,
      caller_phone: lead ? lead.phone : `+9198${pad(7000000 + i, 8)}`,
      is_member: Boolean(lead),
      started_at: startedAt,
      ended_at: new Date(Date.parse(startedAt) + dur * 1000).toISOString(),
      outcome,
    });
  }
  const { data: inserted, error } = await db.from("call_logs").insert(calls).select("id, outcome, caller_phone");
  if (error) throw error;

  const tx = [];
  for (const c of inserted) {
    if (c.outcome === "missed") continue;
    for (const line of reTranscript(rand(UNITS), c.outcome === "booked")) {
      tx.push({ call_id: c.id, facility_id: FAC, role: line.role, content: line.content });
    }
  }
  if (tx.length) { const { error: e2 } = await db.from("transcripts").insert(tx); if (e2) throw e2; }

  // Site visits (booked viewings) — dated across past + upcoming so the Bookings tab looks full.
  await db.from("bookings").delete().like("id", "MOCK-%").eq("facility_id", FAC);
  const bookings = [];
  for (let i = 0; i < 24; i++) {
    const knownLead = i % 3 !== 0;                         // ~66% from a known lead
    const m = rand(leads);
    const phone = knownLead ? m.phone : `+9197${pad(6000000 + i, 8)}`;
    const who = knownLead ? m.name : rand(NAMES);
    const [s, e] = rand(TIMES);
    const dayOffset = i < 13 ? (i % 5) : -(1 + (i % 6));   // ~13 upcoming, ~11 past
    const d = new Date(); d.setDate(d.getDate() + dayOffset);
    bookings.push({
      id: `MOCK-${pad(i)}`, facility_id: FAC, sport: rand(UNITS),   // sport column = unit type
      court_id: rand(TOWERS),                                       // court_id column = tower
      booking_date: d.toISOString().slice(0, 10),
      start_time: s, end_time: e, source: i % 5 === 0 ? "portal" : "mello",
      booked_by_phone: phone, booked_by_name: who, status: "confirmed",
      created_at: isoTodayAt(10 + (i % 10), (i * 7) % 60),
    });
  }
  const { error: e3 } = await db.from("bookings").insert(bookings);
  if (e3) throw e3;
  return { calls: inserted.length, transcripts: tx.length, bookings: bookings.length };
}

// Real-estate outbound campaigns. "New project launch" is the LIVE one (your real-call
// transcripts) — it is preserved, never wiped or reseeded.
const KEEP_CAMPAIGN = "New project launch";
const CAMPAIGNS = [
  ["Site-visit follow-ups", "no_show_followup"],
  ["Price-list enquiries", "lead_qualification"],
  ["Booking confirmations", "booking_confirmation"],
  ["Channel-partner win-back", "reactivation"],
  ["Payment / EOI reminders", "membership_renewal"],
  ["Post-visit feedback", "feedback"],
];
const DISPOS = ["confirmed","confirmed","rescheduled","refused","callback_requested","opt_out","no_answer","voicemail"];

async function seedOutbound(leads) {
  const probe = await db.from("outbound_campaigns").select("id").limit(1);
  if (probe.error) {
    console.log("  outbound tables not found — run migration 004_outbound.sql first, then re-run. Skipping outbound.");
    return null;
  }
  // Wipe every mock campaign for this facility EXCEPT the live real-call one, then reseed the RE set.
  const { data: existing } = await db.from("outbound_campaigns").select("id, name").eq("facility_id", FAC);
  const toDelete = (existing ?? []).filter((c) => c.name !== KEEP_CAMPAIGN).map((c) => c.id);
  if (toDelete.length) await db.from("outbound_campaigns").delete().in("id", toDelete);

  let contactsTotal = 0, attemptsTotal = 0;
  for (const [name, objective] of CAMPAIGNS) {
    const { data: camp, error } = await db.from("outbound_campaigns")
      .insert({ facility_id: FAC, name, objective_type: objective, status: "active", budget_cap_inr: 500, spent_inr: 0 })
      .select("id").single();
    if (error) throw error;

    const n = 7 + Math.floor(Math.random() * 2);
    let spent = 0;
    for (let i = 0; i < n; i++) {
      const m = rand(leads);
      const dispo = rand(DISPOS);
      const answered = !["no_answer", "voicemail"].includes(dispo);
      const state = ["no_answer"].includes(dispo) ? "pending" : "done";
      const { data: contact, error: ce } = await db.from("outbound_contacts")
        .insert({ facility_id: FAC, campaign_id: camp.id, name: m.name, phone: m.phone, state, last_disposition: dispo, attempt_count: 1 })
        .select("id").single();
      if (ce) throw ce;
      const cost = 0.4 + Math.random() * 1.6; spent += cost;
      const { error: ae } = await db.from("outbound_call_attempts").insert({
        facility_id: FAC, campaign_id: camp.id, contact_id: contact.id, answered,
        amd_result: answered ? "human" : rand(["voicemail", "unknown"]),
        disposition: dispo, duration_s: answered ? 25 + Math.floor(Math.random() * 90) : 0, cost_inr: Number(cost.toFixed(2)),
      });
      if (ae) throw ae;
      contactsTotal++; attemptsTotal++;
    }
    await db.from("outbound_campaigns").update({ spent_inr: Number(spent.toFixed(2)) }).eq("id", camp.id);
  }
  return { campaigns: CAMPAIGNS.length, contacts: contactsTotal, attempts: attemptsTotal };
}

// --- run ---
const leads = await seedLeads();
console.log(`leads: ${leads.length}`);
const inb = await seedInbound(leads);
console.log(`inbound: ${inb.calls} calls, ${inb.transcripts} transcript lines, ${inb.bookings} site visits`);
const out = await seedOutbound(leads);
if (out) console.log(`outbound: ${out.campaigns} seeded campaigns (+ live "New project launch"), ${out.contacts} contacts, ${out.attempts} attempts`);
console.log("done.");

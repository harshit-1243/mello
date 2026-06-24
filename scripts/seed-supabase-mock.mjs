/**
 * Seed demo-ready mock data into Supabase so the dashboard looks full.
 *
 *   node scripts/seed-supabase-mock.mjs            # inbound + outbound (skips outbound if tables missing)
 *
 * Idempotent: mock rows are tagged (call_sid 'MOCK-*', booking id 'MOCK-*', member phone +9199xxxxxxxx,
 * outbound campaign names from our set) and deleted before re-inserting, so re-running won't duplicate.
 * Live calls (inbound mic + outbound to your number) append on top and are never touched.
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
const SPORTS = ["badminton","tennis","pickleball","basketball"];
const TIMES = [["18:00","19:00"],["19:00","20:00"],["20:00","21:00"],["07:00","08:00"],["08:00","09:00"],["17:00","18:00"]];
const todayIST = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
function mockPhone(i) { return `+9199${pad(1000000 + i, 8)}`; }
function isoTodayAt(hour, min = 0) {
  // today's date in IST, at the given IST hour → ISO with +05:30 offset
  return `${todayIST()}T${pad(hour, 2)}:${pad(min, 2)}:00+05:30`;
}

async function seedMembers() {
  await db.from("members").delete().like("phone", "+9199%").eq("facility_id", FAC);
  const rows = NAMES.map((name, i) => ({
    facility_id: FAC, name, phone: mockPhone(i),
    tier: rand(["standard", "standard", "premium"]), active: true,
    joined_at: `2025-${pad(1 + (i % 12), 2)}-${pad(1 + (i % 27), 2)}`,
  }));
  const { error } = await db.from("members").insert(rows);
  if (error) throw error;
  return rows;
}

async function seedInbound(members) {
  // wipe prior mock calls (cascades transcripts/tool_calls), then 50 fresh ones across today.
  await db.from("call_logs").delete().like("call_sid", "MOCK-%").eq("facility_id", FAC);
  const N = 50;
  const outcomes = [..."booked ".repeat(20).trim().split(" "), ..."no_booking ".repeat(15).trim().split(" "), ..."escalated ".repeat(6).trim().split(" "), ..."missed ".repeat(9).trim().split(" ")];
  const calls = [];
  for (let i = 0; i < N; i++) {
    const member = Math.random() < 0.55 ? rand(members) : null;
    const hour = 8 + Math.floor((i / N) * 14);            // spread 08:00–22:00
    const min = (i * 7) % 60;
    const startedAt = isoTodayAt(hour, min);
    const outcome = rand(outcomes);
    const dur = outcome === "missed" ? 0 : 35 + Math.floor(Math.random() * 160);
    calls.push({
      facility_id: FAC, call_sid: `MOCK-${pad(i)}`,
      caller_phone: member ? member.phone : `+9198${pad(7000000 + i, 8)}`,
      is_member: Boolean(member),
      started_at: startedAt,
      ended_at: new Date(Date.parse(startedAt) + dur * 1000).toISOString(),
      outcome,
    });
  }
  const { data: inserted, error } = await db.from("call_logs").insert(calls).select("id, outcome, caller_phone");
  if (error) throw error;

  // transcripts for the conversational ones (so the detail view + "handled" classification light up)
  const tx = [];
  for (const c of inserted) {
    if (c.outcome === "missed") continue;
    tx.push(
      { call_id: c.id, facility_id: FAC, role: "caller", content: "Hi, I'd like to book a court for this evening." },
      { call_id: c.id, facility_id: FAC, role: "mello", content: "Sure! What sport and what time works for you?" },
      { call_id: c.id, facility_id: FAC, role: "caller", content: `${rand(SPORTS)}, around 7 PM please.` },
      { call_id: c.id, facility_id: FAC, role: "mello", content: c.outcome === "booked" ? "Done — you're booked. See you then!" : "We're full then, shall I suggest another slot?" },
    );
  }
  if (tx.length) { const { error: e2 } = await db.from("transcripts").insert(tx); if (e2) throw e2; }

  // a spread of bookings (past + upcoming) so the Bookings tab looks full.
  // ~55% non-member so Revenue Booked is non-zero; mostly source=mello so it counts as "made today".
  await db.from("bookings").delete().like("id", "MOCK-%").eq("facility_id", FAC);
  const bookings = [];
  for (let i = 0; i < 24; i++) {
    const nonMember = i % 9 < 5;                            // ~55% non-member → revenue shows
    const m = rand(members);
    const phone = nonMember ? `+9197${pad(6000000 + i, 8)}` : m.phone;
    const who = nonMember ? rand(NAMES) : m.name;
    const [s, e] = rand(TIMES);
    const dayOffset = i < 13 ? (i % 4) : -(1 + (i % 6));    // ~13 upcoming, ~11 past
    const d = new Date(); d.setDate(d.getDate() + dayOffset);
    bookings.push({
      id: `MOCK-${pad(i)}`, facility_id: FAC, sport: rand(SPORTS),
      court_id: `court_${1 + (i % 3)}`, booking_date: d.toISOString().slice(0, 10),
      start_time: s, end_time: e, source: i % 6 === 0 ? "hudle" : "mello",
      booked_by_phone: phone, booked_by_name: who, status: "confirmed",
      // dated today-IST so the "made today" / revenue stats count them (avoids the
      // UTC-vs-IST midnight gap where now() can fall before today's IST cutoff)
      created_at: isoTodayAt(9 + (i % 11), (i * 7) % 60),
    });
  }
  const { error: e3 } = await db.from("bookings").insert(bookings);
  if (e3) throw e3;
  return { calls: inserted.length, transcripts: tx.length, bookings: bookings.length };
}

const CAMPAIGNS = [
  ["Tomorrow's confirmations", "booking_confirmation"],
  ["Membership renewals — June", "membership_renewal"],
  ["Win-back lapsed clients", "reactivation"],
  ["New lead qualification", "lead_qualification"],
  ["No-show rebooking", "no_show_followup"],
  ["Monsoon promo offer", "promo_offer"],
  ["Post-visit feedback", "feedback"],
];
const DISPOS = ["confirmed","confirmed","rescheduled","refused","callback_requested","opt_out","no_answer","voicemail"];

async function seedOutbound(members) {
  // probe: do the outbound tables exist?
  const probe = await db.from("outbound_campaigns").select("id").limit(1);
  if (probe.error) {
    console.log("  outbound tables not found — run migration 004_outbound.sql first, then re-run. Skipping outbound.");
    return null;
  }
  // wipe our mock campaigns (cascade contacts + attempts)
  await db.from("outbound_campaigns").delete().in("name", CAMPAIGNS.map((c) => c[0])).eq("facility_id", FAC);

  let contactsTotal = 0, attemptsTotal = 0;
  for (const [name, objective] of CAMPAIGNS) {
    const { data: camp, error } = await db.from("outbound_campaigns")
      .insert({ facility_id: FAC, name, objective_type: objective, status: "active", budget_cap_inr: 500, spent_inr: 0 })
      .select("id").single();
    if (error) throw error;

    const n = 7 + Math.floor(Math.random() * 2);          // ~7-8 per campaign → ~50 total
    let spent = 0;
    for (let i = 0; i < n; i++) {
      const m = rand(members);
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
const members = await seedMembers();
console.log(`members: ${members.length}`);
const inb = await seedInbound(members);
console.log(`inbound: ${inb.calls} calls, ${inb.transcripts} transcript lines, ${inb.bookings} bookings`);
const out = await seedOutbound(members);
if (out) console.log(`outbound: ${out.campaigns} campaigns, ${out.contacts} contacts, ${out.attempts} attempts`);
console.log("done.");

/**
 * Dashboard data layer.
 *
 * Right now this returns realistic SEED data so we can build + polish the look
 * in the real app. Step 10.2 swaps the body of `getOverview()` to read live
 * Supabase rows (call_logs / transcripts / bookings) — same return shape, so
 * nothing in the UI changes. Kept async + server-only for that reason.
 *
 * Step 10.2 is now wired: getters try the live Supabase loaders first
 * (`./live`) and fall back to the seed below when the DB is unconfigured/empty.
 */

import { loadCalls, loadCall, loadBookings, loadMembers, loadOverview, loadSettings, loadReports } from "./live";
import { currentFacilityId } from "./session";

/**
 * Pre-launch the dashboard shows the rich DEMO seed below so it always looks
 * alive (there's no real facility data yet). Set DASHBOARD_LIVE=1 to read live
 * Supabase (with seed fallback) once a real facility is connected.
 */
const USE_LIVE = process.env.DASHBOARD_LIVE === "1";

export type CallStatus = "booked" | "handled" | "missed";

export interface CallSummary {
  id: string;
  phone: string; // E.164
  summary: string;
  status: CallStatus;
  at: string; // ISO timestamp
}

export interface UpcomingBooking {
  id: string;
  when: string; // human label, e.g. "8:00 PM" / "Sat 6 PM"
  sport: string; // display name
  who: string; // booker label, e.g. "Rahul · non-member · ₹600"
  court: string; // "Court 2" / "Full" — surfaced here, never on the call
}

export interface LiveCall {
  phone: string;
  name?: string;
  detail: string; // "Member · badminton · EN→HI"
  lastLine: string; // latest transcript line, for the rail ticker
  elapsedSeconds: number;
}

export interface OverviewStats {
  callsToday: number;
  answered: number;
  answerRatePct: number;
  bookingsMade: number;
  bookingsMember: number;
  revenueBookedInr: number;
}

export interface Overview {
  facilityName: string;
  facilityCity: string;
  hoursLabel: string;
  live: LiveCall | null;
  stats: OverviewStats;
  recentCalls: CallSummary[];
  upcoming: UpcomingBooking[];
}

/** Overview — live Supabase when configured, else the demo seed below. */
export async function getOverview(): Promise<Overview> {
  return USE_LIVE ? (await loadOverview(await currentFacilityId())) ?? seedOverview() : seedOverview();
}

/** Seeded overview — mirrors the demo facility (Raheja Ileseum). */
function seedOverview(): Overview {
  return {
    facilityName: "Raheja Ileseum",
    facilityCity: "Mumbai",
    hoursLabel: "8:00 AM – 12:00 AM",
    live: {
      phone: "+919653679703",
      name: "Manan",
      detail: "Member · badminton · EN→HI",
      lastLine: "Done Manan — confirmation WhatsApp pe aa raha hai…",
      elapsedSeconds: 42,
    },
    stats: {
      callsToday: 24,
      answered: 22,
      answerRatePct: 92,
      bookingsMade: 6,
      bookingsMember: 1,
      revenueBookedInr: 3600,
    },
    recentCalls: [
      { id: "c1", phone: "+919876512345", summary: "Badminton · tomorrow 8 PM", status: "booked", at: iso(-3) },
      { id: "c2", phone: "+919653679703", summary: "Tennis · today 9 PM · member", status: "booked", at: iso(-12) },
      { id: "c3", phone: "+919004122000", summary: "Parking question · callback scheduled", status: "handled", at: iso(-26) },
      { id: "c4", phone: "+918826004111", summary: "Basketball · Sat 6 PM · full court", status: "booked", at: iso(-44) },
      { id: "c5", phone: "+917021588222", summary: "Missed — caller hung up", status: "missed", at: iso(-58) },
    ],
    upcoming: [
      { id: "b1", when: "8:00 PM", sport: "Badminton", who: "Rahul · non-member · ₹600", court: "Court 2" },
      { id: "b2", when: "9:00 PM", sport: "Tennis", who: "Manan · member", court: "Court 1" },
      { id: "b3", when: "Sat 6 PM", sport: "Basketball", who: "Kush · full court · ₹1,600", court: "Full" },
    ],
  };
}

/** Minutes-ago helper for seed timestamps. */
function iso(minutesAgo: number): string {
  return new Date(Date.now() + minutesAgo * 60_000).toISOString();
}

// ===========================================================================
// Calls
// ===========================================================================

export interface CallRow {
  id: string;
  phone: string;
  name?: string;
  isMember: boolean;
  intent: string; // short description of what the caller wanted
  language: string; // "Hindi+English" | "English" | ...
  durationSeconds: number;
  status: CallStatus;
  at: string; // ISO
}

export interface TranscriptLine {
  role: "caller" | "mello";
  text: string;
}

export interface ToolCallEntry {
  tool: string;
  summary: string; // human-readable args→result
  ok: boolean;
}

export interface CallDetail extends CallRow {
  transcript: TranscriptLine[];
  toolCalls: ToolCallEntry[];
  /** The booking that resulted, if any. Court IS shown here (internal view). */
  booking?: { sport: string; court: string; when: string; amountInr: number; source: string };
}

const CALLS: CallDetail[] = [
  {
    id: "c1",
    phone: "+919876512345",
    name: "Rahul",
    isMember: false,
    intent: "Badminton · tomorrow 8 PM",
    language: "Hindi+English",
    durationSeconds: 78,
    status: "booked",
    at: iso(-3),
    transcript: [
      { role: "mello", text: "Hi! Welcome to Raheja Ileseum — how can I help?" },
      { role: "caller", text: "Kal sham ko badminton court chahiye tha, 8 baje" },
      { role: "mello", text: "Let me check that for you… 8 PM ke do courts booked hain, but 9 PM available hai. Chalega?" },
      { role: "caller", text: "Haan 9 baje theek hai" },
      { role: "mello", text: "1 hour ke liye ₹600 hoga. Aap WhatsApp pe payment link se pay kar sakte hain, ya venue pe. Kya theek rahega?" },
      { role: "caller", text: "Venue pe kar dunga" },
      { role: "mello", text: "Done Rahul! Badminton, kal 9 se 10 PM. Confirmation WhatsApp pe aa raha hai. See you!" },
    ],
    toolCalls: [
      { tool: "verify_member", summary: "+91 98765 12345 → not a member", ok: true },
      { tool: "check_slot", summary: "badminton · tomorrow 20:00 → booked; offered 21:00, 22:00", ok: true },
      { tool: "check_slot", summary: "badminton · tomorrow 21:00 → available", ok: true },
      { tool: "create_booking", summary: "badminton · tomorrow 21:00 · 1h → MLO-…-0007", ok: true },
    ],
    booking: { sport: "Badminton", court: "Court 2", when: "Tomorrow 9–10 PM", amountInr: 600, source: "mello" },
  },
  {
    id: "c2",
    phone: "+919653679703",
    name: "Manan",
    isMember: true,
    intent: "Badminton · tomorrow 8 PM (group conflict)",
    language: "Hindi+English",
    durationSeconds: 95,
    status: "booked",
    at: iso(-12),
    transcript: [
      { role: "mello", text: "Hi Manan! Welcome to Raheja Ileseum — how can I help?" },
      { role: "caller", text: "Kal 8 baje badminton book karna hai" },
      { role: "mello", text: "Ek sec… kal 8 PM badminton uplabdh nahi hai. 5 PM ya 6 PM chalega?" },
      { role: "caller", text: "5 baje kar do" },
      { role: "mello", text: "Done Manan! Badminton, kal 5 se 6 PM. Confirmation WhatsApp pe aa raha hai." },
    ],
    toolCalls: [
      { tool: "verify_member", summary: "+91 96536 79703 → member (Manan, standard)", ok: true },
      { tool: "check_slot", summary: "badminton · tomorrow 20:00 → unavailable (group ±2h); offered 17:00, 18:00", ok: true },
      { tool: "check_slot", summary: "badminton · tomorrow 17:00 → available", ok: true },
      { tool: "create_booking", summary: "badminton · tomorrow 17:00 · 1h → MLO-…-0006", ok: true },
    ],
    booking: { sport: "Badminton", court: "Court 1", when: "Tomorrow 5–6 PM", amountInr: 0, source: "mello" },
  },
  {
    id: "c3",
    phone: "+919004122000",
    isMember: false,
    intent: "Parking question",
    language: "English",
    durationSeconds: 41,
    status: "handled",
    at: iso(-26),
    transcript: [
      { role: "mello", text: "Hi! Welcome to Raheja Ileseum — how can I help?" },
      { role: "caller", text: "Do you have parking at the venue?" },
      { role: "mello", text: "Good question — let me have someone from the team call you back with the details shortly. Is this number okay?" },
      { role: "caller", text: "Yes thanks" },
      { role: "mello", text: "Done, they'll reach out soon. Anything else I can help with?" },
    ],
    toolCalls: [{ tool: "escalate_to_human", summary: "reason: parking · callback +91 90041 22000", ok: true }],
  },
  {
    id: "c4",
    phone: "+918826004111",
    name: "Kush",
    isMember: true,
    intent: "Basketball · Sat 6 PM · full court",
    language: "Hindi+English",
    durationSeconds: 63,
    status: "booked",
    at: iso(-44),
    transcript: [
      { role: "mello", text: "Hi Kush! Welcome to Raheja Ileseum — how can I help?" },
      { role: "caller", text: "Saturday 6 baje basketball, full court" },
      { role: "mello", text: "Done Kush! Basketball full court, Saturday 6 se 7 PM. Confirmation WhatsApp pe aa raha hai." },
    ],
    toolCalls: [
      { tool: "verify_member", summary: "+91 88260 04111 → member (Kush, standard)", ok: true },
      { tool: "check_slot", summary: "basketball(full) · Sat 18:00 → available", ok: true },
      { tool: "create_booking", summary: "basketball(full) · Sat 18:00 · 1h → MLO-…-0005", ok: true },
    ],
    booking: { sport: "Basketball", court: "Full court", when: "Sat 6–7 PM", amountInr: 0, source: "mello" },
  },
  {
    id: "c5",
    phone: "+917021588222",
    isMember: false,
    intent: "Caller hung up before speaking",
    language: "—",
    durationSeconds: 6,
    status: "missed",
    at: iso(-58),
    transcript: [{ role: "mello", text: "Hi! Welcome to Raheja Ileseum — how can I help?" }],
    toolCalls: [],
  },
  {
    id: "c6",
    phone: "+918369851507",
    name: "Harshit",
    isMember: true,
    intent: "Tennis · today 9 PM",
    language: "English",
    durationSeconds: 52,
    status: "booked",
    at: iso(-92),
    transcript: [
      { role: "mello", text: "Hi Harshit! Welcome to Raheja Ileseum — how can I help?" },
      { role: "caller", text: "Tennis tonight at 9?" },
      { role: "mello", text: "Done Harshit! Tennis, today 9 to 10 PM. Confirmation on its way." },
    ],
    toolCalls: [
      { tool: "verify_member", summary: "+91 83698 51507 → member (Harshit, standard)", ok: true },
      { tool: "check_slot", summary: "tennis · today 21:00 → available", ok: true },
      { tool: "create_booking", summary: "tennis · today 21:00 · 1h → MLO-…-0004", ok: true },
    ],
    booking: { sport: "Tennis", court: "Court 1", when: "Today 9–10 PM", amountInr: 0, source: "mello" },
  },
];

export async function getCalls(): Promise<CallRow[]> {
  const seed = () => CALLS.map(({ transcript, toolCalls, booking, ...row }) => row);
  return USE_LIVE ? (await loadCalls(await currentFacilityId())) ?? seed() : seed();
}

export async function getCall(id: string): Promise<CallDetail | null> {
  const seed = () => CALLS.find((c) => c.id === id) ?? null;
  return USE_LIVE ? (await loadCall(id, await currentFacilityId())) ?? seed() : seed();
}

// ===========================================================================
// Bookings
// ===========================================================================

export interface BookingRow {
  id: string;
  dateLabel: string; // "Today" / "Tomorrow" / "Sat 14 Jun"
  when: string; // "8:00–9:00 PM"
  sport: string;
  court: string;
  who: string; // name
  member: boolean;
  amountInr: number;
  source: string; // "mello" | "hudle"
}

const BOOKINGS_UPCOMING: BookingRow[] = [
  { id: "MLO-0007", dateLabel: "Tomorrow", when: "9:00–10:00 PM", sport: "Badminton", court: "Court 2", who: "Rahul", member: false, amountInr: 600, source: "mello" },
  { id: "MLO-0006", dateLabel: "Tomorrow", when: "5:00–6:00 PM", sport: "Badminton", court: "Court 1", who: "Manan", member: true, amountInr: 0, source: "mello" },
  { id: "HD-DEMO-001", dateLabel: "Tomorrow", when: "8:00–9:00 PM", sport: "Badminton", court: "Court 2", who: "Hudle booking", member: false, amountInr: 0, source: "hudle" },
  { id: "MLO-0005", dateLabel: "Sat 14 Jun", when: "6:00–7:00 PM", sport: "Basketball", court: "Full court", who: "Kush", member: true, amountInr: 0, source: "mello" },
];

const BOOKINGS_PAST: BookingRow[] = [
  { id: "MLO-0004", dateLabel: "Today", when: "9:00–10:00 PM", sport: "Tennis", court: "Court 1", who: "Harshit", member: true, amountInr: 0, source: "mello" },
  { id: "MLO-0003", dateLabel: "Yesterday", when: "7:00–8:00 PM", sport: "Pickleball", court: "Court 3", who: "Krit", member: true, amountInr: 0, source: "mello" },
  { id: "MLO-0002", dateLabel: "Yesterday", when: "6:00–7:00 PM", sport: "Badminton", court: "Court 2", who: "Priya", member: false, amountInr: 600, source: "mello" },
];

export async function getBookings(): Promise<{ upcoming: BookingRow[]; past: BookingRow[] }> {
  const seed = { upcoming: BOOKINGS_UPCOMING, past: BOOKINGS_PAST };
  return USE_LIVE ? (await loadBookings(await currentFacilityId())) ?? seed : seed;
}

// ===========================================================================
// Members + groups
// ===========================================================================

export interface MemberRow {
  name: string;
  phone: string;
  tier: string;
  joinedAt: string;
  active: boolean;
}
export interface GroupRow {
  id: string;
  label: string;
  memberNames: string[];
}

export async function getMembers(): Promise<{ members: MemberRow[]; groups: GroupRow[] }> {
  return USE_LIVE ? (await loadMembers(await currentFacilityId())) ?? SEED_MEMBERS : SEED_MEMBERS;
}

const SEED_MEMBERS: { members: MemberRow[]; groups: GroupRow[] } = {
  members: [
      { name: "Harshit", phone: "+918369851507", tier: "standard", joinedAt: "2025-01-15", active: true },
      { name: "Manan", phone: "+919653679703", tier: "standard", joinedAt: "2025-02-10", active: true },
      { name: "Bitu", phone: "+918976019902", tier: "standard", joinedAt: "2024-12-01", active: true },
      { name: "Kush", phone: "+918479641500", tier: "standard", joinedAt: "2025-03-20", active: true },
      { name: "Krit", phone: "+918937504721", tier: "standard", joinedAt: "2025-04-05", active: true },
    ],
    groups: [
      { id: "group_1", label: "Group 1", memberNames: ["Harshit", "Manan", "Bitu"] },
      { id: "group_2", label: "Group 2", memberNames: ["Kush", "Krit", "Bitu"] },
    ],
};

// ===========================================================================
// Settings
// ===========================================================================

export interface SettingsView {
  facilityName: string;
  city: string;
  hoursLabel: string;
  sports: { name: string; courts: number; priceLabel: string }[];
  memberWindows: string[];
  integrations: { label: string; status: "connected" | "not_connected"; detail: string }[];
  privacy: { audioSeconds: number; transcriptDays: number };
}

export async function getSettings(): Promise<SettingsView> {
  return USE_LIVE ? (await loadSettings(await currentFacilityId())) ?? seedSettings() : seedSettings();
}

function seedSettings(): SettingsView {
  return {
    facilityName: "Raheja Ileseum",
    city: "Mumbai",
    hoursLabel: "8:00 AM – 12:00 AM",
    sports: [
      { name: "Badminton", courts: 3, priceLabel: "₹600/hr" },
      { name: "Tennis", courts: 1, priceLabel: "₹1,200/hr" },
      { name: "Pickleball", courts: 3, priceLabel: "₹600/hr" },
      { name: "Basketball", courts: 1, priceLabel: "₹1,600/hr full · ₹800 half" },
    ],
    memberWindows: ["8:00–10:00 AM (all days)", "9:00–11:00 PM (all days)"],
    integrations: [
      { label: "Phone (Twilio)", status: "not_connected", detail: "KYC pending" },
      { label: "WhatsApp (Meta)", status: "not_connected", detail: "Add token to go live" },
      { label: "Payments", status: "not_connected", detail: "Add your provider key" },
      { label: "Database (Supabase)", status: "connected", detail: "Persisting calls & bookings" },
    ],
    privacy: { audioSeconds: 60, transcriptDays: 90 },
  };
}

// ===========================================================================
// Reports — real, derivable analytics (no fabricated metrics, no price refs)
// ===========================================================================

export interface ReportData {
  periodDays: number;
  calls: number;
  answered: number;
  answerRatePct: number;
  bookings: number;
  conversionPct: number; // bookings ÷ calls
  revenueInr: number; // non-member ₹ booked in the period
  afterHoursCalls: number; // calls outside facility open hours = recovered
  byHour: { hour: number; count: number }[]; // bookings by start hour (0–23)
  bySport: { sport: string; count: number }[];
  memberMix: { member: number; nonMember: number };
  /** Pre-Mello baseline — null until the facility provides it (lights up the
   *  before/after comparison). Sourced at onboarding, not assumed. */
  baseline: { missedPerMonth: number } | null;
}

export async function getReports(): Promise<ReportData> {
  return USE_LIVE ? (await loadReports(await currentFacilityId())) ?? seedReports() : seedReports();
}

function seedReports(): ReportData {
  return {
    periodDays: 30,
    calls: 642,
    answered: 597,
    answerRatePct: 93,
    bookings: 421,
    conversionPct: 66,
    revenueInr: 184200,
    afterHoursCalls: 138,
    byHour: [
      { hour: 8, count: 9 }, { hour: 9, count: 14 }, { hour: 10, count: 11 }, { hour: 11, count: 8 },
      { hour: 12, count: 6 }, { hour: 13, count: 7 }, { hour: 14, count: 9 }, { hour: 15, count: 12 },
      { hour: 16, count: 18 }, { hour: 17, count: 27 }, { hour: 18, count: 41 }, { hour: 19, count: 46 },
      { hour: 20, count: 38 }, { hour: 21, count: 24 }, { hour: 22, count: 13 }, { hour: 23, count: 7 },
    ],
    bySport: [
      { sport: "Badminton", count: 198 },
      { sport: "Pickleball", count: 96 },
      { sport: "Tennis", count: 71 },
      { sport: "Basketball", count: 56 },
    ],
    memberMix: { member: 156, nonMember: 265 },
    baseline: { missedPerMonth: 180 },
  };
}

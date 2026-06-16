import "server-only";
import { db } from "./db";
import type {
  CallRow,
  CallDetail,
  CallStatus,
  BookingRow,
  MemberRow,
  GroupRow,
  ToolCallEntry,
  Overview,
  OverviewStats,
  CallSummary,
  UpcomingBooking,
  LiveCall,
  SettingsView,
  ReportData,
} from "./data";

/**
 * Live Supabase loaders for the dashboard read-path.
 *
 * Each returns `null` when the DB is unconfigured, the query fails, or there's
 * simply no data yet — the data layer then falls back to the built-in seed.
 * So the dashboard demos with seed today and lights up automatically once real
 * calls + bookings land in Supabase. No mapping bug can break a render: every
 * query is wrapped and degrades to seed.
 */

// --- shared helpers --------------------------------------------------------

/** Today's date (YYYY-MM-DD) in the facility timezone. */
function todayIST(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** "20:00" → "8 PM", "20:30" → "8:30 PM". */
function clock12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const ampm = h >= 12 && h < 24 ? "PM" : "AM";
  let hr = h % 12;
  if (hr === 0) hr = 12;
  return m ? `${hr}:${String(m).padStart(2, "0")} ${ampm}` : `${hr} ${ampm}`;
}
function timeRange(start: string, end: string): string {
  return `${clock12(start).replace(/ (AM|PM)$/, "")}–${clock12(end)}`;
}
function dateLabel(date: string): string {
  const today = todayIST();
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${date}T00:00:00Z`);
  const diff = Math.round((b - a) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

// Non-member ₹/hr by sport (members = 0). Mirrors the facility config.
const PRICE_PER_HOUR: Record<string, number> = { badminton: 600, tennis: 1200, pickleball: 600, basketball: 1600 };
function bookingAmount(sport: string, start: string, end: string, isMember: boolean, mode?: string | null): number {
  if (isMember) return 0;
  let perHour = PRICE_PER_HOUR[sport] ?? 0;
  if (sport === "basketball" && mode === "half") perHour = 800;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
  return Math.round(perHour * Math.max(hours, 0));
}

function statusFromOutcome(outcome: string | null, hasTranscript: boolean): CallStatus {
  if (outcome === "booked") return "booked";
  if (outcome === "escalated" || outcome === "handled") return "handled";
  if (!hasTranscript) return "missed";
  return "handled";
}

/** Map facility members once → phone→name lookup. */
async function memberNameMap(facilityId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!db) return map;
  const { data } = await db.from("members").select("name, phone").eq("facility_id", facilityId);
  for (const m of data ?? []) map.set(m.phone as string, m.name as string);
  return map;
}

// --- loaders ---------------------------------------------------------------

export async function loadCalls(facilityId: string): Promise<CallRow[] | null> {
  if (!db) return null;
  try {
    const start = `${todayIST()}T00:00:00`;
    const { data, error } = await db
      .from("call_logs")
      .select("id, caller_phone, is_member, started_at, ended_at, outcome")
      .eq("facility_id", facilityId)
      .gte("started_at", start)
      .order("started_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const names = await memberNameMap(facilityId);
    return data.map((c): CallRow => {
      const dur = c.ended_at ? Math.max(0, Math.round((Date.parse(c.ended_at) - Date.parse(c.started_at)) / 1000)) : 0;
      return {
        id: c.id as string,
        phone: c.caller_phone ?? "",
        name: names.get(c.caller_phone ?? "") ?? undefined,
        isMember: Boolean(c.is_member),
        intent: c.outcome ?? "—",
        language: "—",
        durationSeconds: dur,
        status: statusFromOutcome(c.outcome ?? null, dur > 8),
        at: c.started_at as string,
      };
    });
  } catch {
    return null;
  }
}

export async function loadCall(id: string, facilityId: string): Promise<CallDetail | null> {
  if (!db) return null;
  try {
    const { data: call, error } = await db
      .from("call_logs")
      .select("id, caller_phone, is_member, started_at, ended_at, outcome")
      .eq("facility_id", facilityId)
      .eq("id", id)
      .maybeSingle();
    if (error || !call) return null;

    const [{ data: tx }, { data: tools }, names] = await Promise.all([
      db.from("transcripts").select("role, content, created_at").eq("call_id", id).order("created_at"),
      db.from("tool_calls").select("tool, args, result, created_at").eq("call_id", id).order("created_at"),
      memberNameMap(facilityId),
    ]);

    const dur = call.ended_at
      ? Math.max(0, Math.round((Date.parse(call.ended_at) - Date.parse(call.started_at)) / 1000))
      : 0;

    const toolCalls: ToolCallEntry[] = (tools ?? []).map((t) => ({
      tool: t.tool as string,
      summary: summarizeTool(t.args, t.result),
      ok: true,
    }));

    // Best-effort: a booking by this caller created around the call.
    const { data: bk } = await db
      .from("bookings")
      .select("sport, court_id, booking_date, start_time, end_time, source, basketball_mode")
      .eq("facility_id", facilityId)
      .eq("booked_by_phone", call.caller_phone ?? "")
      .order("created_at", { ascending: false })
      .limit(1);
    const b = bk?.[0];

    return {
      id: call.id as string,
      phone: call.caller_phone ?? "",
      name: names.get(call.caller_phone ?? "") ?? undefined,
      isMember: Boolean(call.is_member),
      intent: call.outcome ?? "—",
      language: "—",
      durationSeconds: dur,
      status: statusFromOutcome(call.outcome ?? null, (tx?.length ?? 0) > 1),
      at: call.started_at as string,
      transcript: (tx ?? []).map((l) => ({ role: l.role as "caller" | "mello", text: l.content as string })),
      toolCalls,
      booking: b
        ? {
            sport: cap(b.sport as string),
            court: courtLabel(b.court_id as string),
            when: `${dateLabel(b.booking_date as string)} ${timeRange(b.start_time as string, b.end_time as string)}`,
            amountInr: bookingAmount(b.sport as string, b.start_time as string, b.end_time as string, Boolean(call.is_member), b.basketball_mode as string | null),
            source: b.source as string,
          }
        : undefined,
    };
  } catch {
    return null;
  }
}

export async function loadBookings(facilityId: string): Promise<{ upcoming: BookingRow[]; past: BookingRow[] } | null> {
  if (!db) return null;
  try {
    const { data, error } = await db
      .from("bookings")
      .select("id, sport, court_id, booking_date, start_time, end_time, source, booked_by_phone, booked_by_name, basketball_mode")
      .eq("facility_id", facilityId)
      .order("booking_date")
      .order("start_time");
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const names = await memberNameMap(facilityId);
    const today = todayIST();
    const upcoming: BookingRow[] = [];
    const past: BookingRow[] = [];
    for (const b of data) {
      const isMember = names.has(b.booked_by_phone ?? "");
      const row: BookingRow = {
        id: b.id as string,
        dateLabel: dateLabel(b.booking_date as string),
        when: timeRange(b.start_time as string, b.end_time as string),
        sport: cap(b.sport as string),
        court: courtLabel(b.court_id as string),
        who: (b.booked_by_name as string) || (b.source === "mello" ? "—" : `${cap(b.source as string)} booking`),
        member: isMember,
        amountInr: bookingAmount(b.sport as string, b.start_time as string, b.end_time as string, isMember, b.basketball_mode as string | null),
        source: b.source as string,
      };
      if ((b.booking_date as string) >= today) upcoming.push(row);
      else past.push(row);
    }
    past.reverse();
    return { upcoming, past };
  } catch {
    return null;
  }
}

export async function loadMembers(facilityId: string): Promise<{ members: MemberRow[]; groups: GroupRow[] } | null> {
  if (!db) return null;
  try {
    const [{ data: members, error: me }, { data: groups }, { data: gm }] = await Promise.all([
      db.from("members").select("name, phone, tier, joined_at, active").eq("facility_id", facilityId).order("joined_at"),
      db.from("groups").select("id, label").eq("facility_id", facilityId),
      db.from("group_members").select("group_id, member_phone").eq("facility_id", facilityId),
    ]);
    if (me) throw me;
    if (!members || members.length === 0) return null;

    const phoneToName = new Map((members ?? []).map((m) => [m.phone as string, m.name as string]));
    return {
      members: members.map((m): MemberRow => ({
        name: m.name as string,
        phone: m.phone as string,
        tier: (m.tier as string) ?? "standard",
        joinedAt: (m.joined_at as string) ?? "",
        active: Boolean(m.active),
      })),
      groups: (groups ?? []).map((g): GroupRow => ({
        id: g.id as string,
        label: g.label as string,
        memberNames: (gm ?? [])
          .filter((x) => x.group_id === g.id)
          .map((x) => phoneToName.get(x.member_phone as string) ?? (x.member_phone as string)),
      })),
    };
  } catch {
    return null;
  }
}

// --- overview --------------------------------------------------------------

/** "08:00" → "8:00 AM", "24:00" → "12:00 AM". Always shows minutes. */
function hhmm12(t: string): string {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  const ampm = h >= 12 && h < 24 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m || 0).padStart(2, "0")} ${ampm}`;
}

interface FacilityRow {
  name: string;
  city: string | null;
  open_time: string;
  close_time: string;
  config: Record<string, unknown> | null;
}

async function loadFacility(facilityId: string): Promise<FacilityRow | null> {
  if (!db) return null;
  const { data } = await db
    .from("facilities")
    .select("name, city, open_time, close_time, config")
    .eq("id", facilityId)
    .maybeSingle();
  return (data as FacilityRow) ?? null;
}

export async function loadOverview(facilityId: string): Promise<Overview | null> {
  if (!db) return null;
  try {
    const facility = await loadFacility(facilityId);
    if (!facility) return null;

    const today = todayIST();
    const dayStart = `${today}T00:00:00`;
    const names = await memberNameMap(facilityId);

    // Today's calls.
    const { data: calls } = await db
      .from("call_logs")
      .select("id, caller_phone, is_member, started_at, ended_at, outcome")
      .eq("facility_id", facilityId)
      .gte("started_at", dayStart)
      .order("started_at", { ascending: false });
    const callRows = calls ?? [];

    const callsToday = callRows.length;
    let answered = 0;
    for (const c of callRows) {
      const dur = c.ended_at ? (Date.parse(c.ended_at) - Date.parse(c.started_at)) / 1000 : 0;
      if (statusFromOutcome(c.outcome ?? null, dur > 8) !== "missed") answered++;
    }
    const answerRatePct = callsToday ? Math.round((answered / callsToday) * 100) : 0;

    const recentCalls: CallSummary[] = callRows.slice(0, 5).map((c): CallSummary => {
      const dur = c.ended_at ? (Date.parse(c.ended_at) - Date.parse(c.started_at)) / 1000 : 0;
      return {
        id: c.id as string,
        phone: c.caller_phone ?? "",
        summary: (c.outcome as string) || "—",
        status: statusFromOutcome(c.outcome ?? null, dur > 8),
        at: c.started_at as string,
      };
    });

    // Bookings made today (for the stat cards).
    const { data: madeToday } = await db
      .from("bookings")
      .select("sport, start_time, end_time, booked_by_phone, basketball_mode, source")
      .eq("facility_id", facilityId)
      .eq("source", "mello")
      .gte("created_at", dayStart);
    const made = madeToday ?? [];
    let bookingsMember = 0;
    let revenueBookedInr = 0;
    for (const b of made) {
      const isMember = names.has(b.booked_by_phone ?? "");
      if (isMember) bookingsMember++;
      else
        revenueBookedInr += bookingAmount(
          b.sport as string,
          b.start_time as string,
          b.end_time as string,
          false,
          b.basketball_mode as string | null,
        );
    }
    const stats: OverviewStats = {
      callsToday,
      answered,
      answerRatePct,
      bookingsMade: made.length,
      bookingsMember,
      revenueBookedInr,
    };

    // Upcoming bookings (today onward).
    const { data: up } = await db
      .from("bookings")
      .select("id, sport, court_id, booking_date, start_time, booked_by_name, source")
      .eq("facility_id", facilityId)
      .gte("booking_date", today)
      .order("booking_date")
      .order("start_time")
      .limit(6);
    const upcoming: UpcomingBooking[] = (up ?? []).map((b): UpcomingBooking => {
      const dl = dateLabel(b.booking_date as string);
      const start = clock12(b.start_time as string);
      return {
        id: b.id as string,
        when: dl === "Today" ? start : `${dl} ${start}`,
        sport: cap(b.sport as string),
        who: (b.booked_by_name as string) || (b.source === "mello" ? "—" : `${cap(b.source as string)} booking`),
        court: courtLabel(b.court_id as string),
      };
    });

    // A live (in-progress) call = started, not yet ended.
    let live: LiveCall | null = null;
    const { data: liveRows } = await db
      .from("call_logs")
      .select("id, caller_phone, is_member, started_at, outcome")
      .eq("facility_id", facilityId)
      .is("ended_at", null)
      .gte("started_at", dayStart)
      .order("started_at", { ascending: false })
      .limit(1);
    const lc = liveRows?.[0];
    if (lc) {
      const { data: lastLine } = await db
        .from("transcripts")
        .select("content")
        .eq("call_id", lc.id as string)
        .order("created_at", { ascending: false })
        .limit(1);
      live = {
        phone: lc.caller_phone ?? "",
        name: names.get(lc.caller_phone ?? ""),
        detail: `${lc.is_member ? "Member" : "Caller"} · ${(lc.outcome as string) || "in progress"}`,
        lastLine: (lastLine?.[0]?.content as string) || "…",
        elapsedSeconds: Math.max(0, Math.round((Date.now() - Date.parse(lc.started_at as string)) / 1000)),
      };
    }

    return {
      facilityName: facility.name,
      facilityCity: facility.city ?? "",
      hoursLabel: `${hhmm12(facility.open_time)} – ${hhmm12(facility.close_time)}`,
      live,
      stats,
      recentCalls,
      upcoming,
    };
  } catch {
    return null;
  }
}

// --- settings --------------------------------------------------------------

function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export async function loadSettings(facilityId: string): Promise<SettingsView | null> {
  if (!db) return null;
  try {
    const facility = await loadFacility(facilityId);
    if (!facility) return null;
    const cfg = (facility.config ?? {}) as Record<string, unknown>;

    // Sports + pricing from the config snapshot.
    const rawSports = Array.isArray(cfg.sports) ? (cfg.sports as Record<string, unknown>[]) : [];
    const sports = rawSports.map((s) => {
      const courts = Array.isArray(s.courts) ? (s.courts as unknown[]).length : 0;
      const p = (s.pricing_per_hour_inr ?? {}) as Record<string, number>;
      const priceLabel =
        s.id === "basketball"
          ? `${inr(p.full_non_member ?? 0)}/hr full · ${inr(p.half_non_member ?? 0)} half`
          : `${inr(p.non_member ?? 0)}/hr`;
      return { name: (s.name as string) ?? cap((s.id as string) ?? ""), courts, priceLabel };
    });

    // Member-only windows.
    const rawWindows = Array.isArray(cfg.member_only_windows) ? (cfg.member_only_windows as Record<string, unknown>[]) : [];
    const memberWindows = rawWindows.map((w) => {
      const days = Array.isArray(w.weekdays) ? (w.weekdays as unknown[]).length : 0;
      const label = days >= 7 ? "all days" : `${days} days`;
      return `${hhmm12(w.start as string)}–${hhmm12(w.end as string)} (${label})`;
    });

    const privacy = (cfg.privacy_rules ?? {}) as Record<string, number>;
    const facilityCfg = (cfg.facility ?? {}) as Record<string, string>;
    const twilioNumber = facilityCfg.twilio_number ?? "";
    const twilioLive = twilioNumber.startsWith("+");

    return {
      facilityName: facility.name,
      city: facility.city ?? "",
      hoursLabel: `${hhmm12(facility.open_time)} – ${hhmm12(facility.close_time)}`,
      sports,
      memberWindows,
      integrations: [
        {
          label: "Phone (Twilio)",
          status: twilioLive ? "connected" : "not_connected",
          detail: twilioLive ? twilioNumber : "KYC pending",
        },
        { label: "WhatsApp (Meta)", status: "not_connected", detail: "Add token to go live" },
        { label: "Payments", status: "not_connected", detail: "Add your provider key" },
        { label: "Database (Supabase)", status: "connected", detail: "Persisting calls & bookings" },
      ],
      privacy: {
        audioSeconds: privacy.audio_retention_seconds ?? 60,
        transcriptDays: privacy.transcript_retention_days ?? 90,
      },
    };
  } catch {
    return null;
  }
}

// --- reports ---------------------------------------------------------------

/** Hour-of-day (0–23) in IST for an ISO timestamp. */
function istHour(iso: string): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", hour12: false }).format(
    new Date(iso),
  );
  return parseInt(h, 10) % 24;
}

export async function loadReports(facilityId: string): Promise<ReportData | null> {
  if (!db) return null;
  try {
    const facility = await loadFacility(facilityId);
    if (!facility) return null;

    const periodDays = 30;
    const since = new Date(Date.now() - periodDays * 86_400_000).toISOString();
    const openHour = parseInt((facility.open_time || "08:00").split(":")[0], 10);
    const closeHour = parseInt((facility.close_time || "24:00").split(":")[0], 10);
    const names = await memberNameMap(facilityId);

    // Calls in the period.
    const { data: calls } = await db
      .from("call_logs")
      .select("started_at, ended_at, outcome")
      .eq("facility_id", facilityId)
      .gte("started_at", since);
    const callRows = calls ?? [];
    let answered = 0;
    let afterHoursCalls = 0;
    for (const c of callRows) {
      const dur = c.ended_at ? (Date.parse(c.ended_at) - Date.parse(c.started_at)) / 1000 : 0;
      if (statusFromOutcome(c.outcome ?? null, dur > 8) !== "missed") answered++;
      const hr = istHour(c.started_at as string);
      if (hr < openHour || hr >= closeHour) afterHoursCalls++;
    }

    // Bookings in the period (Mello-made).
    const { data: bookings } = await db
      .from("bookings")
      .select("sport, start_time, end_time, booked_by_phone, basketball_mode, created_at")
      .eq("facility_id", facilityId)
      .eq("source", "mello")
      .gte("created_at", since);
    const bk = bookings ?? [];

    const sportCounts = new Map<string, number>();
    const hourCounts = new Map<number, number>();
    let member = 0;
    let nonMember = 0;
    let revenueInr = 0;
    for (const b of bk) {
      const sport = cap(b.sport as string);
      sportCounts.set(sport, (sportCounts.get(sport) ?? 0) + 1);
      const hr = parseInt((b.start_time as string).split(":")[0], 10);
      hourCounts.set(hr, (hourCounts.get(hr) ?? 0) + 1);
      const isMember = names.has(b.booked_by_phone ?? "");
      if (isMember) member++;
      else {
        nonMember++;
        revenueInr += bookingAmount(b.sport as string, b.start_time as string, b.end_time as string, false, b.basketball_mode as string | null);
      }
    }

    const cfg = (facility.config ?? {}) as Record<string, unknown>;
    const baselineRaw = (cfg.baseline ?? null) as { missed_per_month?: number } | null;

    return {
      periodDays,
      calls: callRows.length,
      answered,
      answerRatePct: callRows.length ? Math.round((answered / callRows.length) * 100) : 0,
      bookings: bk.length,
      conversionPct: callRows.length ? Math.round((bk.length / callRows.length) * 100) : 0,
      revenueInr,
      afterHoursCalls,
      byHour: [...hourCounts.entries()].sort((a, b) => a[0] - b[0]).map(([hour, count]) => ({ hour, count })),
      bySport: [...sportCounts.entries()].sort((a, b) => b[1] - a[1]).map(([sport, count]) => ({ sport, count })),
      memberMix: { member, nonMember },
      baseline: baselineRaw?.missed_per_month ? { missedPerMonth: baselineRaw.missed_per_month } : null,
    };
  } catch {
    return null;
  }
}

// --- tiny formatters -------------------------------------------------------

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** "badminton_2" → "Court 2"; "basketball_full" → "Full court"; "*_half_a" → "Half A". */
function courtLabel(courtId: string): string {
  if (courtId.endsWith("_full")) return "Full court";
  const half = courtId.match(/_half_([ab])$/);
  if (half) return `Half ${half[1].toUpperCase()}`;
  const n = courtId.match(/_(\d+)$/);
  return n ? `Court ${n[1]}` : courtId;
}

/** Render a tool call's args/result into a one-line human summary. */
function summarizeTool(args: unknown, result: unknown): string {
  const a = compact(args);
  const r = compact(result);
  return r ? `${a} → ${r}` : a || "—";
}
function compact(v: unknown): string {
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  const parts = Object.entries(v as Record<string, unknown>)
    .filter(([, val]) => val !== null && val !== undefined && val !== "")
    .map(([k, val]) => `${k}: ${typeof val === "object" ? JSON.stringify(val) : String(val)}`);
  return parts.join(", ");
}

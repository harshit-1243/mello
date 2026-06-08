import "server-only";
import { db, FACILITY_ID } from "./db";
import type { CallRow, CallDetail, CallStatus, BookingRow, MemberRow, GroupRow, ToolCallEntry } from "./data";

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
async function memberNameMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!db) return map;
  const { data } = await db.from("members").select("name, phone").eq("facility_id", FACILITY_ID);
  for (const m of data ?? []) map.set(m.phone as string, m.name as string);
  return map;
}

// --- loaders ---------------------------------------------------------------

export async function loadCalls(): Promise<CallRow[] | null> {
  if (!db) return null;
  try {
    const start = `${todayIST()}T00:00:00`;
    const { data, error } = await db
      .from("call_logs")
      .select("id, caller_phone, is_member, started_at, ended_at, outcome")
      .eq("facility_id", FACILITY_ID)
      .gte("started_at", start)
      .order("started_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const names = await memberNameMap();
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

export async function loadCall(id: string): Promise<CallDetail | null> {
  if (!db) return null;
  try {
    const { data: call, error } = await db
      .from("call_logs")
      .select("id, caller_phone, is_member, started_at, ended_at, outcome")
      .eq("facility_id", FACILITY_ID)
      .eq("id", id)
      .maybeSingle();
    if (error || !call) return null;

    const [{ data: tx }, { data: tools }, names] = await Promise.all([
      db.from("transcripts").select("role, content, created_at").eq("call_id", id).order("created_at"),
      db.from("tool_calls").select("tool, args, result, created_at").eq("call_id", id).order("created_at"),
      memberNameMap(),
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
      .eq("facility_id", FACILITY_ID)
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

export async function loadBookings(): Promise<{ upcoming: BookingRow[]; past: BookingRow[] } | null> {
  if (!db) return null;
  try {
    const { data, error } = await db
      .from("bookings")
      .select("id, sport, court_id, booking_date, start_time, end_time, source, booked_by_phone, booked_by_name, basketball_mode")
      .eq("facility_id", FACILITY_ID)
      .order("booking_date")
      .order("start_time");
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const names = await memberNameMap();
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

export async function loadMembers(): Promise<{ members: MemberRow[]; groups: GroupRow[] } | null> {
  if (!db) return null;
  try {
    const [{ data: members, error: me }, { data: groups }, { data: gm }] = await Promise.all([
      db.from("members").select("name, phone, tier, joined_at, active").eq("facility_id", FACILITY_ID).order("joined_at"),
      db.from("groups").select("id, label").eq("facility_id", FACILITY_ID),
      db.from("group_members").select("group_id, member_phone").eq("facility_id", FACILITY_ID),
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

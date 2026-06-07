import type { FastifyBaseLogger } from "fastify";
import { db } from "./client.js";

/**
 * Capture layer for call data — call logs, transcripts, tool calls, bookings,
 * and the audit trail. This is the foundation for the per-facility learning
 * loop (and required by the privacy/audit policy).
 *
 * Every function is best-effort: if Supabase isn't configured or a write fails,
 * it logs and returns gracefully — persistence must NEVER break a live call.
 */

export interface CallMeta {
  callSid?: string;
  callerPhone?: string;
  isMember?: boolean;
}

/** Create a call_logs row; returns its id (or null if not persisted). */
export async function startCall(
  log: FastifyBaseLogger,
  facilityId: string,
  meta: CallMeta,
): Promise<string | null> {
  if (!db) return null;
  try {
    const { data, error } = await db
      .from("call_logs")
      .insert({
        facility_id: facilityId,
        call_sid: meta.callSid,
        caller_phone: meta.callerPhone,
        is_member: meta.isMember,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch (err) {
    log.warn({ err }, "startCall persist failed");
    return null;
  }
}

export async function endCall(
  log: FastifyBaseLogger,
  callId: string | null,
  outcome?: string,
): Promise<void> {
  if (!db || !callId) return;
  try {
    await db.from("call_logs").update({ ended_at: new Date().toISOString(), outcome }).eq("id", callId);
  } catch (err) {
    log.warn({ err }, "endCall persist failed");
  }
}

export async function logTranscript(
  log: FastifyBaseLogger,
  facilityId: string,
  callId: string | null,
  role: "caller" | "mello",
  content: string,
): Promise<void> {
  if (!db || !content.trim()) return;
  try {
    await db.from("transcripts").insert({ facility_id: facilityId, call_id: callId, role, content });
  } catch (err) {
    log.warn({ err }, "logTranscript persist failed");
  }
}

export async function logToolCall(
  log: FastifyBaseLogger,
  facilityId: string,
  callId: string | null,
  tool: string,
  args: unknown,
  result: unknown,
): Promise<void> {
  if (!db) return;
  try {
    await db.from("tool_calls").insert({ facility_id: facilityId, call_id: callId, tool, args, result });
  } catch (err) {
    log.warn({ err }, "logToolCall persist failed");
  }
}

export async function logAudit(
  log: FastifyBaseLogger,
  facilityId: string | null,
  actor: string,
  action: string,
  target?: string,
): Promise<void> {
  if (!db) return;
  try {
    await db.from("audit_log").insert({ facility_id: facilityId, actor, action, target });
  } catch (err) {
    log.warn({ err }, "logAudit persist failed");
  }
}

export interface BookingRow {
  id: string;
  facility_id: string;
  sport: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  source?: string;
  booked_by_phone?: string;
  booked_by_name?: string;
  basketball_mode?: string;
}

export async function saveBooking(log: FastifyBaseLogger, booking: BookingRow): Promise<void> {
  if (!db) return;
  try {
    await db.from("bookings").upsert(booking);
  } catch (err) {
    log.warn({ err }, "saveBooking persist failed");
  }
}

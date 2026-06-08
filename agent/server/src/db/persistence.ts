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

// --- Privacy: retention + right-to-delete ----------------------------------

/**
 * Delete expired transcripts (past their 90-day TTL). Run on a schedule.
 * Returns the number of rows removed.
 */
export async function purgeExpiredTranscripts(log: FastifyBaseLogger): Promise<number> {
  if (!db) return 0;
  try {
    const { data, error } = await db
      .from("transcripts")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id");
    if (error) throw error;
    const n = data?.length ?? 0;
    if (n > 0) {
      log.info({ purged: n }, "Purged expired transcripts");
      void logAudit(log, null, "system", "purge_expired_transcripts", String(n));
    }
    return n;
  } catch (err) {
    log.warn({ err }, "purgeExpiredTranscripts failed");
    return 0;
  }
}

/**
 * Right-to-delete: remove ONE caller's data for a facility — their bookings and
 * call logs (transcripts + tool_calls cascade via the FK). Audited.
 */
export async function deleteCallerData(
  log: FastifyBaseLogger,
  facilityId: string,
  phone: string,
): Promise<boolean> {
  if (!db) return false;
  try {
    await db.from("bookings").delete().eq("facility_id", facilityId).eq("booked_by_phone", phone);
    await db.from("call_logs").delete().eq("facility_id", facilityId).eq("caller_phone", phone);
    void logAudit(log, facilityId, "system", "delete_caller_data", phone);
    return true;
  } catch (err) {
    log.warn({ err }, "deleteCallerData failed");
    return false;
  }
}

/**
 * Facility-level "delete everything" (for the owner dashboard, Step 10).
 * Removes all call logs (cascading transcripts/tool_calls) and bookings.
 */
export async function deleteFacilityData(log: FastifyBaseLogger, facilityId: string): Promise<boolean> {
  if (!db) return false;
  try {
    await db.from("call_logs").delete().eq("facility_id", facilityId);
    await db.from("bookings").delete().eq("facility_id", facilityId);
    void logAudit(log, facilityId, "system", "delete_facility_data", facilityId);
    return true;
  } catch (err) {
    log.warn({ err }, "deleteFacilityData failed");
    return false;
  }
}

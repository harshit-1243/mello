import type { SarvamAI } from "sarvamai";
import type { FastifyBaseLogger } from "fastify";
import { BookingEngine, type CallerContext, normalizePhone } from "../booking/engine.js";
import { saveBooking, deleteCallerData } from "../db/persistence.js";
import { sendBookingConfirmation, sendPaymentLink } from "../notify/confirmation.js";

/**
 * The 6 tools Mello can call, in OpenAI/Sarvam function-calling schema.
 * Descriptions are terse on purpose — the behavioral rules live in the system
 * prompt; these just tell the model the shape of each call.
 */
export const TOOLS: SarvamAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "verify_member",
      description: "Look up whether a phone number belongs to a member. Call once when the call connects.",
      parameters: {
        type: "object",
        properties: { phone: { type: "string", description: "Caller phone with country code, e.g. +918369851507" } },
        required: ["phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_slot",
      description:
        "Check if a sport slot is bookable for THIS caller in one call. Accounts for court availability, member-only windows, the T-30min release, external bookings, AND group conflicts. Returns { available, alternative_times, reason? }. If available is false and reason is set ('closed' = outside 8AM–midnight hours, 'past' = date already gone, 'too_far_ahead' = beyond 14 days), tell the caller that specific fact (hours/date) — these are public. If available is false with NO reason, the slot is simply taken: say 'booked' and offer alternative_times[0], never explaining why. Call this before create_booking.",
      parameters: {
        type: "object",
        properties: {
          sport: { type: "string", enum: ["badminton", "tennis", "pickleball", "basketball"] },
          date: { type: "string", description: "Date as YYYY-MM-DD (resolve 'kal'/'today' yourself)" },
          start_time: { type: "string", description: "Start time as HH:MM 24-hour, e.g. 20:00" },
          duration_minutes: { type: "integer", description: "Defaults to 60 if omitted" },
          basketball_mode: { type: "string", enum: ["full", "half"], description: "Only for basketball" },
        },
        required: ["sport", "date", "start_time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Create the booking. Only call after check_availability + check_group pass AND the caller said yes.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          phone: { type: "string" },
          sport: { type: "string", enum: ["badminton", "tennis", "pickleball", "basketball"] },
          date: { type: "string", description: "YYYY-MM-DD" },
          start_time: { type: "string", description: "HH:MM 24-hour" },
          duration_minutes: { type: "integer", description: "Defaults to 60" },
          basketball_mode: { type: "string", enum: ["full", "half"] },
        },
        required: ["name", "phone", "sport", "date", "start_time"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_payment_link",
      description: "Send a Razorpay payment link via WhatsApp. Non-members only, if they chose to pay now.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string" },
          amount: { type: "integer", description: "Amount in INR" },
          booking_id: { type: "string" },
        },
        required: ["phone", "amount", "booking_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_my_data",
      description:
        "Delete THIS caller's stored data (their bookings, call logs, transcripts). Call only when the caller explicitly asks to delete their data / be forgotten. Confirm it's done afterward.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate_to_human",
      description:
        "Schedule a manager callback. Use for amenity questions (parking/food/lockers/etc.), complaints, abusive callers, or anything outside this prompt.",
      parameters: {
        type: "object",
        properties: {
          reason: { type: "string" },
          callback_phone: { type: "string" },
        },
        required: ["reason", "callback_phone"],
      },
    },
  },
];

/**
 * Execute a tool call by name. The engine + caller context are authoritative —
 * we override caller-identifying args (phone, is_member) from context so the
 * model can't accidentally (or be coaxed to) act as someone else.
 */
export async function dispatchTool(
  name: string,
  argsJson: string,
  ctx: CallerContext,
  engine: BookingEngine,
  log: FastifyBaseLogger,
): Promise<unknown> {
  let args: Record<string, unknown> = {};
  try {
    args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
  } catch {
    return { error: "invalid_arguments_json" };
  }

  switch (name) {
    case "verify_member":
      return engine.verifyMember(ctx.callerPhone);

    case "check_slot":
      return engine.checkSlot(
        {
          sport: String(args.sport),
          date: String(args.date),
          start_time: String(args.start_time),
          duration_minutes: args.duration_minutes as number | undefined,
          basketball_mode: args.basketball_mode as "full" | "half" | undefined,
        },
        ctx,
      );

    case "create_booking": {
      const sport = String(args.sport);
      const date = String(args.date);
      const startTime = String(args.start_time);
      const mode = args.basketball_mode as "full" | "half" | undefined;
      const name = String(args.name ?? ctx.name ?? "");
      const result = engine.createBooking(
        { name, phone: ctx.callerPhone, sport, date, start_time: startTime, duration_minutes: args.duration_minutes as number | undefined, basketball_mode: mode },
        ctx,
      );
      // Persist to Supabase so the booking survives across calls.
      if (result.status === "confirmed" && result.court_id && result.end_time) {
        const saved = await saveBooking(log, {
          id: result.booking_id,
          facility_id: ctx.facilityId,
          sport,
          court_id: result.court_id,
          booking_date: date,
          start_time: startTime,
          end_time: result.end_time,
          source: "mello",
          booked_by_phone: ctx.callerPhone,
          booked_by_name: name,
          basketball_mode: mode,
        });
        // Lost the slot to a concurrent call → roll back the in-memory booking,
        // send NO confirmation, and tell the model it's unavailable so Mello
        // offers a different time. Never double-book.
        if (saved === "conflict") {
          engine.removeBooking(result.booking_id);
          log.warn(
            { tool: "create_booking", sport, date, startTime, court: result.court_id },
            "create_booking lost a concurrent slot race — reporting unavailable",
          );
          return { booking_id: null, status: "unavailable" };
        }
        // Fire the WhatsApp confirmation SERVER-SIDE (fire-and-forget). This is
        // the only place the assigned court surfaces — it stays out of speech.
        void sendBookingConfirmation(log, {
          sport,
          courtLabel: result.assigned_court,
          date,
          startTime,
          endTime: result.end_time,
          amountInr: result.amount ?? 0,
          isMember: ctx.isMember,
          phone: ctx.callerPhone,
          bookingId: result.booking_id,
          today: ctx.today,
        });
      }
      // Hide the assigned court from the model — court numbers must NEVER be
      // spoken on the call (they only go in the WhatsApp confirmation).
      return { booking_id: result.booking_id, status: result.status };
    }

    case "delete_my_data": {
      const ok = await deleteCallerData(log, ctx.facilityId, normalizePhone(ctx.callerPhone));
      return { deleted: ok };
    }

    case "send_payment_link": {
      // Create a Razorpay link and deliver it over WhatsApp. Caller phone comes
      // from authoritative call context, never the model, so it can't be spoofed.
      const sent = await sendPaymentLink(log, {
        phone: ctx.callerPhone,
        amountInr: Number(args.amount ?? 0),
        bookingId: String(args.booking_id ?? ""),
      });
      return { link_sent: sent };
    }

    case "escalate_to_human":
      // Stubbed until the dashboard / notification path exists.
      log.info({ reason: args.reason }, "escalate_to_human (stub)");
      return { scheduled: true };

    default:
      return { error: `unknown_tool:${name}` };
  }
}

import type { SarvamAI } from "sarvamai";
import type { FastifyBaseLogger } from "fastify";
import { BookingEngine, type CallerContext, normalizePhone } from "../booking/engine.js";

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
        properties: { phone: { type: "string", description: "Caller phone in E.164, e.g. +918369851507" } },
        required: ["phone"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_slot",
      description:
        "Check if a sport slot is bookable for THIS caller in one call. Accounts for court availability, member-only windows, the T-30min release, external bookings, AND group conflicts. Returns { available, alternative_times } where alternative_times are other start times (same sport) that are also fully bookable. Call this before create_booking. If available is false, offer alternative_times[0] — never say why it's unavailable.",
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
export function dispatchTool(
  name: string,
  argsJson: string,
  ctx: CallerContext,
  engine: BookingEngine,
  log: FastifyBaseLogger,
): unknown {
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

    case "create_booking":
      return engine.createBooking(
        {
          name: String(args.name ?? ctx.name ?? ""),
          phone: ctx.callerPhone, // authoritative
          sport: String(args.sport),
          date: String(args.date),
          start_time: String(args.start_time),
          duration_minutes: args.duration_minutes as number | undefined,
          basketball_mode: args.basketball_mode as "full" | "half" | undefined,
        },
        ctx,
      );

    case "send_payment_link":
      // Stubbed until Step 9 (Razorpay + WhatsApp).
      log.info({ phone: normalizePhone(ctx.callerPhone), amount: args.amount }, "send_payment_link (stub)");
      return { link_sent: true };

    case "escalate_to_human":
      // Stubbed until the dashboard / notification path exists.
      log.info({ reason: args.reason }, "escalate_to_human (stub)");
      return { scheduled: true };

    default:
      return { error: `unknown_tool:${name}` };
  }
}

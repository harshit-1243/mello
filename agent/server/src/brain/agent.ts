import { SarvamAIClient, type SarvamAI } from "sarvamai";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../env.js";
import { BookingEngine, type CallerContext } from "../booking/engine.js";
import { loadEngineData } from "../booking/load.js";
import { loadFacilityConfig, renderSystemPrompt, type FacilityConfig } from "../facility/facility.js";
import { nowInTz, type NowInTz } from "../util/datetime.js";
import { TOOLS, dispatchTool } from "./tools.js";
import { startCall, endCall, logTranscript, logToolCall, logAudit } from "../db/persistence.js";
import { loadMemory } from "../learning/memory.js";

const MAX_TOOL_HOPS = 6; // safety cap on tool-call loops per user turn

/** Spoken when the model returns nothing — never leave the caller in silence. */
const FALLBACK_REPLY = "Sorry, ek baar aur boliye — kaunsa time aur sport chahiye?";

/** Parse a tool-args JSON string for logging; falls back to the raw string. */
function safeJson(s: string): unknown {
  try {
    return s ? JSON.parse(s) : {};
  } catch {
    return { raw: s };
  }
}

/**
 * One conversation with one caller. Holds the message history, runs the Sarvam
 * chat loop, and executes tool calls against the booking engine.
 *
 * - `greeting()` returns the deterministic opening line (membership-aware).
 * - `handleUserTurn(text)` feeds a transcript in and returns Mello's reply.
 *
 * Step 6 will send the returned text to Sarvam TTS so the caller hears it.
 */
export class CallAgent {
  private readonly client: SarvamAIClient | null;
  private readonly config: FacilityConfig;
  private readonly now: NowInTz;
  private readonly facilityId: string;
  private engine!: BookingEngine; // set in startSession (after DB load)
  private ctx!: CallerContext;
  private greetingLine = "";
  private callId: string | null = null;
  private readonly messages: SarvamAI.ChatCompletionRequestMessage[] = [];

  constructor(
    private readonly log: FastifyBaseLogger,
    private readonly callSid: string,
    private readonly callerPhone: string,
  ) {
    this.config = loadFacilityConfig();
    this.now = nowInTz();
    this.facilityId = this.config.facility.id;
    this.client = env.SARVAM_API_KEY
      ? new SarvamAIClient({ apiSubscriptionKey: env.SARVAM_API_KEY })
      : null;
  }

  /**
   * Begin the call: load this facility's data from Supabase (members, groups,
   * bookings) into the engine, identify the caller, open a call_logs row, and
   * return the spoken greeting. Falls back to the config seed if there's no DB.
   */
  async startSession(): Promise<string> {
    const data = await loadEngineData(this.log, this.facilityId, this.now.date);
    this.engine = new BookingEngine(this.config, this.now.date, data ?? undefined);

    const member = this.engine.verifyMember(this.callerPhone);
    this.ctx = {
      callerPhone: this.callerPhone,
      isMember: member.is_member,
      name: member.name,
      today: this.now.date,
      nowMinutes: this.now.minutes,
      facilityId: this.facilityId,
    };

    this.greetingLine = member.is_member
      ? `Hi ${member.name}! Welcome to ${this.config.facility.name} — how can I help?`
      : this.config.facility.default_greeting;

    const systemPrompt = renderSystemPrompt({
      current_date: this.now.date,
      current_time: this.now.time,
      current_weekday: this.now.weekday,
      name: member.name ?? "",
      day: this.now.weekday,
    });

    this.messages.push({ role: "system", content: systemPrompt });

    // Inject per-facility learned context (demand patterns, hot misses, language mix).
    // Generated daily by the learning loop; empty string when no data yet.
    const facilityMemory = await loadMemory(this.log, this.facilityId);
    if (facilityMemory) {
      this.messages.push({ role: "system", content: facilityMemory });
    }

    this.messages.push({
      role: "system",
      content: `Call connected. Caller phone: ${this.callerPhone}. Member: ${member.is_member ? `yes (${member.name})` : "no"}. You have already greeted with: "${this.greetingLine}"`,
    });
    this.messages.push({ role: "assistant", content: this.greetingLine });

    this.callId = await startCall(this.log, this.facilityId, {
      callSid: this.callSid,
      callerPhone: this.callerPhone,
      isMember: member.is_member,
    });
    void logAudit(this.log, this.facilityId, "system", "call_started", this.callSid);
    void logTranscript(this.log, this.facilityId, this.callId, "mello", this.greetingLine);
    return this.greetingLine;
  }

  /** End the call: close the call_logs row. */
  async endSession(outcome?: string): Promise<void> {
    await endCall(this.log, this.callId, outcome);
  }

  /** Feed in a caller transcript; returns Mello's spoken reply (or "" if none). */
  async handleUserTurn(text: string): Promise<string> {
    if (!this.client) {
      this.log.warn({ callSid: this.callSid }, "SARVAM_API_KEY missing — brain offline, cannot reply.");
      return "";
    }

    this.messages.push({ role: "user", content: text });
    void logTranscript(this.log, this.facilityId, this.callId, "caller", text);

    try {
      const reply = await this.runToolLoop();
      void logTranscript(this.log, this.facilityId, this.callId, "mello", reply);
      return reply;
    } catch (err) {
      // Network blip / API error mid-turn must never crash the call or go silent.
      this.log.error({ callSid: this.callSid, err }, "Brain turn failed");
      this.messages.push({ role: "assistant", content: FALLBACK_REPLY });
      return FALLBACK_REPLY;
    }
  }

  private async runToolLoop(): Promise<string> {
    for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
      const res = await this.client!.chat.completions({
        model: env.SARVAM_LLM_MODEL as SarvamAI.SarvamModelIds,
        messages: this.messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
        reasoning_effort: env.SARVAM_REASONING_EFFORT,
      });

      const msg = res.choices[0]?.message;
      if (!msg) return FALLBACK_REPLY;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Record the assistant's tool-call turn, then answer each call.
        this.messages.push({
          role: "assistant",
          content: msg.content ?? "",
          tool_calls: msg.tool_calls,
        });
        for (const tc of msg.tool_calls) {
          const result = await dispatchTool(tc.function.name, tc.function.arguments, this.ctx, this.engine, this.log);
          this.log.info(
            { callSid: this.callSid, tool: tc.function.name, args: tc.function.arguments, result },
            "🔧 tool call",
          );
          void logToolCall(
            this.log,
            this.facilityId,
            this.callId,
            tc.function.name,
            safeJson(tc.function.arguments),
            result,
          );
          this.messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        continue; // loop again so the model can use the tool results
      }

      const reply = (msg.content ?? "").trim() || FALLBACK_REPLY;
      this.messages.push({ role: "assistant", content: reply });
      this.log.info({ callSid: this.callSid }, `🤖 Mello: ${reply}`);
      return reply;
    }

    this.log.warn({ callSid: this.callSid }, "Tool-call loop hit max hops without a final reply.");
    this.messages.push({ role: "assistant", content: FALLBACK_REPLY });
    return FALLBACK_REPLY;
  }
}

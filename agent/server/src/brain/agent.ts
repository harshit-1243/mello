import { SarvamAIClient, type SarvamAI } from "sarvamai";
import type { FastifyBaseLogger } from "fastify";
import { env } from "../env.js";
import { BookingEngine, type CallerContext } from "../booking/engine.js";
import { loadFacilityConfig, renderSystemPrompt } from "../facility/facility.js";
import { nowInTz } from "../util/datetime.js";
import { TOOLS, dispatchTool } from "./tools.js";

const MAX_TOOL_HOPS = 6; // safety cap on tool-call loops per user turn

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
  private readonly engine: BookingEngine;
  private readonly ctx: CallerContext;
  private readonly greetingLine: string;
  private readonly messages: SarvamAI.ChatCompletionRequestMessage[] = [];

  constructor(
    private readonly log: FastifyBaseLogger,
    private readonly callSid: string,
    callerPhone: string,
  ) {
    const config = loadFacilityConfig();
    const now = nowInTz();
    this.engine = new BookingEngine(config, now.date);

    const member = this.engine.verifyMember(callerPhone);
    this.ctx = {
      callerPhone,
      isMember: member.is_member,
      name: member.name,
      today: now.date,
      nowMinutes: now.minutes,
    };

    this.greetingLine = member.is_member
      ? `Hi ${member.name}! Welcome to ${config.facility.name} — how can I help?`
      : config.facility.default_greeting;

    const systemPrompt = renderSystemPrompt({
      current_date: now.date,
      current_time: now.time,
      current_weekday: now.weekday,
      name: member.name ?? "",
      day: now.weekday,
    });

    this.messages.push({ role: "system", content: systemPrompt });
    // Tell the model who's calling and seed the greeting it already "said".
    this.messages.push({
      role: "system",
      content: `Call connected. Caller phone: ${callerPhone}. Member: ${member.is_member ? `yes (${member.name})` : "no"}. You have already greeted with: "${this.greetingLine}"`,
    });
    this.messages.push({ role: "assistant", content: this.greetingLine });

    this.client = env.SARVAM_API_KEY
      ? new SarvamAIClient({ apiSubscriptionKey: env.SARVAM_API_KEY })
      : null;
  }

  /** The opening line the caller hears (no LLM round-trip needed). */
  greeting(): string {
    return this.greetingLine;
  }

  /** Feed in a caller transcript; returns Mello's spoken reply (or "" if none). */
  async handleUserTurn(text: string): Promise<string> {
    if (!this.client) {
      this.log.warn({ callSid: this.callSid }, "SARVAM_API_KEY missing — brain offline, cannot reply.");
      return "";
    }

    this.messages.push({ role: "user", content: text });

    for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
      const res = await this.client.chat.completions({
        model: env.SARVAM_LLM_MODEL as SarvamAI.SarvamModelIds,
        messages: this.messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.3,
        reasoning_effort: env.SARVAM_REASONING_EFFORT,
      });

      const msg = res.choices[0]?.message;
      if (!msg) return "";

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        // Record the assistant's tool-call turn, then answer each call.
        this.messages.push({
          role: "assistant",
          content: msg.content ?? "",
          tool_calls: msg.tool_calls,
        });
        for (const tc of msg.tool_calls) {
          const result = dispatchTool(tc.function.name, tc.function.arguments, this.ctx, this.engine, this.log);
          this.log.info(
            { callSid: this.callSid, tool: tc.function.name, args: tc.function.arguments, result },
            "🔧 tool call",
          );
          this.messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        continue; // loop again so the model can use the tool results
      }

      const reply = (msg.content ?? "").trim();
      this.messages.push({ role: "assistant", content: reply });
      this.log.info({ callSid: this.callSid }, `🤖 Mello: ${reply}`);
      return reply;
    }

    this.log.warn({ callSid: this.callSid }, "Tool-call loop hit max hops without a final reply.");
    return "";
  }
}

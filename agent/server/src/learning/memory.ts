import type { FastifyBaseLogger } from "fastify";
import { db } from "../db/client.js";
import { getCallStats, getPeakDemand, getHotMisses, getLanguageMix } from "./analyzer.js";

function fmtHour(h: number): string {
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12} ${suffix}`;
}

function buildContextString(data: {
  stats: Awaited<ReturnType<typeof getCallStats>>;
  peak: Awaited<ReturnType<typeof getPeakDemand>>;
  misses: Awaited<ReturnType<typeof getHotMisses>>;
  language: Awaited<ReturnType<typeof getLanguageMix>>;
}): string {
  const { stats, peak, misses, language } = data;
  const lines: string[] = ["[Facility context — auto-updated daily from real call data]"];

  if (stats.totalCalls > 0) {
    lines.push(
      `- ${stats.totalCalls} calls in the last 30 days. ${stats.conversionPct}% converted to a booking. ${stats.memberCalls} were members.`,
    );
  }

  if (peak.length > 0) {
    const top = peak[0];
    lines.push(
      `- Most booked: ${top.sport} at ${fmtHour(top.hour)} (${top.count} bookings). Proactively offer this slot when a caller seems uncertain about timing.`,
    );
  }

  if (misses.length > 0) {
    const missStr = misses
      .map((m) => `${m.sport} at ${m.startTime} (${m.missCount}x)`)
      .join("; ");
    lines.push(
      `- Frequently unavailable slots callers keep requesting: ${missStr}. When these are full, immediately suggest the next available window for the SAME sport — do not wait for the caller to ask.`,
    );
  }

  if (language.hindiPct >= 50) {
    lines.push(
      `- ${language.hindiPct}% of recent callers spoke Hindi. If the caller hasn't set a language yet, lean towards Hindi.`,
    );
  } else if (language.hindiPct > 0) {
    lines.push(`- ${language.hindiPct}% of recent callers used Hindi.`);
  }

  return lines.join("\n");
}

/** Analyze recent call data and persist a fresh memory record. Returns the context string. */
export async function generateAndSaveMemory(log: FastifyBaseLogger, facilityId: string): Promise<string> {
  if (!db) return "";
  try {
    const [stats, peak, misses, language] = await Promise.all([
      getCallStats(log, facilityId),
      getPeakDemand(log, facilityId),
      getHotMisses(log, facilityId),
      getLanguageMix(log, facilityId),
    ]);

    const contextInjection = buildContextString({ stats, peak, misses, language });

    await db.from("facility_memory").upsert({
      facility_id: facilityId,
      generated_at: new Date().toISOString(),
      call_count: stats.totalCalls,
      booking_count: stats.bookedCalls,
      conversion_rate: stats.conversionPct,
      peak_sport: peak[0]?.sport ?? null,
      peak_hour_range: peak[0] ? fmtHour(peak[0].hour) : null,
      hot_miss_slots: misses,
      hindi_pct: language.hindiPct,
      context_injection: contextInjection,
    });

    log.info({ facilityId }, "Learning loop: memory updated");
    return contextInjection;
  } catch (err) {
    log.warn({ err }, "generateAndSaveMemory failed");
    return "";
  }
}

/** Load the current saved memory context for a facility. Returns "" if none exists. */
export async function loadMemory(log: FastifyBaseLogger, facilityId: string): Promise<string> {
  if (!db) return "";
  try {
    const { data, error } = await db
      .from("facility_memory")
      .select("context_injection")
      .eq("facility_id", facilityId)
      .single();
    if (error || !data) return "";
    return (data.context_injection as string) ?? "";
  } catch (err) {
    log.warn({ err }, "loadMemory failed");
    return "";
  }
}

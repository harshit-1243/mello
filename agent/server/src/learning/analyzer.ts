import type { FastifyBaseLogger } from "fastify";
import { db } from "../db/client.js";

const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const NINETY_DAYS_AGO = () => new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

export interface CallStats {
  totalCalls: number;
  bookedCalls: number;
  memberCalls: number;
  conversionPct: number;
}

export interface PeakSlot {
  sport: string;
  hour: number;
  count: number;
}

export interface HotMiss {
  sport: string;
  startTime: string;
  missCount: number;
}

export interface LanguageMix {
  hindiPct: number;
}

/** Call volume, conversion rate, and member mix over the last 30 days. */
export async function getCallStats(log: FastifyBaseLogger, facilityId: string): Promise<CallStats> {
  if (!db) return { totalCalls: 0, bookedCalls: 0, memberCalls: 0, conversionPct: 0 };
  try {
    const { data, error } = await db
      .from("call_logs")
      .select("outcome, is_member")
      .eq("facility_id", facilityId)
      .gte("created_at", THIRTY_DAYS_AGO());
    if (error) throw error;
    const rows = data ?? [];
    const totalCalls = rows.length;
    const bookedCalls = rows.filter((r) => r.outcome === "booked").length;
    const memberCalls = rows.filter((r) => r.is_member).length;
    const conversionPct = totalCalls > 0 ? Math.round((bookedCalls / totalCalls) * 100) : 0;
    return { totalCalls, bookedCalls, memberCalls, conversionPct };
  } catch (err) {
    log.warn({ err }, "analyzer.getCallStats failed");
    return { totalCalls: 0, bookedCalls: 0, memberCalls: 0, conversionPct: 0 };
  }
}

/**
 * Top sport + hour combos by confirmed booking count (last 90 days).
 * Gives Mello awareness of what this facility's members actually book.
 */
export async function getPeakDemand(log: FastifyBaseLogger, facilityId: string): Promise<PeakSlot[]> {
  if (!db) return [];
  try {
    const { data, error } = await db
      .from("bookings")
      .select("sport, start_time")
      .eq("facility_id", facilityId)
      .gte("created_at", NINETY_DAYS_AGO());
    if (error) throw error;
    const rows = data ?? [];

    const tally = new Map<string, number>();
    for (const row of rows) {
      const hour = parseInt((row.start_time as string).split(":")[0], 10);
      const key = `${row.sport}|${hour}`;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }

    return [...tally.entries()]
      .map(([key, count]) => {
        const [sport, hourStr] = key.split("|");
        return { sport, hour: parseInt(hourStr, 10), count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  } catch (err) {
    log.warn({ err }, "analyzer.getPeakDemand failed");
    return [];
  }
}

/**
 * Slots that callers keep requesting but can't get (last 30 days, min 2 misses).
 * Mello uses this to immediately suggest the next window for the same sport.
 */
export async function getHotMisses(log: FastifyBaseLogger, facilityId: string): Promise<HotMiss[]> {
  if (!db) return [];
  try {
    const { data, error } = await db
      .from("tool_calls")
      .select("args, result")
      .eq("facility_id", facilityId)
      .eq("tool", "check_slot")
      .gte("created_at", THIRTY_DAYS_AGO());
    if (error) throw error;
    const rows = data ?? [];

    const tally = new Map<string, number>();
    for (const row of rows) {
      const result = row.result as { available?: boolean };
      if (result?.available !== false) continue;
      const args = row.args as { sport?: string; start_time?: string };
      if (!args?.sport || !args?.start_time) continue;
      const key = `${args.sport}|${args.start_time}`;
      tally.set(key, (tally.get(key) ?? 0) + 1);
    }

    return [...tally.entries()]
      .filter(([, count]) => count >= 2)
      .map(([key, missCount]) => {
        const [sport, startTime] = key.split("|");
        return { sport, startTime, missCount };
      })
      .sort((a, b) => b.missCount - a.missCount)
      .slice(0, 3);
  } catch (err) {
    log.warn({ err }, "analyzer.getHotMisses failed");
    return [];
  }
}

/**
 * Percentage of caller turns that contain Devanagari script (last 30 days).
 * Informs Mello whether to lean Hindi or English by default for this facility.
 */
export async function getLanguageMix(log: FastifyBaseLogger, facilityId: string): Promise<LanguageMix> {
  if (!db) return { hindiPct: 0 };
  try {
    const { data, error } = await db
      .from("transcripts")
      .select("content")
      .eq("facility_id", facilityId)
      .eq("role", "caller")
      .gte("created_at", THIRTY_DAYS_AGO());
    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return { hindiPct: 0 };

    const devanagari = /[ऀ-ॿ]/;
    const hindiTurns = rows.filter((r) => devanagari.test(r.content as string)).length;
    return { hindiPct: Math.round((hindiTurns / rows.length) * 100) };
  } catch (err) {
    log.warn({ err }, "analyzer.getLanguageMix failed");
    return { hindiPct: 0 };
  }
}

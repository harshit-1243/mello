import type { FastifyBaseLogger } from "fastify";
import { generateAndSaveMemory } from "./memory.js";

const DAILY_MS = 24 * 60 * 60 * 1000;

/**
 * Start the per-facility learning loop.
 * Runs once immediately on boot (so every call has fresh context), then daily.
 * Best-effort — never throws, never blocks the server.
 */
export function startLearningScheduler(log: FastifyBaseLogger, facilityId: string): void {
  const run = () => void generateAndSaveMemory(log, facilityId);
  run();
  setInterval(run, DAILY_MS).unref();
  log.info({ facilityId }, "Learning loop scheduler started (runs daily)");
}

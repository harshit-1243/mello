import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client for the dashboard's READ path.
 *
 * Uses the service key (server-side only — never shipped to the browser thanks
 * to `server-only`). The service key bypasses RLS, so every query is hard-scoped
 * by facility id — now derived from the signed-in owner (Step 10.3, see
 * `session.ts`), falling back to DEFAULT_FACILITY_ID for demo/seed mode.
 *
 * If the env vars are absent, `db` is null and the data layer falls back to the
 * built-in seed — the dashboard still renders, same graceful pattern as the
 * voice agent.
 */
const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_KEY?.trim();

export const db: SupabaseClient | null =
  url && serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

export const dbConfigured = Boolean(db);

/**
 * Fallback facility id for demo/seed mode and when auth is off. The signed-in
 * owner's facility (derived in `session.ts`) takes precedence at request time.
 */
export const DEFAULT_FACILITY_ID = process.env.DASHBOARD_FACILITY_ID?.trim() || "raheja-ileseum";

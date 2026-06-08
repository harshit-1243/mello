import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client for the dashboard's READ path.
 *
 * Uses the service key (server-side only — never shipped to the browser thanks
 * to `server-only`). Once dashboard auth lands (Step 10.3) we'll switch to the
 * per-user anon key + RLS scoped by facility. Until then the dashboard is not
 * yet protected, so we read with the service key and hard-scope every query to
 * FACILITY_ID below.
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

/** The facility this dashboard shows. Hardcoded until auth derives it (10.3). */
export const FACILITY_ID = process.env.DASHBOARD_FACILITY_ID?.trim() || "raheja-ileseum";

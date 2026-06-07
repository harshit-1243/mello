import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, dbConfigured } from "../env.js";

/**
 * Shared Supabase client (service role — server-side, bypasses RLS).
 * Null when Supabase isn't configured, so the rest of the app can no-op
 * persistence and keep running on the in-memory config seed.
 */
export const db: SupabaseClient | null = dbConfigured
  ? createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_KEY!, {
      auth: { persistSession: false },
    })
  : null;

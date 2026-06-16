/**
 * Supabase public config shared by the browser, server, and proxy clients.
 *
 * `authConfigured` is the master switch for dashboard auth. Until BOTH the
 * public URL and anon key are set, auth stays OFF and the dashboard behaves
 * exactly as before (open, seed/demo data) — same graceful pattern as the rest
 * of the app. Paste NEXT_PUBLIC_SUPABASE_ANON_KEY into .env.local to turn it on.
 *
 * The anon key is a PUBLIC key (safe in the browser); RLS is what protects data.
 * The service key (db.ts) stays server-only and is never referenced here.
 */
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

/** True once magic-link auth can run. Gates the proxy + DAL. */
export const authConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

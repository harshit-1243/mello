import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/**
 * Request-scoped Supabase client bound to the user's session cookies.
 *
 * Use this in Server Components, Server Actions, and Route Handlers to read the
 * signed-in user (`supabase.auth.getUser()`) and to drive the magic-link flow.
 * Unlike the service client in `lib/dashboard/db.ts`, this runs as the *user*
 * (anon key + their JWT), so RLS applies.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In Server Components cookies are read-only; the proxy refreshes them
        // on every request, so swallowing the write here is safe.
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* called from a Server Component — ignore */
        }
      },
    },
  });
}

import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/supabase/config";
import { db, DEFAULT_FACILITY_ID } from "./db";

/**
 * Dashboard Data Access Layer — the authoritative auth check (close to the data,
 * per the Next.js auth guide). The proxy is only the optimistic gate.
 *
 * A signed-in owner is mapped to their facility by the `facility_users` table
 * (keyed by email). Everything is `cache()`d so repeated calls within one render
 * pass hit Supabase once.
 *
 * When auth is not configured yet, these degrade to the env-default facility so
 * the dashboard keeps working in demo/seed mode (graceful, same as everywhere).
 */

/** The current Supabase user, or null. */
export const getSessionUser = cache(async () => {
  if (!authConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Look up the facility linked to an email via the service client. */
async function facilityForEmail(email: string): Promise<string | null> {
  if (!db) return null;
  const { data } = await db
    .from("facility_users")
    .select("facility_id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return (data?.facility_id as string) ?? null;
}

/**
 * The facility id to scope data reads to. Soft: never redirects — used by the
 * data layer. Falls back to the env default when auth is off or the user isn't
 * mapped (the proxy + requireDashboardAccess handle the hard gate).
 */
export const currentFacilityId = cache(async (): Promise<string> => {
  if (!authConfigured) return DEFAULT_FACILITY_ID;
  const user = await getSessionUser();
  if (!user?.email) return DEFAULT_FACILITY_ID;
  return (await facilityForEmail(user.email)) ?? DEFAULT_FACILITY_ID;
});

export interface DashboardAccess {
  email: string | null;
  facilityId: string;
}

/**
 * Hard gate for the dashboard shell. Redirects to /login if signed out, or to
 * /login?error=no-access if signed in but not linked to any facility. Returns
 * the resolved facility + email for the authenticated owner.
 */
export async function requireDashboardAccess(): Promise<DashboardAccess> {
  if (!authConfigured) return { email: null, facilityId: DEFAULT_FACILITY_ID };

  const user = await getSessionUser();
  if (!user) redirect("/login");

  if (!user.email) redirect("/login?error=no-access");
  const facilityId = await facilityForEmail(user.email);
  if (!facilityId) redirect("/login?error=no-access");

  return { email: user.email, facilityId };
}

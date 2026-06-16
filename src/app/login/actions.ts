"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/supabase/config";
import { db } from "@/lib/dashboard/db";

export interface LoginState {
  error?: string;
  sent?: boolean;
  email?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Send a passwordless magic link — but only to an allowlisted email.
 *
 * The allowlist is the `facility_users` table: an email must already be linked
 * to a facility before it can receive a link. This keeps the public dashboard
 * URL from minting auth accounts for strangers.
 */
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address.", email };
  if (!authConfigured) return { error: "Sign-in isn't configured yet.", email };

  // Allowlist check (service client, server-only).
  if (db) {
    const { data } = await db.from("facility_users").select("email").eq("email", email).maybeSingle();
    if (!data) return { error: "This email isn't authorized for any facility yet.", email };
  }

  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { error: error.message, email };

  return { sent: true, email };
}

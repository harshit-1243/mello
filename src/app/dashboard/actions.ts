"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authConfigured } from "@/lib/supabase/config";

/** Sign the owner out and return them to the login screen. */
export async function logout() {
  if (authConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { authConfigured } from "@/lib/supabase/config";

/**
 * Next.js 16 Proxy (the renamed `middleware`) — the dashboard's first auth gate.
 *
 * - Auth not configured yet → pass everything through (dashboard stays open,
 *   same graceful behaviour as before). Turns on the moment the anon key is set.
 * - Configured → refresh the session, send signed-out users at /dashboard/* to
 *   /login, and bounce already-signed-in users away from /login.
 *
 * This is the optimistic check; the Data Access Layer (lib/dashboard/session.ts)
 * is the authoritative one, close to the data.
 */
export async function proxy(request: NextRequest) {
  // INTERIM: the demo dashboard isn't gated by login yet, so don't expose it on
  // any public domain. Allow it only on localhost (the operator's own machine);
  // redirect everywhere else (melloai.in, *.vercel.app) to home. Remove this
  // block once proper per-client auth is set up.
  const host = request.nextUrl.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  if (!isLocal && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (!authConfigured) return NextResponse.next();

  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (path.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (path === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login"],
};

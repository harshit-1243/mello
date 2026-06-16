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
  matcher: ["/dashboard/:path*", "/login"],
};

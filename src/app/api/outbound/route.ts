/**
 * Server-side proxy for the Outbound section. The client view polls this; we read the configured
 * source (FastAPI now, Supabase later) so the backend URL/key stay server-side.
 *
 *   GET /api/outbound?resource=campaigns
 *   GET /api/outbound?resource=metrics&id=2
 *   GET /api/outbound?resource=contacts&id=2
 */
import { NextResponse } from "next/server";
import { getCampaigns, getCampaignMetrics, getCampaignContacts } from "@/lib/dashboard/outbound";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "campaigns";
  const id = Number(searchParams.get("id"));

  try {
    if (resource === "campaigns") return NextResponse.json(await getCampaigns());
    if (resource === "metrics") {
      if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
      return NextResponse.json(await getCampaignMetrics(id));
    }
    if (resource === "contacts") {
      if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
      return NextResponse.json(await getCampaignContacts(id));
    }
    return NextResponse.json({ error: "unknown resource" }, { status: 400 });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "outbound source unavailable";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}

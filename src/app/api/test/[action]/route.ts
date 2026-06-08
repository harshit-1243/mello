/**
 * Proxy for the dashboard's "Test Mello" page.
 *
 * Forwards POST /api/test/start and /api/test/message to the running voice
 * agent server (Fastify, default :8080), which runs the REAL brain + tools +
 * booking engine and persists to Supabase. Proxying here keeps the browser
 * same-origin (no CORS) and lets us point at any agent URL via env.
 */
const AGENT_URL = (process.env.AGENT_SERVER_URL || "http://localhost:8080").replace(/\/$/, "");

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  if (action !== "start" && action !== "message") {
    return Response.json({ error: "unknown_action" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const res = await fetch(`${AGENT_URL}/test/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json(
      { error: "agent_unreachable", detail: `Could not reach the voice agent at ${AGENT_URL}. Start it with: cd agent/server && npm run dev` },
      { status: 502 },
    );
  }
}

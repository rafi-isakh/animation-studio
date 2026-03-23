import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const BACKEND_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

function backendHeaders(userId: string) {
  return {
    "Content-Type": "application/json",
    "X-Internal-Secret": INTERNAL_SECRET,
    "X-User-Id": userId,
  };
}

/**
 * GET /api/monitoring?range=60m|6h|24h|7d
 * Admin-only proxy to the mithril-backend Firestore metrics endpoint.
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const range = searchParams.get("range") ?? "60m";

  const targetUrl = `${BACKEND_URL}/api/v1/monitoring/firestore-metrics?range=${range}`;
  console.log(`[monitoring proxy] → ${targetUrl} (userId=${session.userId})`);
  console.log(`[monitoring proxy] BACKEND_URL=${BACKEND_URL}, INTERNAL_SECRET set=${!!INTERNAL_SECRET}`);

  try {
    const res = await fetch(targetUrl, { headers: backendHeaders(session.userId) });

    console.log(`[monitoring proxy] ← ${res.status} ${res.statusText}`);

    const text = await res.text();
    console.log(`[monitoring proxy] response body (first 500 chars):`, text.slice(0, 500));

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`[monitoring proxy] non-JSON response (${res.status}):`, text.slice(0, 200));
      return NextResponse.json(
        { error: `Backend error (${res.status}): ${text.slice(0, 200)}` },
        { status: res.ok ? 502 : res.status },
      );
    }

    if (!res.ok) {
      const detail = (data as Record<string, unknown>)?.detail ?? "Backend error";
      console.error(`[monitoring proxy] backend returned error:`, data);
      return NextResponse.json({ error: detail }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[monitoring proxy] fetch error:", err);
    console.error("[monitoring proxy] is backend running at", BACKEND_URL, "?");
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 502 });
  }
}

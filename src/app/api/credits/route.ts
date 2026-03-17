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
 * GET /api/credits?type=summary|stages|providers
 * Proxies to the mithril-backend credits endpoints for the current user.
 * Optional query params: start_date, end_date
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") ?? "summary";
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  const dateQs = new URLSearchParams();
  if (start_date) dateQs.set("start_date", start_date);
  if (end_date) dateQs.set("end_date", end_date);
  const dateSuffix = dateQs.toString() ? `?${dateQs}` : "";

  const pathMap: Record<string, string> = {
    summary: `/credits/me${dateSuffix}`,
    stages: `/credits/me/stages${dateSuffix}`,
    providers: `/credits/me/providers${dateSuffix}`,
  };

  const backendPath = pathMap[type];
  if (!backendPath) {
    return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1${backendPath}`, {
      headers: backendHeaders(session.userId),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error(`[credits proxy] non-JSON response (${res.status}):`, text.slice(0, 200));
      return NextResponse.json(
        { error: `Backend error (${res.status}): ${text.slice(0, 200)}` },
        { status: res.ok ? 502 : res.status },
      );
    }

    if (!res.ok) {
      const detail = (data as Record<string, unknown>)?.detail ?? "Backend error";
      return NextResponse.json({ error: detail }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[credits proxy] fetch error:", err);
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 502 });
  }
}

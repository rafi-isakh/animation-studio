import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";
import { assertSafePathSegment, buildInternalServiceUrl } from "@/utils/urlSafety";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const safeJobId = assertSafePathSegment(jobId);
    const cancelUrl = buildInternalServiceUrl(
      ORCHESTRATOR_URL,
      `/api/v1/krea-style-converter-jobs/${encodeURIComponent(safeJobId)}/cancel`
    );

    const response = await fetch(
      cancelUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
          "X-User-Id": session.userId,
          "X-User-Email": session.email || "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to cancel job" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      jobId: data.job_id,
      status: data.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

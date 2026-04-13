import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";
import { assertSafePathSegment, buildInternalServiceUrl } from "@/utils/urlSafety";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    // Validate session
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId parameter is required" },
        { status: 400 }
      );
    }

    // Forward to orchestrator backend
    const safeJobId = assertSafePathSegment(jobId);
    const statusUrl = buildInternalServiceUrl(
      ORCHESTRATOR_URL,
      `/api/v1/story-splitter-jobs/${encodeURIComponent(safeJobId)}/status`
    );

    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: `Backend returned invalid JSON: ${responseText.substring(0, 200)}` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to get job status" },
        { status: response.status }
      );
    }

    // Transform response to camelCase
    return NextResponse.json({
      jobId: data.job_id,
      status: data.status,
      progress: data.progress,
      // Results
      parts: data.parts,
      partsCount: data.parts_count,
      // Error info
      error: data.error,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    });
  } catch (error) {
    console.error("Error getting story splitter job status:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

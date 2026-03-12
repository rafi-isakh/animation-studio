import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const response = await fetch(
      `${ORCHESTRATOR_URL}/api/v1/style-converter-jobs/${jobId}/status`,
      {
        method: "GET",
        headers: {
          "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
          "X-User-Id": session.userId,
          "X-User-Email": session.email || "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to get job status" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      jobId: data.job_id,
      panelId: data.panel_id,
      sessionId: data.session_id,
      status: data.status,
      progress: data.progress,
      imageUrl: data.image_url,
      s3FileName: data.s3_file_name,
      error: data.error
        ? {
            code: data.error.code,
            message: data.error.message,
            retryable: data.error.retryable,
          }
        : null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

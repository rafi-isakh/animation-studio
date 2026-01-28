import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

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
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // Forward to orchestrator backend
    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/jobs/${jobId}/status`, {
      method: "GET",
      headers: {
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
    });

    const data = await response.json();

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
      providerJobId: data.provider_job_id,
      videoUrl: data.video_url,
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
    console.error("Error getting job status:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
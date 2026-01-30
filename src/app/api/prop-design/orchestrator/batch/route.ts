import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface PropDesignBatchSubmitRequest {
  projectId: string;
  jobs: Array<{
    propId: string;
    propName: string;
    category: "character" | "object";
    prompt: string;
    referenceUrls?: string[];
    aspectRatio?: "16:9" | "9:16" | "1:1";
  }>;
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: PropDesignBatchSubmitRequest = await request.json();

    // Forward to orchestrator backend
    console.log("[PropDesignOrchestrator] Batch submitting to:", `${ORCHESTRATOR_URL}/api/v1/prop-design-jobs/submit-batch`);

    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/prop-design-jobs/submit-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
      body: JSON.stringify({
        project_id: body.projectId,
        jobs: body.jobs.map((job) => ({
          project_id: body.projectId,
          prop_id: job.propId,
          prop_name: job.propName,
          category: job.category,
          prompt: job.prompt,
          reference_urls: job.referenceUrls || [],
          aspect_ratio: job.aspectRatio || "1:1",
        })),
        api_key: body.apiKey,
      }),
    });

    const responseText = await response.text();
    console.log("[PropDesignOrchestrator] Batch response status:", response.status, "body:", responseText.substring(0, 500));

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
        { error: data.detail || "Failed to submit prop design batch" },
        { status: response.status }
      );
    }

    // Transform response to camelCase
    return NextResponse.json({
      batchId: data.batch_id,
      jobs: data.jobs.map((job: any) => ({
        jobId: job.job_id,
        status: job.status,
        createdAt: job.created_at,
      })),
      totalCount: data.total_count,
    });
  } catch (error) {
    console.error("Error submitting prop design batch:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

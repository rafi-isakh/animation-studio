import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30; // Job submission should be quick

interface OrchestratorBgSubmitRequest {
  projectId: string;
  bgId: string;
  bgAngle: string;
  bgName: string;
  prompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  apiKey?: string;
}

interface OrchestratorBgBatchSubmitRequest {
  projectId: string;
  jobs: OrchestratorBgSubmitRequest[];
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

    const body = await request.json();

    // Check if it's a batch request
    if (body.jobs && Array.isArray(body.jobs)) {
      return handleBatchSubmit(body as OrchestratorBgBatchSubmitRequest, session);
    }

    // Single job submission
    return handleSingleSubmit(body as OrchestratorBgSubmitRequest, session);
  } catch (error) {
    console.error("Error submitting to bg orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

async function handleSingleSubmit(
  body: OrchestratorBgSubmitRequest,
  session: { userId: string; email?: string }
) {
  console.log("[BgOrchestrator] Submitting to:", `${ORCHESTRATOR_URL}/api/v1/bg-jobs/submit`);

  const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/bg-jobs/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
      "X-User-Id": session.userId,
      "X-User-Email": session.email || "",
    },
    body: JSON.stringify({
      project_id: body.projectId,
      bg_id: body.bgId,
      bg_angle: body.bgAngle,
      bg_name: body.bgName,
      prompt: body.prompt,
      aspect_ratio: body.aspectRatio,
      api_key: body.apiKey,
    }),
  });

  const responseText = await response.text();
  console.log("[BgOrchestrator] Response status:", response.status, "body:", responseText.substring(0, 500));

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
      { error: data.detail || "Failed to submit bg job" },
      { status: response.status }
    );
  }

  // Transform response to camelCase
  return NextResponse.json({
    jobId: data.job_id,
    status: data.status,
    createdAt: data.created_at,
  });
}

async function handleBatchSubmit(
  body: OrchestratorBgBatchSubmitRequest,
  session: { userId: string; email?: string }
) {
  console.log("[BgOrchestrator] Submitting batch to:", `${ORCHESTRATOR_URL}/api/v1/bg-jobs/submit-batch`);
  console.log("[BgOrchestrator] Batch size:", body.jobs.length);

  const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/bg-jobs/submit-batch`, {
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
        bg_id: job.bgId,
        bg_angle: job.bgAngle,
        bg_name: job.bgName,
        prompt: job.prompt,
        aspect_ratio: job.aspectRatio,
        api_key: job.apiKey,
      })),
      api_key: body.apiKey,
    }),
  });

  const responseText = await response.text();
  console.log("[BgOrchestrator] Batch response status:", response.status);

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
      { error: data.detail || "Failed to submit bg batch" },
      { status: response.status }
    );
  }

  // Transform response to camelCase
  return NextResponse.json({
    batchId: data.batch_id,
    jobs: data.jobs.map((job: { job_id: string; status: string; created_at: string }) => ({
      jobId: job.job_id,
      status: job.status,
      createdAt: job.created_at,
    })),
    totalCount: data.total_count,
    status: data.status,
  });
}

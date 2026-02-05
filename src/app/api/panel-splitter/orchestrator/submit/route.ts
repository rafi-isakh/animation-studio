import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 60; // Allow time for batch submission

interface PanelSplitterSubmitRequest {
  projectId: string;
  pageId: string;
  pageIndex: number;
  fileName: string;
  imageBase64: string;
  readingDirection: "rtl" | "ltr";
  apiKey?: string;
}

interface PanelSplitterBatchSubmitRequest {
  projectId: string;
  pages: Array<{
    pageId: string;
    pageIndex: number;
    fileName: string;
    imageBase64: string;
  }>;
  readingDirection: "rtl" | "ltr";
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

    // Check if batch request (has 'pages' array)
    if (body.pages && Array.isArray(body.pages)) {
      return handleBatchSubmit(body as PanelSplitterBatchSubmitRequest, session);
    }

    return handleSingleSubmit(body as PanelSplitterSubmitRequest, session);
  } catch (error) {
    console.error("Error submitting to panel-splitter orchestrator:", error);

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
  body: PanelSplitterSubmitRequest,
  session: { userId: string; email?: string }
) {
  console.log("[PanelSplitterOrchestrator] Submitting single job to:", `${ORCHESTRATOR_URL}/api/v1/panel-splitter-jobs/submit`);

  const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/panel-splitter-jobs/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
      "X-User-Id": session.userId,
      "X-User-Email": session.email || "",
    },
    body: JSON.stringify({
      project_id: body.projectId,
      page_id: body.pageId,
      page_index: body.pageIndex,
      file_name: body.fileName,
      image_base64: body.imageBase64,
      reading_direction: body.readingDirection,
      api_key: body.apiKey,
    }),
  });

  const responseText = await response.text();
  console.log("[PanelSplitterOrchestrator] Response status:", response.status, "body:", responseText.substring(0, 500));

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
      { error: data.detail || "Failed to submit panel splitter job" },
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
  body: PanelSplitterBatchSubmitRequest,
  session: { userId: string; email?: string }
) {
  console.log("[PanelSplitterOrchestrator] Submitting batch of", body.pages.length, "jobs to:", `${ORCHESTRATOR_URL}/api/v1/panel-splitter-jobs/submit-batch`);

  const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/panel-splitter-jobs/submit-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
      "X-User-Id": session.userId,
      "X-User-Email": session.email || "",
    },
    body: JSON.stringify({
      project_id: body.projectId,
      pages: body.pages.map((page) => ({
        page_id: page.pageId,
        page_index: page.pageIndex,
        file_name: page.fileName,
        image_base64: page.imageBase64,
      })),
      reading_direction: body.readingDirection,
      api_key: body.apiKey,
    }),
  });

  const responseText = await response.text();
  console.log("[PanelSplitterOrchestrator] Batch response status:", response.status, "body:", responseText.substring(0, 500));

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
      { error: data.detail || "Failed to submit panel splitter batch" },
      { status: response.status }
    );
  }

  // Transform response to camelCase
  return NextResponse.json({
    batchId: data.batch_id,
    jobs: data.jobs?.map((job: { job_id: string; status: string; created_at: string }) => ({
      jobId: job.job_id,
      status: job.status,
      createdAt: job.created_at,
    })) || [],
    totalCount: data.total_count,
  });
}

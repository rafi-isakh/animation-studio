import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 60; // Batch submission may take longer

interface JobRequest {
  projectId: string;
  sceneIndex: number;
  clipIndex: number;
  providerId: "sora" | "veo3" | "grok_i2v" | "wan_i2v" | "wan22_i2v";
  prompt: string;
  imageUrl?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
  apiKey?: string;
}

interface BatchSubmitRequest {
  projectId: string;
  jobs: JobRequest[];
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

    const body: BatchSubmitRequest = await request.json();

    // Transform jobs to snake_case
    const transformedJobs = body.jobs.map((job) => ({
      project_id: job.projectId,
      scene_index: job.sceneIndex,
      clip_index: job.clipIndex,
      provider_id: job.providerId,
      prompt: job.prompt,
      image_url: job.imageUrl,
      duration: job.duration,
      aspect_ratio: job.aspectRatio,
      api_key: job.apiKey,
    }));

    // Forward to orchestrator backend
    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/jobs/submit-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
      body: JSON.stringify({
        project_id: body.projectId,
        jobs: transformedJobs,
        api_key: body.apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to submit batch" },
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
  } catch (error) {
    console.error("Error submitting batch to orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
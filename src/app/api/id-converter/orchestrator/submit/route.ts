import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface GlossarySubmitRequest {
  jobType: "glossary";
  projectId: string;
  originalText: string;
  fileUri?: string;
  apiKey?: string;
}

interface BatchSubmitRequest {
  jobType: "batch";
  projectId: string;
  glossary: Array<{
    name: string;
    type: string;
    variants: Array<{ id: string; description: string; tags?: string[] }>;
  }>;
  chunks: Array<{ originalIndex: number; originalText: string }>;
  apiKey?: string;
}

type SubmitRequest = GlossarySubmitRequest | BatchSubmitRequest;

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

    const body: SubmitRequest = await request.json();

    let endpoint: string;
    let payload: Record<string, unknown>;

    if (body.jobType === "glossary") {
      // Glossary analysis job
      endpoint = `${ORCHESTRATOR_URL}/api/v1/id-converter-jobs/submit-glossary`;
      payload = {
        project_id: body.projectId,
        original_text: body.originalText,
        file_uri: body.fileUri,
        api_key: body.apiKey,
      };
      console.log("[IdConverterOrchestrator] Submitting glossary job to:", endpoint);
    } else if (body.jobType === "batch") {
      // Batch conversion job
      endpoint = `${ORCHESTRATOR_URL}/api/v1/id-converter-jobs/submit-batch`;
      payload = {
        project_id: body.projectId,
        glossary: body.glossary,
        chunks: body.chunks,
        api_key: body.apiKey,
      };
      console.log("[IdConverterOrchestrator] Submitting batch job to:", endpoint);
      console.log("[IdConverterOrchestrator] Chunks count:", body.chunks.length);
    } else {
      return NextResponse.json(
        { error: "Invalid jobType. Must be 'glossary' or 'batch'" },
        { status: 400 }
      );
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("[IdConverterOrchestrator] Response status:", response.status, "body:", responseText.substring(0, 500));

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
        { error: data.detail || "Failed to submit ID converter job" },
        { status: response.status }
      );
    }

    // Transform response to camelCase
    return NextResponse.json({
      jobId: data.job_id,
      status: data.status,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("Error submitting to ID converter orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

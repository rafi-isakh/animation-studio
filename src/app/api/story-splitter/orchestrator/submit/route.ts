import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface StorySplitterSubmitRequest {
  projectId: string;
  text: string;
  guidelines?: string;
  numParts?: number;
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

    const body: StorySplitterSubmitRequest = await request.json();

    const endpoint = `${ORCHESTRATOR_URL}/api/v1/story-splitter-jobs/submit`;
    const payload = {
      project_id: body.projectId,
      text: body.text,
      guidelines: body.guidelines || "",
      num_parts: body.numParts || 8,
      api_key: body.apiKey,
    };

    console.log("[StorySplitterOrchestrator] Submitting job to:", endpoint);
    console.log("[StorySplitterOrchestrator] Text length:", body.text.length);
    console.log("[StorySplitterOrchestrator] Num parts:", body.numParts || 8);

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
    console.log("[StorySplitterOrchestrator] Response status:", response.status, "body:", responseText.substring(0, 500));

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
        { error: data.detail || "Failed to submit story splitter job" },
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
    console.error("Error submitting to story splitter orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30; // Job submission should be quick

interface PropDesignSubmitRequest {
  projectId: string;
  propId: string;
  propName: string;
  category: "character" | "object";
  prompt: string;
  referenceUrls?: string[];
  aspectRatio?: "16:9" | "9:16" | "1:1";
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

    const body: PropDesignSubmitRequest = await request.json();

    // Forward to orchestrator backend
    console.log("[PropDesignOrchestrator] Submitting to:", `${ORCHESTRATOR_URL}/api/v1/prop-design-jobs/submit`);

    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/prop-design-jobs/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
      body: JSON.stringify({
        project_id: body.projectId,
        prop_id: body.propId,
        prop_name: body.propName,
        category: body.category,
        prompt: body.prompt,
        reference_urls: body.referenceUrls || [],
        aspect_ratio: body.aspectRatio || "1:1",
        api_key: body.apiKey,
      }),
    });

    const responseText = await response.text();
    console.log("[PropDesignOrchestrator] Response status:", response.status, "body:", responseText.substring(0, 500));

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
        { error: data.detail || "Failed to submit prop design job" },
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
    console.error("Error submitting to prop design orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

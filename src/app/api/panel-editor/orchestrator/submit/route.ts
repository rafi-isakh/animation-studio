import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface PanelJobSubmitRequest {
  projectId: string; // Project ID for S3 storage path
  sessionId: string; // Unique session identifier for real-time tracking
  panelId: string;
  fileName: string;
  imageBase64: string; // Base64 encoded source image
  mimeType: string;
  targetAspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  refinementMode: "default" | "zoom" | "expand";
  apiKey?: string;
  provider?: "gemini" | "gemini_flash" | "grok" | "z_image_turbo" | "flux2_dev";
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

    const body: PanelJobSubmitRequest = await request.json();

    // Validate required fields
    if (!body.projectId || !body.sessionId || !body.panelId || !body.imageBase64) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, sessionId, panelId, imageBase64" },
        { status: 400 }
      );
    }

    // Forward to orchestrator backend

    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/panel-jobs/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
      body: JSON.stringify({
        project_id: body.projectId,
        session_id: body.sessionId,
        panel_id: body.panelId,
        file_name: body.fileName,
        image_base64: body.imageBase64,
        mime_type: body.mimeType,
        target_aspect_ratio: body.targetAspectRatio,
        refinement_mode: body.refinementMode,
        api_key: body.apiKey,
        provider: body.provider ?? "gemini",
      }),
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
        { error: data.detail || "Failed to submit panel job" },
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
    console.error("Error submitting to panel orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

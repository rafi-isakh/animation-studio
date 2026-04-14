import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface PanelColorizerJobSubmitRequest {
  projectId: string;
  sessionId: string;
  panelId: string;
  fileName: string;
  imageBase64: string;
  mimeType: string;
  referenceImages: Array<{ base64: string; mimeType: string }>;
  globalPrompt: string;
  targetAspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  apiKey?: string;
  provider?: "gemini" | "gemini_flash" | "grok" | "z_image_turbo" | "flux2_dev";
  timeOfDay?: string;
  mode?: "colorize" | "remix";
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

    const body: PanelColorizerJobSubmitRequest = await request.json();

    // Validate required fields
    if (!body.projectId || !body.sessionId || !body.panelId || !body.imageBase64) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, sessionId, panelId, imageBase64" },
        { status: 400 }
      );
    }

    // Convert reference images to snake_case
    const referenceImages = (body.referenceImages || []).map((ref) => ({
      base64: ref.base64,
      mime_type: ref.mimeType,
    }));

    // Forward to orchestrator backend
    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/panel-colorizer-jobs/submit`, {
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
        reference_images: referenceImages,
        global_prompt: body.globalPrompt || "",
        target_aspect_ratio: body.targetAspectRatio,
        api_key: body.apiKey,
        provider: body.provider ?? "gemini",
        time_of_day: body.timeOfDay ?? null,
        colorizer_mode: body.mode ?? "colorize",
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
        { error: data.detail || "Failed to submit panel colorizer job" },
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
    console.error("Error submitting to panel colorizer orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

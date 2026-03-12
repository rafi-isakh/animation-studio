import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface StyleConverterJobSubmitRequest {
  projectId: string;
  sessionId: string;
  panelId: string;
  fileName: string;
  imageBase64: string;
  mimeType: string;
  prompts: string;
  targetAspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body: StyleConverterJobSubmitRequest = await request.json();

    if (!body.projectId || !body.sessionId || !body.panelId || !body.imageBase64) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, sessionId, panelId, imageBase64" },
        { status: 400 }
      );
    }

    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/style-converter-jobs/submit`, {
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
        prompts: body.prompts,
        target_aspect_ratio: body.targetAspectRatio,
        api_key: body.apiKey ?? null,
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
        { error: data.detail || "Backend error" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      jobId: data.job_id,
      status: data.status,
      createdAt: data.created_at,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

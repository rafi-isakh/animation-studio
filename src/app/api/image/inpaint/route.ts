import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      inpaintSessionId,
      frameId,
      imageUrl,
      maskBase64,
      prompt,
      strength,
      width,
      height,
      aspectRatio,
      apiKey,
    } = body;

    if (!projectId || !inpaintSessionId || !frameId || !imageUrl || !maskBase64 || !prompt) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, inpaintSessionId, frameId, imageUrl, maskBase64, prompt" },
        { status: 400 }
      );
    }

    const panelPayload = {
      projectId,
      sessionId: inpaintSessionId,
      panelId: frameId,
      fileName: `frame_${frameId}.png`,
      imageBase64: "",
      mimeType: "image/png",
      targetAspectRatio: aspectRatio || "16:9",
      refinementMode: "inpaint",
      apiKey: apiKey || undefined,
      inpaintSourceUrl: imageUrl,
      inpaintMaskBase64: maskBase64,
      inpaintPrompt: prompt,
      inpaintStrength: strength ?? 0.7,
      inpaintWidth: width,
      inpaintHeight: height,
    };

    const response = await fetch(`${BASE_URL}/api/panel-editor/orchestrator/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify(panelPayload),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: `Upstream returned invalid JSON: ${responseText.substring(0, 200)}` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to submit inpaint job" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[image/inpaint] Error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

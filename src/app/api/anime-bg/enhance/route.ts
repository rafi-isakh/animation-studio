import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL =
  process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const backendUrl = `${ORCHESTRATOR_URL}/api/v1/anime-bg/enhance`;
    const backendPayload = {
      image_url: body.imageUrl,
      prompt: body.prompt,
      reference_image_url: body.referenceImageUrl || null,
      aspect_ratio: body.aspectRatio || "16:9",
      api_key: body.apiKey || null,
      provider: body.provider || "gemini",
      session_id: body.sessionId || "",
      image_id: body.imageId || "",
    };

    let response: Response;
    try {
      response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
          "X-User-Id": session.userId,
          "X-User-Email": session.email || "",
        },
        body: JSON.stringify(backendPayload),
      });
    } catch (fetchError) {
      console.error("[anime-bg] Failed to connect to backend:", fetchError);
      return NextResponse.json(
        {
          error: `Cannot connect to backend at ${ORCHESTRATOR_URL}: ${fetchError instanceof Error ? fetchError.message : fetchError}`,
        },
        { status: 502 }
      );
    }

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: "Backend returned invalid JSON" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Image generation failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({ imageUrl: data.image_url });
  } catch (error) {
    console.error("[anime-bg] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

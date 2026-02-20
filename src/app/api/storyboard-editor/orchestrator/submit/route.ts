import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface StoryboardEditorSubmitRequest {
  projectId: string;
  sceneIndex: number;
  clipIndex: number;
  frameType: "start" | "end";
  operation: "generate" | "remix";
  prompt: string;
  referenceImageUrl?: string;
  assetImageUrls?: string[];
  originalImageUrl?: string;
  originalContext?: string;
  remixPrompt?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16";
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: StoryboardEditorSubmitRequest = await request.json();


    const response = await fetch(
      `${ORCHESTRATOR_URL}/api/v1/storyboard-editor-jobs/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
          "X-User-Id": session.userId,
          "X-User-Email": session.email || "",
        },
        body: JSON.stringify({
          project_id: body.projectId,
          scene_index: body.sceneIndex,
          clip_index: body.clipIndex,
          frame_type: body.frameType,
          operation: body.operation,
          prompt: body.prompt,
          reference_image_url: body.referenceImageUrl,
          asset_image_urls: body.assetImageUrls || [],
          original_image_url: body.originalImageUrl,
          original_context: body.originalContext || "",
          remix_prompt: body.remixPrompt || "",
          aspect_ratio: body.aspectRatio || "16:9",
          api_key: body.apiKey,
        }),
      }
    );

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: `Backend returned invalid JSON: ${responseText.substring(0, 200)}`,
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to submit storyboard editor job" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      jobId: data.job_id,
      status: data.status,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("Error submitting to storyboard-editor orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface StoryboardSubmitRequest {
  projectId: string;
  sourceText: string;
  partIndex?: number;
  // Conditions
  storyCondition?: string;
  imageCondition?: string;
  videoCondition?: string;
  soundCondition?: string;
  // Guides
  imageGuide?: string;
  videoGuide?: string;
  // New configuration
  targetTime?: string;
  clipCount?: number;
  customInstruction?: string;
  backgroundInstruction?: string;
  negativeInstruction?: string;
  videoInstruction?: string;
  imageInstruction?: string;
  // API key
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

    const body: StoryboardSubmitRequest = await request.json();

    if (!body.sourceText) {
      return NextResponse.json(
        { error: "sourceText is required" },
        { status: 400 }
      );
    }

    const endpoint = `${ORCHESTRATOR_URL}/api/v1/storyboard-jobs/submit`;
    const payload = {
      project_id: body.projectId,
      source_text: body.sourceText,
      part_index: body.partIndex || 0,
      // Conditions
      story_condition: body.storyCondition || "",
      image_condition: body.imageCondition || "",
      video_condition: body.videoCondition || "",
      sound_condition: body.soundCondition || "",
      // Guides
      image_guide: body.imageGuide || "",
      video_guide: body.videoGuide || "",
      // New configuration
      target_time: body.targetTime || "03:00",
      clip_count: body.clipCount ?? null,
      custom_instruction: body.customInstruction || "",
      background_instruction: body.backgroundInstruction || "",
      negative_instruction: body.negativeInstruction || "",
      video_instruction: body.videoInstruction || "",
      image_instruction: body.imageInstruction || "",
      // API key
      api_key: body.apiKey,
    };


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
        { error: data.detail || "Failed to submit storyboard job" },
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
    console.error("Error submitting to storyboard orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

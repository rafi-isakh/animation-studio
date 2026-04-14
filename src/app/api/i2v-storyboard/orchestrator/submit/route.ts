import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

export const maxDuration = 30;

interface I2VStoryboardSubmitRequest {
  projectId: string;
  panelUrls: string[];
  panelLabels: string[];
  sourceText?: string;
  // Conditions
  storyCondition?: string;
  imageCondition?: string;
  videoCondition?: string;
  soundCondition?: string;
  // Guides
  imageGuide?: string;
  videoGuide?: string;
  // Instructions
  customInstruction?: string;
  backgroundInstruction?: string;
  negativeInstruction?: string;
  videoInstruction?: string;
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

    const body: I2VStoryboardSubmitRequest = await request.json();

    if (!Array.isArray(body.panelUrls)) {
      return NextResponse.json(
        { error: "panelUrls must be an array" },
        { status: 400 }
      );
    }

    const endpoint = `${ORCHESTRATOR_URL}/api/v1/i2v-storyboard-jobs/submit`;
    const payload = {
      project_id: body.projectId,
      panel_urls: body.panelUrls,
      panel_labels: body.panelLabels || [],
      source_text: body.sourceText || "",
      // Conditions
      story_condition: body.storyCondition || "",
      image_condition: body.imageCondition || "",
      video_condition: body.videoCondition || "",
      sound_condition: body.soundCondition || "",
      // Guides
      image_guide: body.imageGuide || "",
      video_guide: body.videoGuide || "",
      // Instructions
      custom_instruction: body.customInstruction || "",
      background_instruction: body.backgroundInstruction || "",
      negative_instruction: body.negativeInstruction || "",
      video_instruction: body.videoInstruction || "",
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
        { error: data.detail || "Failed to submit I2V storyboard job" },
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
    console.error("Error submitting to I2V storyboard orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

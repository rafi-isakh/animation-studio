import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface AnalyzeStoryboardRequest {
  image: string; // base64 encoded annotated image with panel boxes
  panels: Array<{ label: string }>;
  apiKey?: string; // Optional custom API key
  isNsfw?: boolean;
}

interface StoryboardResult {
  panels: Array<{
    label: string;
    script: string;
  }>;
}

// Schema for structured output
const storyboardSchema = {
  type: Type.OBJECT,
  properties: {
    panels: {
      type: Type.ARRAY,
      description: "Storyboard scripts for each labeled panel",
      items: {
        type: Type.OBJECT,
        properties: {
          label: {
            type: Type.STRING,
            description: "Panel label matching the green box number on the image",
          },
          script: {
            type: Type.STRING,
            description: "Full script text for this panel including VISUAL, DIALOGUE, NARRATION, SFX",
          },
        },
        required: ["label", "script"],
      },
    },
  },
  required: ["panels"],
};

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeStoryboardRequest = await request.json();
    const { image, panels, apiKey: customApiKey, isNsfw = false } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "image is required and must be a base64 string" },
        { status: 400 }
      );
    }

    if (!panels || !Array.isArray(panels) || panels.length === 0) {
      return NextResponse.json(
        { error: "panels array is required and must not be empty" },
        { status: 400 }
      );
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const nsfwSection = isNsfw ? `
4. **NSFW & Video Prompt**:
   - First, determine if a panel is NSFW. If it is, include the indicator "**NSFW" in the output.
   - For NSFW panels, generate a recommended video prompt and a recommended Video Model based on the following conditions:
     Condition 1: If the panel is more of a still shot, no dynamic movement or action is detected (e.g., even if nude, just lying in bed, surprised face, no action started yet), print video prompt:
     still shot, light breathing, don't add any effects that did not exist, body stays still
     Additionally, print recommended Video Model: Grok
     Condition 2: If the panel contains action, loud sound effects and repetitive strong motion is detected, print video prompt:
     still shot, sex scene, woman is repeatedly sexually penetrated by man, fast moving, breasts fast movement, man is penetrating fast, keep angle same, nude body no clothing, don't move hand
     Additionally, print recommended Video Model: Wan 2.2
     Condition 3: If a panel is an abstract visualization of movement of a substance, interpret the anticipated motion based on the visual and the sfx analyzed, then generate a video prompt describing the motion.
     Additionally, print recommended Video Model: Wan 2.2
   - The phrases "still shot, light breathing, don't add any effects that did not exist, body stays still" (for Condition 1) and "still shot, sex scene", "fast moving", "keep angle same, nude body no clothing, don't move hand" (for Condition 2) are fixed templates. Do NOT include brackets [] in the output. The other parts of the prompt should be adjusted depending on the action detected in the scene.
   - For panels that are not NSFW, skip the video prompt entirely.` : '';

    const nsfwOutputFormat = isNsfw ? `
**NSFW (if applicable)
Video Prompt: [Generated Video Prompt] (if NSFW)
Video Model: [Recommended Video Model] (if NSFW)` : '';

    const prompt = `Analyze this manga/comic page.
There are numbered green boxes drawn on the image representing the panels to focus on.

**TASK**: Write a raw text script for EACH highlighted panel.

**REQUIREMENTS**:
1. **NO Names/IDs**: Describe characters by visual traits (e.g., "Man with scar", "Blonde girl"). Do NOT use "CHARACTER_ID".
2. **Visuals & Camera**:
   - Specify Camera Shot (e.g., Close Up, Wide Shot, Low Angle).
   - Describe the action/scene.
   - **Peak Emotion**: If a character is in a peak volatile emotion, specify **WHICH** emotion explicitly (e.g., "Peak WRATH emotion", "Peak SORROW emotion", "Peak TERROR emotion").
3. **Dialogue & Text**:
   - **Merge Dialogue**: If a speaker says a continuous sentence split across multiple speech bubbles, MERGE them into ONE "DIALOGUE" line.
   - **Narration**: If text is in a rectangular box (caption/narration), label it "NARRATION ([Emotion]): [Text]".
   - **Speech**: "DIALOGUE: [Visual Subject]: [Merged Speech]"${nsfwSection}

**Output Format**:
VISUAL: [Camera Shot] [Description + Peak Emotion if applicable]
DIALOGUE: [Visual Subject]: [Merged Speech]
NARRATION (Calm): [Text]
SFX: [Sound Effects]${nsfwOutputFormat}

Return a JSON object with a "panels" array where each panel has:
- label: the panel number (matching the green box)
- script: the full formatted script text

Analyze all ${panels.length} panels shown in the image.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: image,
              mimeType: "image/jpeg",
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: storyboardSchema,
        temperature: 0.7,
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error("No response text from AI");
    }

    const result: StoryboardResult = JSON.parse(responseText);

    return NextResponse.json({
      success: true,
      panels: result.panels,
    });
  } catch (error: any) {
    console.error("Error analyzing storyboard:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze storyboard",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

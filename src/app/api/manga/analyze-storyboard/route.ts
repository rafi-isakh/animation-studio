import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface AnalyzeStoryboardRequest {
  image: string; // base64 encoded annotated image with panel boxes
  panels: Array<{ label: string }>;
  apiKey?: string; // Optional custom API key
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
    const { image, panels, apiKey: customApiKey } = body;

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
   - **Speech**: "DIALOGUE: [Visual Subject]: [Merged Speech]"

**Output Format**:
VISUAL: [Camera Shot] [Description + Peak Emotion if applicable]
DIALOGUE: [Visual Subject]: [Merged Speech]
NARRATION (Calm): [Text]
SFX: [Sound Effects]

Return a JSON object with a "panels" array where each panel has:
- label: the panel number (matching the green box)
- script: the full formatted script text

Analyze all ${panels.length} panels shown in the image.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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

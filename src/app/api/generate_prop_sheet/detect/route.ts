import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface Clip {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string;
  videoPrompt: string;
  dialogue: string;
  backgroundId: string;
}

interface Scene {
  sceneTitle: string;
  clips: Clip[];
}

interface DetectRequest {
  scenes: Scene[];
  targetIds: string[]; // IDs to analyze (pre-filtered as objects, not characters)
  genre: string;
  customApiKey?: string;
}

const detectionSchema = {
  type: Type.ARRAY,
  description: "Array of detected props/objects with their details",
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The UPPERCASE_ID exactly as provided in the target list",
      },
      description: {
        type: Type.STRING,
        description:
          "English visual description focusing on appearance, material, color, size. Use keywords and short phrases.",
      },
      descriptionKo: {
        type: Type.STRING,
        description:
          "Korean description of the object's purpose, role, and significance in the story.",
      },
      appearingClips: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array of clip IDs where this object appears (e.g., '1-1', '2-3')",
      },
      contextPrompts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            clipId: { type: Type.STRING, description: "Clip ID (e.g., '1-1')" },
            text: {
              type: Type.STRING,
              description:
                "Verbatim text snippet from the clip where the object appears. Copy exactly as written.",
            },
          },
          required: ["clipId", "text"],
        },
        description: "Context snippets showing how the object appears in each clip",
      },
      productSheetPrompt: {
        type: Type.STRING,
        description:
          "Image generation prompt for a product/design sheet. Format: '2d anime white background product sheet of [OBJECT], [VISUAL DESCRIPTION], front view, side view, top view, high quality, shading detail, no text'",
      },
    },
    required: [
      "name",
      "description",
      "descriptionKo",
      "appearingClips",
      "contextPrompts",
      "productSheetPrompt",
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: DetectRequest = await request.json();
    const { scenes, targetIds, genre, customApiKey } = body;

    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json(
        { error: "scenes is required and must be an array" },
        { status: 400 }
      );
    }

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return NextResponse.json(
        { error: "targetIds is required and must be a non-empty array" },
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

    // Prepare clip data for analysis
    const allClips = scenes.flatMap((scene, sIdx) =>
      scene.clips.map((clip, cIdx) => ({
        clipId: `${sIdx + 1}-${cIdx + 1}`,
        story: clip.story,
        imagePrompt: clip.imagePrompt,
        videoPrompt: clip.videoPrompt,
        dialogue: clip.dialogue,
      }))
    );

    const prompt = `
[Object Detection and Design Sheet Master Prompt]
Genre/Era: ${genre || "Modern"}

Analyze the following animation storyboard data and generate detailed information for ALL objects in the 'Target Object IDs' list.

**[MANDATORY INSTRUCTIONS]**
1. **Include ALL IDs from the Target Object IDs list in your output. No exceptions.**
2. **The 'name' field MUST match the provided ID exactly, character-for-character.**
3. **Context Extraction Rule:** For 'contextPrompts', copy the text VERBATIM from the source. Do not paraphrase or summarize. Keep uppercase IDs and punctuation exactly as they appear.
4. **Description Style:** 'description' (English visual description) should use keywords and short phrases focusing on visual appearance.
5. **Design Sheet Format:** The productSheetPrompt should follow this template:
   "2d anime white background. Product sheet of [OBJECT NAME] in ${genre || "Modern"} setting, [VISUAL DESCRIPTION], front view, side view, top view, high quality, shading detail, no text, no vfx or visual effects, no dust particles"

**Target Object IDs:** ${targetIds.join(", ")}

**Storyboard Data:**
${JSON.stringify(allClips, null, 2)}

Generate the JSON array with detailed information for each object.
    `;

    console.log("[detect-props] Analyzing", targetIds.length, "object IDs");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: detectionSchema,
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error("No response text from AI");
    }

    // Clean up markdown code blocks if present
    const jsonText = responseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(jsonText);

    console.log("[detect-props] Detected", result.length, "objects");

    return NextResponse.json({ objects: result });
  } catch (error: unknown) {
    console.error("Error in generate_prop_sheet/detect API:", error);

    const errorMessage = String(error);
    if (
      errorMessage.includes("503") ||
      errorMessage.includes("overloaded") ||
      errorMessage.includes("UNAVAILABLE")
    ) {
      return NextResponse.json(
        {
          error:
            "The AI model is currently overloaded. Please try again in a few moments.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

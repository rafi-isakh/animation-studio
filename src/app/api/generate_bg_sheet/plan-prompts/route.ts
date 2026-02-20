import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface PlanPromptsRequest {
  imageBase64: string;
  backgroundDesc: string;
  customApiKey?: string;
}

// Schema for structured prompt list output
const promptListSchema = {
  type: Type.ARRAY,
  items: { type: Type.STRING },
  description: "Array of 9 prompts for each camera angle",
};

export async function POST(request: NextRequest) {
  try {
    const body: PlanPromptsRequest = await request.json();
    const { imageBase64, backgroundDesc, customApiKey } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required and must be a string" },
        { status: 400 }
      );
    }

    if (!backgroundDesc || typeof backgroundDesc !== "string") {
      return NextResponse.json(
        { error: "backgroundDesc is required and must be a string" },
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

    const masterPrompt = `First, look at the background image uploaded as master reference. Please generate a list of 9 prompts (N-1 to N-9). The prompts that get called in should work like below, don't add anything or reword.

For N-1: Make a slight closeup of the background.
For N-2: Make a worm's eye view low angle version of the background. 2d anime background style.
For N-3 and N-4: Strictly follow the prompt wording template of: detect [LARGE NOTICEABLE OBJECT EYE LEVEL WHERE CHARACTER IS EXPECTED TO BE IN BG] and make a closeup. No characters. 2d anime background style.
For N-7 and N-8: Strictly follow the prompt wording template of: detect [LARGE NOTICEABLE OBJECT EYE LEVEL WHERE CHARACTER IS EXPECTED TO BE IN BG] and make a closeup. Part of the [CEILING/SKY depending on bg] should be visible. No characters. 2d anime background style.
For N-5: detect corner of the background and make a close up. part of the [CEILING/SKY depending on bg] should be visible. 2d anime background style
For N-6: make high angle almost bird's eye view of the background, 2d anime background style
For N-9: detect the [ENTER floor/carpet/ocean, etc depending on the place] and do a macroshot of it 2d anime background style.

[Examples]
N-4: Detect crib in the background and make a close up. eye level. 2d anime background style No characters.
N-8: Detect upper half of [LARGE NOTICEABLE OBJECT EYE LEVEL] in the background and make a close up. part of the [SKY/CEILING] should be visible. 2d anime background style. No characters.

CONDITION: Assigned OBJECT for N-3 and N-4 should be different, and assigned OBJECT for N-7 and N-8 should be different.

Background Description: ${backgroundDesc}

Output ONLY a JSON array of exactly 9 prompt strings, in order from N-1 to N-9. Replace all bracket placeholders with actual objects/materials detected from the image.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        },
        { text: masterPrompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: promptListSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No prompts returned from AI");
    }

    const prompts = JSON.parse(text) as string[];

    // Ensure we have exactly 9 prompts
    if (!Array.isArray(prompts) || prompts.length !== 9) {
      throw new Error("Expected exactly 9 prompts from AI");
    }

    return NextResponse.json({ prompts });
  } catch (error: unknown) {
    console.error("Error in generate_bg_sheet/plan-prompts API:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
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

    const masterPrompt = `
      Look at the background image I uploaded. Please generate a list of 9 prompts (N-1 to N-9) for different camera angles.

      The prompts should follow these templates exactly:

      N-1 (Front View): Make a slight closeup of the background
      N-2 (Worm View): Make a worm's eye view low angle version of the background. 2d anime background style.
      N-3 (Character A View): detect [LARGE NOTICEABLE OBJECT EYE LEVEL WHERE CHARACTER WOULD STAND] and make a closeup. No characters. 2d anime background style.
      N-4 (Character B View): detect [DIFFERENT LARGE OBJECT EYE LEVEL] and make a closeup. No characters. 2d anime background style.
      N-5 (Rear View): detect corner of the background and make a close up. part of the [CEILING/SKY depending on bg] should be visible. 2d anime background style
      N-6 (Bird's Eye View): make high angle almost bird's eye view of the background, 2d anime background style
      N-7 (Over-Shoulder A): detect [LARGE OBJECT EYE LEVEL] and make a closeup. Part of the [CEILING/SKY] should be visible. No characters. 2d anime background style.
      N-8 (Over-Shoulder B): detect [DIFFERENT LARGE OBJECT EYE LEVEL] and make a closeup. Part of the [CEILING/SKY] should be visible. No characters. 2d anime background style.
      N-9 (Floor Close-up): detect the [floor/carpet/ocean/ground type] and do a macroshot of it 2d anime background style.

      IMPORTANT RULES:
      - Objects for N-3 and N-4 MUST be different
      - Objects for N-7 and N-8 MUST be different
      - Replace [CEILING/SKY] with actual ceiling (indoor) or sky (outdoor)
      - Replace [floor/carpet/ocean/ground type] with actual floor/ground material
      - Keep "2d anime background style" in prompts where specified
      - Choose logical objects that would be near where characters stand

      Background Description: ${backgroundDesc}

      Output ONLY a JSON array of exactly 9 prompt strings, in order from N-1 to N-9.
    `;

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
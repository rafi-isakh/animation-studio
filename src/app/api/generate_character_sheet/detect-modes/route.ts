import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface DetectModesRequest {
  text: string;
  characterName: string;
}

interface DetectedMode {
  name: string;
  description: string;
  prompt: string;
}

const modesSchema = {
  type: Type.OBJECT,
  properties: {
    modes: {
      type: Type.ARRAY,
      description: "List of detected modes/variations for the character",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description:
              'Mode name in format "CharacterName-Ch[Number]-[ModeName]" (e.g., "Elara-Ch8-Banquet", "Kael-Ch?-Childhood")',
          },
          description: {
            type: Type.STRING,
            description: "What makes this mode different from the default appearance",
          },
          prompt: {
            type: Type.STRING,
            description:
              "Visual prompt description for generating this mode (outfit, pose, setting details)",
          },
        },
        required: ["name", "description", "prompt"],
      },
    },
  },
};

/**
 * Detect character modes/variations from text
 *
 * Analyzes text to find:
 * - Costume/outfit changes
 * - Age variations (time skips)
 * - Transformation scenes
 * - Different emotional states with visual impact
 */
export async function POST(request: NextRequest) {
  try {
    const body: DetectModesRequest = await request.json();
    const { text, characterName } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    if (!characterName || typeof characterName !== "string") {
      return NextResponse.json(
        { error: "characterName is required and must be a string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Analyze the following text for the character "${characterName}".
      Identify specific "modes", "ages", "outfits", or "occasions" where this character appears differently.

      Look for:
      1. Costume/outfit changes (e.g., formal wear, battle armor, casual clothes)
      2. Age variations (e.g., flashback scenes, time skips, childhood memories)
      3. Transformation scenes (e.g., powered up forms, disguises)
      4. Different settings that affect appearance (e.g., ball gown for a banquet, swimwear at beach)

      Try to identify the chapter number from the text if available (e.g., "Chapter 5", "Episode 3").
      If the chapter number is not found, use "?" in the name.

      For each detected mode, provide:
      - name: Use format "${characterName}-Ch[Number]-[ModeName]" (e.g., "${characterName}-Ch8-Banquet")
      - description: What makes this mode different from the default
      - prompt: A visual prompt for generating this mode (describe the outfit, pose, setting)

      Only include modes that are explicitly described in the text. Do not invent modes.

      TEXT SEGMENT:
      ---
      ${text.substring(0, 30000)}
      ---
      (Text truncated if too long)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: modesSchema,
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error("No response text from AI");
    }

    // Clean up markdown code blocks if present
    const jsonText = responseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(jsonText);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in generate_character_sheet/detect-modes API:", error);

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
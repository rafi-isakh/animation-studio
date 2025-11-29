import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface AnalyzeRequest {
  text: string;
}

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    characters: {
      type: Type.ARRAY,
      description: "List of all characters with dialogue.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description:
              "Character's name. If appearance/clothing changes, use format 'Name_Situation'.",
          },
          appearance: {
            type: Type.STRING,
            description: "Detailed physical appearance.",
          },
          clothing: {
            type: Type.STRING,
            description: "Description of their attire.",
          },
          personality: {
            type: Type.STRING,
            description: "Key personality traits.",
          },
          backgroundStory: {
            type: Type.STRING,
            description: "Relevant background or history.",
          },
        },
        required: ["name", "appearance", "clothing", "personality", "backgroundStory"],
      },
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
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
      You are a story analyst for a creative studio. Your task is to read the following novel text and extract structured information about characters for design purposes.

      Rules:
      1. Identify every character who has at least one line of dialogue.
      2. For each character, extract detailed descriptions covering their appearance (face, hair, body), clothing, personality traits, and any relevant background information.
      3. If a character's appearance or clothing changes significantly in a different scene or time, create a new, separate entry for that version of the character. The name MUST be formatted as "CharacterName_SituationDescription" (e.g., "Elara_CoronationGown", "Kael_BattleArmor").
      4. Output the result in the specified JSON format. Do not include any text outside of the JSON structure.

      Novel Text:
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
        responseSchema: analysisSchema,
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
    console.error("Error in generate_character_sheet/analyze API:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

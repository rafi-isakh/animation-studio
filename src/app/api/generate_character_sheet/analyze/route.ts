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
          // New v1.6 fields for role & identity
          role: {
            type: Type.STRING,
            description:
              "Character's role in the story: 'protagonist', 'antagonist', 'supporting', or 'minor'.",
          },
          isProtagonist: {
            type: Type.BOOLEAN,
            description:
              "True ONLY for the main protagonist/hero of the story. There should typically be only one protagonist.",
          },
          age: {
            type: Type.STRING,
            description:
              "Character's age or age range (e.g., '25', 'early 20s', 'teenager', 'toddler').",
          },
          gender: {
            type: Type.STRING,
            description: "Character's gender (e.g., 'male', 'female', 'non-binary').",
          },
          traits: {
            type: Type.STRING,
            description:
              "Physical traits focusing on hair style, hair color, eye color, and distinctive features.",
          },
          // Existing description fields
          appearance: {
            type: Type.STRING,
            description: "Detailed physical appearance including face, body type, and distinguishing features.",
          },
          clothing: {
            type: Type.STRING,
            description: "Description of their attire including colors, style, and era.",
          },
          personality: {
            type: Type.STRING,
            description: "Key personality traits (summarize in 4-5 words).",
          },
          backgroundStory: {
            type: Type.STRING,
            description: "Relevant background, history, or role in the story.",
          },
        },
        required: [
          "name",
          "role",
          "isProtagonist",
          "age",
          "gender",
          "traits",
          "appearance",
          "clothing",
          "personality",
          "backgroundStory",
        ],
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
      You are a story analyst for a creative studio. Your task is to read the following novel text and extract structured information about characters for character design purposes.

      For each character, extract:
      - name: Character's name (use "Name_Situation" format for different appearances)
      - role: One of "protagonist", "antagonist", "supporting", or "minor"
      - isProtagonist: TRUE only for the main hero/protagonist (usually just one character)
      - age: Age or age range (e.g., "25", "early 20s", "teenager", "toddler")
      - gender: Character's gender (e.g., "male", "female", "non-binary")
      - traits: Physical traits focusing on hair (style, color), eye color, distinctive features
      - appearance: Detailed physical description (face shape, body type, height, skin tone)
      - clothing: Attire description with colors, style, and era
      - personality: Key traits (4-5 words, e.g., "brave, kind, impulsive, loyal")
      - backgroundStory: Relevant history, occupation, or role in the story

      Rules:
      1. Identify every character who has at least one line of dialogue.
      2. Only ONE character should have isProtagonist: true (the main hero/protagonist).
      3. If a character's appearance changes significantly (e.g., time skip, costume change), create separate entries using "Name_Situation" format.
      4. For traits, focus on visual features useful for character art: hair style, hair color, eye color, scars, tattoos, etc.
      5. Output the result in the specified JSON format only.

      Examples for role assignment:
      - protagonist: The main character the story follows
      - antagonist: Main villain or opposing force
      - supporting: Important recurring characters
      - minor: Characters with few appearances

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

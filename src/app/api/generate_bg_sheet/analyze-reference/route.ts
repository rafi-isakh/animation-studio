import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface AnalyzeReferenceRequest {
  imageBase64: string;
  customApiKey?: string;
}

// Schema for structured reference analysis output
const referenceAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    floorType: {
      type: Type.STRING,
      description: "Material of floor (interior) or ground (exterior). E.g., 'wooden floor', 'grassy ground', 'marble tiles'."
    },
    rightObject: {
      type: Type.STRING,
      description: "Primary object visible on the RIGHT side (e.g., window, door, bookshelf, tree)."
    },
    leftObject: {
      type: Type.STRING,
      description: "Primary object visible on the LEFT side."
    },
    rearObject: {
      type: Type.STRING,
      description: "Primary object visible in the REAR (center back)."
    },
    ceilingObject: {
      type: Type.STRING,
      description: "Prominent object in CEILING or SKY (e.g., chandelier, clouds, beams)."
    },
    topLeftObject: {
      type: Type.STRING,
      description: "Prominent object in TOP LEFT diagonal (high up)."
    },
    topRightObject: {
      type: Type.STRING,
      description: "Prominent object in TOP RIGHT diagonal (high up)."
    },
  },
  required: ["floorType", "rightObject", "leftObject", "rearObject", "ceilingObject", "topLeftObject", "topRightObject"]
};

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeReferenceRequest = await request.json();
    const { imageBase64, customApiKey } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required and must be a string" },
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

    const prompt = `
      Analyze this background image to identify specific spatial elements for 3D reconstruction and multi-view generation.

      Identify the following:
      - Floor/ground type and material
      - Objects on the left side of the scene
      - Objects on the right side of the scene
      - Objects in the rear/back of the scene
      - Ceiling or sky elements
      - Objects in the top-left diagonal area
      - Objects in the top-right diagonal area

      Be specific about materials, colors, and positions. This will be used to maintain consistency across different camera angles.
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
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: referenceAnalysisSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No analysis returned from AI");
    }

    const analysis = JSON.parse(text);

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error("Error in generate_bg_sheet/analyze-reference API:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
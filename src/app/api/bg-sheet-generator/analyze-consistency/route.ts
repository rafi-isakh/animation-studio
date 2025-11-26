import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface AnalyzeConsistencyRequest {
  imageBase64: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeConsistencyRequest = await request.json();
    const { imageBase64 } = body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { error: "imageBase64 is required and must be a string" },
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
      Analyze this background image for the purpose of 3D reconstruction and consistency.
      List the FIXED physical elements that must remain identical in other angles.

      Output Format:
      - ARCHITECTURE: (Style, wall color, floor material, ceiling type, window shape/location)
      - KEY FURNITURE: (List specific items, their exact colors, and their fixed positions relative to each other)
      - LIGHTING: (Source of light, color temperature, shadows)
      - DECOR: (Rugs, curtains, wall art - describe specific patterns/colors)

      Do NOT describe the camera angle. Only describe the static physical reality of the room.
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
    });

    const analysis = response.text || "";

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error(
      "Error in bg-sheet-generator/analyze-consistency API:",
      error
    );

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

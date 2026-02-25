import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface RemixImageRequest {
  originalImage: string; // Base64 of the original generated image
  remixPrompt: string; // Instructions for changes
  originalContext: string; // Original image prompt for context
  assetImages?: string[]; // Base64 character/background sheets for color consistency
  aspectRatio?: "1:1" | "16:9" | "9:16";
  customApiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: RemixImageRequest;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[storyboard-editor/remix-image] Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid or empty request body" },
        { status: 400 }
      );
    }

    const {
      originalImage,
      remixPrompt,
      originalContext,
      assetImages = [],
      aspectRatio = "16:9",
      customApiKey
    } = body;

    if (!originalImage || typeof originalImage !== "string") {
      return NextResponse.json(
        { error: "Original image is required" },
        { status: 400 }
      );
    }

    if (!remixPrompt || typeof remixPrompt !== "string") {
      return NextResponse.json(
        { error: "Remix prompt is required" },
        { status: 400 }
      );
    }

    // Use custom API key if provided, otherwise fall back to environment variable
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemMsg = `
Modify the provided anime screenshot.
Instruction: ${remixPrompt}
Context: ${originalContext}
STRICTLY maintain character colors from Asset References and overall style.
REMOVE all text, bubbles, and borders.
`;

    const parts: any[] = [];

    // Add asset context images
    assetImages.forEach(data => {
      parts.push({ inlineData: { data, mimeType: 'image/jpeg' } });
    });

    // Add original image
    parts.push({ inlineData: { data: originalImage, mimeType: 'image/jpeg' } });

    // Add instruction
    parts.push({ text: systemMsg });


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    // Extract image from response
    for (const candidate of response.candidates || []) {
      if (!candidate.content?.parts) continue;
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return NextResponse.json({ imageBase64: part.inlineData.data });
        }
      }
    }

    console.error("[storyboard-editor/remix-image] No image in response");
    throw new Error("Remix failed.");
  } catch (error: unknown) {
    console.error("Error in storyboard-editor/remix-image API:", error);

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

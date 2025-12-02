import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface GenerateFromSketchRequest {
  sketchBase64: string;
  prompt: string;
  styleReferenceBase64?: string;
  customApiKey?: string;
}

interface Part {
  inlineData?: { data: string; mimeType: string };
  text?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateFromSketchRequest = await request.json();
    const { sketchBase64, prompt, styleReferenceBase64, customApiKey } = body;

    if (!sketchBase64 || typeof sketchBase64 !== "string") {
      return NextResponse.json(
        { error: "sketchBase64 is required and must be a string" },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required and must be a string" },
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

    const parts: Part[] = [
      {
        inlineData: {
          data: sketchBase64,
          mimeType: "image/jpeg",
        },
      },
    ];

    let finalPrompt = prompt;

    if (styleReferenceBase64) {
      // Add style reference as second image
      parts.push({
        inlineData: {
          data: styleReferenceBase64,
          mimeType: "image/jpeg",
        },
      });

      // Strict prompt engineering for style transfer
      finalPrompt = `
        [SYSTEM INSTRUCTION]
        You are an expert digital artist.

        INPUTS:
        - Image 1 (First image provided): Content/Structure Reference. Maintain the pose, composition, and objects from this image exactly.
        - Image 2 (Second image provided): Style Reference. Use the color palette, art style, lighting, and texture from this image.

        TASK:
        Redraw Image 1 using the art style of Image 2.

        RULES:
        1. **IGNORE Image 2's Content**: Do NOT copy the background, characters, or scene details from Image 2. Only copy the *aesthetic*.
        2. **PRESERVE Image 1's Layout**: The output must look like Image 1 in terms of composition.
        3. **Sketch Cleanup**: If Image 1 contains rough sketch lines, refine them into finished art.

        User Description: ${prompt}
      `;
    }

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K",
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
        if (part.text) {
          console.log(
            "Model returned text during image generation:",
            part.text
          );
        }
      }
    }

    throw new Error("Model executed but returned no image data.");
  } catch (error: unknown) {
    console.error(
      "Error in generate_bg_sheet/generate-from-sketch API:",
      error
    );

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

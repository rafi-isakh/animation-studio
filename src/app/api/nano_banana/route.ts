import { GoogleGenAI, Part } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export interface ImageReference {
  base64: string;
  mimeType: string;
}

export interface ImageReferencesPayload {
  backgrounds: ImageReference[];
  characters: ImageReference[];
}

interface RequestBody {
  prompt: string;
  references?: ImageReferencesPayload;
  aspectRatio: string;
  customApiKey?: string;
}

function handleCommonErrors(error: any) {
  let errorMessage = error.message || "Unknown error";

  if (errorMessage.startsWith("{")) {
    try {
      const apiError = JSON.parse(errorMessage);
      errorMessage = apiError.error?.message || errorMessage;
    } catch (e) {
      /* ignore */
    }
  }

  if (errorMessage.includes("INVALID_ARGUMENT")) {
    throw new Error("The API rejected the request. Check prompt or image format.");
  }
  if (errorMessage.includes("Internal error") || errorMessage.includes("500")) {
    throw new Error("Google AI Service Internal Error. Please try again later.");
  }

  throw new Error(`Generation failed: ${errorMessage}`);
}

/**
 * Generates an image using gemini-2.5-flash-image, with a fallback to imagen-3.0-generate-001
 * for text-only requests if the primary model is denied.
 */
async function generateImage(
  prompt: string,
  references: ImageReferencesPayload | undefined,
  aspectRatio: string,
  customApiKey?: string
): Promise<string> {
  // Use custom API key if provided, otherwise fall back to environment variable
  const apiKey = customApiKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is not configured");
  }
  const ai = new GoogleGenAI({ apiKey });
  const parts: Part[] = [];
  const backgrounds = references?.backgrounds || [];
  const characters = references?.characters || [];
  let hasReferenceImages = false;

  // 1. Add the main text prompt.
  parts.push({ text: prompt });

  // 2. Add all user-provided images.
  if (backgrounds) {
    for (const bgRef of backgrounds) {
      parts.push({
        inlineData: {
          data: bgRef.base64,
          mimeType: bgRef.mimeType,
        },
      });
      hasReferenceImages = true;
    }
  }
  if (characters) {
    for (const charRef of characters) {
      parts.push({
        inlineData: {
          data: charRef.base64,
          mimeType: charRef.mimeType,
        },
      });
      hasReferenceImages = true;
    }
  }

  if (parts.length <= 1 && !prompt.trim()) {
    throw new Error(
      "A text prompt or an image reference is required to generate an image."
    );
  }

  try {
    // Primary attempt: gemini-2.5-flash-image (Nano Banana)
    // This model supports both text-to-image and image-to-image (editing).
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        },
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }
    }

    // Check for blocking reasons or text feedback
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Request blocked: ${response.promptFeedback.blockReason}`);
    }
    if (response.text) {
      throw new Error(`Model returned text instead of image: ${response.text}`);
    }
    throw new Error("No image returned from gemini-2.5-flash-image.");
  } catch (error: any) {
    // Parse API error code
    let errorCode = error.status || error.code;
    if (error.message) {
      if (
        error.message.includes("403") ||
        error.message.includes("PERMISSION_DENIED")
      )
        errorCode = 403;
      if (error.message.includes("404") || error.message.includes("NOT_FOUND"))
        errorCode = 404;
    }

    // FALLBACK STRATEGY: If Permission Denied (403) or Not Found (404)
    if (errorCode === 403 || errorCode === 404) {
      // If we have reference images, we CANNOT use Imagen 3 easily via generateImages
      // (as it's primarily text-to-image in this SDK method).
      if (hasReferenceImages) {
        throw new Error(
          `Access Denied to 'gemini-2.5-flash-image'. \n` +
            `This model is required for Image-to-Image features (Character/Background references). \n` +
            `Please try clearing your reference images to use the text-only fallback model.`
        );
      }

      console.warn(
        "Primary model failed with permission error. Attempting fallback to Imagen 3..."
      );

      try {
        // Fallback: imagen-3.0-generate-001
        const imagenResponse = await ai.models.generateImages({
          model: "imagen-3.0-generate-001",
          prompt: prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio,
            outputMimeType: "image/png",
          },
        });

        const base64Image =
          imagenResponse.generatedImages?.[0]?.image?.imageBytes;
        if (base64Image) {
          return base64Image;
        }
        throw new Error("Fallback model (Imagen 3) did not return an image.");
      } catch (fallbackError: any) {
        console.error("Fallback failed:", fallbackError);
        throw new Error(
          `Failed to generate image. Primary model denied access, and fallback model failed: ${fallbackError.message}`
        );
      }
    }

    // Re-throw other errors (e.g., 500, safety blocks)
    handleCommonErrors(error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { prompt, references, aspectRatio, customApiKey } = body;

    if (
      !prompt &&
      !references?.backgrounds?.length &&
      !references?.characters?.length
    ) {
      return NextResponse.json(
        { error: "A prompt or reference images are required." },
        { status: 400 }
      );
    }

    const imageBase64 = await generateImage(
      prompt || "",
      references,
      aspectRatio || "16:9",
      customApiKey
    );

    return NextResponse.json({ imageBase64 });
  } catch (error: any) {
    console.error("NanoBanana API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}

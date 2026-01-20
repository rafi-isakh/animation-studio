import { NextRequest, NextResponse } from "next/server";
import { submitToSora, validateSoraRequest } from "../providers/sora";
import { submitToVeo3, validateVeo3Request } from "../providers/veo3";

export const maxDuration = 300; // Allow up to 5 minutes for job submission

interface VideoSubmitRequest {
  providerId: string;
  prompt: string;
  imageBase64?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
  customApiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoSubmitRequest = await request.json();
    const { providerId, prompt, imageBase64, duration, aspectRatio, customApiKey } = body;

    // Default to sora if no provider specified
    const provider = providerId || "sora";

    // Dispatch to appropriate provider
    switch (provider) {
      case "sora": {
        // Validate request
        const validationError = validateSoraRequest({
          prompt,
          imageBase64,
          duration,
          aspectRatio,
        });
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 400 });
        }

        try {
          const result = await submitToSora({
            prompt,
            imageBase64,
            duration,
            aspectRatio,
          }, customApiKey);
          return NextResponse.json(result);
        } catch (error) {
          if (error instanceof Error) {
            // Check for specific OpenAI errors
            if (error.message.includes("rate limit")) {
              return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
              );
            }
            if (error.message.includes("insufficient_quota")) {
              return NextResponse.json(
                {
                  error:
                    "Insufficient API quota. Please check your OpenAI account.",
                },
                { status: 402 }
              );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          throw error;
        }
      }

      case "veo3": {
        // Validate request
        const validationError = validateVeo3Request({
          prompt,
          imageBase64,
          duration,
          aspectRatio,
        });
        if (validationError) {
          return NextResponse.json({ error: validationError }, { status: 400 });
        }

        try {
          const result = await submitToVeo3({
            prompt,
            imageBase64,
            duration,
            aspectRatio,
          }, customApiKey);
          return NextResponse.json(result);
        } catch (error) {
          if (error instanceof Error) {
            // Check for specific Google API errors
            if (error.message.includes("rate limit") || error.message.includes("RATE_LIMIT")) {
              return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                { status: 429 }
              );
            }
            if (error.message.includes("quota") || error.message.includes("QUOTA")) {
              return NextResponse.json(
                {
                  error:
                    "Insufficient API quota. Please check your Google Cloud account.",
                },
                { status: 402 }
              );
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          throw error;
        }
      }

      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error("Error submitting video job:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
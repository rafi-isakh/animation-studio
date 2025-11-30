import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 300; // Allow up to 5 minutes for job submission

interface SoraVideoRequest {
  prompt: string;
  imageBase64?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body: SoraVideoRequest = await request.json();
    const { prompt, imageBase64, duration, aspectRatio } = body;

    // Validation
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    if (!duration || duration < 1 || duration > 20) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 20 seconds" },
        { status: 400 }
      );
    }

    if (!aspectRatio || !["16:9", "9:16"].includes(aspectRatio)) {
      return NextResponse.json(
        { error: "Aspect ratio must be '16:9' or '9:16'" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Determine size based on aspect ratio
    const size = aspectRatio === "16:9" ? "1920x1080" : "1080x1920";

    // Build the request for Sora API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestParams: any = {
      model: "sora",
      prompt,
      duration,
      size,
    };

    // Add image reference if provided (image-to-video)
    if (imageBase64) {
      // Sora expects image as a data URI
      const mimeType = imageBase64.startsWith("/9j/") ? "image/jpeg" : "image/png";
      requestParams.image = `data:${mimeType};base64,${imageBase64}`;
    }

    // Submit the video generation job
    // Note: Using the videos.generate endpoint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (openai as any).videos.generate(requestParams);

    // The response should contain a job ID
    const jobId = response.id;

    return NextResponse.json({
      jobId,
      status: "pending",
    });
  } catch (error: unknown) {
    console.error("Error submitting Sora video job:", error);

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
          { error: "Insufficient API quota. Please check your OpenAI account." },
          { status: 402 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

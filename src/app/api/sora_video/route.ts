import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300; // Allow up to 5 minutes for job submission

interface SoraVideoRequest {
  prompt: string;
  imageBase64?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.SORA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SORA_API_KEY is not configured" },
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

    // Sora only supports 4, 8, or 12 second videos
    // Map to nearest valid duration
    const validDurations = [4, 8, 12];
    const parsedDuration = Number(duration) || 4;
    const soraDuration = validDurations.reduce((prev, curr) =>
      Math.abs(curr - parsedDuration) < Math.abs(prev - parsedDuration) ? curr : prev
    );

    if (!aspectRatio || !["16:9", "9:16"].includes(aspectRatio)) {
      return NextResponse.json(
        { error: "Aspect ratio must be '16:9' or '9:16'" },
        { status: 400 }
      );
    }

    // Determine size based on aspect ratio
    // Sora supports: 720x1280, 1280x720, 1024x1792, 1792x1024
    const size = aspectRatio === "16:9" ? "1280x720" : "720x1280";

    // Use raw fetch API since OpenAI SDK may not have videos namespace yet
    // Sora API expects multipart/form-data
    const formData = new FormData();
    formData.append("model", "sora-2");
    formData.append("prompt", prompt);
    formData.append("seconds", soraDuration.toString());
    formData.append("size", size);

    // Add image reference if provided (image-to-video)
    if (imageBase64) {
      const mimeType = imageBase64.startsWith("/9j/") ? "image/jpeg" : "image/png";
      const extension = mimeType === "image/jpeg" ? "jpg" : "png";
      // Convert base64 to Blob for multipart upload
      const imageBuffer = Buffer.from(imageBase64, "base64");
      const imageBlob = new Blob([imageBuffer], { type: mimeType });
      formData.append("input_reference", imageBlob, `input.${extension}`);
    }

    // Submit the video generation job via POST /videos
    const response = await fetch("https://api.openai.com/v1/videos", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || data.error || "Failed to create video job";
      console.error("Sora API Error:", data);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // The response should contain a job ID
    const jobId = data.id;

    return NextResponse.json({
      jobId,
      status: data.status || "pending",
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

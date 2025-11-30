import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 1 minute for status check

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    // Check the status of the video generation job
    const response = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || data.error || "Failed to check job status";

      // Check if job not found
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Job not found. It may have expired." },
          { status: 404 }
        );
      }

      console.error("Sora Status API Error:", data);
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Map Sora status to our status format
    const soraStatus = data.status;
    let status: "pending" | "running" | "completed" | "failed";

    switch (soraStatus) {
      case "pending":
      case "queued":
        status = "pending";
        break;
      case "in_progress":
      case "processing":
        status = "running";
        break;
      case "completed":
      case "succeeded":
        status = "completed";
        break;
      case "failed":
      case "cancelled":
        status = "failed";
        break;
      default:
        status = "pending";
    }

    const result: {
      jobId: string;
      status: "pending" | "running" | "completed" | "failed";
      videoUrl?: string;
      error?: string;
    } = {
      jobId,
      status,
    };

    // If completed, include the video URL (via our proxy endpoint for authentication)
    if (status === "completed") {
      result.videoUrl = `/api/sora_video/download?jobId=${jobId}`;
    }

    // If failed, include the error message
    if (status === "failed") {
      result.error = data.error?.message || data.failure_reason || "Video generation failed";
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error checking Sora video status:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

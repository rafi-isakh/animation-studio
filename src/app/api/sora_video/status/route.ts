import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getVideoUrl } from "@/utils/urls";

export const maxDuration = 120; // Allow up to 2 minutes for status check + S3 upload

const VIDEOS_BUCKET_NAME = process.env.VIDEOS_BUCKET_NAME;

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.SORA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "SORA_API_KEY is not configured" },
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
      s3FileName?: string;
      error?: string;
    } = {
      jobId,
      status,
    };

    // If completed, download from OpenAI and upload to S3 for permanent storage
    if (status === "completed") {
      try {
        // Download video from OpenAI
        const videoResponse = await fetch(`https://api.openai.com/v1/videos/${jobId}/content`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
          },
        });

        if (!videoResponse.ok) {
          throw new Error(`Failed to download video from OpenAI: ${videoResponse.statusText}`);
        }

        const videoBlob = await videoResponse.arrayBuffer();
        const videoBuffer = Buffer.from(videoBlob);

        // Generate unique filename with jobId for traceability
        const s3FileName = `sora_${Date.now()}_${jobId}.mp4`;

        // Upload to S3
        const uploadParams = {
          Bucket: VIDEOS_BUCKET_NAME,
          Key: s3FileName,
          Body: videoBuffer,
          ContentType: "video/mp4",
        };

        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log("Sora video uploaded to S3:", s3FileName);

        // Return CloudFront URL for permanent access
        result.videoUrl = getVideoUrl(s3FileName);
        result.s3FileName = s3FileName;
      } catch (uploadError) {
        console.error("Error uploading to S3, falling back to proxy URL:", uploadError);
        // Fallback to proxy URL if S3 upload fails
        result.videoUrl = `/api/sora_video/download?jobId=${jobId}`;
      }
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

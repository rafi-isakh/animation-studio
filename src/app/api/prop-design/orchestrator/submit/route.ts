import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";

// S3 client for uploading reference images
const AWS_S3_ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY;
const AWS_S3_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.AWS_S3_BUCKET || "toonyzbucket";
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || "ap-northeast-2";

// Only initialize S3 client if credentials are available
const s3Client = AWS_S3_ACCESS_KEY && AWS_S3_SECRET_ACCESS_KEY ? new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_S3_ACCESS_KEY,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
  },
}) : null;

export const maxDuration = 60; // Allow more time for uploading reference images

interface PropDesignSubmitRequest {
  projectId: string;
  propId: string;
  propName: string;
  category: "character" | "object";
  prompt: string;
  genre?: string;
  styleKeyword?: string;
  referenceImages?: string[]; // Base64 images to be uploaded to S3
  referenceUrls?: string[]; // Already uploaded S3 URLs
  aspectRatio?: "16:9" | "9:16" | "1:1";
  apiKey?: string;
}

/**
 * Upload a base64 image to S3 and return the URL
 */
async function uploadBase64ToS3(
  base64Data: string,
  projectId: string,
  propId: string,
  index: number
): Promise<string> {
  if (!s3Client) {
    throw new Error("S3 client not initialized - AWS credentials missing");
  }

  // Remove data URL prefix if present
  const base64Clean = base64Data.includes("base64,")
    ? base64Data.split("base64,")[1]
    : base64Data;

  // Determine mime type
  let mimeType = "image/png";
  if (base64Data.includes("data:image/jpeg")) {
    mimeType = "image/jpeg";
  } else if (base64Data.includes("data:image/webp")) {
    mimeType = "image/webp";
  }

  const extension = mimeType.split("/")[1];
  const buffer = Buffer.from(base64Clean, "base64");
  const timestamp = Date.now();
  const s3Key = `props/${projectId}/${propId}/ref_${index}_${timestamp}.${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // Return S3 URL (CDN is only used for videos, not images)
  return `https://${S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: PropDesignSubmitRequest = await request.json();

    console.log(`[PropDesignOrchestrator] Received request:`, {
      propId: body.propId,
      propName: body.propName,
      promptLength: body.prompt?.length,
      referenceImages: body.referenceImages?.length || 0,
      referenceUrls: body.referenceUrls?.length || 0,
      genre: body.genre,
      styleKeyword: body.styleKeyword,
    });

    // Upload base64 reference images to S3 if provided
    let referenceUrls: string[] = body.referenceUrls || [];

    if (body.referenceImages && body.referenceImages.length > 0) {
      console.log(`[PropDesignOrchestrator] Uploading ${body.referenceImages.length} reference images to S3...`);
      
      if (!s3Client) {
        console.warn("[PropDesignOrchestrator] AWS credentials not configured, skipping reference image upload");
        console.warn("[PropDesignOrchestrator] Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local");
        // Continue without reference images
      } else {
        const uploadPromises = body.referenceImages.map((img, index) =>
          uploadBase64ToS3(img, body.projectId, body.propId, index)
        );

        try {
          const uploadedUrls = await Promise.all(uploadPromises);
          referenceUrls = [...referenceUrls, ...uploadedUrls];
          console.log(`[PropDesignOrchestrator] Uploaded ${uploadedUrls.length} reference images`);
        } catch (uploadError) {
          console.error("[PropDesignOrchestrator] Failed to upload reference images:", uploadError);
          // Continue without reference images rather than failing
        }
      }
    }

    // Build the full prompt with genre and style if provided
    let fullPrompt = body.prompt;
    if (body.genre || body.styleKeyword) {
      const prefix = [
        body.genre ? `Genre: ${body.genre}` : "",
        body.styleKeyword ? `Style: ${body.styleKeyword}` : "",
      ].filter(Boolean).join(". ");
      fullPrompt = prefix ? `${prefix}.\n\n${body.prompt}` : body.prompt;
    }

    // Forward to orchestrator backend
    console.log("[PropDesignOrchestrator] Submitting to:", `${ORCHESTRATOR_URL}/api/v1/prop-design-jobs/submit`);

    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/prop-design-jobs/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
      body: JSON.stringify({
        project_id: body.projectId,
        prop_id: body.propId,
        prop_name: body.propName,
        category: body.category,
        prompt: fullPrompt,
        reference_urls: referenceUrls,
        aspect_ratio: body.aspectRatio || "1:1",
        api_key: body.apiKey,
      }),
    });

    const responseText = await response.text();
    console.log("[PropDesignOrchestrator] Response status:", response.status, "body:", responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        { error: `Backend returned invalid JSON: ${responseText.substring(0, 200)}` },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to submit prop design job" },
        { status: response.status }
      );
    }

    // Transform response to camelCase
    return NextResponse.json({
      jobId: data.job_id,
      status: data.status,
      createdAt: data.created_at,
    });
  } catch (error) {
    console.error("Error submitting to prop design orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

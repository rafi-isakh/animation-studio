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

export const maxDuration = 120; // Allow more time for batch uploads

interface PropDesignBatchSubmitRequest {
  projectId: string;
  jobs: Array<{
    propId: string;
    propName: string;
    category: "character" | "object";
    prompt: string;
    genre?: string;
    styleKeyword?: string;
    referenceImages?: string[]; // Base64 images to be uploaded to S3
    referenceUrls?: string[]; // Already uploaded S3 URLs
    aspectRatio?: "16:9" | "9:16" | "1:1";
  }>;
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

    const body: PropDesignBatchSubmitRequest = await request.json();


    // Upload reference images for each job and build full prompts
    const processedJobs = await Promise.all(
      body.jobs.map(async (job) => {
        let referenceUrls: string[] = job.referenceUrls || [];

        // Upload base64 reference images to S3 if provided
        if (job.referenceImages && job.referenceImages.length > 0) {
          if (!s3Client) {
            console.warn(`[PropDesignOrchestrator] AWS credentials not configured, skipping reference image upload for prop ${job.propId}`);
          } else {
            try {
              const uploadPromises = job.referenceImages.map((img, index) =>
                uploadBase64ToS3(img, body.projectId, job.propId, index)
              );
              const uploadedUrls = await Promise.all(uploadPromises);
              referenceUrls = [...referenceUrls, ...uploadedUrls];
            } catch (uploadError) {
              console.error(`[PropDesignOrchestrator] Failed to upload references for prop ${job.propId}:`, uploadError);
              // Continue without reference images
            }
          }
        }

        // Build the full prompt with genre and style if provided
        let fullPrompt = job.prompt;
        if (job.genre || job.styleKeyword) {
          const prefix = [
            job.genre ? `Genre: ${job.genre}` : "",
            job.styleKeyword ? `Style: ${job.styleKeyword}` : "",
          ].filter(Boolean).join(". ");
          fullPrompt = prefix ? `${prefix}.\n\n${job.prompt}` : job.prompt;
        }

        return {
          project_id: body.projectId,
          prop_id: job.propId,
          prop_name: job.propName,
          category: job.category,
          prompt: fullPrompt,
          reference_urls: referenceUrls,
          aspect_ratio: job.aspectRatio || "1:1",
        };
      })
    );

    // Forward to orchestrator backend

    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/prop-design-jobs/submit-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
      body: JSON.stringify({
        project_id: body.projectId,
        jobs: processedJobs,
        api_key: body.apiKey,
      }),
    });

    const responseText = await response.text();

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
        { error: data.detail || "Failed to submit prop design batch" },
        { status: response.status }
      );
    }

    // Transform response to camelCase
    // The backend jobs array maintains order with our processedJobs
    return NextResponse.json({
      batchId: data.batch_id,
      jobs: data.jobs.map((job: { job_id: string; status: string; created_at: string }, index: number) => ({
        jobId: job.job_id,
        propId: processedJobs[index]?.prop_id || body.jobs[index]?.propId, // Map back to propId from our request
        status: job.status,
        createdAt: job.created_at,
      })),
      totalCount: data.total_count,
    });
  } catch (error) {
    console.error("Error submitting prop design batch:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Sora Provider API Integration
// Server-side logic for Sora video generation

import sharp from "sharp";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getVideoUrl } from "@/utils/urls";
import { fetchImageAsBase64 as fetchImageAsBase64WithMime } from "@/utils/fetchImage";

const VIDEOS_BUCKET_NAME = process.env.VIDEOS_BUCKET_NAME;

// Sora constraints
const SORA_VALID_DURATIONS = [4, 8, 12];
const SORA_VALID_ASPECT_RATIOS = ["16:9", "9:16"];

export interface SoraSubmitRequest {
  prompt: string;
  imageBase64?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
}

export interface SoraSubmitResult {
  jobId: string;
  status: "pending";
}

export interface SoraStatusResult {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  videoUrl?: string;
  s3FileName?: string;
  error?: string;
}

/**
 * Check if string is a URL
 */
function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

/**
 * Resize image to exact Sora dimensions
 */
async function resizeImageToSoraDimensions(
  imageInput: string,
  width: number,
  height: number
): Promise<string> {
  // Handle both S3 URLs and base64 strings
  let base64: string;
  if (isUrl(imageInput)) {
    ({ base64 } = await fetchImageAsBase64WithMime(imageInput));
  } else {
    base64 = imageInput;
  }

  const buffer = Buffer.from(base64, "base64");
  const resized = await sharp(buffer)
    .resize(width, height, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer();
  return resized.toString("base64");
}

/**
 * Map duration to nearest valid Sora duration
 */
export function mapToSoraDuration(duration: number): number {
  return SORA_VALID_DURATIONS.reduce((prev, curr) =>
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
  );
}

/**
 * Validate Sora request
 */
export function validateSoraRequest(
  request: SoraSubmitRequest
): string | null {
  if (!request.prompt || typeof request.prompt !== "string") {
    return "Prompt is required and must be a string";
  }

  if (
    !request.aspectRatio ||
    !SORA_VALID_ASPECT_RATIOS.includes(request.aspectRatio)
  ) {
    return "Aspect ratio must be '16:9' or '9:16'";
  }

  return null;
}

/**
 * Submit a video generation job to Sora
 */
export async function submitToSora(
  request: SoraSubmitRequest,
  customApiKey?: string
): Promise<SoraSubmitResult> {
  const apiKey = customApiKey || process.env.SORA_API_KEY;
  if (!apiKey) {
    throw new Error("SORA_API_KEY is not configured");
  }

  const { prompt, imageBase64, duration, aspectRatio } = request;

  // Validate
  const validationError = validateSoraRequest(request);
  if (validationError) {
    throw new Error(validationError);
  }

  // Map to valid Sora duration
  const soraDuration = mapToSoraDuration(duration);

  // Determine size based on aspect ratio
  const size = aspectRatio === "16:9" ? "1280x720" : "720x1280";

  // Build form data
  const formData = new FormData();
  formData.append("model", "sora-2");
  formData.append("prompt", prompt);
  formData.append("seconds", soraDuration.toString());
  formData.append("size", size);

  // Add image reference if provided (image-to-video)
  if (imageBase64) {
    const targetWidth = aspectRatio === "16:9" ? 1280 : 720;
    const targetHeight = aspectRatio === "16:9" ? 720 : 1280;

    // Resize image to exact Sora dimensions
    const resizedBase64 = await resizeImageToSoraDimensions(
      imageBase64,
      targetWidth,
      targetHeight
    );

    // Convert resized base64 to Blob for multipart upload
    const imageBuffer = Buffer.from(resizedBase64, "base64");
    const imageBlob = new Blob([imageBuffer], { type: "image/jpeg" });
    formData.append("input_reference", imageBlob, "input.jpg");
  }

  // Submit the video generation job
  const response = await fetch("https://api.openai.com/v1/videos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage =
      data.error?.message || data.error || "Failed to create video job";
    console.error("Sora API Error:", data);
    throw new Error(errorMessage);
  }

  return {
    jobId: data.id,
    status: "pending",
  };
}

/**
 * Check the status of a Sora video generation job
 * If completed, downloads from OpenAI and uploads to S3
 */
export async function checkSoraStatus(
  jobId: string,
  customApiKey?: string
): Promise<SoraStatusResult> {
  const apiKey = customApiKey || process.env.SORA_API_KEY;
  if (!apiKey) {
    throw new Error("SORA_API_KEY is not configured");
  }

  // Check the status of the video generation job
  const response = await fetch(`https://api.openai.com/v1/videos/${jobId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Job not found. It may have expired.");
    }
    const errorMessage =
      data.error?.message || data.error || "Failed to check job status";
    console.error("Sora Status API Error:", data);
    throw new Error(errorMessage);
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

  const result: SoraStatusResult = {
    jobId,
    status,
  };

  // If completed, download from OpenAI and upload to S3
  if (status === "completed") {
    try {
      // Download video from OpenAI
      const videoResponse = await fetch(
        `https://api.openai.com/v1/videos/${jobId}/content`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      if (!videoResponse.ok) {
        throw new Error(
          `Failed to download video from OpenAI: ${videoResponse.statusText}`
        );
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

      // Return CloudFront URL for permanent access
      result.videoUrl = getVideoUrl(s3FileName);
      result.s3FileName = s3FileName;
    } catch (uploadError) {
      console.error("Error uploading to S3:", uploadError);
      // Return with completed status but no S3 URL
      // The caller can decide how to handle this
      throw uploadError;
    }
  }

  // If failed, include the error message
  if (status === "failed") {
    result.error =
      data.error?.message || data.failure_reason || "Video generation failed";
  }

  return result;
}
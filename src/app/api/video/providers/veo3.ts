// Veo 3 Provider API Integration
// Server-side logic for Google Veo 3 video generation

import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getVideoUrl } from "@/utils/urls";
import { fetchImageAsBase64 as fetchImageAsBase64WithMime } from "@/utils/fetchImage";
import { assertAllowedUrl, assertSafePathSegment, encodePathPreservingSlashes } from "@/utils/urlSafety";

const VIDEOS_BUCKET_NAME = process.env.VIDEOS_BUCKET_NAME;

// Veo 3 constraints
const VEO3_VALID_DURATIONS = [4, 6, 8];
const VEO3_VALID_ASPECT_RATIOS = ["16:9", "9:16"];

export interface Veo3SubmitRequest {
  prompt: string;
  imageBase64?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
}

export interface Veo3SubmitResult {
  jobId: string;
  status: "pending";
}

export interface Veo3StatusResult {
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
 * Resize image to exact Veo 3 dimensions
 */
async function resizeImageToVeo3Dimensions(
  imageInput: string,
  width: number,
  height: number
): Promise<{ base64: string; mimeType: string }> {
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
  return {
    base64: resized.toString("base64"),
    mimeType: "image/jpeg",
  };
}

/**
 * Map duration to nearest valid Veo 3 duration
 */
export function mapToVeo3Duration(duration: number): number {
  return VEO3_VALID_DURATIONS.reduce((prev, curr) =>
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
  );
}

/**
 * Validate Veo 3 request
 */
export function validateVeo3Request(request: Veo3SubmitRequest): string | null {
  if (!request.prompt || typeof request.prompt !== "string") {
    return "Prompt is required and must be a string";
  }

  if (
    !request.aspectRatio ||
    !VEO3_VALID_ASPECT_RATIOS.includes(request.aspectRatio)
  ) {
    return "Aspect ratio must be '16:9' or '9:16'";
  }

  return null;
}

/**
 * Submit a video generation job to Veo 3
 */
export async function submitToVeo3(
  request: Veo3SubmitRequest,
  customApiKey?: string
): Promise<Veo3SubmitResult> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const { prompt, imageBase64, duration, aspectRatio } = request;

  // Validate
  const validationError = validateVeo3Request(request);
  if (validationError) {
    throw new Error(validationError);
  }

  // Map to valid Veo 3 duration
  const veo3Duration = mapToVeo3Duration(duration);

  const ai = new GoogleGenAI({ apiKey });

  // Build request config
  const config: {
    aspectRatio: string;
    durationSeconds: number;
    personGeneration: string;
  } = {
    aspectRatio,
    durationSeconds: veo3Duration,
    personGeneration: "allow_adult",
  };

  // Build request with or without image
  const requestBody: Record<string, unknown> = {
    model: "veo-3.1-generate-preview",
    prompt,
    config,
  };

  // Add image reference if provided (image-to-video)
  if (imageBase64) {
    const targetWidth = aspectRatio === "16:9" ? 1280 : 720;
    const targetHeight = aspectRatio === "16:9" ? 720 : 1280;

    const { base64, mimeType } = await resizeImageToVeo3Dimensions(
      imageBase64,
      targetWidth,
      targetHeight
    );

    requestBody.image = {
      imageBytes: base64,
      mimeType,
    };
  }


  // Submit the video generation job
  // Cast to unknown first to avoid type incompatibility
  const models = ai.models as unknown as { generateVideos: (body: unknown) => Promise<{ name?: string; operationName?: string; id?: string; operationId?: string }> };
  const operation = await models.generateVideos(requestBody);


  // The operation.name is the job ID we'll use to poll status
  // Try different property names that the SDK might use
  const jobId = operation.name || operation.operationName || operation.id || operation.operationId;

  if (!jobId) {
    console.error("[veo3] Operation object keys:", Object.keys(operation || {}));
    throw new Error("Failed to get operation ID from Veo 3 response");
  }


  return {
    jobId,
    status: "pending",
  };
}

/**
 * Check the status of a Veo 3 video generation job
 * If completed, downloads from Google and uploads to S3
 */
export async function checkVeo3Status(
  jobId: string,
  customApiKey?: string
): Promise<Veo3StatusResult> {
  const safeJobId = assertSafePathSegment(jobId, { allowSlash: true });
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const encodedJobId = encodePathPreservingSlashes(safeJobId);

  // Use REST API directly to poll operation status
  // The SDK methods don't work reliably for operation polling
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${encodedJobId}?key=${apiKey}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("[veo3] REST API error:", response.status, errorData);
    throw new Error(
      errorData.error?.message || `Failed to check operation status: ${response.status}`
    );
  }

  const operation = await response.json();

  // Determine status
  let status: "pending" | "running" | "completed" | "failed";

  if (operation.done) {
    if (operation.error) {
      status = "failed";
    } else {
      status = "completed";
    }
  } else {
    // Operation is still in progress
    status = "running";
  }


  const result: Veo3StatusResult = {
    jobId,
    status,
  };

  // If completed, download from Google and upload to S3
  const generatedSamples = operation.response?.generateVideoResponse?.generatedSamples;
  if (status === "completed" && generatedSamples?.length > 0) {
    try {
      const videoUri = generatedSamples[0].video?.uri;

      if (!videoUri) {
        throw new Error("No video URI in response");
      }

      const safeVideoUrl = assertAllowedUrl(videoUri, {
        allowedHostSuffixes: [".googleapis.com"],
        allowedHostnames: new Set(),
      });

      // Download the video directly from the URI
      // Add API key if not already in the URL
      const safeVideoUri = safeVideoUrl.toString();
      const downloadUrl = safeVideoUri.includes("key=")
        ? safeVideoUri
        : `${safeVideoUri}&key=${apiKey}`;

      const videoResponse = await fetch(downloadUrl);

      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText}`);
      }

      const videoArrayBuffer = await videoResponse.arrayBuffer();
      const videoBuffer = Buffer.from(videoArrayBuffer);


      // Generate unique filename with jobId for traceability
      // Replace slashes in jobId since it contains path-like structure
      const sanitizedJobId = jobId.replace(/\//g, "_");
      const s3FileName = `veo3_${Date.now()}_${sanitizedJobId}.mp4`;

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
      console.error("[veo3] Error uploading to S3:", uploadError);
      throw uploadError;
    }
  }

  // If failed, include the error message
  if (status === "failed") {
    result.error =
      operation.error?.message || "Video generation failed";
    console.error("[veo3] Video generation failed:", result.error);
  }

  return result;
}

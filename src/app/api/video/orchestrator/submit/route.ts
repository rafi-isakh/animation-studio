import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/mithrilAuth";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const ORCHESTRATOR_URL = process.env.MITHRIL_BACKEND_URL || "http://localhost:8000";
const INTERNAL_SERVICE_SECRET = process.env.INTERNAL_SERVICE_SECRET || "";
const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || "";
const CDN_HOST = process.env.NEXT_PUBLIC_PICTURES_S3 || "";

/**
 * If the given URL is a data URL (from a browser file upload), upload the image
 * to S3 and return the CDN URL. Otherwise return the URL unchanged.
 * This prevents Firestore from rejecting large field values (limit ~1 MB).
 */
async function resolveImageUrl(dataOrUrl: string, s3Prefix: string): Promise<string> {
  if (!dataOrUrl.startsWith("data:")) return dataOrUrl;

  const [header, base64] = dataOrUrl.split(",", 2);
  const mimeMatch = header.match(/data:([^;]+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const ext = mimeType.split("/")[1] ?? "jpg";

  const buffer = Buffer.from(base64, "base64");
  const s3Key = `${s3Prefix}/${randomUUID()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `https://${CDN_HOST}/${s3Key}`;
}

export const maxDuration = 30; // Job submission should be quick

interface OrchestratorSubmitRequest {
  projectId: string;
  sceneIndex: number;
  clipIndex: number;
  providerId: "sora" | "veo3" | "grok_i2v" | "grok_imagine_i2v" | "wan_i2v" | "wan22_i2v";
  prompt: string;
  imageUrl?: string;
  imageEndUrl?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
  apiKey?: string;
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

    const body: OrchestratorSubmitRequest = await request.json();

    // Upload data URLs to S3 so Firestore doesn't hit its ~1 MB field size limit
    const s3Prefix = `mithril/temp/video-frames/${body.projectId}`;
    const imageUrl = body.imageUrl
      ? await resolveImageUrl(body.imageUrl, s3Prefix)
      : undefined;
    const imageEndUrl = body.imageEndUrl
      ? await resolveImageUrl(body.imageEndUrl, s3Prefix)
      : undefined;

    // Forward to orchestrator backend

    const response = await fetch(`${ORCHESTRATOR_URL}/api/v1/jobs/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": INTERNAL_SERVICE_SECRET,
        "X-User-Id": session.userId,
        "X-User-Email": session.email || "",
      },
      body: JSON.stringify({
        project_id: body.projectId,
        scene_index: body.sceneIndex,
        clip_index: body.clipIndex,
        provider_id: body.providerId,
        prompt: body.prompt,
        image_url: imageUrl,
        image_end_url: imageEndUrl,
        duration: body.duration,
        aspect_ratio: body.aspectRatio,
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
        { error: data.detail || "Failed to submit job" },
        { status: response.status }
      );
    }

    // Transform response to camelCase
    return NextResponse.json({
      jobId: data.job_id,
      status: data.status,
      createdAt: data.created_at,
      resolvedImageUrl: imageUrl || null,
    });
  } catch (error) {
    console.error("Error submitting to orchestrator:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
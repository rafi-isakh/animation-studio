import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getCurrentSession } from "@/lib/mithrilAuth";

export const maxDuration = 120;

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const PICTURES_S3 = process.env.NEXT_PUBLIC_PICTURES_S3;

const PIXAI_API_BASE = "https://api.pixai.art/v1";

// Haruka v2 (PixAI XL) — stable quality, refined details, accurate hands
const MODEL_ID = "1861558740588989558";

// Artist sinanohaka Artstyle LoRA
const LORA_VERSION_ID = "1979066588753786310";
const LORA_WEIGHT = -0.2;

const NEGATIVE_PROMPTS =
  "watermark, nsfw, worst quality, bad quality, low quality, lowres, anatomical nonsense, artistic error, bad anatomy, interlocked fingers, extra fingers, text, artist name, watermark, signature, bad feet, extra toes, ugly, poorly drawn, censor, blurry, watermark, simple background, transparent background, old, oldest, glitch, deformed, mutated, disfigured, long body, bad hands, missing fingers, extra digit, fewer digits, cropped, very displeasing, sketch, jpeg artifacts, username, censored, bar_censor, mosaic_censor, conjoined, bad ai-generated, nsfw, long neck, skin blemishes, skin spots, acne, the wrong limb, error, black line, excess hands";

// Haruka v2 SDXL preset resolutions (768–1280 range)
const RESOLUTION_MAP: Record<string, { width: number; height: number }> = {
  "9:16": { width: 768, height: 1280 },
  "16:9": { width: 1280, height: 768 },
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1024, height: 1024 }, // no exact 4:3 preset; use square
  "3:4": { width: 896, height: 1152 },
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // 40 × 3s = 120s max

// ── S3 upload ─────────────────────────────────────────────────────────────────

async function uploadSourceToS3(base64: string, mimeType: string): Promise<string> {
  if (!BUCKET_NAME || !PICTURES_S3) {
    throw new Error(
      "S3 not configured: set NEXT_PUBLIC_AWS_BUCKET_NAME and NEXT_PUBLIC_PICTURES_S3"
    );
  }

  const buffer = Buffer.from(base64, "base64");
  const ext =
    mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  const key = `mithril/temp/pixai-source/${Date.now()}.${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return `https://${PICTURES_S3}/${key}`;
}

// ── pixAI API calls ───────────────────────────────────────────────────────────

async function submitTask(
  apiKey: string,
  mediaUrl: string,
  prompts: string,
  aspectRatio: string
): Promise<string> {
  const resolution = RESOLUTION_MAP[aspectRatio] ?? RESOLUTION_MAP["9:16"];

  const response = await fetch(`${PIXAI_API_BASE}/task`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parameters: {
        prompts,
        modelId: MODEL_ID,
        width: resolution.width,
        height: resolution.height,
        batchSize: 1,
        mediaUrl,
        strength: 0.46,
        negativePrompts: NEGATIVE_PROMPTS,
        samplingMethod: "Euler a",
        samplingSteps: 28,
        cfgScale: 5,
        lora: { [LORA_VERSION_ID]: LORA_WEIGHT },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `pixAI task submission failed (${response.status}): ${body.substring(0, 300)}`
    );
  }

  const data = await response.json();
  return data.id as string;
}

async function pollTask(apiKey: string, taskId: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));

    const response = await fetch(`${PIXAI_API_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`pixAI task poll failed (${response.status})`);
    }

    const data = await response.json();
    const status: string = data.status;

    if (status === "completed") {
      const mediaId: string | undefined = data.outputs?.mediaIds?.[0];
      if (!mediaId) {
        throw new Error("Task completed but no mediaId in response");
      }
      return mediaId;
    }

    if (status === "failed" || status === "cancelled") {
      throw new Error(`pixAI task ended with status: ${status}`);
    }
    // "waiting" or "running" — keep polling
  }

  throw new Error("pixAI task timed out after 2 minutes");
}

async function fetchResultImage(apiKey: string, mediaId: string): Promise<string> {
  const response = await fetch(`${PIXAI_API_BASE}/media/${mediaId}/image`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch result image (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = response.headers.get("content-type") || "image/png";

  return `data:${contentType};base64,${base64}`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      imageBase64,
      mimeType = "image/jpeg",
      prompts,
      targetAspectRatio = "9:16",
      apiKey,
    } = body as {
      imageBase64: string;
      mimeType?: string;
      prompts: string;
      targetAspectRatio?: string;
      apiKey?: string;
    };

    const resolvedKey = apiKey?.trim() || process.env.PIXAI_API_KEY;

    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
    }
    if (!resolvedKey) {
      return NextResponse.json({ error: "Missing apiKey" }, { status: 400 });
    }
    if (!prompts) {
      return NextResponse.json({ error: "Missing prompts" }, { status: 400 });
    }

    // 1. Upload source to S3 (pixAI needs a public URL for img2img)
    const mediaUrl = await uploadSourceToS3(imageBase64, mimeType);

    // 2. Submit generation task
    const taskId = await submitTask(resolvedKey, mediaUrl, prompts, targetAspectRatio);

    // 3. Poll until completed
    const mediaId = await pollTask(resolvedKey, taskId);

    // 4. Fetch result image and return as base64 data URI
    const resultUrl = await fetchResultImage(resolvedKey, mediaId);

    return NextResponse.json({ resultUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[pixai/convert]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

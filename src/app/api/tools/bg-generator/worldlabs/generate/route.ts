import { NextRequest, NextResponse } from "next/server";

const WORLDLABS_BASE = "https://api.worldlabs.ai/marble/v1";

interface GenerateRequestBody {
  frontImageUrl: string; // S3/CDN URL or data URI
  backImageUrl: string;
  displayName?: string;
  apiKey: string;
}

async function fetchImageAsBuffer(url: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (url.startsWith("data:")) {
    const [header, base64] = url.split(",");
    const contentType = header.replace("data:", "").replace(";base64", "");
    const ext = contentType.split("/")[1]?.split("+")[0] || "jpg";
    const buffer = Buffer.from(base64, "base64");
    return { buffer, contentType, ext };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = contentType.split("/")[1]?.split("+")[0] || "jpg";
  const arrayBuffer = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType, ext };
}

async function prepareUpload(
  apiKey: string,
  filename: string,
  ext: string
): Promise<{ mediaAssetId: string; uploadUrl: string; requiredHeaders: Record<string, string> }> {
  const res = await fetch(`${WORLDLABS_BASE}/media-assets:prepare_upload`, {
    method: "POST",
    headers: {
      "WLT-Api-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_name: filename, kind: "image", extension: ext }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`prepare_upload failed (${res.status}): ${err}`);
  }
  const data = await res.json();
  console.log("[WorldLabs prepare_upload response]", JSON.stringify(data));
  // Try multiple possible field paths for the media asset ID
  const mediaAssetId: string =
    data.media_asset?.id ??
    data.media_asset?.media_asset_id ??
    data.id ??
    "";
  if (!mediaAssetId) {
    throw new Error(`prepare_upload: could not find media asset ID in response: ${JSON.stringify(data)}`);
  }
  return {
    mediaAssetId,
    uploadUrl: data.upload_info.upload_url,
    // GCS signs the URL against these headers — they must be included in the PUT
    requiredHeaders: (data.upload_info?.required_headers as Record<string, string>) ?? {},
  };
}

async function uploadFile(
  uploadUrl: string,
  buffer: Buffer,
  requiredHeaders: Record<string, string>,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Length": String(buffer.byteLength), ...requiredHeaders },
    body: buffer,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`File upload failed (${res.status}): ${err}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequestBody = await req.json();
    const { frontImageUrl, backImageUrl, displayName, apiKey } = body;

    if (!frontImageUrl || !backImageUrl || !apiKey) {
      return NextResponse.json(
        { error: "frontImageUrl, backImageUrl, and apiKey are required" },
        { status: 400 }
      );
    }

    // Fetch both images
    const [front, back] = await Promise.all([
      fetchImageAsBuffer(frontImageUrl),
      fetchImageAsBuffer(backImageUrl),
    ]);

    // Prepare uploads
    const [frontUpload, backUpload] = await Promise.all([
      prepareUpload(apiKey, `front.${front.ext}`, front.ext),
      prepareUpload(apiKey, `back.${back.ext}`, back.ext),
    ]);

    // Upload files to signed URLs
    await Promise.all([
      uploadFile(frontUpload.uploadUrl, front.buffer, frontUpload.requiredHeaders),
      uploadFile(backUpload.uploadUrl, back.buffer, backUpload.requiredHeaders),
    ]);

    // Submit world generation
    const generateRes = await fetch(`${WORLDLABS_BASE}/worlds:generate`, {
      method: "POST",
      headers: {
        "WLT-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        display_name: displayName || "BG Generator World",
        world_prompt: {
          type: "multi-image",
          multi_image_prompt: [
            {
              azimuth: 0,
              content: { source: "media_asset", media_asset_id: frontUpload.mediaAssetId },
            },
            {
              azimuth: 180,
              content: { source: "media_asset", media_asset_id: backUpload.mediaAssetId },
            },
          ],
        },
      }),
    });

    if (!generateRes.ok) {
      const err = await generateRes.text();
      throw new Error(`worlds:generate failed (${generateRes.status}): ${err}`);
    }

    const result = await generateRes.json();
    const operationId: string = result.operation_id ?? "";

    return NextResponse.json({ operationId });
  } catch (err) {
    console.error("[WorldLabs generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}

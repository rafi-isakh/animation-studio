import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getCurrentSession } from "@/lib/mithrilAuth";

export const dynamic = "force-dynamic";

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const PICTURES_S3 = process.env.NEXT_PUBLIC_PICTURES_S3;

/**
 * POST /api/anime-bg/upload
 * Upload a source or reference image to S3 for the Anime BG Studio.
 * Body: { base64: string, imageId: string, type: "source" | "reference" | "result", sessionId: string, mimeType?: string }
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!BUCKET_NAME) {
      return NextResponse.json(
        { error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      base64,
      imageId,
      type,
      sessionId,
      mimeType = "image/png",
    } = body;

    if (!base64 || !imageId || !type || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields: base64, imageId, type, sessionId" },
        { status: 400 }
      );
    }

    const ext = mimeType.includes("webp")
      ? "webp"
      : mimeType.includes("jpeg") || mimeType.includes("jpg")
        ? "jpg"
        : "png";
    const s3Key = `tools/anime-bg/${sessionId}/${type}/${imageId}.${ext}`;

    const imageBuffer = Buffer.from(base64, "base64");

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: mimeType,
      })
    );

    const url = `https://${PICTURES_S3}/${s3Key}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[anime-bg/upload] Error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/anime-bg/upload
 * Delete all S3 objects for a given session.
 * Body: { sessionId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!BUCKET_NAME) {
      return NextResponse.json(
        { error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing required field: sessionId" },
        { status: 400 }
      );
    }

    const prefix = `tools/anime-bg/${sessionId}/`;
    let deletedCount = 0;
    let continuationToken: string | undefined;

    do {
      const listResult = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );

      const objects = listResult.Contents;
      if (objects && objects.length > 0) {
        await s3Client.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
              Objects: objects.map((obj) => ({ Key: obj.Key })),
              Quiet: true,
            },
          })
        );
        deletedCount += objects.length;
      }

      continuationToken = listResult.NextContinuationToken;
    } while (continuationToken);

    return NextResponse.json({ deleted: deletedCount });
  } catch (error) {
    console.error("[anime-bg/upload] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to clear session files" },
      { status: 500 }
    );
  }
}

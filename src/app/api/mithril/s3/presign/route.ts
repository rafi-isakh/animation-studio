import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getCurrentSession } from "@/lib/mithrilAuth";

export const dynamic = "force-dynamic";

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const PICTURES_S3 = process.env.NEXT_PUBLIC_PICTURES_S3;

/**
 * POST /api/mithril/s3/presign
 * Generate a presigned S3 PUT URL so the browser can upload large files
 * directly to S3, bypassing Vercel's 4.5 MB body limit.
 *
 * Request: { key: string; contentType: string }
 * Response: { presignedUrl: string; fileUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!BUCKET_NAME || !PICTURES_S3) {
      return NextResponse.json({ error: "S3 not configured" }, { status: 500 });
    }

    const { key, contentType } = await request.json();
    if (!key || !contentType) {
      return NextResponse.json({ error: "key and contentType are required" }, { status: 400 });
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const fileUrl = `https://${PICTURES_S3}/${key}`;

    return NextResponse.json({ presignedUrl, fileUrl });
  } catch (error) {
    console.error("[presign] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mithril/s3/presign
 * Delete a previously uploaded temporary file from S3.
 * Only allows deletion of keys under mithril/3d-screenshots/ for safety.
 *
 * Request: { key: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!BUCKET_NAME) {
      return NextResponse.json({ error: "S3 not configured" }, { status: 500 });
    }

    const { key } = await request.json();
    if (!key || !key.startsWith("mithril/3d-screenshots/")) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[presign] Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete file" },
      { status: 500 }
    );
  }
}

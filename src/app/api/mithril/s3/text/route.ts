import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getIdConverterTextKey } from "@/components/Mithril/services/s3/types";

export const dynamic = 'force-dynamic';

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const PICTURES_S3 = process.env.NEXT_PUBLIC_PICTURES_S3;

interface UploadTextRequest {
  projectId: string;
  text: string;
}

interface UploadTextResponse {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * POST /api/mithril/s3/text
 * Upload text content to S3 (for IdConverter source text)
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadTextResponse>> {
  try {
    if (!BUCKET_NAME) {
      return NextResponse.json(
        { success: false, url: "", error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    const body: UploadTextRequest = await request.json();
    const { projectId, text } = body;

    if (!projectId || !text) {
      return NextResponse.json(
        { success: false, url: "", error: "Missing required fields: projectId, text" },
        { status: 400 }
      );
    }

    const s3Key = getIdConverterTextKey(projectId);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: text,
        ContentType: "text/plain; charset=utf-8",
      })
    );

    const url = `https://${PICTURES_S3}/${s3Key}`;

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error("Error uploading text to S3:", error);
    return NextResponse.json(
      { success: false, url: "", error: "Failed to upload text to S3" },
      { status: 500 }
    );
  }
}

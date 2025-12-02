import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const MITHRIL_S3_FOLDER = process.env.MITHRIL_S3_FOLDER;

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!BUCKET_NAME || !MITHRIL_S3_FOLDER) {
      return NextResponse.json(
        { error: "S3 bucket or folder not configured" },
        { status: 500 }
      );
    }

    const { sessionData } = await request.json();

    if (!sessionData) {
      return NextResponse.json(
        { error: "No session data provided" },
        { status: 400 }
      );
    }

    // S3 key: folder/bgsheet_session.json
    const key = `${MITHRIL_S3_FOLDER}/bgsheet_session.json`;

    // Upload to S3 (overwrites existing file)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(sessionData),
      ContentType: "application/json",
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      key,
      savedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error saving bgsheet session to S3:", error);
    return NextResponse.json(
      { error: "Failed to save bgsheet session to S3" },
      { status: 500 }
    );
  }
}

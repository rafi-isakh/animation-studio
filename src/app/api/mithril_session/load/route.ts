import { NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const MITHRIL_S3_FOLDER = process.env.MITHRIL_S3_FOLDER;

export async function GET() {
  try {
    // Validate environment variables
    if (!BUCKET_NAME || !MITHRIL_S3_FOLDER) {
      return NextResponse.json(
        { error: "S3 bucket or folder not configured" },
        { status: 500 }
      );
    }

    // S3 key: folder/sora_session.json
    const key = `${MITHRIL_S3_FOLDER}/sora_session.json`;

    // Fetch from S3
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 404 }
      );
    }

    // Convert stream to string
    const bodyContents = await response.Body.transformToString();
    const sessionData = JSON.parse(bodyContents);

    return NextResponse.json({
      success: true,
      sessionData,
    });
  } catch (error: unknown) {
    // Check if it's a "NoSuchKey" error (file doesn't exist)
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
      return NextResponse.json(
        { error: "No session found" },
        { status: 404 }
      );
    }

    console.error("Error loading session from S3:", error);
    return NextResponse.json(
      { error: "Failed to load session from S3" },
      { status: 500 }
    );
  }
}

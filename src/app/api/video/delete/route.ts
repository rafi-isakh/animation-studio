import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

const VIDEOS_BUCKET_NAME = process.env.VIDEOS_BUCKET_NAME;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileNames } = body as { fileNames: string[] };

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: "fileNames array is required" },
        { status: 400 }
      );
    }

    // Filter to only allow video files (sora_ prefix for now, can expand later)
    const validFileNames = fileNames.filter(
      (name) =>
        typeof name === "string" &&
        name.startsWith("sora_") &&
        name.endsWith(".mp4")
    );

    if (validFileNames.length === 0) {
      return NextResponse.json(
        { error: "No valid video files to delete" },
        { status: 400 }
      );
    }

    // Delete objects from S3
    const deleteParams = {
      Bucket: VIDEOS_BUCKET_NAME,
      Delete: {
        Objects: validFileNames.map((fileName) => ({ Key: fileName })),
        Quiet: false,
      },
    };

    const result = await s3Client.send(new DeleteObjectsCommand(deleteParams));

    console.log("Deleted videos from S3:", validFileNames);

    return NextResponse.json({
      success: true,
      deleted: result.Deleted?.map((d) => d.Key) || [],
      errors: result.Errors || [],
    });
  } catch (error: unknown) {
    console.error("Error deleting videos from S3:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
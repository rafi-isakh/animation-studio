import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const maxDuration = 60;

const VIDEOS_BUCKET_NAME = process.env.VIDEOS_BUCKET_NAME;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const s3FileName = searchParams.get("s3FileName");
  const downloadFileName = searchParams.get("downloadFileName");

  if (!s3FileName || !s3FileName.endsWith(".mp4")) {
    return NextResponse.json({ error: "Invalid s3FileName" }, { status: 400 });
  }

  const fileName = downloadFileName || s3FileName;

  try {
    const command = new GetObjectCommand({
      Bucket: VIDEOS_BUCKET_NAME,
      Key: s3FileName,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        ...(response.ContentLength && {
          "Content-Length": response.ContentLength.toString(),
        }),
      },
    });
  } catch (error) {
    console.error("Error downloading video:", error);
    return NextResponse.json(
      { error: "Failed to download video" },
      { status: 500 }
    );
  }
}
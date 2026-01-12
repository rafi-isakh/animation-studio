import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import {
  UploadVideoRequest,
  UploadVideoResponse,
  DeleteVideoRequest,
  DeleteVideoResponse,
  getVideoKey,
} from "@/components/Mithril/services/s3/types";

export const dynamic = 'force-dynamic';

const VIDEOS_BUCKET_NAME = "toonyzvideosbucket";
const VIDEOS_S3 = process.env.NEXT_PUBLIC_VIDEOS_CLOUDFRONT;

/**
 * POST /api/mithril/s3/video
 * Download video from URL and upload to S3 with project-based key structure
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadVideoResponse>> {
  try {
    const body: UploadVideoRequest = await request.json();
    const { projectId, clipId, videoUrl } = body;

    if (!projectId || !clipId || !videoUrl) {
      return NextResponse.json(
        { success: false, s3Key: "", url: "", error: "Missing required fields: projectId, clipId, videoUrl" },
        { status: 400 }
      );
    }

    // Download video from URL
    const response = await fetch(videoUrl);
    if (!response.ok) {
      return NextResponse.json(
        { success: false, s3Key: "", url: "", error: `Failed to download video: ${response.statusText}` },
        { status: 500 }
      );
    }

    const videoBlob = await response.arrayBuffer();
    const videoBuffer = Buffer.from(videoBlob);

    const s3Key = getVideoKey(projectId, clipId);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: VIDEOS_BUCKET_NAME,
        Key: s3Key,
        Body: videoBuffer,
        ContentType: "video/mp4",
      })
    );

    const url = `https://${VIDEOS_S3}/${s3Key}`;

    return NextResponse.json({
      success: true,
      s3Key,
      url,
    });
  } catch (error) {
    console.error("Error uploading video to S3:", error);
    return NextResponse.json(
      { success: false, s3Key: "", url: "", error: "Failed to upload video to S3" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mithril/s3/video
 * Delete video from S3
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteVideoResponse>> {
  try {
    const body: DeleteVideoRequest = await request.json();
    const { projectId, clipId } = body;

    if (!projectId || !clipId) {
      return NextResponse.json(
        { success: false, deletedKey: "", error: "Missing required fields: projectId, clipId" },
        { status: 400 }
      );
    }

    const s3Key = getVideoKey(projectId, clipId);

    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: VIDEOS_BUCKET_NAME,
        Delete: {
          Objects: [{ Key: s3Key }],
        },
      })
    );

    return NextResponse.json({
      success: true,
      deletedKey: s3Key,
    });
  } catch (error) {
    console.error("Error deleting video from S3:", error);
    return NextResponse.json(
      { success: false, deletedKey: "", error: "Failed to delete video from S3" },
      { status: 500 }
    );
  }
}
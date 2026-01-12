import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
  UploadVideoRequest,
  UploadVideoResponse,
  DeleteVideoRequest,
  DeleteVideoResponse,
  ClearProjectRequest,
  ClearProjectResponse,
  getVideoKey,
  getProjectPrefix,
} from "@/components/Mithril/services/s3/types";

export const dynamic = 'force-dynamic';

const VIDEOS_BUCKET_NAME = "toonyzvideosbucket";
const PICTURES_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
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

/**
 * POST /api/mithril/s3/video/clear-project
 * Clear all project files from both buckets
 * This is a separate endpoint to avoid confusion with the main POST
 */
export async function PUT(request: NextRequest): Promise<NextResponse<ClearProjectResponse>> {
  try {
    if (!PICTURES_BUCKET_NAME) {
      return NextResponse.json(
        { success: false, deletedCount: 0, error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    const body: ClearProjectRequest = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { success: false, deletedCount: 0, error: "Missing required field: projectId" },
        { status: 400 }
      );
    }

    const prefix = getProjectPrefix(projectId);
    let deletedCount = 0;

    // Delete from pictures bucket (characters, backgrounds, storyboard images)
    const picturesListResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: PICTURES_BUCKET_NAME,
        Prefix: prefix,
      })
    );

    if (picturesListResponse.Contents && picturesListResponse.Contents.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: PICTURES_BUCKET_NAME,
          Delete: {
            Objects: picturesListResponse.Contents.map(obj => ({ Key: obj.Key! })),
          },
        })
      );
      deletedCount += picturesListResponse.Contents.length;
    }

    // Delete from videos bucket
    const videosListResponse = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: VIDEOS_BUCKET_NAME,
        Prefix: prefix,
      })
    );

    if (videosListResponse.Contents && videosListResponse.Contents.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: VIDEOS_BUCKET_NAME,
          Delete: {
            Objects: videosListResponse.Contents.map(obj => ({ Key: obj.Key! })),
          },
        })
      );
      deletedCount += videosListResponse.Contents.length;
    }

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (error) {
    console.error("Error clearing project from S3:", error);
    return NextResponse.json(
      { success: false, deletedCount: 0, error: "Failed to clear project from S3" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
  ClearProjectRequest,
  ClearProjectResponse,
  getProjectPrefix,
} from "@/components/Mithril/services/s3/types";

export const dynamic = 'force-dynamic';

const VIDEOS_BUCKET_NAME = "toonyzvideosbucket";
const PICTURES_BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;

/**
 * DELETE /api/mithril/s3/clear-project
 * Clear all project files from both S3 buckets (images and videos)
 * Used when deleting a project to clean up all associated files
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ClearProjectResponse>> {
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
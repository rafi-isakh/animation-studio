import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
  UploadImageRequest,
  UploadImageResponse,
  DeleteImageRequest,
  DeleteImageResponse,
  getCharacterImageKey,
  getBackgroundImageKey,
  getBackgroundFolderPrefix,
  getStoryboardImageKey,
} from "@/components/Mithril/services/s3/types";

export const dynamic = 'force-dynamic';

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const PICTURES_S3 = process.env.NEXT_PUBLIC_PICTURES_S3;

/**
 * POST /api/mithril/s3/image
 * Upload an image to S3 with project-based key structure
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadImageResponse>> {
  try {
    if (!BUCKET_NAME) {
      return NextResponse.json(
        { success: false, s3Key: "", url: "", error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    const body: UploadImageRequest = await request.json();
    const { projectId, imageType, base64, mimeType = "image/webp" } = body;

    if (!projectId || !imageType || !base64) {
      return NextResponse.json(
        { success: false, s3Key: "", url: "", error: "Missing required fields: projectId, imageType, base64" },
        { status: 400 }
      );
    }

    let s3Key: string;

    switch (imageType) {
      case "character": {
        const { characterId } = body;
        if (!characterId) {
          return NextResponse.json(
            { success: false, s3Key: "", url: "", error: "characterId is required for character images" },
            { status: 400 }
          );
        }
        s3Key = getCharacterImageKey(projectId, characterId);
        break;
      }
      case "background": {
        const { bgId, angle } = body;
        if (!bgId || !angle) {
          return NextResponse.json(
            { success: false, s3Key: "", url: "", error: "bgId and angle are required for background images" },
            { status: 400 }
          );
        }
        s3Key = getBackgroundImageKey(projectId, bgId, angle);
        break;
      }
      case "storyboard": {
        const { sceneIndex, clipIndex } = body;
        if (sceneIndex === undefined || clipIndex === undefined) {
          return NextResponse.json(
            { success: false, s3Key: "", url: "", error: "sceneIndex and clipIndex are required for storyboard images" },
            { status: 400 }
          );
        }
        s3Key = getStoryboardImageKey(projectId, sceneIndex, clipIndex);
        break;
      }
      default:
        return NextResponse.json(
          { success: false, s3Key: "", url: "", error: `Invalid imageType: ${imageType}` },
          { status: 400 }
        );
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64, "base64");

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: mimeType,
      })
    );

    const url = `https://${PICTURES_S3}/${s3Key}`;

    return NextResponse.json({
      success: true,
      s3Key,
      url,
    });
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    return NextResponse.json(
      { success: false, s3Key: "", url: "", error: "Failed to upload image to S3" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mithril/s3/image
 * Delete image(s) from S3
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteImageResponse>> {
  try {
    if (!BUCKET_NAME) {
      return NextResponse.json(
        { success: false, deletedKeys: [], error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    const body: DeleteImageRequest = await request.json();
    const { projectId, imageType } = body;

    if (!projectId || !imageType) {
      return NextResponse.json(
        { success: false, deletedKeys: [], error: "Missing required fields: projectId, imageType" },
        { status: 400 }
      );
    }

    let keysToDelete: string[] = [];

    switch (imageType) {
      case "character": {
        const { characterId } = body;
        if (!characterId) {
          return NextResponse.json(
            { success: false, deletedKeys: [], error: "characterId is required for character images" },
            { status: 400 }
          );
        }
        keysToDelete = [getCharacterImageKey(projectId, characterId)];
        break;
      }
      case "background": {
        const { bgId, angle } = body;
        if (!bgId) {
          return NextResponse.json(
            { success: false, deletedKeys: [], error: "bgId is required for background images" },
            { status: 400 }
          );
        }
        if (angle) {
          // Delete specific angle
          keysToDelete = [getBackgroundImageKey(projectId, bgId, angle)];
        } else {
          // Delete all angles for this background
          const prefix = getBackgroundFolderPrefix(projectId, bgId);
          const listResponse = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: BUCKET_NAME,
              Prefix: prefix,
            })
          );
          if (listResponse.Contents) {
            keysToDelete = listResponse.Contents.map(obj => obj.Key!).filter(Boolean);
          }
        }
        break;
      }
      case "storyboard": {
        const { sceneIndex, clipIndex } = body;
        if (sceneIndex === undefined || clipIndex === undefined) {
          return NextResponse.json(
            { success: false, deletedKeys: [], error: "sceneIndex and clipIndex are required for storyboard images" },
            { status: 400 }
          );
        }
        keysToDelete = [getStoryboardImageKey(projectId, sceneIndex, clipIndex)];
        break;
      }
      default:
        return NextResponse.json(
          { success: false, deletedKeys: [], error: `Invalid imageType: ${imageType}` },
          { status: 400 }
        );
    }

    if (keysToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        deletedKeys: [],
      });
    }

    // Delete from S3
    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: keysToDelete.map(Key => ({ Key })),
        },
      })
    );

    return NextResponse.json({
      success: true,
      deletedKeys: keysToDelete,
    });
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    return NextResponse.json(
      { success: false, deletedKeys: [], error: "Failed to delete image from S3" },
      { status: 500 }
    );
  }
}
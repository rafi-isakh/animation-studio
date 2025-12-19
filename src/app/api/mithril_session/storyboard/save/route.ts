import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const dynamic = 'force-dynamic';

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const MITHRIL_S3_FOLDER = process.env.MITHRIL_S3_FOLDER;

interface StoryboardSceneImage {
  id: string;
  type: string;
  base64: string;
  mimeType: string;
  sceneIndex: number;
  clipIndex: number;
  clipName: string;
  imagePrompt: string;
  selectedBgId: string;
  createdAt: number;
}

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

    // 1. Delete existing images in storyboard_images/ folder (to replace old session)
    const imagesPrefix = `${MITHRIL_S3_FOLDER}/storyboard_images/`;
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: imagesPrefix,
    });
    const listResponse = await s3Client.send(listCommand);

    if (listResponse.Contents && listResponse.Contents.length > 0) {
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: listResponse.Contents.map(obj => ({ Key: obj.Key! })),
        },
      });
      await s3Client.send(deleteCommand);
    }

    // 2. Upload each scene image separately to S3
    const storyboardSceneImages: StoryboardSceneImage[] = sessionData.storyboardSceneImages || [];
    const uploadedImages = await Promise.all(
      storyboardSceneImages.map(async (img: StoryboardSceneImage) => {
        if (!img.base64) {
          return { ...img, base64: undefined, s3Key: "" };
        }

        // Use id (e.g., "scene_1.1") as filename
        const imageKey = `${MITHRIL_S3_FOLDER}/storyboard_images/${img.id}.jpg`;
        const imageBuffer = Buffer.from(img.base64, "base64");

        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: imageKey,
            Body: imageBuffer,
            ContentType: img.mimeType || "image/jpeg",
          })
        );

        return {
          id: img.id,
          type: img.type,
          mimeType: img.mimeType,
          sceneIndex: img.sceneIndex,
          clipIndex: img.clipIndex,
          clipName: img.clipName,
          imagePrompt: img.imagePrompt,
          selectedBgId: img.selectedBgId,
          createdAt: img.createdAt,
          s3Key: imageKey,
        };
      })
    );

    // 3. Save metadata (without base64) to session JSON
    const metadataSession = {
      ...sessionData,
      storyboardSceneImages: uploadedImages,
    };

    const metadataKey = `${MITHRIL_S3_FOLDER}/storyboard_session.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: metadataKey,
        Body: JSON.stringify(metadataSession),
        ContentType: "application/json",
      })
    );

    return NextResponse.json({
      success: true,
      key: metadataKey,
      imagesUploaded: uploadedImages.filter(img => img.s3Key).length,
      savedAt: Date.now(),
    });
  } catch (error) {
    console.error("Error saving storyboard session to S3:", error);
    return NextResponse.json(
      { error: "Failed to save storyboard session to S3" },
      { status: 500 }
    );
  }
}

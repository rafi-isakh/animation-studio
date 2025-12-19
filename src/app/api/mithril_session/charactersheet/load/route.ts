import { NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = 'force-dynamic';

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME;
const MITHRIL_S3_FOLDER = process.env.MITHRIL_S3_FOLDER;

interface CharacterImageMetadata {
  id: string;
  type: string;
  mimeType: string;
  characterId: string;
  createdAt: number;
  s3Key?: string;
  base64?: string;
}

export async function GET() {
  try {
    // Validate environment variables
    if (!BUCKET_NAME || !MITHRIL_S3_FOLDER) {
      return NextResponse.json(
        { error: "S3 bucket or folder not configured" },
        { status: 500 }
      );
    }

    // 1. Load metadata JSON
    const metadataKey = `${MITHRIL_S3_FOLDER}/charactersheet_session.json`;
    const metadataCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: metadataKey,
    });

    const metadataResponse = await s3Client.send(metadataCommand);

    if (!metadataResponse.Body) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 404 }
      );
    }

    const bodyContents = await metadataResponse.Body.transformToString();
    const sessionData = JSON.parse(bodyContents);

    // 2. Load each image from S3 (if they have s3Key)
    const characterImages: CharacterImageMetadata[] = sessionData.characterImages || [];
    const imagesWithData = await Promise.all(
      characterImages.map(async (img: CharacterImageMetadata) => {
        // Backwards compatibility: if no s3Key, image might have inline base64 (old format)
        if (!img.s3Key) {
          return img;
        }

        try {
          const imageCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: img.s3Key,
          });

          const imageResponse = await s3Client.send(imageCommand);

          if (!imageResponse.Body) {
            console.error(`No body for image ${img.s3Key}`);
            return { ...img, base64: "", s3Key: undefined };
          }

          const imageBuffer = await imageResponse.Body.transformToByteArray();
          const base64 = Buffer.from(imageBuffer).toString("base64");

          return {
            id: img.id,
            type: img.type,
            mimeType: img.mimeType,
            characterId: img.characterId,
            createdAt: img.createdAt,
            base64,
          };
        } catch (err) {
          console.error(`Failed to load image ${img.s3Key}:`, err);
          return { ...img, base64: "", s3Key: undefined };
        }
      })
    );

    // 3. Return complete session with images
    return NextResponse.json({
      success: true,
      sessionData: {
        ...sessionData,
        characterImages: imagesWithData,
      },
    });
  } catch (error: unknown) {
    // Check if it's a "NoSuchKey" error (file doesn't exist)
    if (error && typeof error === "object" && "name" in error && error.name === "NoSuchKey") {
      return NextResponse.json(
        { error: "No session found" },
        { status: 404 }
      );
    }

    console.error("Error loading charactersheet session from S3:", error);
    return NextResponse.json(
      { error: "Failed to load charactersheet session from S3" },
      { status: 500 }
    );
  }
}

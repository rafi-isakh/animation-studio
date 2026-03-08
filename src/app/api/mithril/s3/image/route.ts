import { NextRequest, NextResponse } from "next/server";
import { s3Client } from "@/utils/s3";
import { PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
  UploadImageRequest,
  UploadImageResponse,
  DeleteImageRequest,
  DeleteImageResponse,
  getCharacterImageKey,
  getCharacterProfileImageKey,
  getCharacterMasterSheetKey,
  getCharacterModeImageKey,
  getCharacterFolderPrefix,
  getBackgroundImageKey,
  getBackgroundFolderPrefix,
  getStoryboardImageKey,
  getStyleSlotImageKey,
  getImageGenFrameKey,
  getImageGenRemixKey,
  getImageGenEditedKey,
  getImageGenFolderPrefix,
  getPropDesignSheetKey,
  getPropReferenceImageKey,
  getPropFolderPrefix,
  getI2VPageKey,
  getI2VPagePrefix,
  getI2VPanelKey,
  getI2VPanelPrefix,
  getI2VFolderPrefix,
  getI2VStoryboardFrameKey,
  getI2VStoryboardFrameEndKey,
  getI2VStoryboardAssetKey,
  getI2VStoryboardFolderPrefix,
  getI2VPanelEditorKey,
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
        const { characterId, characterSubtype, modeId } = body;
        if (!characterId) {
          return NextResponse.json(
            { success: false, s3Key: "", url: "", error: "characterId is required for character images" },
            { status: 400 }
          );
        }
        // Use appropriate key based on subtype
        switch (characterSubtype) {
          case "profile":
            s3Key = getCharacterProfileImageKey(projectId, characterId);
            break;
          case "mastersheet":
            s3Key = getCharacterMasterSheetKey(projectId, characterId);
            break;
          case "mode":
            if (!modeId) {
              return NextResponse.json(
                { success: false, s3Key: "", url: "", error: "modeId is required for character mode images" },
                { status: 400 }
              );
            }
            s3Key = getCharacterModeImageKey(projectId, characterId, modeId);
            break;
          case "legacy":
          default:
            // Backward compatibility: use legacy key format
            s3Key = getCharacterImageKey(projectId, characterId);
            break;
        }
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
      case "style-slot": {
        const { slotIndex } = body;
        if (slotIndex === undefined) {
          return NextResponse.json(
            { success: false, s3Key: "", url: "", error: "slotIndex is required for style-slot images" },
            { status: 400 }
          );
        }
        s3Key = getStyleSlotImageKey(projectId, slotIndex);
        break;
      }
      case "imagegen": {
        const { frameId, imageGenSubtype } = body;
        if (!frameId) {
          return NextResponse.json(
            { success: false, s3Key: "", url: "", error: "frameId is required for imagegen images" },
            { status: 400 }
          );
        }
        switch (imageGenSubtype) {
          case "remix":
            s3Key = getImageGenRemixKey(projectId, frameId);
            break;
          case "edited":
            s3Key = getImageGenEditedKey(projectId, frameId);
            break;
          case "frame":
          default:
            s3Key = getImageGenFrameKey(projectId, frameId);
            break;
        }
        break;
      }
      case "prop": {
        const { propId, propSubtype } = body;
        if (!propId) {
          return NextResponse.json(
            { success: false, s3Key: "", url: "", error: "propId is required for prop images" },
            { status: 400 }
          );
        }
        switch (propSubtype) {
          case "reference":
            s3Key = getPropReferenceImageKey(projectId, propId);
            break;
          case "designsheet":
          default:
            s3Key = getPropDesignSheetKey(projectId, propId);
            break;
        }
        break;
      }
      case "i2v": {
        const { i2vSubtype, pageIndex, panelIndex, i2vSceneIndex, i2vClipIndex, assetId, assetType, panelEditorId } = body;
        switch (i2vSubtype) {
          case "panel":
            if (pageIndex === undefined || panelIndex === undefined) {
              return NextResponse.json(
                { success: false, s3Key: "", url: "", error: "pageIndex and panelIndex are required for i2v panel images" },
                { status: 400 }
              );
            }
            s3Key = getI2VPanelKey(projectId, pageIndex, panelIndex);
            break;
          case "panel-editor":
            if (!panelEditorId) {
              return NextResponse.json(
                { success: false, s3Key: "", url: "", error: "panelEditorId is required for panel-editor images" },
                { status: 400 }
              );
            }
            s3Key = getI2VPanelEditorKey(projectId, panelEditorId);
            break;
          case "page":
            if (pageIndex === undefined) {
              return NextResponse.json(
                { success: false, s3Key: "", url: "", error: "pageIndex is required for i2v page images" },
                { status: 400 }
              );
            }
            s3Key = getI2VPageKey(projectId, pageIndex);
            break;
          case "storyboard-frame":
            if (i2vSceneIndex === undefined || i2vClipIndex === undefined) {
              return NextResponse.json(
                { success: false, s3Key: "", url: "", error: "i2vSceneIndex and i2vClipIndex are required for i2v storyboard frame images" },
                { status: 400 }
              );
            }
            s3Key = getI2VStoryboardFrameKey(projectId, i2vSceneIndex, i2vClipIndex);
            break;
          case "storyboard-frame-end":
            if (i2vSceneIndex === undefined || i2vClipIndex === undefined) {
              return NextResponse.json(
                { success: false, s3Key: "", url: "", error: "i2vSceneIndex and i2vClipIndex are required for i2v storyboard frame end images" },
                { status: 400 }
              );
            }
            s3Key = getI2VStoryboardFrameEndKey(projectId, i2vSceneIndex, i2vClipIndex);
            break;
          case "storyboard-asset":
            if (!assetId || !assetType) {
              return NextResponse.json(
                { success: false, s3Key: "", url: "", error: "assetId and assetType are required for i2v storyboard asset images" },
                { status: 400 }
              );
            }
            s3Key = getI2VStoryboardAssetKey(projectId, assetId, assetType);
            break;
          default:
            return NextResponse.json(
              { success: false, s3Key: "", url: "", error: "i2vSubtype is required for i2v images" },
              { status: 400 }
            );
        }
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
        const { characterId, characterSubtype, modeId } = body;
        if (!characterId) {
          return NextResponse.json(
            { success: false, deletedKeys: [], error: "characterId is required for character images" },
            { status: 400 }
          );
        }
        // Use appropriate key based on subtype
        switch (characterSubtype) {
          case "profile":
            keysToDelete = [getCharacterProfileImageKey(projectId, characterId)];
            break;
          case "mastersheet":
            keysToDelete = [getCharacterMasterSheetKey(projectId, characterId)];
            break;
          case "mode":
            if (!modeId) {
              return NextResponse.json(
                { success: false, deletedKeys: [], error: "modeId is required for character mode images" },
                { status: 400 }
              );
            }
            keysToDelete = [getCharacterModeImageKey(projectId, characterId, modeId)];
            break;
          case "legacy":
            keysToDelete = [getCharacterImageKey(projectId, characterId)];
            break;
          default:
            // Delete all character images (profile, mastersheet, modes, legacy)
            const prefix = getCharacterFolderPrefix(projectId, characterId);
            const listResponse = await s3Client.send(
              new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: prefix,
              })
            );
            if (listResponse.Contents) {
              keysToDelete = listResponse.Contents.map(obj => obj.Key!).filter(Boolean);
            }
            // Also try to delete legacy format
            keysToDelete.push(getCharacterImageKey(projectId, characterId));
            break;
        }
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
      case "style-slot": {
        const { slotIndex } = body;
        if (slotIndex === undefined) {
          return NextResponse.json(
            { success: false, deletedKeys: [], error: "slotIndex is required for style-slot images" },
            { status: 400 }
          );
        }
        keysToDelete = [getStyleSlotImageKey(projectId, slotIndex)];
        break;
      }
      case "imagegen": {
        const { frameId, imageGenSubtype } = body;
        if (!frameId) {
          // Delete all imagegen images if no frameId specified
          const prefix = getImageGenFolderPrefix(projectId);
          const listResponse = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: BUCKET_NAME,
              Prefix: prefix,
            })
          );
          if (listResponse.Contents) {
            keysToDelete = listResponse.Contents.map(obj => obj.Key!).filter(Boolean);
          }
        } else {
          switch (imageGenSubtype) {
            case "remix":
              keysToDelete = [getImageGenRemixKey(projectId, frameId)];
              break;
            case "edited":
              keysToDelete = [getImageGenEditedKey(projectId, frameId)];
              break;
            case "frame":
            default:
              keysToDelete = [getImageGenFrameKey(projectId, frameId)];
              break;
          }
        }
        break;
      }
      case "prop": {
        const { propId, propSubtype } = body;
        if (!propId) {
          return NextResponse.json(
            { success: false, deletedKeys: [], error: "propId is required for prop images" },
            { status: 400 }
          );
        }
        if (!propSubtype) {
          // Delete all prop images if no subtype specified
          const prefix = getPropFolderPrefix(projectId, propId);
          const listResponse = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: BUCKET_NAME,
              Prefix: prefix,
            })
          );
          if (listResponse.Contents) {
            keysToDelete = listResponse.Contents.map(obj => obj.Key!).filter(Boolean);
          }
        } else {
          switch (propSubtype) {
            case "reference":
              keysToDelete = [getPropReferenceImageKey(projectId, propId)];
              break;
            case "designsheet":
            default:
              keysToDelete = [getPropDesignSheetKey(projectId, propId)];
              break;
          }
        }
        break;
      }
      case "i2v": {
        const { i2vSubtype, pageIndex, panelIndex, i2vSceneIndex, i2vClipIndex, assetId, assetType, panelEditorId } = body;
        switch (i2vSubtype) {
          case "panel-editor":
            if (panelEditorId) {
              keysToDelete = [getI2VPanelEditorKey(projectId, panelEditorId)];
            }
            break;
          case "panel":
            if (pageIndex !== undefined && panelIndex !== undefined) {
              // Use prefix listing to catch both legacy keys ({pageIndex}_{panelIndex}.webp)
              // and job-suffixed keys ({pageIndex}_{panelIndex}_{jobId}.webp).
              const panelPrefix = getI2VPanelPrefix(projectId, pageIndex, panelIndex);
              const panelList = await s3Client.send(
                new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: panelPrefix })
              );
              if (panelList.Contents) {
                const panelPattern = new RegExp(`/${pageIndex}_${panelIndex}(\\.webp|_[^/]+\\.webp)$`);
                keysToDelete = panelList.Contents
                  .map(obj => obj.Key!)
                  .filter(key => key && panelPattern.test(key));
              }
            }
            break;
          case "page":
            if (pageIndex !== undefined) {
              // Use prefix listing to catch both legacy keys ({pageIndex}.webp)
              // and job-suffixed keys ({pageIndex}_{jobId}.webp).
              const pagePrefix = getI2VPagePrefix(projectId, pageIndex);
              const pageList = await s3Client.send(
                new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: pagePrefix })
              );
              if (pageList.Contents) {
                const pagePattern = new RegExp(`/${pageIndex}(\\.webp|_[^/]+\\.webp)$`);
                keysToDelete = pageList.Contents
                  .map(obj => obj.Key!)
                  .filter(key => key && pagePattern.test(key));
              }
            }
            break;
          case "storyboard-frame":
            if (i2vSceneIndex !== undefined && i2vClipIndex !== undefined) {
              keysToDelete = [getI2VStoryboardFrameKey(projectId, i2vSceneIndex, i2vClipIndex)];
            }
            break;
          case "storyboard-frame-end":
            if (i2vSceneIndex !== undefined && i2vClipIndex !== undefined) {
              keysToDelete = [getI2VStoryboardFrameEndKey(projectId, i2vSceneIndex, i2vClipIndex)];
            }
            break;
          case "storyboard-asset":
            if (assetId && assetType) {
              keysToDelete = [getI2VStoryboardAssetKey(projectId, assetId, assetType)];
            }
            break;
          default:
            // Delete all i2v content if no subtype specified
            const prefix = getI2VFolderPrefix(projectId);
            const listResponse = await s3Client.send(
              new ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                Prefix: prefix,
              })
            );
            if (listResponse.Contents) {
              keysToDelete = listResponse.Contents.map(obj => obj.Key!).filter(Boolean);
            }
            break;
        }
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
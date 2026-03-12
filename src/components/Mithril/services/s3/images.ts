/**
 * S3 Image Service for Mithril
 * Client-side service for uploading/deleting images to S3 via API routes
 *
 * S3 Key Structure:
 * mithril/{projectId}/
 * ├── characters/{characterId}.webp
 * ├── backgrounds/{bgId}/{angle}.webp
 * ├── storyboard/{sceneIndex}_{clipIndex}.webp
 * └── videos/{clipId}.mp4
 */

import {
  UploadImageRequest,
  UploadImageResponse,
  DeleteImageRequest,
  DeleteImageResponse,
  UploadVideoRequest,
  UploadVideoResponse,
  DeleteVideoRequest,
  DeleteVideoResponse,
  ClearProjectRequest,
  ClearProjectResponse,
  CharacterImageSubtype,
  ImageGenImageSubtype,
  I2VImageSubtype,
  getCharacterImageKey,
  getBackgroundImageKey,
  getStoryboardImageKey,
  getVideoKey,
  getCharacterProfileImageKey,
  getCharacterMasterSheetKey,
  getCharacterModeImageKey,
  getStyleSlotImageKey,
  getImageGenFrameKey,
  getImageGenRemixKey,
  getImageGenEditedKey,
  getI2VPageKey,
  getI2VPanelKey,
  getI2VPanelEditorKey,
} from './types';

const IMAGE_API_URL = '/api/mithril/s3/image';
const VIDEO_API_URL = '/api/mithril/s3/video';
const CLEAR_PROJECT_API_URL = '/api/mithril/s3/clear-project';

// ============================================================================
// Character Images
// ============================================================================

/**
 * Upload a character image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadCharacterImage(
  projectId: string,
  characterId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'character',
    characterId,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload character image');
  }

  return result.url;
}

/**
 * Delete a character image from S3
 */
export async function deleteCharacterImage(
  projectId: string,
  characterId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'character',
    characterId,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete character image');
  }
}

// ============================================================================
// Background Images
// ============================================================================

/**
 * Upload a background image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadBackgroundImage(
  projectId: string,
  bgId: string,
  angle: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'background',
    bgId,
    angle,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload background image');
  }

  return result.url;
}

/**
 * Delete a specific background angle image from S3
 */
export async function deleteBackgroundImage(
  projectId: string,
  bgId: string,
  angle: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'background',
    bgId,
    angle,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete background image');
  }
}

/**
 * Delete all angle images for a background from S3
 */
export async function deleteAllBackgroundImages(
  projectId: string,
  bgId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'background',
    bgId,
    // No angle = delete all
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete background images');
  }
}

/**
 * Upload a background reference image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadBackgroundReferenceImage(
  projectId: string,
  bgId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'background',
    bgId,
    angle: '_reference', // Special angle name for reference image
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload background reference image');
  }

  return result.url;
}

/**
 * Delete a background reference image from S3
 */
export async function deleteBackgroundReferenceImage(
  projectId: string,
  bgId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'background',
    bgId,
    angle: '_reference', // Special angle name for reference image
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete background reference image');
  }
}

// ============================================================================
// Storyboard Images
// ============================================================================

/**
 * Upload a storyboard clip image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadStoryboardImage(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'storyboard',
    sceneIndex,
    clipIndex,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload storyboard image');
  }

  return result.url;
}

/**
 * Delete a storyboard clip image from S3
 */
export async function deleteStoryboardImage(
  projectId: string,
  sceneIndex: number,
  clipIndex: number
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'storyboard',
    sceneIndex,
    clipIndex,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete storyboard image');
  }
}

// ============================================================================
// Videos
// ============================================================================

/**
 * Download video from URL and upload to S3
 * @returns S3 URL for the uploaded video
 */
export async function uploadVideo(
  projectId: string,
  clipId: string,
  videoUrl: string
): Promise<string> {
  const request: UploadVideoRequest = {
    projectId,
    clipId,
    videoUrl,
  };

  const response = await fetch(VIDEO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadVideoResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload video');
  }

  return result.url;
}

/**
 * Delete a video from S3
 */
export async function deleteVideo(
  projectId: string,
  clipId: string
): Promise<void> {
  const request: DeleteVideoRequest = {
    projectId,
    clipId,
  };

  const response = await fetch(VIDEO_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteVideoResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete video');
  }
}

// ============================================================================
// Project Cleanup
// ============================================================================

/**
 * Clear all S3 files for a project (images and videos)
 * Used when deleting a project
 */
export async function clearAllProjectFiles(projectId: string): Promise<number> {
  const request: ClearProjectRequest = {
    projectId,
  };

  const response = await fetch(CLEAR_PROJECT_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: ClearProjectResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to clear project files');
  }

  return result.deletedCount;
}

// ============================================================================
// Character Sheet v2 - Profile, Master Sheet, Mode Images
// ============================================================================

/**
 * Upload a character profile image (1:1 headshot) to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadCharacterProfileImage(
  projectId: string,
  characterId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'character',
    characterId,
    characterSubtype: 'profile',
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload character profile image');
  }

  return result.url;
}

/**
 * Delete a character profile image from S3
 */
export async function deleteCharacterProfileImage(
  projectId: string,
  characterId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'character',
    characterId,
    characterSubtype: 'profile',
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete character profile image');
  }
}

/**
 * Upload a character master sheet image (16:9, 4 views) to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadCharacterMasterSheetImage(
  projectId: string,
  characterId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'character',
    characterId,
    characterSubtype: 'mastersheet',
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload character master sheet image');
  }

  return result.url;
}

/**
 * Delete a character master sheet image from S3
 */
export async function deleteCharacterMasterSheetImage(
  projectId: string,
  characterId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'character',
    characterId,
    characterSubtype: 'mastersheet',
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete character master sheet image');
  }
}

/**
 * Upload a character mode image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadCharacterModeImage(
  projectId: string,
  characterId: string,
  modeId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'character',
    characterId,
    characterSubtype: 'mode',
    modeId,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload character mode image');
  }

  return result.url;
}

/**
 * Delete a character mode image from S3
 */
export async function deleteCharacterModeImage(
  projectId: string,
  characterId: string,
  modeId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'character',
    characterId,
    characterSubtype: 'mode',
    modeId,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete character mode image');
  }
}

// ============================================================================
// Style Slot Images
// ============================================================================

/**
 * Upload a style slot image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadStyleSlotImage(
  projectId: string,
  slotIndex: number,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'style-slot',
    slotIndex,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload style slot image');
  }

  return result.url;
}

/**
 * Delete a style slot image from S3
 */
export async function deleteStyleSlotImage(
  projectId: string,
  slotIndex: number
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'style-slot',
    slotIndex,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete style slot image');
  }
}

// ============================================================================
// Prop Designer Images (Stage 5)
// ============================================================================

/**
 * Upload a prop design sheet image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadPropDesignSheetImage(
  projectId: string,
  propId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'prop',
    propId,
    propSubtype: 'designsheet',
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload prop design sheet image');
  }

  return result.url;
}

/**
 * Upload a prop reference image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadPropReferenceImage(
  projectId: string,
  propId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'prop',
    propId,
    propSubtype: 'reference',
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload prop reference image');
  }

  return result.url;
}

/**
 * Delete a prop design sheet image from S3
 */
export async function deletePropDesignSheetImage(
  projectId: string,
  propId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'prop',
    propId,
    propSubtype: 'designsheet',
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete prop design sheet image');
  }
}

/**
 * Delete a prop reference image from S3
 */
export async function deletePropReferenceImage(
  projectId: string,
  propId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'prop',
    propId,
    propSubtype: 'reference',
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete prop reference image');
  }
}

/**
 * Delete all images for a prop (both design sheet and reference)
 */
export async function deletePropImages(
  projectId: string,
  propId: string
): Promise<void> {
  // Delete design sheet
  try {
    await deletePropDesignSheetImage(projectId, propId);
  } catch (error) {
    console.warn(`Failed to delete prop design sheet for ${propId}:`, error);
  }

  // Delete reference image
  try {
    await deletePropReferenceImage(projectId, propId);
  } catch (error) {
    console.warn(`Failed to delete prop reference for ${propId}:`, error);
  }
}

// ============================================================================
// ImageGen Images (Stage 6)
// ============================================================================

/**
 * Upload an imagegen frame image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadImageGenFrameImage(
  projectId: string,
  frameId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'imagegen',
    frameId,
    imageGenSubtype: 'frame',
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload imagegen frame image');
  }

  return result.url;
}

/**
 * Upload an imagegen remix image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadImageGenRemixImage(
  projectId: string,
  frameId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'imagegen',
    frameId,
    imageGenSubtype: 'remix',
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload imagegen remix image');
  }

  return result.url;
}

/**
 * Upload an imagegen edited image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadImageGenEditedImage(
  projectId: string,
  frameId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'imagegen',
    frameId,
    imageGenSubtype: 'edited',
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload imagegen edited image');
  }

  return result.url;
}

/**
 * Delete an imagegen frame image from S3
 */
export async function deleteImageGenFrameImage(
  projectId: string,
  frameId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'imagegen',
    frameId,
    imageGenSubtype: 'frame',
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete imagegen frame image');
  }
}

/**
 * Delete an imagegen remix image from S3
 */
export async function deleteImageGenRemixImage(
  projectId: string,
  frameId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'imagegen',
    frameId,
    imageGenSubtype: 'remix',
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete imagegen remix image');
  }
}

/**
 * Delete an imagegen edited image from S3
 */
export async function deleteImageGenEditedImage(
  projectId: string,
  frameId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'imagegen',
    frameId,
    imageGenSubtype: 'edited',
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete imagegen edited image');
  }
}

// ============================================================================
// ImageGen Replacement Assets
// ============================================================================

/**
 * Upload a replacement asset (character or background) to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadImageGenReplacementAsset(
  projectId: string,
  assetId: string,
  category: 'character' | 'background',
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'imagegen',
    frameId: `replacement_${category}_${assetId}`,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload replacement asset');
  }

  return result.url;
}

/**
 * Delete a replacement asset from S3
 */
export async function deleteImageGenReplacementAsset(
  projectId: string,
  assetId: string,
  category: 'character' | 'background'
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'imagegen',
    frameId: `replacement_${category}_${assetId}`,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete replacement asset');
  }
}

// ============================================================================
// Image-to-Video (I2V) Images
// ============================================================================

/**
 * Upload an I2V page image (full manga page) to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadI2VPageImage(
  projectId: string,
  pageIndex: number,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const key = getI2VPageKey(projectId, pageIndex);

  // Request a presigned PUT URL — avoids routing base64 through Next.js body parser
  // which has a 4 MB limit (problematic for tall webtoon pages).
  const presignRes = await fetch('/api/mithril/s3/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, contentType: mimeType }),
  });

  const presignData = await presignRes.json();
  if (!presignRes.ok) {
    throw new Error(presignData.error || 'Failed to get presigned upload URL');
  }

  // Convert base64 → binary and PUT directly to S3 (bypasses Next.js entirely)
  const binaryStr = atob(base64);
  const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));

  const uploadRes = await fetch(presignData.presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: bytes,
  });

  if (!uploadRes.ok) {
    throw new Error('Failed to upload I2V page image to S3');
  }

  return presignData.fileUrl;
}

/**
 * Upload an I2V panel image (cropped panel) to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadI2VPanelImage(
  projectId: string,
  pageIndex: number,
  panelIndex: number,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'panel',
    pageIndex,
    panelIndex,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload I2V panel image');
  }

  return result.url;
}

/**
 * Delete an I2V page image from S3
 */
export async function deleteI2VPageImage(
  projectId: string,
  pageIndex: number
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'page',
    pageIndex,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete I2V page image');
  }
}

/**
 * Delete an I2V panel image from S3
 */
export async function deleteI2VPanelImage(
  projectId: string,
  pageIndex: number,
  panelIndex: number
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'panel',
    pageIndex,
    panelIndex,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete I2V panel image');
  }
}

/**
 * Delete all I2V images (pages and panels) for a project from S3
 */
export async function clearAllI2VImages(projectId: string): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'i2v',
    // No pageIndex = delete all
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to clear I2V images');
  }
}

// ============================================================================
// I2V Panel Editor Original Images
// ============================================================================

/**
 * Upload a panel editor original image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadI2VPanelEditorImage(
  projectId: string,
  panelEditorId: string,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'panel-editor',
    panelEditorId,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload panel editor image');
  }

  return result.url;
}

/**
 * Delete a panel editor original image from S3
 */
export async function deleteI2VPanelEditorImage(
  projectId: string,
  panelEditorId: string
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'panel-editor',
    panelEditorId,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete panel editor image');
  }
}

// ============================================================================
// URL Generators (for reference, primarily used server-side)
// ============================================================================

// ============================================================================
// I2V Storyboard Images (Stage 4)
// ============================================================================

/**
 * Upload an I2V storyboard frame image (start frame) to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadI2VStoryboardFrameImage(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'storyboard-frame',
    i2vSceneIndex: sceneIndex,
    i2vClipIndex: clipIndex,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload I2V storyboard frame image');
  }

  return result.url;
}

/**
 * Upload an I2V storyboard frame end image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadI2VStoryboardFrameEndImage(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'storyboard-frame-end',
    i2vSceneIndex: sceneIndex,
    i2vClipIndex: clipIndex,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload I2V storyboard frame end image');
  }

  return result.url;
}

/**
 * Upload an I2V storyboard asset image to S3
 * @returns S3 URL for the uploaded image
 */
export async function uploadI2VStoryboardAssetImage(
  projectId: string,
  assetId: string,
  assetType: 'character' | 'background',
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'storyboard-asset',
    assetId,
    assetType,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload I2V storyboard asset image');
  }

  return result.url;
}

/**
 * Upload an I2V storyboard reference image to S3 (custom user-uploaded reference per clip)
 * @returns S3 URL for the uploaded image
 */
export async function uploadI2VStoryboardReferenceImage(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  base64: string,
  mimeType = 'image/webp'
): Promise<string> {
  const request: UploadImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'storyboard-reference',
    i2vSceneIndex: sceneIndex,
    i2vClipIndex: clipIndex,
    base64,
    mimeType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: UploadImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to upload I2V storyboard reference image');
  }

  return result.url;
}

/**
 * Delete an I2V storyboard frame image from S3
 */
export async function deleteI2VStoryboardFrameImage(
  projectId: string,
  sceneIndex: number,
  clipIndex: number
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'storyboard-frame',
    i2vSceneIndex: sceneIndex,
    i2vClipIndex: clipIndex,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete I2V storyboard frame image');
  }
}

/**
 * Delete an I2V storyboard frame end image from S3
 */
export async function deleteI2VStoryboardFrameEndImage(
  projectId: string,
  sceneIndex: number,
  clipIndex: number
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'storyboard-frame-end',
    i2vSceneIndex: sceneIndex,
    i2vClipIndex: clipIndex,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete I2V storyboard frame end image');
  }
}

/**
 * Delete an I2V storyboard asset image from S3
 */
export async function deleteI2VStoryboardAssetImage(
  projectId: string,
  assetId: string,
  assetType: 'character' | 'background'
): Promise<void> {
  const request: DeleteImageRequest = {
    projectId,
    imageType: 'i2v',
    i2vSubtype: 'storyboard-asset',
    assetId,
    assetType,
  };

  const response = await fetch(IMAGE_API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const result: DeleteImageResponse = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete I2V storyboard asset image');
  }
}

export {
  getCharacterImageKey,
  getBackgroundImageKey,
  getStoryboardImageKey,
  getVideoKey,
  getCharacterProfileImageKey,
  getCharacterMasterSheetKey,
  getCharacterModeImageKey,
  getStyleSlotImageKey,
  getImageGenFrameKey,
  getImageGenRemixKey,
  getImageGenEditedKey,
  getI2VPageKey,
  getI2VPanelKey,
  getI2VPanelEditorKey,
};
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
  getCharacterImageKey,
  getBackgroundImageKey,
  getStoryboardImageKey,
  getVideoKey,
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
// URL Generators (for reference, primarily used server-side)
// ============================================================================

export { getCharacterImageKey, getBackgroundImageKey, getStoryboardImageKey, getVideoKey };
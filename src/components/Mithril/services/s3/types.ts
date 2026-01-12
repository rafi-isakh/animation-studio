/**
 * S3 Service Types for Mithril Project-based Storage
 *
 * S3 Key Structure:
 * mithril/{projectId}/
 * ├── characters/{characterId}.webp
 * ├── backgrounds/{bgId}/{angle}.webp
 * ├── storyboard/{sceneIndex}_{clipIndex}.webp
 * └── videos/{clipId}.mp4
 */

// Request/Response types for S3 API routes

export interface UploadImageRequest {
  projectId: string;
  imageType: 'character' | 'background' | 'storyboard';
  // For character images
  characterId?: string;
  // For background images
  bgId?: string;
  angle?: string;
  // For storyboard images
  sceneIndex?: number;
  clipIndex?: number;
  // Image data
  base64: string;
  mimeType?: string;
}

export interface UploadImageResponse {
  success: boolean;
  s3Key: string;
  url: string;
  error?: string;
}

export interface DeleteImageRequest {
  projectId: string;
  imageType: 'character' | 'background' | 'storyboard';
  // For character images
  characterId?: string;
  // For background images
  bgId?: string;
  angle?: string; // If not provided, deletes all angles for the bgId
  // For storyboard images
  sceneIndex?: number;
  clipIndex?: number;
}

export interface DeleteImageResponse {
  success: boolean;
  deletedKeys: string[];
  error?: string;
}

export interface UploadVideoRequest {
  projectId: string;
  clipId: string;
  videoUrl: string; // URL to download video from (e.g., OpenAI Sora result)
}

export interface UploadVideoResponse {
  success: boolean;
  s3Key: string;
  url: string;
  error?: string;
}

export interface DeleteVideoRequest {
  projectId: string;
  clipId: string;
}

export interface DeleteVideoResponse {
  success: boolean;
  deletedKey: string;
  error?: string;
}

export interface ClearProjectRequest {
  projectId: string;
}

export interface ClearProjectResponse {
  success: boolean;
  deletedCount: number;
  error?: string;
}

// S3 Key generators (used both client and server side)
export const S3_BASE_PATH = 'mithril';

export function getCharacterImageKey(projectId: string, characterId: string): string {
  return `${S3_BASE_PATH}/${projectId}/characters/${characterId}.webp`;
}

export function getBackgroundImageKey(projectId: string, bgId: string, angle: string): string {
  return `${S3_BASE_PATH}/${projectId}/backgrounds/${bgId}/${angle}.webp`;
}

export function getBackgroundFolderPrefix(projectId: string, bgId: string): string {
  return `${S3_BASE_PATH}/${projectId}/backgrounds/${bgId}/`;
}

export function getStoryboardImageKey(projectId: string, sceneIndex: number, clipIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/storyboard/${sceneIndex}_${clipIndex}.webp`;
}

export function getVideoKey(projectId: string, clipId: string): string {
  return `${S3_BASE_PATH}/${projectId}/videos/${clipId}.mp4`;
}

export function getProjectPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/`;
}
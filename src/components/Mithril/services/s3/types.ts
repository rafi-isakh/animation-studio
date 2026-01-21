/**
 * S3 Service Types for Mithril Project-based Storage
 *
 * S3 Key Structure:
 * mithril/{projectId}/
 * ├── characters/{characterId}/
 * │   ├── profile.webp              (1:1 headshot)
 * │   ├── mastersheet.webp          (16:9 character sheet)
 * │   ├── legacy.webp               (backward compatibility)
 * │   └── modes/{modeId}.webp       (mode variations)
 * ├── style-slots/{slotIndex}.webp  (global style references)
 * ├── backgrounds/{bgId}/{angle}.webp
 * ├── storyboard/{sceneIndex}_{clipIndex}.webp
 * └── videos/{clipId}.mp4
 */

// Request/Response types for S3 API routes

export type CharacterImageSubtype = 'profile' | 'mastersheet' | 'legacy' | 'mode';

export type ImageGenImageSubtype = 'frame' | 'remix' | 'edited';

export interface UploadImageRequest {
  projectId: string;
  imageType: 'character' | 'background' | 'storyboard' | 'style-slot' | 'imagegen';
  // For character images
  characterId?: string;
  characterSubtype?: CharacterImageSubtype; // New: profile, mastersheet, legacy, or mode
  modeId?: string; // For mode images
  // For background images
  bgId?: string;
  angle?: string;
  // For storyboard images
  sceneIndex?: number;
  clipIndex?: number;
  // For style slot images
  slotIndex?: number;
  // For imagegen images
  frameId?: string;
  imageGenSubtype?: ImageGenImageSubtype; // frame, remix, or edited
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
  imageType: 'character' | 'background' | 'storyboard' | 'style-slot' | 'imagegen';
  // For character images
  characterId?: string;
  characterSubtype?: CharacterImageSubtype; // New: profile, mastersheet, legacy, or mode
  modeId?: string; // For mode images
  // For background images
  bgId?: string;
  angle?: string; // If not provided, deletes all angles for the bgId
  // For storyboard images
  sceneIndex?: number;
  clipIndex?: number;
  // For style slot images
  slotIndex?: number;
  // For imagegen images
  frameId?: string;
  imageGenSubtype?: ImageGenImageSubtype; // frame, remix, or edited
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

export function getBackgroundReferenceImageKey(projectId: string, bgId: string): string {
  return `${S3_BASE_PATH}/${projectId}/backgrounds/${bgId}/_reference.webp`;
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

// ============================================
// New Key Generators for Character Sheet v2
// ============================================

/**
 * Get S3 key for character profile image (1:1 headshot)
 */
export function getCharacterProfileImageKey(projectId: string, characterId: string): string {
  return `${S3_BASE_PATH}/${projectId}/characters/${characterId}/profile.webp`;
}

/**
 * Get S3 key for character master sheet image (16:9, 4 views)
 */
export function getCharacterMasterSheetKey(projectId: string, characterId: string): string {
  return `${S3_BASE_PATH}/${projectId}/characters/${characterId}/mastersheet.webp`;
}

/**
 * Get S3 key for character legacy image (backward compatibility)
 */
export function getCharacterLegacyImageKey(projectId: string, characterId: string): string {
  return `${S3_BASE_PATH}/${projectId}/characters/${characterId}/legacy.webp`;
}

/**
 * Get S3 key for character mode image
 */
export function getCharacterModeImageKey(projectId: string, characterId: string, modeId: string): string {
  return `${S3_BASE_PATH}/${projectId}/characters/${characterId}/modes/${modeId}.webp`;
}

/**
 * Get S3 key for style slot image
 */
export function getStyleSlotImageKey(projectId: string, slotIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/style-slots/${slotIndex}.webp`;
}

/**
 * Get S3 folder prefix for character (for deleting all character images)
 */
export function getCharacterFolderPrefix(projectId: string, characterId: string): string {
  return `${S3_BASE_PATH}/${projectId}/characters/${characterId}/`;
}

/**
 * Get S3 folder prefix for style slots (for deleting all style slots)
 */
export function getStyleSlotsFolderPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/style-slots/`;
}

// ============================================
// ImageGen (Stage 6) Key Generators
// ============================================

/**
 * Get S3 key for imagegen frame image
 */
export function getImageGenFrameKey(projectId: string, frameId: string): string {
  return `${S3_BASE_PATH}/${projectId}/imagegen/${frameId}.webp`;
}

/**
 * Get S3 key for imagegen remix image
 */
export function getImageGenRemixKey(projectId: string, frameId: string): string {
  return `${S3_BASE_PATH}/${projectId}/imagegen/${frameId}_remix.webp`;
}

/**
 * Get S3 key for imagegen edited image
 */
export function getImageGenEditedKey(projectId: string, frameId: string): string {
  return `${S3_BASE_PATH}/${projectId}/imagegen/${frameId}_edited.webp`;
}

/**
 * Get S3 folder prefix for imagegen (for deleting all imagegen images)
 */
export function getImageGenFolderPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/imagegen/`;
}
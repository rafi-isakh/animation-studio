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
 * ├── props/{propId}/
 * │   ├── designsheet.webp          (16:9 prop design sheet)
 * │   └── reference.webp            (user-uploaded reference)
 * ├── backgrounds/{bgId}/{angle}.webp
 * ├── storyboard/{sceneIndex}_{clipIndex}.webp
 * ├── imagegen/{frameId}.webp
 * ├── videos/{clipId}.mp4
 * └── i2v/                          (Image-to-Video pipeline)
 *     ├── pages/{pageIndex}.webp    (manga page images)
 *     └── panels/{pageIndex}_{panelIndex}.webp (cropped panels)
 */

// Request/Response types for S3 API routes

export type CharacterImageSubtype = 'profile' | 'mastersheet' | 'legacy' | 'mode';

export type ImageGenImageSubtype = 'frame' | 'remix' | 'edited';

export type I2VImageSubtype = 'page' | 'panel' | 'panel-editor' | 'storyboard-frame' | 'storyboard-frame-end' | 'storyboard-asset' | 'storyboard-reference';

export interface UploadImageRequest {
  projectId: string;
  imageType: 'character' | 'background' | 'storyboard' | 'style-slot' | 'imagegen' | 'prop' | 'i2v' | 'csv-frame';
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
  // For prop images
  propId?: string;
  propSubtype?: 'designsheet' | 'reference';
  // For i2v (Image-to-Video) images
  i2vSubtype?: I2VImageSubtype; // page, panel, storyboard-frame, storyboard-frame-end, storyboard-asset
  pageIndex?: number;
  panelIndex?: number;
  // For i2v storyboard frames
  i2vSceneIndex?: number;
  i2vClipIndex?: number;
  // For i2v storyboard assets
  assetId?: string;
  assetType?: 'character' | 'background';
  // For i2v panel-editor originals
  panelEditorId?: string;
  // For csv-frame images
  csvFrameIndex?: number;
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
  imageType: 'character' | 'background' | 'storyboard' | 'style-slot' | 'imagegen' | 'prop' | 'i2v' | 'csv-frame';
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
  // For prop images
  propId?: string;
  propSubtype?: 'designsheet' | 'reference';
  // For i2v (Image-to-Video) images
  i2vSubtype?: I2VImageSubtype; // page, panel, storyboard-frame, storyboard-frame-end, storyboard-asset
  pageIndex?: number;
  panelIndex?: number;
  // For i2v storyboard frames
  i2vSceneIndex?: number;
  i2vClipIndex?: number;
  // For i2v storyboard assets
  assetId?: string;
  assetType?: 'character' | 'background';
  // For i2v panel-editor originals
  panelEditorId?: string;
  // For csv-frame images
  csvFrameIndex?: number;
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

export interface CopyProjectFilesRequest {
  sourceProjectId: string;
  destinationProjectId: string;
}

export interface CopyProjectFilesResponse {
  success: boolean;
  copiedCount: number;
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

export function getCsvFrameImageKey(projectId: string, frameIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/csv-frames/${frameIndex}.webp`;
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

// ============================================
// Prop Designer (Stage 5) Key Generators
// ============================================

/**
 * Get S3 key for prop design sheet image (16:9 product sheet)
 */
export function getPropDesignSheetKey(projectId: string, propId: string): string {
  return `${S3_BASE_PATH}/${projectId}/props/${propId}/designsheet.webp`;
}

/**
 * Get S3 key for prop reference image (uploaded by user)
 */
export function getPropReferenceImageKey(projectId: string, propId: string): string {
  return `${S3_BASE_PATH}/${projectId}/props/${propId}/reference.webp`;
}

/**
 * Get S3 folder prefix for prop (for deleting all prop images)
 */
export function getPropFolderPrefix(projectId: string, propId: string): string {
  return `${S3_BASE_PATH}/${projectId}/props/${propId}/`;
}

/**
 * Get S3 folder prefix for all props (for clearing all prop images)
 */
export function getPropsFolderPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/props/`;
}

// ============================================
// Image-to-Video (I2V) Key Generators
// ============================================

/**
 * Get S3 key for I2V manga page image
 */
export function getI2VPageKey(projectId: string, pageIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/pages/${pageIndex}.webp`;
}

/**
 * Get S3 key for I2V panel image
 */
export function getI2VPanelKey(projectId: string, pageIndex: number, panelIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/panels/${pageIndex}_${panelIndex}.webp`;
}

/**
 * Get S3 folder prefix for I2V pages (for deleting all pages)
 */
export function getI2VPagesFolderPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/pages/`;
}

/**
 * Get S3 key prefix for a specific I2V page (matches both legacy and job-suffixed keys).
 * Legacy: `{pageIndex}.webp`  New: `{pageIndex}_{jobId}.webp`
 */
export function getI2VPagePrefix(projectId: string, pageIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/pages/${pageIndex}`;
}

/**
 * Get S3 folder prefix for I2V panels (for deleting all panels)
 */
export function getI2VPanelsFolderPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/panels/`;
}

/**
 * Get S3 key prefix for a specific I2V panel (matches both legacy and job-suffixed keys).
 * Legacy: `{pageIndex}_{panelIndex}.webp`  New: `{pageIndex}_{panelIndex}_{jobId}.webp`
 */
export function getI2VPanelPrefix(projectId: string, pageIndex: number, panelIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/panels/${pageIndex}_${panelIndex}`;
}

/**
 * Get S3 key for I2V panel-editor original image
 */
export function getI2VPanelEditorKey(projectId: string, panelEditorId: string): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/panel-editor/${panelEditorId}.webp`;
}

/**
 * Get S3 folder prefix for all I2V content
 */
export function getI2VFolderPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/`;
}

// ============================================
// I2V Storyboard Key Generators
// ============================================

/**
 * Get S3 key for I2V storyboard frame image (start frame)
 */
export function getI2VStoryboardFrameKey(projectId: string, sceneIndex: number, clipIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/storyboard/${sceneIndex}_${clipIndex}.webp`;
}

/**
 * Get S3 key for I2V storyboard frame end image
 */
export function getI2VStoryboardFrameEndKey(projectId: string, sceneIndex: number, clipIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/storyboard/${sceneIndex}_${clipIndex}_end.webp`;
}

/**
 * Get S3 key for I2V storyboard asset image
 */
export function getI2VStoryboardAssetKey(projectId: string, assetId: string, assetType: 'character' | 'background'): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/storyboard/assets/${assetType}/${assetId}.webp`;
}

/**
 * Get S3 key for I2V storyboard reference image (custom user-uploaded reference per clip)
 */
export function getI2VStoryboardReferenceKey(projectId: string, sceneIndex: number, clipIndex: number): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/storyboard/references/${sceneIndex}_${clipIndex}.webp`;
}

/**
 * Get S3 folder prefix for I2V storyboard (for deleting all storyboard images)
 */
export function getI2VStoryboardFolderPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/i2v/storyboard/`;
}

// ============================================
// ImageGen Replacement Assets Key Generators
// ============================================

/**
 * Get S3 key for ImageGen replacement asset (character or background)
 */
export function getImageGenReplacementAssetKey(projectId: string, assetId: string, category: 'character' | 'background'): string {
  return `${S3_BASE_PATH}/${projectId}/imagegen/replacements/${category}/${assetId}.webp`;
}

/**
 * Get S3 folder prefix for ImageGen replacement assets
 */
export function getImageGenReplacementsFolderPrefix(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/imagegen/replacements/`;
}

// ============================================
// IdConverter Key Generators
// ============================================

/**
 * Get S3 key for IdConverter source text file
 */
export function getIdConverterTextKey(projectId: string): string {
  return `${S3_BASE_PATH}/${projectId}/id-converter/source.txt`;
}
import { Timestamp } from 'firebase/firestore';

// ============================================
// Project Metadata
// ============================================

export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  currentStage: number;
  customApiKey?: string;
}

export interface CreateProjectInput {
  name: string;
}

export interface UpdateProjectInput {
  name?: string;
  currentStage?: number;
  customApiKey?: string;
}

// ============================================
// Chapter (Stage 1)
// ============================================

export interface ChapterDocument {
  content: string;
  filename: string;
  uploadedAt: Timestamp;
}

// ============================================
// Story Splits (Stage 2)
// ============================================

export interface CliffhangerDocument {
  sentence: string;
  reason: string;
}

export interface PartWithAnalysisDocument {
  text: string;
  cliffhangers: CliffhangerDocument[];
}

export interface StorySplitsDocument {
  guidelines: string;
  parts: PartWithAnalysisDocument[];
  generatedAt: Timestamp;
}

// ============================================
// Character Sheet (Stage 3)
// ============================================

export interface StyleSlotDocument {
  id: string;
  name: string;
  imageRef: string; // S3 URL
}

export interface CharacterSheetDocument {
  styleKeyword: string;
  characterBasePrompt: string;
  genre: string;
  styleSlots: StyleSlotDocument[];
  activeStyleIndex: number | null;
  generatedAt: Timestamp;
}

export interface ModeDocument {
  id: string;
  characterId: string;
  name: string;
  description: string;
  prompt: string;
  imageRef: string; // S3 URL
}

export interface CharacterDocument {
  id: string;
  name: string;

  // Role & Identity (v1.6 fields)
  role: string;
  isProtagonist: boolean;
  age: string;
  gender: string;
  traits: string;

  // Description fields
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;

  // Profile Image (1:1 headshot)
  profileImageRef: string;
  profileImagePrompt: string;

  // Master Sheet (16:9, 4 views)
  masterSheetImageRef: string;
  masterSheetImagePrompt: string;

  // Legacy fields for backward compatibility
  imageRef: string; // S3 URL - maps to masterSheetImageRef
  imagePrompt: string; // maps to masterSheetImagePrompt
}

// ============================================
// Background Sheet (Stage 4)
// ============================================

export const BACKGROUND_ANGLES = [
  'Front View',
  'Side View (Left)',
  'Side View (Right)',
  'Rear View',
  'Low Angle',
  'High Angle',
  'Wide Shot',
  'Close-up Detail',
] as const;

export type BackgroundAngle = (typeof BACKGROUND_ANGLES)[number];

export interface BgSheetDocument {
  styleKeyword: string;
  backgroundBasePrompt: string;
  generatedAt: Timestamp;
}

export interface BackgroundAngleImage {
  angle: string; // Can be standard angle name or storyboard ID like "1-3"
  imageRef: string; // S3 URL
  prompt: string;
}

export interface BackgroundDocument {
  id: string;
  name: string;
  description: string;
  angles: BackgroundAngleImage[];
}

// ============================================
// Storyboard (Stage 5)
// ============================================

export interface StoryboardDocument {
  generatedAt: Timestamp;
  aspectRatio?: string;
}

export interface VoicePromptDocument {
  promptKo: string;
  promptEn: string;
}

export interface SceneDocument {
  sceneIndex: number;
  sceneTitle: string;
}

export interface ClipDocument {
  clipIndex: number;
  // Story content
  story: string;
  // Prompts
  imagePrompt: string;
  imagePromptEnd?: string;
  videoPrompt: string;
  soraVideoPrompt: string;
  backgroundPrompt: string;
  backgroundId: string;
  // Dialogue
  dialogue: string;
  dialogueEn: string;
  // Sound
  sfx: string;
  sfxEn: string;
  bgm: string;
  bgmEn: string;
  // Timing
  length: string;
  accumulatedTime: string;
  // Image reference (S3 URL)
  imageRef: string;
  selectedBgId: string | null;
}

// ============================================
// ImageGen (Stage 6)
// ============================================

export type ImageGenAspectRatio = '1:1' | '16:9' | '9:16';
export type ImageGenFrameStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface ImageGenDocument {
  stylePrompt: string;
  aspectRatio: ImageGenAspectRatio;
  generatedAt: Timestamp;
}

export interface ImageGenFrameDocument {
  id: string;
  sceneIndex: number;
  clipIndex: number;
  frameLabel: string;
  frameNumber: string;
  shotGroup: number;
  prompt: string;
  backgroundId: string;
  refFrame: string;
  imageRef: string; // S3 URL
  status: ImageGenFrameStatus;
  remixPrompt: string;
  remixImageRef: string | null;
  editedImageRef: string | null;
}

export interface SaveImageGenFrameInput {
  sceneIndex: number;
  clipIndex: number;
  frameLabel: string;
  frameNumber: string;
  shotGroup: number;
  prompt: string;
  backgroundId: string;
  refFrame: string;
  imageRef?: string;
  status?: ImageGenFrameStatus;
  remixPrompt?: string;
  remixImageRef?: string | null;
  editedImageRef?: string | null;
}

export interface UpdateImageGenFrameInput {
  prompt?: string;
  backgroundId?: string;
  refFrame?: string;
  imageRef?: string;
  status?: ImageGenFrameStatus;
  remixPrompt?: string;
  remixImageRef?: string | null;
  editedImageRef?: string | null;
}

// ============================================
// Video (Stage 7)
// ============================================

export type AspectRatio = '16:9' | '9:16';
export type VideoStatus = 'pending' | 'generating' | 'completed' | 'failed';

export interface VideoDocument {
  aspectRatio: AspectRatio;
  createdAt: Timestamp;
}

export interface VideoClipDocument {
  clipIndex: number;
  sceneIndex: number;
  sceneTitle: string;
  videoPrompt: string;
  length: string;
  videoRef: string | null; // S3 URL
  jobId: string | null;
  s3FileName: string | null;
  status: VideoStatus;
  error?: string;
}

// ============================================
// Helper types for service functions
// ============================================

export interface SaveChapterInput {
  content: string;
  filename: string;
}

export interface SaveStorySplitsInput {
  guidelines: string;
  parts: PartWithAnalysisDocument[];
}

export interface SaveCharacterSheetSettingsInput {
  styleKeyword: string;
  characterBasePrompt: string;
  genre?: string;
  styleSlots?: StyleSlotDocument[];
  activeStyleIndex?: number | null;
}

export interface SaveCharacterInput {
  name: string;

  // Role & Identity
  role?: string;
  isProtagonist?: boolean;
  age?: string;
  gender?: string;
  traits?: string;

  // Description fields
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;

  // Profile image
  profileImageRef?: string;
  profileImagePrompt?: string;

  // Master sheet image
  masterSheetImageRef?: string;
  masterSheetImagePrompt?: string;

  // Legacy fields
  imageRef?: string;
  imagePrompt?: string;
}

export interface UpdateCharacterInput {
  name?: string;

  // Role & Identity
  role?: string;
  isProtagonist?: boolean;
  age?: string;
  gender?: string;
  traits?: string;

  // Description fields
  appearance?: string;
  clothing?: string;
  personality?: string;
  backgroundStory?: string;

  // Profile image
  profileImageRef?: string;
  profileImagePrompt?: string;

  // Master sheet image
  masterSheetImageRef?: string;
  masterSheetImagePrompt?: string;

  // Legacy fields
  imageRef?: string;
  imagePrompt?: string;
}

export interface SaveModeInput {
  id?: string; // Optional: use this ID instead of auto-generating
  characterId: string;
  name: string;
  description: string;
  prompt: string;
  imageRef?: string;
}

export interface UpdateModeInput {
  name?: string;
  description?: string;
  prompt?: string;
  imageRef?: string;
}

export interface SaveBgSheetSettingsInput {
  styleKeyword: string;
  backgroundBasePrompt: string;
}

export interface SaveBackgroundInput {
  name: string;
  description: string;
  angles?: BackgroundAngleImage[];
}

export interface UpdateBackgroundInput {
  name?: string;
  description?: string;
}

export interface SaveSceneInput {
  sceneTitle: string;
}

export interface SaveClipInput {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string;
  videoPrompt: string;
  soraVideoPrompt: string;
  backgroundPrompt: string;
  backgroundId: string;
  dialogue: string;
  dialogueEn: string;
  sfx: string;
  sfxEn: string;
  bgm: string;
  bgmEn: string;
  length: string;
  accumulatedTime: string;
  imageRef?: string;
  selectedBgId?: string | null;
}

export interface UpdateClipInput {
  story?: string;
  imagePrompt?: string;
  imagePromptEnd?: string;
  videoPrompt?: string;
  soraVideoPrompt?: string;
  backgroundPrompt?: string;
  backgroundId?: string;
  dialogue?: string;
  dialogueEn?: string;
  sfx?: string;
  sfxEn?: string;
  bgm?: string;
  bgmEn?: string;
  length?: string;
  accumulatedTime?: string;
  imageRef?: string;
  selectedBgId?: string | null;
}

export interface SaveVideoClipInput {
  clipIndex: number;
  sceneIndex: number;
  sceneTitle: string;
  videoPrompt: string;
  length: string;
}

export interface UpdateVideoClipInput {
  sceneIndex?: number;
  clipIndex?: number;
  videoRef?: string | null;
  jobId?: string | null;
  s3FileName?: string | null;
  status?: VideoStatus;
  error?: string;
}

// ============================================
// Mithril User Authentication
// ============================================

export type MithrilUserRole = 'admin' | 'user';

export interface MithrilUser {
  id: string;
  email: string;
  passwordHash: string;
  role: MithrilUserRole;
  displayName: string;
  createdAt: Timestamp;
  createdBy: string;
  lastLoginAt: Timestamp | null;
  isActive: boolean;
}

export interface MithrilSession {
  id: string;
  userId: string;
  email: string;
  role: MithrilUserRole;
  displayName: string;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface MithrilUserPublic {
  id: string;
  email: string;
  role: MithrilUserRole;
  displayName: string;
}

export interface CreateMithrilUserInput {
  email: string;
  password: string;
  role: MithrilUserRole;
  displayName: string;
  createdBy: string;
}
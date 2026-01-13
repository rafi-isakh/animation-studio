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

export interface StorySplitsDocument {
  guidelines: string;
  parts: string[];
  generatedAt: Timestamp;
}

// ============================================
// Character Sheet (Stage 3)
// ============================================

export interface CharacterSheetDocument {
  styleKeyword: string;
  characterBasePrompt: string;
  generatedAt: Timestamp;
}

export interface CharacterDocument {
  id: string;
  name: string;
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;
  imageRef: string; // S3 URL
  imagePrompt: string;
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
  angle: BackgroundAngle;
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
// Video (Stage 6)
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
  parts: string[];
}

export interface SaveCharacterSheetSettingsInput {
  styleKeyword: string;
  characterBasePrompt: string;
}

export interface SaveCharacterInput {
  name: string;
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;
  imageRef?: string;
  imagePrompt?: string;
}

export interface UpdateCharacterInput {
  name?: string;
  appearance?: string;
  clothing?: string;
  personality?: string;
  backgroundStory?: string;
  imageRef?: string;
  imagePrompt?: string;
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
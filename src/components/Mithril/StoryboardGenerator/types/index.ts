export interface Continuity {
  story: string;
  imagePrompt: string;
  videoPrompt: string;
  soraVideoPrompt: string;
  dialogue: string;
  dialogueEn: string;
  sfx: string;
  sfxEn: string;
  bgm: string;
  bgmEn: string;
  length: string;
  accumulatedTime: string;
  backgroundPrompt: string;
  backgroundId: string;
  imageRef?: string; // S3 URL for generated storyboard image
}

// Scene image generation state per clip
export interface ClipImageState {
  selectedBgId: string | null; // Selected background reference ID from BgSheet
  generatedImageBase64: string | null; // Generated scene image (base64 or S3 URL)
  isS3Url?: boolean; // Flag to indicate if generatedImageBase64 is actually an S3 URL
  isGenerating: boolean;
  error: string | null;
}

// Metadata for localStorage (without base64 - that's in IndexedDB)
export interface ClipImageMetadata {
  clipKey: string; // e.g., "0-0", "1-2"
  clipName: string; // e.g., "1.1", "2.3"
  selectedBgId: string | null;
  hasGeneratedImage: boolean; // true if image exists in IndexedDB
}

// localStorage structure for storyboard scene images
export interface StoryboardSceneImagesMetadata {
  clips: ClipImageMetadata[];
  updatedAt: number;
}

export interface VoicePrompt {
  promptKo: string;
  promptEn: string;
}

export interface Scene {
  sceneTitle: string;
  clips: Continuity[];
}

export interface GenerationResult {
  scenes: Scene[];
  voicePrompts: VoicePrompt[];
}

export interface SplitResult {
  parts: string[];
}

// Reference image from BgSheet (background references)
export interface ReferenceImage {
  id: string;
  bgId: string;
  bgName: string;
  angle: string;
  base64: string;  // Can be base64 data or S3 URL (check isS3Url flag)
  mimeType: string;
  isS3Url?: boolean;  // Flag to indicate if base64 is actually an S3 URL
}

// Character reference image from CharacterSheet
export interface CharacterReferenceImage {
  id: string;
  characterId: string;
  characterName: string;
  base64: string;  // Can be base64 data or S3 URL (check isS3Url flag)
  mimeType: string;
  isS3Url?: boolean;  // Flag to indicate if base64 is actually an S3 URL
}

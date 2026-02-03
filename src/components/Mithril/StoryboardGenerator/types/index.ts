export interface Continuity {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string; // End frame prompt for Vidu (motion-heavy clips only)
  videoPrompt: string;
  soraVideoPrompt: string;
  dialogue: string;
  dialogueEn: string;
  narration: string; // Narration text (Korean) - for clips without dialogue
  narrationEn: string; // Narration text (English)
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

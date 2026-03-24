export interface Continuity {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string; // End frame prompt for Vidu (motion-heavy clips only)
  // Webnovel-trailer A/B/C/D image prompt variations (4 types × 5 variations)
  attentionDevice?: string;
  imagePromptA1?: string;
  imagePromptA2?: string;
  imagePromptA3?: string;
  imagePromptA4?: string;
  imagePromptA5?: string;
  attentionAction?: string;
  imagePromptB1?: string;
  imagePromptB2?: string;
  imagePromptB3?: string;
  imagePromptB4?: string;
  imagePromptB5?: string;
  attentionExpression?: string;
  imagePromptC1?: string;
  imagePromptC2?: string;
  imagePromptC3?: string;
  imagePromptC4?: string;
  imagePromptC5?: string;
  attentionMood?: string;
  imagePromptD1?: string;
  imagePromptD2?: string;
  imagePromptD3?: string;
  imagePromptD4?: string;
  imagePromptD5?: string;
  videoPrompt: string;
  soraVideoPrompt: string;
  veoVideoPrompt: string;
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
  characterInfo?: string; // Brief character relationships (e.g., "AREL=Protagonist's son, 19-year-old")
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

export interface CharacterIdSummary {
  characterId: string;
  description: string; // e.g., "Protagonist. Default" or "19 year old version of ELISA_PRESENT"
}

export interface Scene {
  sceneTitle: string;
  clips: Continuity[];
}

export interface GenerationResult {
  scenes: Scene[];
  voicePrompts: VoicePrompt[];
  characterIdSummary?: CharacterIdSummary[]; // Summary of all character IDs with relationships
  genre?: string; // Story genre (e.g., "Western Fantasy", "Wuxia", "Modern Romance")
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

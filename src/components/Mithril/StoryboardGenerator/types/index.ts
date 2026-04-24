export interface Continuity {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string; // End frame prompt for Vidu (motion-heavy clips only)
  // Webnovel-trailer A/B/C/D image prompt variations (1 per type)
  attentionDevice?: string;     // 오브젝/인서트컷 item → reference for imagePromptA
  attentionAction?: string;     // 행동 item → reference for imagePromptB
  attentionExpression?: string; // 감정 item → reference for imagePromptC
  attentionMood?: string;       // kept for structure (D is free methodology)
  imagePromptA?: string;        // 오브젝/인서트컷 (attention_device)
  imagePromptB?: string;        // 행동 (attention_action)
  imagePromptC?: string;        // 감정 (attention_expression)
  imagePromptD?: string;        // 감정 증폭 (free methodology)
  videoPrompt: string;
  soraVideoPrompt: string;
  veoVideoPrompt: string;
  pixAiPrompt: string;
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
  backgroundIdA?: string;
  backgroundIdB?: string;
  backgroundIdC?: string;
  backgroundIdD?: string;
  characterInfo?: string; // Brief character relationships (e.g., "AREL=Protagonist's son, 19-year-old")
  imageRef?: string; // S3 URL for generated storyboard image
  // Webnovel trailer script fields
  trailerScriptKo?: string;
  trailerScriptEn?: string;
}

export interface TrailerOption {
  id: number;
  title: string;
  script: string[];
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

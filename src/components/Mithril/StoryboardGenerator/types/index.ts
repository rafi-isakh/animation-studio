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
}

// Scene image generation state per clip
export interface ClipImageState {
  selectedBgId: string | null; // Selected background reference ID from BgSheet
  generatedImageBase64: string | null; // Generated scene image
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

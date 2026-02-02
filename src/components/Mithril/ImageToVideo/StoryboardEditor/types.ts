// Continuity data for each clip in the storyboard
export interface Continuity {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string;
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
  referenceImage?: string;
  referenceImageIndex?: number;
  generatedImage?: string;
  generatedImageEnd?: string;
}

// Voice prompt for character voice guide
export interface VoicePrompt {
  promptKo: string;
  promptEn: string;
}

// Scene containing multiple clips
export interface Scene {
  sceneTitle: string;
  clips: Continuity[];
}

// Asset for characters and backgrounds
export interface Asset {
  id: string;
  tags: string;
  image: string;
  type: 'character' | 'background';
}

// Aspect ratio options
export type AspectRatio = '16:9' | '9:16' | '1:1';

// Full generation result
export interface GenerationResult {
  scenes: Scene[];
  voicePrompts: VoicePrompt[];
}

// Project data for import/export
export interface ProjectData {
  storyboardData: Scene[];
  voicePrompts: VoicePrompt[];
  assets: Asset[];
  targetDuration: string;
  aspectRatio?: AspectRatio;
}

// View mode for the editor
export type ViewMode = 'table' | 'generator';

// UI state
export interface StoryboardEditorUI {
  view: ViewMode;
  loading: boolean;
}

// Complete state shape
export interface StoryboardEditorState {
  storyboardData: Scene[];
  voicePrompts: VoicePrompt[];
  assets: Asset[];
  targetDuration: string;
  aspectRatio: AspectRatio;
  ui: StoryboardEditorUI;
}

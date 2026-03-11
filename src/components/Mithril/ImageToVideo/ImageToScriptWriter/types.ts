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
  referenceImageUrl?: string; // S3 URL if user uploaded a custom reference image (persisted)
  panelCoordinates?: number[];
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

// Full generation result
export interface GenerationResult {
  scenes: Scene[];
  voicePrompts: VoicePrompt[];
}

// Genre preset configuration
export interface GenrePreset {
  id: string;
  name: string;
  description: string;
  story: string;
  image: string;
  video: string;
  sound: string;
}

// Generation conditions
export interface GenerationConditions {
  story: string;
  image: string;
  video: string;
  sound: string;
}

// Style guide prompts
export interface StyleGuides {
  image: string;
  video: string;
}

// Additional instruction fields (file-uploadable specs)
export interface GenerationInstructions {
  custom: string;      // Story flow instructions
  background: string;  // Background ID spec
  negative: string;    // Negative prompts (absolute prohibitions)
  video: string;       // Video prompt rules spec
}

// Configuration state
export interface ScriptWriterConfig {
  genre: string;
  sourceText: string;
  conditions: GenerationConditions;
  guides: StyleGuides;
  instructions: GenerationInstructions;
}

// UI state
export interface ScriptWriterUI {
  showConditions: boolean;
  showGuides: boolean;
}

// Processing state
export interface ScriptWriterProcessing {
  isGenerating: boolean;
  isSplitting: boolean;
}

// Panel data from ImageSplitter or imported
export interface PanelData {
  id: string;
  imageBase64: string;
  label: string;
}

// Panel payload sent to the API (URL or base64, not both)
export interface PanelPayload {
  id: string;
  label: string;
  imageBase64?: string;
  imageUrl?: string;
}

// Complete state shape
export interface ScriptWriterState {
  config: ScriptWriterConfig;
  ui: ScriptWriterUI;
  processing: ScriptWriterProcessing;
  mangaImages: string[]; // Converted base64 images
  mangaImageFiles: (File | string)[]; // Original files/strings before conversion
  result: GenerationResult | null;
}

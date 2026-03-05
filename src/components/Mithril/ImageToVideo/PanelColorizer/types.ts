// Aspect ratio options for output
export enum AspectRatio {
  Square = "1:1",
  Landscape = "16:9",
  Portrait = "9:16",
  Standard = "4:3",
  Wide = "3:4"
}

// Processing status for each panel
export enum ProcessingStatus {
  Idle = "idle",
  Pending = "pending",
  Success = "success",
  Error = "error",
}

// Individual panel data structure
export interface PanelData {
  id: string;
  file: File;
  previewUrl: string;
  fileName: string;
  status: ProcessingStatus;
  resultUrl?: string;
  error?: string;
  timeOfDay?: string; // Active time-of-day lighting preset
}

// Reference image for color extraction (character sheets)
export interface ReferenceImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

// App configuration
export interface PanelColorizerConfig {
  targetAspectRatio: AspectRatio;
}

// Processing progress tracker
export interface ProcessingProgress {
  current: number;
  total: number;
}

// Complete state shape for the Panel Colorizer
export interface PanelColorizerState {
  fileLibrary: Record<string, File>;
  panels: PanelData[];
  referenceImages: ReferenceImage[];
  globalPrompt: string;
  config: PanelColorizerConfig;
  isProcessing: boolean;
  progress: ProcessingProgress;
}

// Action types for reducer
export type PanelColorizerAction =
  | { type: 'ADD_FILES_TO_LIBRARY'; files: File[] }
  | { type: 'ADD_PANELS'; panels: PanelData[] }
  | { type: 'REMOVE_PANEL'; id: string }
  | { type: 'UPDATE_PANEL'; id: string; updates: Partial<PanelData> }
  | { type: 'SET_REFERENCE_IMAGES'; images: ReferenceImage[] }
  | { type: 'ADD_REFERENCE_IMAGES'; images: ReferenceImage[] }
  | { type: 'REMOVE_REFERENCE_IMAGE'; id: string }
  | { type: 'SET_GLOBAL_PROMPT'; prompt: string }
  | { type: 'SET_CONFIG'; config: Partial<PanelColorizerConfig> }
  | { type: 'SET_PROCESSING'; isProcessing: boolean }
  | { type: 'SET_PROGRESS'; progress: ProcessingProgress }
  | { type: 'CLEAR_PANELS' }
  | { type: 'RESET_STATE' };

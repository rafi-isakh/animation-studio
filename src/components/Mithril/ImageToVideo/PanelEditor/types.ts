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
  originalImageRef?: string; // S3 URL for original image (for persistence across navigation)
}

// App configuration
export interface PanelEditorConfig {
  targetAspectRatio: AspectRatio;
}

// Processing progress tracker
export interface ProcessingProgress {
  current: number;
  total: number;
}

// Complete state shape for the Panel Editor
export interface PanelEditorState {
  fileLibrary: Record<string, File>;
  panels: PanelData[];
  config: PanelEditorConfig;
  isProcessing: boolean;
  progress: ProcessingProgress;
}

// Action types for reducer
export type PanelEditorAction =
  | { type: 'ADD_FILES_TO_LIBRARY'; files: File[] }
  | { type: 'ADD_PANELS'; panels: PanelData[] }
  | { type: 'REMOVE_PANEL'; id: string }
  | { type: 'UPDATE_PANEL'; id: string; updates: Partial<PanelData> }
  | { type: 'SET_CONFIG'; config: Partial<PanelEditorConfig> }
  | { type: 'SET_PROCESSING'; isProcessing: boolean }
  | { type: 'SET_PROGRESS'; progress: ProcessingProgress }
  | { type: 'CLEAR_PANELS' }
  | { type: 'RESET_STATE' };

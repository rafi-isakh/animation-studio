export enum AspectRatio {
  Square = "1:1",
  Landscape = "16:9",
  Portrait = "9:16",
  Standard = "4:3",
  Wide = "3:4",
}

export enum ProcessingStatus {
  Idle = "idle",
  Pending = "pending",
  Success = "success",
  Error = "error",
}

export interface PanelData {
  id: string;
  file: File;
  previewUrl: string;
  fileName?: string;
  status: ProcessingStatus;
  resultUrl?: string;
  error?: string;
  prompt?: string;
  category?: string;
  jobId?: string;
  progress?: number;
  originalImageRef?: string;
  _fromStorage?: boolean; // Internal flag: true if loaded from persisted storage (prevents re-persist on mount)
}

export interface AppConfig {
  targetAspectRatio: AspectRatio;
}

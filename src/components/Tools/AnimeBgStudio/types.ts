export type ImageProvider = "gemini" | "grok";

export type ImageStatus = "idle" | "generating" | "success" | "error";

export type AspectRatio = "16:9" | "9:16" | "1:1";

export interface WorkspaceImage {
  id: string;
  originalDataUrl: string;
  generatedDataUrl?: string;
  prompt: string; // per-image override (empty = use global)
  status: ImageStatus;
  error?: string;
}

export interface WorkspaceState {
  images: WorkspaceImage[];
  referenceImageDataUrl?: string;
  globalPrompt: string;
  aspectRatio: AspectRatio;
  provider: ImageProvider;
}

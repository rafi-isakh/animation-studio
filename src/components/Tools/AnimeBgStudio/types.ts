export type ImageProvider = "gemini" | "grok";

export type ImageStatus = "idle" | "generating" | "success" | "error";

export type AspectRatio = "16:9" | "9:16" | "1:1";

export interface WorkspaceImage {
  id: string;
  originalDataUrl: string; // local data URI for display
  originalS3Url?: string; // CloudFront URL after S3 upload
  generatedUrl?: string; // CloudFront URL of result
  prompt: string; // per-image override (empty = use global)
  status: ImageStatus;
  error?: string;
}

export interface WorkspaceState {
  images: WorkspaceImage[];
  referenceImageDataUrl?: string; // local data URI for display
  referenceS3Url?: string; // CloudFront URL after S3 upload
  globalPrompt: string;
  aspectRatio: AspectRatio;
  provider: ImageProvider;
}

// VideoGenerator Types
// Generalized types for multi-provider video generation

// Re-export provider types for convenience
export type { AspectRatio, AspectRatioOption } from "./providers/types";

export type ClipStatus = "pending" | "generating" | "completed" | "failed";

// Individual clip state
export interface VideoClip {
  clipIndex: number; // Index within the scene
  sceneIndex: number; // Which scene this clip belongs to
  sceneTitle: string;
  videoPrompt: string;
  soraVideoPrompt: string; // Provider-specific prompt (kept for backwards compatibility)
  customPrompt?: string; // User-edited prompt (overrides soraVideoPrompt/videoPrompt)
  length: string; // "1초" or "2초"
  imageBase64: string | null; // From ImageGen (Stage 6)
  videoUrl: string | null;
  jobId: string | null;
  s3FileName: string | null; // S3 filename for permanent storage
  status: ClipStatus;
  error?: string;
  providerId?: string; // Provider used to generate this clip
}

// Metadata stored in Firestore (videos stored in S3)
export interface VideoResultMetadata {
  clips: {
    clipIndex: number;
    sceneIndex: number;
    videoUrl: string | null;
    jobId: string | null;
    s3FileName: string | null;
    status: ClipStatus;
    error?: string;
    providerId?: string;
  }[];
  aspectRatio: "16:9" | "9:16";
  providerId: string; // Default provider used
  createdAt: number;
}

// API request/response types
export interface VideoSubmitRequest {
  providerId: string;
  prompt: string;
  imageBase64?: string;
  duration: number;
  aspectRatio: "16:9" | "9:16";
}

export interface VideoSubmitResponse {
  jobId: string;
  status: "pending";
}

export interface VideoStatusResponse {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  videoUrl?: string;
  s3FileName?: string;
  error?: string;
}

// Legacy type aliases for backwards compatibility
export type SoraVideoClip = VideoClip;
export type SoraVideoResultMetadata = VideoResultMetadata;
export type SoraVideoRequest = VideoSubmitRequest;
export type SoraVideoSubmitResponse = VideoSubmitResponse;
export type SoraVideoStatusResponse = VideoStatusResponse;

// Default aspect ratios (can be overridden by provider)
export const ASPECT_RATIOS: { value: "16:9" | "9:16"; label: string }[] = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
];
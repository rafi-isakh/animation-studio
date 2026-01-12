// SoraVideoGenerator Types

export type AspectRatio = "16:9" | "9:16";

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
];

export type ClipStatus = "pending" | "generating" | "completed" | "failed";

// Individual clip state
export interface SoraVideoClip {
  clipIndex: number; // Index within the scene
  sceneIndex: number; // Which scene this clip belongs to
  sceneTitle: string;
  videoPrompt: string;
  soraVideoPrompt: string;
  length: string; // "1초" or "2초"
  imageBase64: string | null; // From NanoBanana (Stage 7)
  videoUrl: string | null;
  jobId: string | null;
  s3FileName: string | null; // S3 filename for permanent storage
  status: ClipStatus;
  error?: string;
}

// Metadata stored in Firestore (videos stored in S3)
export interface SoraVideoResultMetadata {
  clips: {
    clipIndex: number;
    sceneIndex: number;
    videoUrl: string | null;
    jobId: string | null;
    s3FileName: string | null;
    status: ClipStatus;
    error?: string;
  }[];
  aspectRatio: AspectRatio;
  createdAt: number;
}

// API request/response types
export interface SoraVideoRequest {
  prompt: string;
  imageBase64?: string;
  duration: number;
  aspectRatio: AspectRatio;
}

export interface SoraVideoSubmitResponse {
  jobId: string;
  status: "pending";
}

export interface SoraVideoStatusResponse {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  videoUrl?: string;
  s3FileName?: string;
  error?: string;
}


export type T2VNsfwClipStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'retrying';

export interface NsfwT2VClip {
  clipNumber: number;
  promptVariant: 'A' | 'B' | 'C' | null;
  frameLabel: string;          // e.g. "3B"
  imageRef: string | null;     // finalized image S3 URL from NsfwImageGenerator
  videoPrompt: string;         // from CSV import
  videoUrl: string | null;
  jobId: string | null;
  s3FileName: string | null;
  status: T2VNsfwClipStatus;
  error?: string;
  providerId?: string;
}

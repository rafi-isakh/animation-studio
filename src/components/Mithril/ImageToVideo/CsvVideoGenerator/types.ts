export interface CsvColumnMapping {
  frameNumber: string;
  veoPrompt: string;
  referenceFilename: string;
  dialogue: string;
  sfx: string;
  clipLength: string;
  videoApi: string;
}

export interface CsvFrame {
  id: string;                   // `frame-{rowIndex}-{timestamp}`
  rowIndex: number;             // 0-based → used as clipIndex
  frameNumber: string;
  veoPrompt: string;
  referenceFilename: string;
  dialogue?: string;
  sfx?: string;
  clipLength?: string;          // raw string from CSV e.g. "5", "10"
  videoApi?: string;            // per-frame provider override (e.g. "sora", "veo3")
  imageData: string | null;     // base64 data URL (in-memory preview)
  endFrameData: string | null;  // base64 data URL (in-memory)
  imageUrl: string | null;      // S3 URL after upload (persisted)
  videoUrl: string | null;
  jobId: string | null;
  s3FileName: string | null;
  status: CsvFrameStatus;
  error?: string;
  providerId?: string;
}

export type CsvFrameStatus =
  | 'idle'
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'retrying';

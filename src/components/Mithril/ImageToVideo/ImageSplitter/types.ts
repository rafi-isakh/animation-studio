// Processing status for each page
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'error';

// Reading direction for manga (RTL) vs western comics (LTR)
export type ReadingDirection = 'rtl' | 'ltr';

// Individual panel detected within a page
export interface MangaPanel {
  id: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  label?: string;
  imageUrl?: string; // Cropped base64 image
}

// A single manga/comic page with its detected panels
export interface MangaPage {
  id: string;
  pageIndex?: number; // Original index from Firestore (used for deletion)
  jobId?: string; // Active orchestrator job ID for tracking
  file?: File;
  previewUrl: string;
  fileName: string;
  panels: MangaPanel[];
  status: ProcessingStatus;
  readingDirection: ReadingDirection;
}

// Processing progress tracker
export interface ProcessingProgress {
  current: number;
  total: number;
}

// Stats shown after processing completes
export interface ProcessingStats {
  duration: string;
  pageCount: number;
  panelCount: number;
}

// Complete state shape for the ImageSplitter
export interface ImageSplitterState {
  pages: MangaPage[];
  isProcessing: boolean;
  progress: ProcessingProgress;
  readingDirection: ReadingDirection;
  processingStats: ProcessingStats | null;
}

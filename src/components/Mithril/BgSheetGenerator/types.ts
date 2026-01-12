// In-memory types (used during session)
export interface GeneratedImage {
  angle: string;
  prompt: string;
  imageBase64: string;  // For newly generated images (before S3 upload)
  imageUrl?: string;    // For S3 URLs (after upload or when loaded)
  isGenerating: boolean;
}

export interface Background {
  id: string;
  name: string;
  description: string;
  images: GeneratedImage[];
}

// Legacy type - kept for backward compatibility
export interface BgSheetResult {
  backgrounds: Background[];
  styleKeyword: string;
  backgroundBasePrompt: string;
}

// Metadata types for Firestore (without base64 data - images stored in S3)
export interface GeneratedImageMetadata {
  angle: string;
  prompt: string;
  imageId: string; // Reference to S3 image
}

export interface BackgroundMetadata {
  id: string;
  name: string;
  description: string;
  images: GeneratedImageMetadata[];
}

export interface BgSheetResultMetadata {
  backgrounds: BackgroundMetadata[];
  styleKeyword: string;
  backgroundBasePrompt: string;
}

export interface AnalysisResult {
  backgrounds: Omit<Background, "id" | "images">[];
}

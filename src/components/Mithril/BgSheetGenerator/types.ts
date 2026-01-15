// In-memory types (used during session)
export interface GeneratedImage {
  angle: string;
  prompt: string;
  imageBase64: string;  // For newly generated images (before S3 upload)
  imageUrl?: string;    // For S3 URLs (after upload or when loaded)
  isGenerating: boolean;
  isPromptOpen?: boolean;      // Whether prompt editor is expanded
  isActive?: boolean;          // Whether frame is active (default true)
  isFinalized?: boolean;       // Whether frame is marked as done
  characterPrompt?: string;    // Additional notes when finalized
  csvContext?: string;         // Context from CSV import
}

// Spatial analysis of a reference image
export interface ReferenceAnalysis {
  floorType: string;
  rightObject: string;
  leftObject: string;
  rearObject: string;
  ceilingObject: string;
  topLeftObject: string;
  topRightObject: string;
}

export interface Background {
  id: string;
  name: string;
  description: string;
  images: GeneratedImage[];
  referenceImageBase64?: string;       // Master reference image
  referenceAnalysis?: ReferenceAnalysis; // Spatial analysis of reference
  plannedPrompts?: string[];           // Array of 9 prompts (N-1 to N-9)
  isSequentiallyGenerating?: boolean;  // Whether batch generation is running
  generationRange?: string;            // Range for generation (e.g., "1-5", "All")
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

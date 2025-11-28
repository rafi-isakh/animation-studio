// NanoBananaGenerator Types

// Reference image from BgSheetGenerator stored in IndexedDB
export interface ReferenceImage {
  id: string; // IndexedDB id: "bg_{bgId}_{angle}"
  bgId: string;
  bgName: string;
  angle: string;
  base64: string;
  mimeType: string;
  selected: boolean;
}

// In-memory type for generated result
export interface NanoBananaResult {
  id: string;
  stylePrompt: string;
  scenePrompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  referenceImageIds: string[]; // IDs of selected reference images
  combinedPrompt: string;
  generatedImageBase64: string;
  isGenerating: boolean;
  createdAt: number;
}

// Metadata for localStorage (without base64)
export interface NanoBananaResultMetadata {
  id: string;
  stylePrompt: string;
  scenePrompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:3" | "3:4";
  referenceImageIds: string[];
  combinedPrompt: string;
  generatedImageId: string; // Reference to IndexedDB
  createdAt: number;
}

// For storing multiple results history
export interface NanoBananaHistory {
  results: NanoBananaResultMetadata[];
}

// Aspect ratio options
export const ASPECT_RATIOS = [
  { value: "16:9" as const, label: "Landscape (16:9)" },
  { value: "9:16" as const, label: "Portrait (9:16)" },
  { value: "1:1" as const, label: "Square (1:1)" },
  { value: "4:3" as const, label: "Standard (4:3)" },
  { value: "3:4" as const, label: "Portrait (3:4)" },
];

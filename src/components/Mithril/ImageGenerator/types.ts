// ============================================
// ImageGenerator Types (Stage 6)
// ============================================

export type ImageGenAspectRatio = '1:1' | '16:9' | '9:16';
export type ImageGenFrameStatus = 'pending' | 'generating' | 'completed' | 'failed';

/**
 * Image variant for storing multiple generated versions
 */
export interface ImageVariant {
  id: string;
  imageRef: string; // S3 URL
  prompt: string;
  createdAt: number;
}

/**
 * A single frame in the ImageGenerator storyboard
 */
export interface ImageGenFrame {
  id: string; // UUID for React key and state matching
  sceneIndex: number; // From storyboard scene
  clipIndex: number; // From storyboard clip
  frameLabel: string; // e.g., "1A", "1B", "2"
  frameNumber: string; // e.g., "001", "001A", "002"
  shotGroup: number; // Grouping for UI display

  // Generation prompts
  prompt: string; // Main image prompt
  backgroundId: string; // Reference to BgSheet background
  refFrame: string; // Reference to another frame's label

  // Generated image
  imageUrl: string | null; // S3 URL of generated image
  imageBase64: string | null; // Temp base64 before S3 upload
  imageUpdatedAt?: number; // Timestamp for cache busting
  status: ImageGenFrameStatus;
  isLoading: boolean;
  error?: string;

  // Remix features
  remixPrompt: string;
  remixImageUrl: string | null;
  remixImageBase64: string | null;

  // Drawing edits
  hasDrawingEdits: boolean;
  editedImageUrl: string | null;
}

/**
 * Settings for ImageGenerator
 */
export interface ImageGenSettings {
  stylePrompt: string;
  aspectRatio: ImageGenAspectRatio;
}

/**
 * Character asset reference (from Prop Designer)
 */
export interface CharacterAssetRef {
  id: string;
  name: string;
  imageUrl: string; // Design sheet or reference image URL
  modes?: {
    id: string;
    name: string;
    imageUrl: string;
  }[];
}

/**
 * Background asset reference (from Stage 4)
 */
export interface BackgroundAssetRef {
  id: string;
  name: string;
  angles: {
    angle: string;
    imageRef: string;
  }[];
}

/**
 * Locally uploaded asset (stored in memory with base64)
 */
export interface LocalAssetRef {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  category: "character" | "background";
}

/**
 * Result metadata for Stage 6 (saved to context and Firestore)
 */
export interface ImageGenResultMetadata {
  frames: ImageGenFrameMetadata[];
  settings: ImageGenSettings;
  createdAt: number;
}

/**
 * Frame metadata (without base64 data)
 */
export interface ImageGenFrameMetadata {
  id: string;
  sceneIndex: number;
  clipIndex: number;
  frameLabel: string;
  frameNumber: string;
  shotGroup: number;
  prompt: string;
  backgroundId: string;
  refFrame: string;
  imageRef: string; // S3 URL
  status: ImageGenFrameStatus;
  remixPrompt: string;
  remixImageRef: string | null;
  editedImageRef: string | null;
}

/**
 * Props for FrameCard component
 */
export interface FrameCardProps {
  frame: ImageGenFrame;
  onPromptChange: (id: string, value: string) => void;
  onRemixPromptChange: (id: string, value: string) => void;
  onBgChange: (id: string, value: string) => void;
  onRefChange: (id: string, value: string) => void;
  onGenerate: (id: string) => void;
  onRemix: (id: string) => void;
  onEdit: (id: string) => void;
  onDownload: (id: string, isRemix?: boolean) => void;
  onOpenModal: (url: string) => void;
  isBatchRunning: boolean;
  globalIdx: number;
  characterAssets: CharacterAssetRef[];
}

/**
 * Props for DrawingModal component
 */
export interface DrawingModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (editedImageBase64: string) => void;
}

/**
 * Props for ImageModal component
 */
export interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

/**
 * Image generation request payload
 */
export interface GenerateImageRequest {
  prompt: string;
  stylePrompt: string;
  aspectRatio: ImageGenAspectRatio;
  backgroundId?: string;
  characterRefs?: string[]; // Character IDs detected in prompt
  refFrameImageUrl?: string; // Reference frame image URL
  customApiKey?: string;
}

/**
 * Image generation response
 */
export interface GenerateImageResponse {
  success: boolean;
  imageBase64?: string;
  mimeType?: string;
  error?: string;
}

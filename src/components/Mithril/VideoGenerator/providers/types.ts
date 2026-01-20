// Video Provider Abstraction Types

export type AspectRatio = "16:9" | "9:16";

export interface AspectRatioOption {
  value: AspectRatio;
  label: string;
}

export interface DurationOption {
  value: number;
  label: string;
}

/**
 * Provider-specific constraints and configuration
 */
export interface ProviderConstraints {
  // Supported durations in seconds
  durations: number[];
  // Supported aspect ratios
  aspectRatios: AspectRatioOption[];
  // Size mapping for each aspect ratio
  sizes: Record<AspectRatio, string>;
  // Polling configuration
  polling: {
    intervalMs: number;
    maxAttempts: number;
  };
  // Whether provider supports image-to-video
  supportsImageToVideo: boolean;
}

/**
 * Provider metadata for UI display
 */
export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  modelName: string; // e.g., "sora-2", "runway-gen3"
  constraints: ProviderConstraints;
}

/**
 * Request to submit a video generation job
 */
export interface VideoSubmitRequest {
  prompt: string;
  imageBase64?: string;
  duration: number;
  aspectRatio: AspectRatio;
}

/**
 * Result of submitting a video generation job
 */
export interface VideoSubmitResult {
  jobId: string;
  status: "pending";
}

/**
 * Result of checking video generation status
 */
export interface VideoStatusResult {
  jobId: string;
  status: "pending" | "running" | "completed" | "failed";
  videoUrl?: string;
  s3FileName?: string;
  error?: string;
}

/**
 * Video provider interface - all providers must implement this
 */
export interface VideoProvider {
  /**
   * Provider ID (e.g., 'sora', 'runway', etc.)
   */
  readonly id: string;

  /**
   * Human-readable provider name
   */
  readonly name: string;

  /**
   * Provider description
   */
  readonly description: string;

  /**
   * Model name/version (e.g., 'sora-2', 'runway-gen3')
   */
  readonly modelName: string;

  /**
   * Get provider constraints
   */
  getConstraints(): ProviderConstraints;

  /**
   * Validate a video generation request
   * Returns null if valid, or an error message string if invalid
   */
  validateRequest(request: VideoSubmitRequest): string | null;

  /**
   * Map a requested duration to a valid provider duration
   */
  mapDuration(requestedDuration: number): number;

  /**
   * Submit a video generation job
   */
  submitJob(request: VideoSubmitRequest): Promise<VideoSubmitResult>;

  /**
   * Check the status of a video generation job
   * If completed, downloads from provider and uploads to S3
   */
  checkStatus(jobId: string): Promise<VideoStatusResult>;
}
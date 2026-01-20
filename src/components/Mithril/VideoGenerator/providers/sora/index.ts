// Sora Video Provider Implementation

import type {
  VideoProvider,
  VideoSubmitRequest,
  VideoSubmitResult,
  VideoStatusResult,
  ProviderConstraints,
} from "../types";
import { SORA_CONSTRAINTS } from "./config";

/**
 * Sora Video Provider
 * Implements the VideoProvider interface for OpenAI's Sora video generation API
 */
export class SoraProvider implements VideoProvider {
  readonly id = "sora";
  readonly name = "Sora";
  readonly description = "OpenAI's text-to-video and image-to-video model";
  readonly modelName = "sora-2";

  getConstraints(): ProviderConstraints {
    return SORA_CONSTRAINTS;
  }

  validateRequest(request: VideoSubmitRequest): string | null {
    if (!request.prompt || typeof request.prompt !== "string") {
      return "Prompt is required and must be a string";
    }

    if (!request.aspectRatio || !["16:9", "9:16"].includes(request.aspectRatio)) {
      return "Aspect ratio must be '16:9' or '9:16'";
    }

    return null;
  }

  mapDuration(requestedDuration: number): number {
    const validDurations = SORA_CONSTRAINTS.durations;
    return validDurations.reduce((prev, curr) =>
      Math.abs(curr - requestedDuration) < Math.abs(prev - requestedDuration)
        ? curr
        : prev
    );
  }

  async submitJob(request: VideoSubmitRequest): Promise<VideoSubmitResult> {
    // This is a client-side proxy - actual API call happens in the API route
    throw new Error(
      "SoraProvider.submitJob should not be called directly. Use the API route instead."
    );
  }

  async checkStatus(jobId: string): Promise<VideoStatusResult> {
    // This is a client-side proxy - actual API call happens in the API route
    throw new Error(
      "SoraProvider.checkStatus should not be called directly. Use the API route instead."
    );
  }
}

// Export singleton instance
export const soraProvider = new SoraProvider();

// Re-export config
export { SORA_CONSTRAINTS, getSoraImageDimensions } from "./config";
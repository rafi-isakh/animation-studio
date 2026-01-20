// Veo 3 Video Provider Implementation

import type {
  VideoProvider,
  VideoSubmitRequest,
  VideoSubmitResult,
  VideoStatusResult,
  ProviderConstraints,
} from "../types";
import { VEO3_CONSTRAINTS } from "./config";

/**
 * Veo 3 Video Provider
 * Implements the VideoProvider interface for Google's Veo 3 video generation API
 */
export class Veo3Provider implements VideoProvider {
  readonly id = "veo3";
  readonly name = "Google Veo 3";
  readonly description = "Google's video generation model with native audio";
  readonly modelName = "veo-3.1-generate-preview";

  getConstraints(): ProviderConstraints {
    return VEO3_CONSTRAINTS;
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
    const validDurations = VEO3_CONSTRAINTS.durations;
    return validDurations.reduce((prev, curr) =>
      Math.abs(curr - requestedDuration) < Math.abs(prev - requestedDuration)
        ? curr
        : prev
    );
  }

  async submitJob(request: VideoSubmitRequest): Promise<VideoSubmitResult> {
    // This is a client-side proxy - actual API call happens in the API route
    throw new Error(
      "Veo3Provider.submitJob should not be called directly. Use the API route instead."
    );
  }

  async checkStatus(jobId: string): Promise<VideoStatusResult> {
    // This is a client-side proxy - actual API call happens in the API route
    throw new Error(
      "Veo3Provider.checkStatus should not be called directly. Use the API route instead."
    );
  }
}

// Export singleton instance
export const veo3Provider = new Veo3Provider();

// Re-export config
export { VEO3_CONSTRAINTS, getVeo3ImageDimensions } from "./config";
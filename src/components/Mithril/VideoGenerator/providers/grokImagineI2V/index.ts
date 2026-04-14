// Grok Imagine I2V Provider (ModelsLab grok-imagine-video-i2v)

import type {
  VideoProvider,
  VideoSubmitRequest,
  VideoSubmitResult,
  VideoStatusResult,
  ProviderConstraints,
  AspectRatio,
} from "../types";

const GROK_IMAGINE_I2V_CONSTRAINTS: ProviderConstraints = {
  durations: [4, 8],
  aspectRatios: [
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
  ],
  sizes: {
    "16:9": "1280x720",
    "9:16": "720x1280",
  } as Record<AspectRatio, string>,
  polling: {
    intervalMs: 10000,
    maxAttempts: 60, // 10 min max
  },
  supportsImageToVideo: true,
};

class GrokImagineI2VProvider implements VideoProvider {
  readonly id = "grok_imagine_i2v";
  readonly name = "Grok (ModelsLab)";
  readonly description = "ModelsLab grok-imagine-video-i2v model";
  readonly modelName = "grok-imagine-video-i2v";

  getConstraints(): ProviderConstraints {
    return GROK_IMAGINE_I2V_CONSTRAINTS;
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
    const validDurations = GROK_IMAGINE_I2V_CONSTRAINTS.durations;
    return validDurations.reduce((prev, curr) =>
      Math.abs(curr - requestedDuration) < Math.abs(prev - requestedDuration)
        ? curr
        : prev
    );
  }

  async submitJob(_request: VideoSubmitRequest): Promise<VideoSubmitResult> {
    throw new Error(
      "GrokImagineI2VProvider.submitJob should not be called directly. Use the API route instead."
    );
  }

  async checkStatus(_jobId: string): Promise<VideoStatusResult> {
    throw new Error(
      "GrokImagineI2VProvider.checkStatus should not be called directly. Use the API route instead."
    );
  }
}

export const grokImagineI2VProvider = new GrokImagineI2VProvider();

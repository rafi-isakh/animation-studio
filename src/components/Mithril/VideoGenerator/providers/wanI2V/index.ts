// WAN 2.1 Image-to-Video Provider (ModelsLab image-to-video-ultra)

import type {
  VideoProvider,
  VideoSubmitRequest,
  VideoSubmitResult,
  VideoStatusResult,
  ProviderConstraints,
  AspectRatio,
} from "../types";

const WAN_I2V_CONSTRAINTS: ProviderConstraints = {
  durations: [5],
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
    maxAttempts: 90, // 15 min max
  },
  supportsImageToVideo: true,
};

class WanI2VProvider implements VideoProvider {
  readonly id = "wan_i2v";
  readonly name = "WAN 2.1";
  readonly description = "ModelsLab's WAN 2.1 image-to-video ultra model";
  readonly modelName = "wan2.1";

  getConstraints(): ProviderConstraints {
    return WAN_I2V_CONSTRAINTS;
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
    const validDurations = WAN_I2V_CONSTRAINTS.durations;
    return validDurations.reduce((prev, curr) =>
      Math.abs(curr - requestedDuration) < Math.abs(prev - requestedDuration)
        ? curr
        : prev
    );
  }

  async submitJob(_request: VideoSubmitRequest): Promise<VideoSubmitResult> {
    throw new Error(
      "WanI2VProvider.submitJob should not be called directly. Use the API route instead."
    );
  }

  async checkStatus(_jobId: string): Promise<VideoStatusResult> {
    throw new Error(
      "WanI2VProvider.checkStatus should not be called directly. Use the API route instead."
    );
  }
}

export const wanI2VProvider = new WanI2VProvider();

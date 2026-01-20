// Veo 3 Provider Configuration

import type { ProviderConstraints, AspectRatio } from "../types";

/**
 * Veo 3-specific constraints and configuration
 */
export const VEO3_CONSTRAINTS: ProviderConstraints = {
  // Veo 3 supports 4, 6, or 8 second videos
  durations: [4, 6, 8],

  // Supported aspect ratios
  aspectRatios: [
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
  ],

  // Veo 3 outputs at 720p resolution
  sizes: {
    "16:9": "1280x720",
    "9:16": "720x1280",
  } as Record<AspectRatio, string>,

  // Polling configuration - Veo 3 can take longer
  polling: {
    intervalMs: 10000, // Poll every 10 seconds
    maxAttempts: 90, // 15 minutes max wait (90 * 10s)
  },

  // Veo 3 supports image-to-video
  supportsImageToVideo: true,
};

/**
 * Get image dimensions for Veo 3 based on aspect ratio
 */
export function getVeo3ImageDimensions(aspectRatio: AspectRatio): {
  width: number;
  height: number;
} {
  if (aspectRatio === "16:9") {
    return { width: 1280, height: 720 };
  }
  return { width: 720, height: 1280 };
}
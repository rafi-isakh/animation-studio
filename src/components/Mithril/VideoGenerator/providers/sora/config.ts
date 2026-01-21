// Sora Provider Configuration

import type { ProviderConstraints, AspectRatio } from "../types";

/**
 * Sora-specific constraints and configuration
 */
export const SORA_CONSTRAINTS: ProviderConstraints = {
  // Sora only supports 4, 8, or 12 second videos
  durations: [4, 8, 12],

  // Supported aspect ratios
  aspectRatios: [
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
  ],

  // Sora size mapping: 720x1280, 1280x720, 1024x1792, 1792x1024
  sizes: {
    "16:9": "1280x720",
    "9:16": "720x1280",
  } as Record<AspectRatio, string>,

  // Polling configuration
  polling: {
    intervalMs: 5000, // Poll every 5 seconds
    maxAttempts: 120, // 10 minutes max wait (120 * 5s)
  },

  // Sora supports image-to-video
  supportsImageToVideo: true,
};

/**
 * Get image dimensions for Sora based on aspect ratio
 */
export function getSoraImageDimensions(aspectRatio: AspectRatio): {
  width: number;
  height: number;
} {
  if (aspectRatio === "16:9") {
    return { width: 1280, height: 720 };
  }
  return { width: 720, height: 1280 };
}
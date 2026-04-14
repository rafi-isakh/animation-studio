"use client";

/**
 * ImageGeneratorWrapper - Feature flag wrapper for ImageGenerator
 *
 * Switches between direct API mode and orchestrator mode based on
 * the NEXT_PUBLIC_USE_IMAGE_ORCHESTRATOR environment variable.
 */

import ImageGenerator from "./index";
import ImageGeneratorOrchestrator from "./ImageGeneratorOrchestrator";

const USE_ORCHESTRATOR = process.env.NEXT_PUBLIC_USE_IMAGE_ORCHESTRATOR === "true";

// Export USE_ORCHESTRATOR for debugging
export { USE_ORCHESTRATOR };

export default function ImageGeneratorWrapper() {
  if (USE_ORCHESTRATOR) {
    return <ImageGeneratorOrchestrator />;
  }

  return <ImageGenerator />;
}

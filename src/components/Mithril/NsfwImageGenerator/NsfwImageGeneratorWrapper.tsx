"use client";

/**
 * NsfwImageGeneratorWrapper - Feature flag wrapper for NsfwImageGenerator
 *
 * Switches between direct API mode and orchestrator mode based on
 * the NEXT_PUBLIC_USE_IMAGE_ORCHESTRATOR environment variable.
 */

import NsfwImageGenerator from "./index";
import NsfwImageGeneratorOrchestrator from "./NsfwImageGeneratorOrchestrator";

const USE_ORCHESTRATOR = process.env.NEXT_PUBLIC_USE_IMAGE_ORCHESTRATOR === "true";

// Export USE_ORCHESTRATOR for debugging
export { USE_ORCHESTRATOR };

export default function NsfwImageGeneratorWrapper() {
  console.log("[NsfwImageGenerator] Loaded. USE_ORCHESTRATOR =", USE_ORCHESTRATOR);

  if (USE_ORCHESTRATOR) {
    return <NsfwImageGeneratorOrchestrator />;
  }

  return <NsfwImageGenerator />;
}

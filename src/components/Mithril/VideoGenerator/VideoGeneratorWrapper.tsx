"use client";

/**
 * VideoGeneratorWrapper - Conditionally renders legacy or orchestrator mode
 *
 * Enable orchestrator mode by setting:
 * NEXT_PUBLIC_USE_VIDEO_ORCHESTRATOR=true
 *
 * This allows gradual migration from the legacy polling-based approach
 * to the new orchestrator-based approach with real-time Firestore updates.
 */

import VideoGenerator from "./index";
import VideoGeneratorOrchestrator from "./VideoGeneratorOrchestrator";

const USE_ORCHESTRATOR = process.env.NEXT_PUBLIC_USE_VIDEO_ORCHESTRATOR === "true";

// Debug log - remove after testing
console.log("[VideoGenerator] USE_ORCHESTRATOR:", USE_ORCHESTRATOR, "env value:", process.env.NEXT_PUBLIC_USE_VIDEO_ORCHESTRATOR);

export default function VideoGeneratorWrapper() {
  if (USE_ORCHESTRATOR) {
    return <VideoGeneratorOrchestrator />;
  }

  return <VideoGenerator />;
}
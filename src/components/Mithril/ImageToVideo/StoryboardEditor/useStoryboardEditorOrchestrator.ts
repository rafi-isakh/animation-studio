"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  subscribeToProjectStoryboardEditorJobs,
  mapStoryboardEditorJobToUpdate,
  JobQueueDocument,
  StoryboardEditorJobUpdate,
} from '../../services/firestore/jobQueue';

// Re-export types for external consumers
export type { StoryboardEditorJobUpdate };

interface SubmitGenerateJobParams {
  sceneIndex: number;
  clipIndex: number;
  frameType: 'start' | 'end';
  prompt: string;
  referenceImageUrl?: string;
  assetImageUrls?: string[];
  aspectRatio?: '1:1' | '16:9' | '9:16';
}

interface SubmitRemixJobParams {
  sceneIndex: number;
  clipIndex: number;
  frameType: 'start' | 'end';
  prompt: string;
  originalImageUrl: string;
  originalContext: string;
  remixPrompt: string;
  assetImageUrls?: string[];
  aspectRatio?: '1:1' | '16:9' | '9:16';
}

interface SubmitJobResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  createdAt?: string;
  error?: string;
}

interface UseStoryboardEditorOrchestratorOptions {
  projectId: string | null;
  customApiKey?: string;
  onFrameUpdate?: (update: StoryboardEditorJobUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the storyboard editor orchestrator backend.
 * Provides methods to submit generate/remix jobs and subscribes to real-time status updates.
 *
 * Returns `pendingCompletedUpdates` — completed job updates from the initial Firestore
 * snapshot that arrived before storyboard data was loaded. The consumer should apply
 * these once data is ready, then call `clearPendingUpdates()`.
 */
export function useStoryboardEditorOrchestrator({
  projectId,
  customApiKey,
  onFrameUpdate,
  enabled = true,
}: UseStoryboardEditorOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onFrameUpdateRef = useRef(onFrameUpdate);
  // Track active job IDs per frame key (sceneIndex-clipIndex-frameType -> jobId)
  const activeJobIdsRef = useRef<Map<string, string>>(new Map());
  // Track whether the initial Firestore snapshot has been processed
  const initialSnapshotRef = useRef(true);
  // Track job IDs that have already been forwarded as completed to avoid duplicates
  const processedJobIdsRef = useRef<Set<string>>(new Set());
  // Queue completed updates from initial snapshot for deferred application
  const [pendingCompletedUpdates, setPendingCompletedUpdates] = useState<StoryboardEditorJobUpdate[]>([]);

  const clearPendingUpdates = useCallback(() => {
    setPendingCompletedUpdates([]);
  }, []);

  // Keep callback ref updated
  useEffect(() => {
    onFrameUpdateRef.current = onFrameUpdate;
  }, [onFrameUpdate]);

  // Reset state when projectId changes
  useEffect(() => {
    initialSnapshotRef.current = true;
    processedJobIdsRef.current = new Set();
    activeJobIdsRef.current = new Map();
    setPendingCompletedUpdates([]);
  }, [projectId]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    const unsubscribe = subscribeToProjectStoryboardEditorJobs(projectId, (jobs: JobQueueDocument[]) => {
      const activeJobs = activeJobIdsRef.current;
      const isInitial = initialSnapshotRef.current;

      if (isInitial) {
        initialSnapshotRef.current = false;

        // On initial snapshot, recover in-flight jobs and queue completed jobs
        // For each frame, find the most recent job (highest created_at)
        const latestByFrame = new Map<string, JobQueueDocument>();
        jobs.forEach((job) => {
          if (!job.id) return;
          const frameKey = `${job.scene_index}-${job.clip_index}-${job.frame_type || 'start'}`;
          const existing = latestByFrame.get(frameKey);
          if (!existing || (job.created_at && existing.created_at && job.created_at > existing.created_at)) {
            latestByFrame.set(frameKey, job);
          }
        });

        const completedUpdates: StoryboardEditorJobUpdate[] = [];

        latestByFrame.forEach((job, frameKey) => {
          const update = mapStoryboardEditorJobToUpdate(job);
          const isTerminal = update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled';

          if (!isTerminal) {
            // Re-track in-flight jobs so subsequent snapshots pick them up
            activeJobs.set(frameKey, job.id);
            onFrameUpdateRef.current?.(update);
          } else if (update.status === 'completed' && update.imageUrl) {
            // Queue completed jobs — storyboard data may not be loaded yet
            processedJobIdsRef.current.add(job.id);
            completedUpdates.push(update);
          }
        });

        if (completedUpdates.length > 0) {
          setPendingCompletedUpdates(completedUpdates);
        }
        return;
      }

      // Subsequent snapshots: only process actively tracked jobs
      if (activeJobs.size === 0) return;

      jobs.forEach((job) => {
        if (!job.id) return;
        const frameKey = `${job.scene_index}-${job.clip_index}-${job.frame_type || 'start'}`;
        const activeJobId = activeJobs.get(frameKey);

        if (activeJobId && job.id === activeJobId) {
          // Skip if already processed
          if (processedJobIdsRef.current.has(job.id)) return;

          const update = mapStoryboardEditorJobToUpdate(job);
          onFrameUpdateRef.current?.(update);

          // Clear active tracking on terminal states
          if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
            activeJobs.delete(frameKey);
            processedJobIdsRef.current.add(job.id);
          }
        }
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a generate job (manga panel -> anime frame)
   */
  const submitGenerateJob = useCallback(async (params: SubmitGenerateJobParams): Promise<SubmitJobResponse> => {
    if (!projectId) {
      return { success: false, error: 'No project ID' };
    }

    try {
      const response = await fetch('/api/storyboard-editor/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sceneIndex: params.sceneIndex,
          clipIndex: params.clipIndex,
          frameType: params.frameType,
          operation: 'generate',
          prompt: params.prompt,
          referenceImageUrl: params.referenceImageUrl,
          assetImageUrls: params.assetImageUrls || [],
          aspectRatio: params.aspectRatio || '16:9',
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit generate job' };
      }

      // Track this job as active for its frame
      const frameKey = `${params.sceneIndex}-${params.clipIndex}-${params.frameType}`;
      activeJobIdsRef.current.set(frameKey, data.jobId);

      return {
        success: true,
        jobId: data.jobId,
        status: data.status,
        createdAt: data.createdAt,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [projectId, customApiKey]);

  /**
   * Submit a remix job (modify existing generated image)
   */
  const submitRemixJob = useCallback(async (params: SubmitRemixJobParams): Promise<SubmitJobResponse> => {
    if (!projectId) {
      return { success: false, error: 'No project ID' };
    }

    try {
      const response = await fetch('/api/storyboard-editor/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sceneIndex: params.sceneIndex,
          clipIndex: params.clipIndex,
          frameType: params.frameType,
          operation: 'remix',
          prompt: params.prompt,
          originalImageUrl: params.originalImageUrl,
          originalContext: params.originalContext,
          remixPrompt: params.remixPrompt,
          assetImageUrls: params.assetImageUrls || [],
          aspectRatio: params.aspectRatio || '16:9',
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit remix job' };
      }

      // Track this job as active for its frame
      const frameKey = `${params.sceneIndex}-${params.clipIndex}-${params.frameType}`;
      activeJobIdsRef.current.set(frameKey, data.jobId);

      return {
        success: true,
        jobId: data.jobId,
        status: data.status,
        createdAt: data.createdAt,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [projectId, customApiKey]);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/storyboard-editor/orchestrator/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to cancel job' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  return {
    submitGenerateJob,
    submitRemixJob,
    cancelJob,
    pendingCompletedUpdates,
    clearPendingUpdates,
  };
}

"use client";

import { useCallback, useEffect, useRef } from 'react';
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
  // This prevents old completed jobs from Firestore initial snapshot from being processed
  const activeJobIdsRef = useRef<Map<string, string>>(new Map());

  // Keep callback ref updated
  useEffect(() => {
    onFrameUpdateRef.current = onFrameUpdate;
  }, [onFrameUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    const unsubscribe = subscribeToProjectStoryboardEditorJobs(projectId, (jobs: JobQueueDocument[]) => {
      const activeJobs = activeJobIdsRef.current;
      if (activeJobs.size === 0) return;

      // Only process jobs that we actively submitted
      jobs.forEach((job) => {
        if (!job.id) return;
        const frameKey = `${job.scene_index}-${job.clip_index}-${job.frame_type || 'start'}`;
        const activeJobId = activeJobs.get(frameKey);

        if (activeJobId && job.id === activeJobId) {
          const update = mapStoryboardEditorJobToUpdate(job);
          onFrameUpdateRef.current?.(update);

          // Clear active tracking on terminal states
          if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
            activeJobs.delete(frameKey);
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
  };
}

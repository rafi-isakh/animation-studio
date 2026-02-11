import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToProjectStorySplitterJobs,
  mapStorySplitterJobToUpdate,
  JobQueueDocument,
  StorySplitterJobUpdate,
  StorySplitterJobStatus,
} from '../../services/firestore/jobQueue';

// Re-export types
export type { StorySplitterJobUpdate, StorySplitterJobStatus };

interface SubmitJobParams {
  text: string;
  guidelines?: string;
  numParts?: number;
}

interface SubmitJobResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  createdAt?: string;
  error?: string;
}

interface UseStorySplitterOrchestratorOptions {
  projectId: string;
  customApiKey?: string;
  onJobUpdate?: (update: StorySplitterJobUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the story splitter orchestrator backend.
 * Provides methods to submit story split jobs and subscribes to real-time status updates.
 */
export function useStorySplitterOrchestrator({
  projectId,
  customApiKey,
  onJobUpdate,
  enabled = true,
}: UseStorySplitterOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onJobUpdateRef = useRef(onJobUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onJobUpdateRef.current = onJobUpdate;
  }, [onJobUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Subscribe to project story splitter jobs
    const unsubscribe = subscribeToProjectStorySplitterJobs(projectId, (jobs: JobQueueDocument[]) => {
      // Notify callback for each job update
      jobs.forEach((job) => {
        const update = mapStorySplitterJobToUpdate(job);
        onJobUpdateRef.current?.(update);
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a story splitter job
   * Splits the story text into parts with cliffhanger analysis
   */
  const submitJob = useCallback(async (params: SubmitJobParams): Promise<SubmitJobResponse> => {
    try {
      const response = await fetch('/api/story-splitter/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          text: params.text,
          guidelines: params.guidelines,
          numParts: params.numParts,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit story splitter job' };
      }

      return { success: true, jobId: data.jobId, status: data.status, createdAt: data.createdAt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [projectId, customApiKey]);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/story-splitter/orchestrator/cancel', {
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
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  /**
   * Get current job status (one-time fetch, prefer Firestore subscription for real-time)
   */
  const getJobStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/story-splitter/orchestrator/status?jobId=${jobId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get job status');
    }

    return data;
  }, []);

  return {
    submitJob,
    cancelJob,
    getJobStatus,
  };
}

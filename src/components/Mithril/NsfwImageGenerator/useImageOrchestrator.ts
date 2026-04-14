import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToProjectImageJobs,
  mapImageJobToFrameUpdate,
  JobQueueDocument,
  FrameUpdate,
} from '../services/firestore/jobQueue';

interface SubmitImageJobParams {
  projectId: string;
  frameId: string;
  sceneIndex: number;
  clipIndex: number;
  frameLabel: string;
  prompt: string;
  stylePrompt?: string;
  referenceUrls?: string[];
  aspectRatio: '16:9' | '9:16' | '1:1';
  apiKey?: string;
}

interface SubmitBatchParams {
  projectId: string;
  jobs: SubmitImageJobParams[];
  apiKey?: string;
}

interface CancelJobParams {
  jobId: string;
}

interface SubmitJobResponse {
  jobId: string;
  status: string;
  createdAt: string;
}

interface SubmitBatchResponse {
  batchId: string;
  jobs: SubmitJobResponse[];
  totalCount: number;
}

export type { FrameUpdate };

interface UseImageOrchestratorOptions {
  projectId: string | null;
  onFrameUpdate?: (update: FrameUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the image orchestrator backend.
 * Provides methods to submit jobs and subscribes to real-time status updates.
 */
export function useImageOrchestrator({
  projectId,
  onFrameUpdate,
  enabled = true,
}: UseImageOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onFrameUpdateRef = useRef(onFrameUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onFrameUpdateRef.current = onFrameUpdate;
  }, [onFrameUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Subscribe to project image jobs
    const unsubscribe = subscribeToProjectImageJobs(projectId, (jobs: JobQueueDocument[]) => {
      // Notify callback for each job update
      jobs.forEach((job) => {
        const update = mapImageJobToFrameUpdate(job);
        onFrameUpdateRef.current?.(update);
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a single image generation job
   */
  const submitJob = useCallback(async (params: SubmitImageJobParams): Promise<SubmitJobResponse> => {
    const response = await fetch('/api/image/orchestrator/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit image job');
    }

    return data;
  }, []);

  /**
   * Submit multiple image generation jobs as a batch
   */
  const submitBatch = useCallback(async (params: SubmitBatchParams): Promise<SubmitBatchResponse> => {
    // Submit jobs individually (backend batch endpoint can be added later)
    const results: SubmitJobResponse[] = [];

    for (const job of params.jobs) {
      const jobWithKey = {
        ...job,
        apiKey: job.apiKey || params.apiKey,
      };
      const result = await submitJob(jobWithKey);
      results.push(result);
    }

    return {
      batchId: `batch_${Date.now()}`,
      jobs: results,
      totalCount: results.length,
    };
  }, [submitJob]);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (params: CancelJobParams): Promise<void> => {
    const response = await fetch('/api/image/orchestrator/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel job');
    }
  }, []);

  /**
   * Get current job status (one-time fetch, prefer Firestore subscription for real-time)
   */
  const getJobStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/image/orchestrator/status?jobId=${jobId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get job status');
    }

    return data;
  }, []);

  return {
    submitJob,
    submitBatch,
    cancelJob,
    getJobStatus,
  };
}

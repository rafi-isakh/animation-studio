import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToProjectJobs,
  mapJobToClipUpdate,
  JobQueueDocument,
} from '../services/firestore/jobQueue';

interface SubmitJobParams {
  projectId: string;
  sceneIndex: number;
  clipIndex: number;
  providerId: 'sora' | 'veo3';
  prompt: string;
  imageUrl?: string;
  duration: number;
  aspectRatio: '16:9' | '9:16';
  apiKey?: string;
}

interface SubmitBatchParams {
  projectId: string;
  jobs: SubmitJobParams[];
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

export interface ClipUpdate {
  sceneIndex: number;
  clipIndex: number;
  jobId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'retrying';
  videoUrl: string | null;
  s3FileName: string | null;
  error?: string;
  providerId: string;
  progress: number;
}

interface UseVideoOrchestratorOptions {
  projectId: string | null;
  onClipUpdate?: (update: ClipUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the video orchestrator backend.
 * Provides methods to submit jobs and subscribes to real-time status updates.
 */
export function useVideoOrchestrator({
  projectId,
  onClipUpdate,
  enabled = true,
}: UseVideoOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onClipUpdateRef = useRef(onClipUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onClipUpdateRef.current = onClipUpdate;
  }, [onClipUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Subscribe to project jobs
    const unsubscribe = subscribeToProjectJobs(projectId, (jobs: JobQueueDocument[]) => {
      // Notify callback for each job update
      jobs.forEach((job) => {
        const update = mapJobToClipUpdate(job);
        onClipUpdateRef.current?.(update);
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a single video generation job
   */
  const submitJob = useCallback(async (params: SubmitJobParams): Promise<SubmitJobResponse> => {
    const response = await fetch('/api/video/orchestrator/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit job');
    }

    return data;
  }, []);

  /**
   * Submit multiple video generation jobs as a batch
   */
  const submitBatch = useCallback(async (params: SubmitBatchParams): Promise<SubmitBatchResponse> => {
    const response = await fetch('/api/video/orchestrator/submit-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit batch');
    }

    return data;
  }, []);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (params: CancelJobParams): Promise<void> => {
    const response = await fetch('/api/video/orchestrator/cancel', {
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
    const response = await fetch(`/api/video/orchestrator/status?jobId=${jobId}`);
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
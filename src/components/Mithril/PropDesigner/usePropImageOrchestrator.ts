import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToProjectPropDesignJobs,
  mapPropJobToPropUpdate,
  JobQueueDocument,
  PropUpdate,
  PropStatus,
} from '../services/firestore/jobQueue';

// Re-export the prop status type
export type PropJobStatus = PropStatus;

interface SubmitPropDesignJobParams {
  propId: string;
  propName: string;
  category: 'character' | 'object';
  prompt: string;
  genre?: string;
  styleKeyword?: string;
  referenceImages?: string[];
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

interface SubmitBatchParams {
  jobs: Array<SubmitPropDesignJobParams>;
}

interface CancelJobParams {
  jobId: string;
}

interface SubmitJobResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  createdAt?: string;
  error?: string;
}

interface SubmitBatchResponse {
  success: boolean;
  batchId?: string;
  jobs?: Array<{ propId: string; jobId: string }>;
  totalCount?: number;
  error?: string;
}

export type { PropUpdate };

interface UsePropImageOrchestratorOptions {
  projectId: string;
  customApiKey?: string;
  onPropUpdate?: (update: PropUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the prop design sheet orchestrator backend.
 * Provides methods to submit jobs and subscribes to real-time status updates.
 */
export function usePropImageOrchestrator({
  projectId,
  customApiKey,
  onPropUpdate,
  enabled = true,
}: UsePropImageOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onPropUpdateRef = useRef(onPropUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onPropUpdateRef.current = onPropUpdate;
  }, [onPropUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Subscribe to project prop design sheet jobs
    const unsubscribe = subscribeToProjectPropDesignJobs(projectId, (jobs: JobQueueDocument[]) => {
      // Notify callback for each job update
      jobs.forEach((job) => {
        const update = mapPropJobToPropUpdate(job);
        onPropUpdateRef.current?.(update);
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a single prop design sheet generation job
   */
  const submitJob = useCallback(async (params: SubmitPropDesignJobParams): Promise<SubmitJobResponse> => {
    try {
      const response = await fetch('/api/prop-design/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...params,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit prop design job' };
      }

      return { success: true, jobId: data.jobId, status: data.status, createdAt: data.createdAt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [projectId, customApiKey]);

  /**
   * Submit multiple prop design sheet generation jobs as a batch
   */
  const submitBatch = useCallback(async (params: SubmitBatchParams): Promise<SubmitBatchResponse> => {
    try {
      const response = await fetch('/api/prop-design/orchestrator/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          jobs: params.jobs,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit prop design batch' };
      }

      return {
        success: true,
        batchId: data.batchId,
        jobs: data.jobs?.map((j: { propId?: string; jobId: string }) => ({ propId: j.propId, jobId: j.jobId })) || [],
        totalCount: data.totalCount,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [projectId, customApiKey]);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (params: CancelJobParams): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/prop-design/orchestrator/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
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
    const response = await fetch(`/api/prop-design/orchestrator/status?jobId=${jobId}`);
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

import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToProjectBgJobs,
  mapBgJobToAngleUpdate,
  JobQueueDocument,
  AngleUpdate,
} from '../services/firestore/jobQueue';

interface SubmitBgJobParams {
  projectId: string;
  bgId: string;
  bgAngle: string;
  bgName: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  referenceUrl?: string;  // Master reference image URL for style consistency
  apiKey?: string;
}

interface SubmitBatchParams {
  projectId: string;
  jobs: SubmitBgJobParams[];
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

export type { AngleUpdate };

interface UseBgOrchestratorOptions {
  projectId: string | null;
  onAngleUpdate?: (update: AngleUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the background orchestrator backend.
 * Provides methods to submit jobs and subscribes to real-time status updates.
 */
export function useBgOrchestrator({
  projectId,
  onAngleUpdate,
  enabled = true,
}: UseBgOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onAngleUpdateRef = useRef(onAngleUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onAngleUpdateRef.current = onAngleUpdate;
  }, [onAngleUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Subscribe to project background jobs
    const unsubscribe = subscribeToProjectBgJobs(projectId, (jobs: JobQueueDocument[]) => {
      // Group jobs by bg_id+bg_angle and keep only the latest job for each angle
      const latestJobsByAngle = new Map<string, JobQueueDocument>();
      
      jobs.forEach((job) => {
        const bgId = job.bg_id || '';
        const angle = job.bg_angle || '';
        if (!bgId || !angle) return;
        
        const angleKey = `${bgId}:${angle}`;
        const existing = latestJobsByAngle.get(angleKey);
        // Keep the job with the latest created_at timestamp
        if (!existing || (job.created_at && (!existing.created_at || job.created_at > existing.created_at))) {
          latestJobsByAngle.set(angleKey, job);
        }
      });
      
      // Notify callback only for the latest job of each angle
      latestJobsByAngle.forEach((job) => {
        const update = mapBgJobToAngleUpdate(job);
        onAngleUpdateRef.current?.(update);
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a single background generation job
   */
  const submitJob = useCallback(async (params: SubmitBgJobParams): Promise<SubmitJobResponse> => {
    const response = await fetch('/api/bg/orchestrator/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit bg job');
    }

    return data;
  }, []);

  /**
   * Submit multiple background generation jobs as a batch
   */
  const submitBatch = useCallback(async (params: SubmitBatchParams): Promise<SubmitBatchResponse> => {
    const response = await fetch('/api/bg/orchestrator/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: params.projectId,
        jobs: params.jobs,
        apiKey: params.apiKey,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit bg batch');
    }

    return data;
  }, []);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (params: CancelJobParams): Promise<void> => {
    const response = await fetch('/api/bg/orchestrator/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel job');
    }
  }, []);

  return {
    submitJob,
    submitBatch,
    cancelJob,
  };
}

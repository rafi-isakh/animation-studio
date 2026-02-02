import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToSessionPanelJobs,
  mapPanelJobToPanelUpdate,
  JobQueueDocument,
  PanelUpdate,
} from '../../services/firestore/jobQueue';
import { AspectRatio } from './types';

export type { PanelUpdate };

interface SubmitPanelJobParams {
  projectId: string;  // Project ID for S3 storage path
  sessionId: string;  // Session ID for real-time tracking
  panelId: string;
  fileName: string;
  imageBase64: string;
  mimeType: string;
  targetAspectRatio: AspectRatio;
  refinementMode: 'default' | 'zoom' | 'expand';
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

interface UsePanelOrchestratorOptions {
  sessionId: string | null;
  onPanelUpdate?: (update: PanelUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the panel editor orchestrator backend.
 * Provides methods to submit jobs and subscribes to real-time status updates.
 */
export function usePanelOrchestrator({
  sessionId,
  onPanelUpdate,
  enabled = true,
}: UsePanelOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onPanelUpdateRef = useRef(onPanelUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onPanelUpdateRef.current = onPanelUpdate;
  }, [onPanelUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    // Subscribe to session panel jobs
    const unsubscribe = subscribeToSessionPanelJobs(sessionId, (jobs: JobQueueDocument[]) => {
      // Notify callback for each job update
      jobs.forEach((job) => {
        const update = mapPanelJobToPanelUpdate(job);
        onPanelUpdateRef.current?.(update);
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [sessionId, enabled]);

  /**
   * Submit a single panel processing job
   */
  const submitJob = useCallback(async (params: SubmitPanelJobParams): Promise<SubmitJobResponse> => {
    const response = await fetch('/api/panel-editor/orchestrator/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit panel job');
    }

    return data;
  }, []);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (params: CancelJobParams): Promise<void> => {
    const response = await fetch('/api/panel-editor/orchestrator/cancel', {
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
    const response = await fetch(`/api/panel-editor/orchestrator/status?jobId=${jobId}`);
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

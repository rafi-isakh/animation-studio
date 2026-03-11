import { useCallback, useEffect, useRef, useState } from 'react';
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
  provider?: 'gemini' | 'gemini_flash' | 'grok' | 'z_image_turbo' | 'flux2_dev';
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
  // Track whether the initial Firestore snapshot has been processed
  const initialSnapshotRef = useRef(true);
  // Track job IDs already processed to avoid duplicates
  const processedJobIdsRef = useRef<Set<string>>(new Set());
  // Queue updates from initial snapshot for deferred application
  const [pendingUpdates, setPendingUpdates] = useState<PanelUpdate[]>([]);

  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates([]);
  }, []);

  // Keep callback ref updated
  useEffect(() => {
    onPanelUpdateRef.current = onPanelUpdate;
  }, [onPanelUpdate]);

  // Reset state when sessionId changes
  useEffect(() => {
    initialSnapshotRef.current = true;
    processedJobIdsRef.current = new Set();
    setPendingUpdates([]);
  }, [sessionId]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    // Subscribe to session panel jobs
    const unsubscribe = subscribeToSessionPanelJobs(sessionId, (jobs: JobQueueDocument[]) => {
      const isInitial = initialSnapshotRef.current;

      if (isInitial) {
        initialSnapshotRef.current = false;

        // On initial snapshot, group by panelId and keep only the latest job per panel
        const latestByPanel = new Map<string, JobQueueDocument>();
        jobs.forEach((job) => {
          if (!job.id || !job.panel_id) return;
          const existing = latestByPanel.get(job.panel_id);
          if (!existing || (job.created_at && existing.created_at && job.created_at > existing.created_at)) {
            latestByPanel.set(job.panel_id, job);
          }
        });

        const updates: PanelUpdate[] = [];
        latestByPanel.forEach((job) => {
          const update = mapPanelJobToPanelUpdate(job);
          // Only mark terminal jobs as processed; in-flight jobs must remain
          // eligible for subsequent snapshot updates (e.g., generating → completed)
          const isTerminal = update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled';
          if (isTerminal) {
            processedJobIdsRef.current.add(job.id);
          }
          updates.push(update);
        });

        if (updates.length > 0) {
          setPendingUpdates(updates);
        }
        return;
      }

      // Subsequent snapshots: forward directly to callback, skipping processed jobs
      jobs.forEach((job) => {
        if (!job.id) return;
        if (processedJobIdsRef.current.has(job.id)) return;

        const update = mapPanelJobToPanelUpdate(job);
        onPanelUpdateRef.current?.(update);

        const isTerminal = update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled';
        if (isTerminal) {
          processedJobIdsRef.current.add(job.id);
        }
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
    pendingUpdates,
    clearPendingUpdates,
  };
}

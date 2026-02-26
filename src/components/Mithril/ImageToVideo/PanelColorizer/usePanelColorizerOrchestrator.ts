import { useCallback, useEffect, useRef, useState } from 'react';
import {
  subscribeToSessionPanelColorizerJobs,
  mapPanelColorizerJobToUpdate,
  JobQueueDocument,
  PanelColorizerUpdate,
} from '../../services/firestore/jobQueue';
import { AspectRatio } from './types';

export type { PanelColorizerUpdate };

interface SubmitPanelColorizerJobParams {
  projectId: string;
  sessionId: string;
  panelId: string;
  fileName: string;
  imageBase64: string;
  mimeType: string;
  referenceImages: Array<{ base64: string; mimeType: string }>;
  globalPrompt: string;
  targetAspectRatio: AspectRatio;
  apiKey?: string;
  provider?: 'gemini' | 'grok' | 'z_image_turbo';
}

interface CancelJobParams {
  jobId: string;
}

interface SubmitJobResponse {
  jobId: string;
  status: string;
  createdAt: string;
}

interface UsePanelColorizerOrchestratorOptions {
  sessionId: string | null;
  onPanelUpdate?: (update: PanelColorizerUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the panel colorizer orchestrator backend.
 * Provides methods to submit jobs and subscribes to real-time status updates.
 */
export function usePanelColorizerOrchestrator({
  sessionId,
  onPanelUpdate,
  enabled = true,
}: UsePanelColorizerOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onPanelUpdateRef = useRef(onPanelUpdate);
  const initialSnapshotRef = useRef(true);
  const processedJobIdsRef = useRef<Set<string>>(new Set());
  const [pendingUpdates, setPendingUpdates] = useState<PanelColorizerUpdate[]>([]);

  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates([]);
  }, []);

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

    const unsubscribe = subscribeToSessionPanelColorizerJobs(sessionId, (jobs: JobQueueDocument[]) => {
      const isInitial = initialSnapshotRef.current;

      if (isInitial) {
        initialSnapshotRef.current = false;

        // Group by panelId, keep latest per panel
        const latestByPanel = new Map<string, JobQueueDocument>();
        jobs.forEach((job) => {
          if (!job.id || !job.panel_id) return;
          const existing = latestByPanel.get(job.panel_id);
          if (!existing || (job.created_at && existing.created_at && job.created_at > existing.created_at)) {
            latestByPanel.set(job.panel_id, job);
          }
        });

        const updates: PanelColorizerUpdate[] = [];
        latestByPanel.forEach((job) => {
          const update = mapPanelColorizerJobToUpdate(job);
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

      // Subsequent snapshots: forward directly
      jobs.forEach((job) => {
        if (!job.id) return;
        if (processedJobIdsRef.current.has(job.id)) return;

        const update = mapPanelColorizerJobToUpdate(job);
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

  const submitJob = useCallback(async (params: SubmitPanelColorizerJobParams): Promise<SubmitJobResponse> => {
    const response = await fetch('/api/panel-colorizer/orchestrator/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit panel colorizer job');
    }

    return data;
  }, []);

  const cancelJob = useCallback(async (params: CancelJobParams): Promise<void> => {
    const response = await fetch('/api/panel-colorizer/orchestrator/cancel', {
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
    cancelJob,
    pendingUpdates,
    clearPendingUpdates,
  };
}

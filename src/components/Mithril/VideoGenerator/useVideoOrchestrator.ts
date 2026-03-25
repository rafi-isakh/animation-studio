import { useCallback, useEffect, useRef, useState } from 'react';
import {
  subscribeToProjectJobs,
  mapJobToClipUpdate,
  JobQueueDocument,
} from '../services/firestore/jobQueue';

interface SubmitJobParams {
  projectId: string;
  sceneIndex: number;
  clipIndex: number;
  providerId: 'sora' | 'veo3' | 'grok_i2v' | 'grok_imagine_i2v' | 'wan_i2v' | 'wan22_i2v';
  prompt: string;
  imageUrl?: string;
  imageEndUrl?: string;
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
  resolvedImageUrl?: string | null;
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
 *
 * Returns `pendingUpdates` — job updates from the initial Firestore snapshot that
 * arrived before clip data was loaded. The consumer should apply these once data
 * is ready, then call `clearPendingUpdates()`.
 */
export function useVideoOrchestrator({
  projectId,
  onClipUpdate,
  enabled = true,
}: UseVideoOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onClipUpdateRef = useRef(onClipUpdate);
  // Track whether the initial Firestore snapshot has been processed
  const initialSnapshotRef = useRef(true);
  // Track job IDs already processed to avoid duplicates
  const processedJobIdsRef = useRef<Set<string>>(new Set());
  // Queue updates from initial snapshot for deferred application
  const [pendingUpdates, setPendingUpdates] = useState<ClipUpdate[]>([]);

  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates([]);
  }, []);

  // Keep callback ref updated
  useEffect(() => {
    onClipUpdateRef.current = onClipUpdate;
  }, [onClipUpdate]);

  // Reset state when projectId changes
  useEffect(() => {
    initialSnapshotRef.current = true;
    processedJobIdsRef.current = new Set();
    setPendingUpdates([]);
  }, [projectId]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    const unsubscribe = subscribeToProjectJobs(projectId, (allJobs: JobQueueDocument[]) => {
      // Only process video jobs — panel, image, bg, etc. jobs share the same
      // project_id and can have the same scene/clip indices, causing false failures.
      // Legacy video jobs may have no `type` field, so we allow those through too.
      const jobs = allJobs.filter((job) => !job.type || job.type === 'video');

      const isInitial = initialSnapshotRef.current;

      if (isInitial) {
        initialSnapshotRef.current = false;

        // On initial snapshot, queue all updates for deferred processing
        // The consumer's loadData hasn't finished yet, so clips array is empty
        const updates: ClipUpdate[] = [];

        // For each clip position, find the most recent job
        const latestByClip = new Map<string, JobQueueDocument>();
        jobs.forEach((job) => {
          if (!job.id) return;
          const clipKey = `${job.scene_index}-${job.clip_index}`;
          const existing = latestByClip.get(clipKey);
          if (!existing || (job.created_at && existing.created_at && job.created_at > existing.created_at)) {
            latestByClip.set(clipKey, job);
          }
        });

        latestByClip.forEach((job) => {
          const update = mapJobToClipUpdate(job);
          // Only mark terminal jobs as processed; in-flight jobs must remain
          // eligible for subsequent snapshot updates (e.g., generating → completed)
          const isTerminal = update.status === 'completed' || update.status === 'failed';
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

      // Subsequent snapshots: forward directly to callback
      jobs.forEach((job) => {
        if (!job.id) return;
        if (processedJobIdsRef.current.has(job.id)) return;

        const update = mapJobToClipUpdate(job);
        onClipUpdateRef.current?.(update);

        const isTerminal = update.status === 'completed' || update.status === 'failed';
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
      // Job already in a terminal state — treat as success since it's no longer running
      const msg: string = data.error || '';
      if (msg.includes('cannot be cancelled') || msg.includes('already') ) return;
      throw new Error(msg || 'Failed to cancel job');
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
    pendingUpdates,
    clearPendingUpdates,
  };
}
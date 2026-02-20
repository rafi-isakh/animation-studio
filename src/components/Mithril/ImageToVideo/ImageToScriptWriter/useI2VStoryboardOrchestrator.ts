"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  subscribeToProjectI2VStoryboardJobs,
  mapI2VStoryboardJobToUpdate,
  JobQueueDocument,
  StoryboardJobUpdate,
} from '../../services/firestore/jobQueue';

export type { StoryboardJobUpdate };

interface SubmitI2VStoryboardParams {
  panelUrls: string[];
  panelLabels: string[];
  sourceText?: string;
  targetDuration?: string;
  // Conditions
  storyCondition?: string;
  imageCondition?: string;
  videoCondition?: string;
  soundCondition?: string;
  // Guides
  imageGuide?: string;
  videoGuide?: string;
}

interface SubmitJobResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  createdAt?: string;
  error?: string;
}

interface UseI2VStoryboardOrchestratorOptions {
  projectId: string | null;
  customApiKey?: string;
  onJobUpdate?: (update: StoryboardJobUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the I2V storyboard generation orchestrator backend.
 * Provides methods to submit I2V storyboard jobs and subscribes to real-time status updates.
 */
export function useI2VStoryboardOrchestrator({
  projectId,
  customApiKey,
  onJobUpdate,
  enabled = true,
}: UseI2VStoryboardOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onJobUpdateRef = useRef(onJobUpdate);
  const activeJobIdRef = useRef<string | null>(null);
  // Track whether the initial Firestore snapshot has been processed
  const initialSnapshotRef = useRef(true);
  // Track job IDs already processed to avoid duplicates
  const processedJobIdsRef = useRef<Set<string>>(new Set());
  // Queue completed update from initial snapshot for deferred application
  const [pendingUpdate, setPendingUpdate] = useState<StoryboardJobUpdate | null>(null);

  const clearPendingUpdate = useCallback(() => {
    setPendingUpdate(null);
  }, []);

  // Keep callback ref updated
  useEffect(() => {
    onJobUpdateRef.current = onJobUpdate;
  }, [onJobUpdate]);

  // Reset state when projectId changes
  useEffect(() => {
    initialSnapshotRef.current = true;
    processedJobIdsRef.current = new Set();
    setPendingUpdate(null);
  }, [projectId]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    const unsubscribe = subscribeToProjectI2VStoryboardJobs(projectId, (jobs: JobQueueDocument[]) => {
      console.log('[I2VOrchestrator] Snapshot received, jobs:', jobs.map(j => ({ id: j.id, status: j.status })));

      // Find the most recent job (or the active one)
      let latestJob: JobQueueDocument | null = null;

      jobs.forEach((job) => {
        if (activeJobIdRef.current && job.id === activeJobIdRef.current) {
          latestJob = job;
          return;
        }

        if (!latestJob || (job.created_at && (!latestJob.created_at || job.created_at > latestJob.created_at))) {
          latestJob = job;
        }
      });

      if (!latestJob) {
        console.log('[I2VOrchestrator] No relevant job found in snapshot');
        return;
      }

      // Re-assign to const for TypeScript narrowing (latestJob was mutated in forEach closure)
      const job = latestJob as JobQueueDocument;
      const update = mapI2VStoryboardJobToUpdate(job);
      const isInitial = initialSnapshotRef.current;

      console.log('[I2VOrchestrator] Processing job:', { jobId: job.id, status: update.status, isInitial, activeJobId: activeJobIdRef.current });

      if (isInitial) {
        initialSnapshotRef.current = false;

        const isTerminal = update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled';

        if (!isTerminal) {
          // Re-track in-flight job so subsequent snapshots pick it up
          activeJobIdRef.current = job.id;
          console.log('[I2VOrchestrator] Initial snapshot: re-tracking in-flight job', job.id, 'status:', update.status);
          onJobUpdateRef.current?.(update);
        } else if (update.status === 'completed') {
          // Queue completed job — panel data may not be loaded yet
          console.log('[I2VOrchestrator] Initial snapshot: queuing completed job as pendingUpdate', job.id);
          processedJobIdsRef.current.add(job.id);
          setPendingUpdate(update);
        } else {
          console.log('[I2VOrchestrator] Initial snapshot: ignoring terminal job', job.id, 'status:', update.status);
        }
        return;
      }

      // Subsequent snapshots
      if (processedJobIdsRef.current.has(job.id)) {
        console.log('[I2VOrchestrator] Skipping already-processed job', job.id);
        return;
      }

      console.log('[I2VOrchestrator] Forwarding update to consumer:', { jobId: job.id, status: update.status });
      onJobUpdateRef.current?.(update);

      // Clear active job ID if job is in terminal state
      if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
        activeJobIdRef.current = null;
        processedJobIdsRef.current.add(job.id);
        console.log('[I2VOrchestrator] Job reached terminal state, cleared activeJobId');
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit an I2V storyboard generation job
   */
  const submitJob = useCallback(async (params: SubmitI2VStoryboardParams): Promise<SubmitJobResponse> => {
    if (!projectId) {
      return { success: false, error: 'No project ID' };
    }

    try {
      const response = await fetch('/api/i2v-storyboard/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          panelUrls: params.panelUrls,
          panelLabels: params.panelLabels,
          sourceText: params.sourceText,
          targetDuration: params.targetDuration,
          // Conditions
          storyCondition: params.storyCondition,
          imageCondition: params.imageCondition,
          videoCondition: params.videoCondition,
          soundCondition: params.soundCondition,
          // Guides
          imageGuide: params.imageGuide,
          videoGuide: params.videoGuide,
          // API key
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit I2V storyboard job' };
      }

      // Track the active job ID
      activeJobIdRef.current = data.jobId;

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
   * Cancel the current job
   */
  const cancelJob = useCallback(async (jobId?: string): Promise<{ success: boolean; error?: string }> => {
    const targetJobId = jobId || activeJobIdRef.current;
    if (!targetJobId) {
      return { success: false, error: 'No active job to cancel' };
    }

    try {
      const response = await fetch('/api/i2v-storyboard/orchestrator/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: targetJobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to cancel job' };
      }

      activeJobIdRef.current = null;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  /**
   * Get current job status (one-time fetch)
   */
  const getJobStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/i2v-storyboard/orchestrator/status?jobId=${jobId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get job status');
    }

    return data;
  }, []);

  /**
   * Get the current active job ID
   */
  const getActiveJobId = useCallback(() => {
    return activeJobIdRef.current;
  }, []);

  /**
   * Set the active job ID (for restoring state)
   */
  const setActiveJobId = useCallback((jobId: string | null) => {
    activeJobIdRef.current = jobId;
  }, []);

  return {
    submitJob,
    cancelJob,
    getJobStatus,
    getActiveJobId,
    setActiveJobId,
    pendingUpdate,
    clearPendingUpdate,
  };
}

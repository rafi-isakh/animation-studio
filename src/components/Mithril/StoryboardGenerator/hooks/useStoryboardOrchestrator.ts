"use client";

import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToProjectStoryboardJobs,
  mapStoryboardJobToUpdate,
  JobQueueDocument,
  StoryboardJobUpdate,
} from '../../services/firestore/jobQueue';

// Re-export types for external consumers
export type { StoryboardJobUpdate };

interface SubmitStoryboardParams {
  sourceText: string;
  partIndex?: number;
  // Conditions
  storyCondition?: string;
  imageCondition?: string;
  videoCondition?: string;
  soundCondition?: string;
  // Guides
  imageGuide?: string;
  videoGuide?: string;
  // New configuration
  targetTime?: string;
  customInstruction?: string;
  backgroundInstruction?: string;
  negativeInstruction?: string;
  videoInstruction?: string;
}

interface SubmitJobResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  createdAt?: string;
  error?: string;
}

interface UseStoryboardOrchestratorOptions {
  projectId: string | null;
  customApiKey?: string;
  onJobUpdate?: (update: StoryboardJobUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the storyboard generation orchestrator backend.
 * Provides methods to submit storyboard jobs and subscribes to real-time status updates.
 */
export function useStoryboardOrchestrator({
  projectId,
  customApiKey,
  onJobUpdate,
  enabled = true,
}: UseStoryboardOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onJobUpdateRef = useRef(onJobUpdate);
  const activeJobIdRef = useRef<string | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    onJobUpdateRef.current = onJobUpdate;
  }, [onJobUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    console.log("[useStoryboardOrchestrator] useEffect triggered:", {
      enabled,
      projectId,
      activeJobId: activeJobIdRef.current,
    });

    if (!enabled || !projectId) {
      console.log("[useStoryboardOrchestrator] Skipping subscription - not enabled or no projectId");
      return;
    }

    console.log("[useStoryboardOrchestrator] Setting up Firestore subscription for project:", projectId);

    // Subscribe to project storyboard jobs
    const unsubscribe = subscribeToProjectStoryboardJobs(projectId, (jobs: JobQueueDocument[]) => {
      console.log("[useStoryboardOrchestrator] Subscription callback fired:", {
        jobCount: jobs.length,
        activeJobId: activeJobIdRef.current,
        jobIds: jobs.map(j => j.id),
      });

      // Find the most recent job (or the active one)
      let latestJob: JobQueueDocument | null = null;

      jobs.forEach((job) => {
        // If we have an active job ID, prioritize that job
        if (activeJobIdRef.current && job.id === activeJobIdRef.current) {
          console.log("[useStoryboardOrchestrator] Found active job:", job.id);
          latestJob = job;
          return;
        }

        // Otherwise, find the most recent job
        if (!latestJob || (job.created_at && (!latestJob.created_at || job.created_at > latestJob.created_at))) {
          latestJob = job;
        }
      });

      const selectedJob = latestJob as JobQueueDocument | null;

      console.log("[useStoryboardOrchestrator] Selected latest job:", {
        jobId: selectedJob?.id,
        status: selectedJob?.status,
      });

      // Notify callback for the latest job
      if (selectedJob) {
        const update = mapStoryboardJobToUpdate(selectedJob);
        console.log("[useStoryboardOrchestrator] Calling onJobUpdate callback with:", {
          jobId: update.jobId,
          status: update.status,
          hasScenes: !!update.scenes,
          sceneCount: update.sceneCount,
        });
        onJobUpdateRef.current?.(update);

        // Clear active job ID if job is completed or failed
        if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
          console.log("[useStoryboardOrchestrator] Clearing activeJobIdRef (terminal status)");
          activeJobIdRef.current = null;
        }
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      console.log("[useStoryboardOrchestrator] Cleaning up subscription for project:", projectId);
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a storyboard generation job
   */
  const submitJob = useCallback(async (params: SubmitStoryboardParams): Promise<SubmitJobResponse> => {
    console.log("[useStoryboardOrchestrator:submitJob] Called with:", {
      projectId,
      sourceTextLength: params.sourceText?.length,
      targetTime: params.targetTime,
    });

    if (!projectId) {
      console.log("[useStoryboardOrchestrator:submitJob] No project ID - returning error");
      return { success: false, error: 'No project ID' };
    }

    try {
      console.log("[useStoryboardOrchestrator:submitJob] Making API request...");
      const response = await fetch('/api/storyboard/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          sourceText: params.sourceText,
          partIndex: params.partIndex,
          // Conditions
          storyCondition: params.storyCondition,
          imageCondition: params.imageCondition,
          videoCondition: params.videoCondition,
          soundCondition: params.soundCondition,
          // Guides
          imageGuide: params.imageGuide,
          videoGuide: params.videoGuide,
          // New configuration
          targetTime: params.targetTime,
          customInstruction: params.customInstruction,
          backgroundInstruction: params.backgroundInstruction,
          negativeInstruction: params.negativeInstruction,
          videoInstruction: params.videoInstruction,
          // API key
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();
      console.log("[useStoryboardOrchestrator:submitJob] Response:", {
        ok: response.ok,
        status: response.status,
        jobId: data.jobId,
        error: data.error,
      });

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit storyboard job' };
      }

      // Track the active job ID
      console.log("[useStoryboardOrchestrator:submitJob] Setting activeJobIdRef:", data.jobId);
      activeJobIdRef.current = data.jobId;

      return {
        success: true,
        jobId: data.jobId,
        status: data.status,
        createdAt: data.createdAt,
      };
    } catch (error) {
      console.log("[useStoryboardOrchestrator:submitJob] Error:", error);
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
      const response = await fetch('/api/storyboard/orchestrator/cancel', {
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
   * Get current job status (one-time fetch, prefer Firestore subscription for real-time)
   */
  const getJobStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/storyboard/orchestrator/status?jobId=${jobId}`);
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
  };
}

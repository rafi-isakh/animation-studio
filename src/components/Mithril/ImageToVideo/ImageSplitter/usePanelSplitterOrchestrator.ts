"use client";

import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToProjectPanelSplitterJobs,
  mapPanelSplitterJobToUpdate,
  JobQueueDocument,
  PanelSplitterJobUpdate,
} from '../../services/firestore/jobQueue';

// Re-export types for external consumers
export type { PanelSplitterJobUpdate };

interface SubmitPageJobParams {
  pageId: string;
  pageIndex: number;
  fileName: string;
  imageUrl: string;
  readingDirection: 'rtl' | 'ltr';
}

interface SubmitBatchParams {
  pages: SubmitPageJobParams[];
  readingDirection: 'rtl' | 'ltr';
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
  jobs?: Array<{
    jobId: string;
    status: string;
    createdAt: string;
  }>;
  totalCount?: number;
  error?: string;
}

interface UsePanelSplitterOrchestratorOptions {
  projectId: string | null;
  customApiKey?: string;
  onPageUpdate?: (update: PanelSplitterJobUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the panel splitter orchestrator backend.
 * Provides methods to submit panel splitting jobs and subscribes to real-time status updates.
 */
export function usePanelSplitterOrchestrator({
  projectId,
  customApiKey,
  onPageUpdate,
  enabled = true,
}: UsePanelSplitterOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onPageUpdateRef = useRef(onPageUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onPageUpdateRef.current = onPageUpdate;
  }, [onPageUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Subscribe to project panel splitter jobs
    const unsubscribe = subscribeToProjectPanelSplitterJobs(projectId, (jobs: JobQueueDocument[]) => {
      // Group jobs by page_id and keep only the latest job for each page
      const latestJobsByPage = new Map<string, JobQueueDocument>();

      jobs.forEach((job) => {
        const pageId = job.page_id || '';
        if (!pageId) return;

        const existing = latestJobsByPage.get(pageId);
        if (!existing || (job.created_at && (!existing.created_at || job.created_at > existing.created_at))) {
          latestJobsByPage.set(pageId, job);
        }
      });

      // Notify callback for the latest job of each page
      latestJobsByPage.forEach((job) => {
        const update = mapPanelSplitterJobToUpdate(job);
        onPageUpdateRef.current?.(update);
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a single panel splitting job
   */
  const submitJob = useCallback(async (params: SubmitPageJobParams): Promise<SubmitJobResponse> => {
    if (!projectId) {
      return { success: false, error: 'No project ID' };
    }

    try {
      const response = await fetch('/api/panel-splitter/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          pageId: params.pageId,
          pageIndex: params.pageIndex,
          fileName: params.fileName,
          imageUrl: params.imageUrl,
          readingDirection: params.readingDirection,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit panel splitter job' };
      }

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
   * Submit multiple panel splitting jobs as a batch
   */
  const submitBatch = useCallback(async (params: SubmitBatchParams): Promise<SubmitBatchResponse> => {
    if (!projectId) {
      return { success: false, error: 'No project ID' };
    }

    try {
      const response = await fetch('/api/panel-splitter/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          pages: params.pages.map((page) => ({
            pageId: page.pageId,
            pageIndex: page.pageIndex,
            fileName: page.fileName,
            imageUrl: page.imageUrl,
          })),
          readingDirection: params.readingDirection,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit panel splitter batch' };
      }

      return {
        success: true,
        batchId: data.batchId,
        jobs: data.jobs,
        totalCount: data.totalCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [projectId, customApiKey]);

  /**
   * Cancel a single job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/panel-splitter/orchestrator/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to cancel job' };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  /**
   * Cancel all active jobs for the project
   */
  const cancelAllJobs = useCallback(async (jobIds: string[]): Promise<{ success: boolean; errors?: string[] }> => {
    const results = await Promise.all(jobIds.map(cancelJob));
    const errors = results.filter((r) => !r.success).map((r) => r.error || 'Unknown error');
    return { success: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }, [cancelJob]);

  /**
   * Get current job status (one-time fetch, prefer Firestore subscription for real-time)
   */
  const getJobStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/panel-splitter/orchestrator/status?jobId=${jobId}`);
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
    cancelAllJobs,
    getJobStatus,
  };
}

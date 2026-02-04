import { useCallback, useEffect, useRef } from 'react';
import {
  subscribeToProjectIdConverterJobs,
  mapIdConverterJobToUpdate,
  JobQueueDocument,
  IdConverterJobUpdate,
  IdConverterJobStatus,
} from '../../services/firestore/jobQueue';

// Re-export types
export type { IdConverterJobUpdate, IdConverterJobStatus };

interface SubmitGlossaryJobParams {
  originalText: string;
  fileUri?: string;
}

interface SubmitBatchJobParams {
  glossary: Array<{
    name: string;
    type: string;
    variants: Array<{ id: string; description: string; tags?: string[] }>;
  }>;
  chunks: Array<{ originalIndex: number; originalText: string }>;
}

interface SubmitJobResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  createdAt?: string;
  error?: string;
}

interface UseIdConverterOrchestratorOptions {
  projectId: string;
  customApiKey?: string;
  onJobUpdate?: (update: IdConverterJobUpdate) => void;
  enabled?: boolean;
}

/**
 * Hook for integrating with the ID converter orchestrator backend.
 * Provides methods to submit glossary and batch jobs, and subscribes to real-time status updates.
 */
export function useIdConverterOrchestrator({
  projectId,
  customApiKey,
  onJobUpdate,
  enabled = true,
}: UseIdConverterOrchestratorOptions) {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onJobUpdateRef = useRef(onJobUpdate);

  // Keep callback ref updated
  useEffect(() => {
    onJobUpdateRef.current = onJobUpdate;
  }, [onJobUpdate]);

  // Subscribe to job updates via Firestore
  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Subscribe to project ID converter jobs
    const unsubscribe = subscribeToProjectIdConverterJobs(projectId, (jobs: JobQueueDocument[]) => {
      // Notify callback for each job update
      jobs.forEach((job) => {
        const update = mapIdConverterJobToUpdate(job);
        onJobUpdateRef.current?.(update);
      });
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
      unsubscribeRef.current = null;
    };
  }, [projectId, enabled]);

  /**
   * Submit a glossary analysis job
   * Analyzes text to extract entities (characters, items, locations)
   */
  const submitGlossaryJob = useCallback(async (params: SubmitGlossaryJobParams): Promise<SubmitJobResponse> => {
    try {
      const response = await fetch('/api/id-converter/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: 'glossary',
          projectId,
          originalText: params.originalText,
          fileUri: params.fileUri,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit glossary job' };
      }

      return { success: true, jobId: data.jobId, status: data.status, createdAt: data.createdAt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [projectId, customApiKey]);

  /**
   * Submit a batch chunk conversion job
   * Converts all text chunks sequentially using the provided glossary
   */
  const submitBatchJob = useCallback(async (params: SubmitBatchJobParams): Promise<SubmitJobResponse> => {
    try {
      const response = await fetch('/api/id-converter/orchestrator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: 'batch',
          projectId,
          glossary: params.glossary,
          chunks: params.chunks,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to submit batch job' };
      }

      return { success: true, jobId: data.jobId, status: data.status, createdAt: data.createdAt };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [projectId, customApiKey]);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/id-converter/orchestrator/cancel', {
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
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  /**
   * Get current job status (one-time fetch, prefer Firestore subscription for real-time)
   */
  const getJobStatus = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/id-converter/orchestrator/status?jobId=${jobId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get job status');
    }

    return data;
  }, []);

  return {
    submitGlossaryJob,
    submitBatchJob,
    cancelJob,
    getJobStatus,
  };
}

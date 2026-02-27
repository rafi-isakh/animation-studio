"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  subscribeToProjectBgJobs,
  mapBgJobToAngleUpdate,
  type JobQueueDocument,
  type AngleUpdate,
} from "@/components/Mithril/services/firestore/jobQueue";

export type { AngleUpdate };

export type BgJobStatus =
  | "pending"
  | "preparing"
  | "generating"
  | "uploading"
  | "completed"
  | "failed"
  | "retrying";

export interface BgJobUpdate {
  itemId: string; // Maps to ProjectItem.id (stored as bgId)
  viewKey: string; // "front", "back-0", "back-1", "morning-front", etc. (stored as bgAngle)
  jobId: string;
  status: BgJobStatus;
  imageUrl: string | null;
  error?: string;
  progress: number;
}

interface SubmitBgJobParams {
  projectId: string;
  bgId: string;
  bgAngle: string;
  bgName: string;
  prompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  referenceUrl?: string;
  apiKey?: string;
}

interface SubmitJobResponse {
  jobId: string;
  status: string;
  createdAt: string;
}

interface UseBgGeneratorOrchestratorOptions {
  projectId: string | null;
  onJobUpdate?: (update: BgJobUpdate) => void;
  enabled?: boolean;
}

function angleToBgJobUpdate(update: AngleUpdate): BgJobUpdate {
  return {
    itemId: update.bgId,
    viewKey: update.angle,
    jobId: update.jobId,
    status: update.status as BgJobStatus,
    imageUrl: update.imageUrl,
    error: update.error,
    progress: update.progress,
  };
}

/**
 * Orchestrator hook for the standalone BG Generator tool.
 * Reuses the existing bg orchestrator backend routes and Firestore subscriptions.
 * Maps bgId → ProjectItem.id, bgAngle → view key (front/back-0/back-1/morning-front/etc.)
 */
export function useBgGeneratorOrchestrator({
  projectId,
  onJobUpdate,
  enabled = true,
}: UseBgGeneratorOrchestratorOptions) {
  const onJobUpdateRef = useRef(onJobUpdate);
  const initialSnapshotRef = useRef(true);
  const processedJobIdsRef = useRef<Set<string>>(new Set());
  const [pendingUpdates, setPendingUpdates] = useState<BgJobUpdate[]>([]);

  const clearPendingUpdates = useCallback(() => {
    setPendingUpdates([]);
  }, []);

  useEffect(() => {
    onJobUpdateRef.current = onJobUpdate;
  }, [onJobUpdate]);

  // Reset state when projectId changes
  useEffect(() => {
    initialSnapshotRef.current = true;
    processedJobIdsRef.current = new Set();
    setPendingUpdates([]);
  }, [projectId]);

  // Subscribe to Firestore job updates
  useEffect(() => {
    if (!enabled || !projectId) return;

    const unsubscribe = subscribeToProjectBgJobs(
      projectId,
      (jobs: JobQueueDocument[]) => {
        // Group by bgId+bgAngle, keep latest
        const latestByKey = new Map<string, JobQueueDocument>();
        jobs.forEach((job) => {
          const bgId = job.bg_id || "";
          const angle = job.bg_angle || "";
          if (!bgId || !angle) return;

          const key = `${bgId}:${angle}`;
          const existing = latestByKey.get(key);
          if (
            !existing ||
            (job.created_at &&
              (!existing.created_at || job.created_at > existing.created_at))
          ) {
            latestByKey.set(key, job);
          }
        });

        const isInitial = initialSnapshotRef.current;

        if (isInitial) {
          initialSnapshotRef.current = false;

          const updates: BgJobUpdate[] = [];
          latestByKey.forEach((job) => {
            if (!job.id) return;
            const angleUpdate = mapBgJobToAngleUpdate(job);
            const isTerminal =
              angleUpdate.status === "completed" ||
              angleUpdate.status === "failed";
            if (isTerminal) {
              processedJobIdsRef.current.add(job.id);
            }
            updates.push(angleToBgJobUpdate(angleUpdate));
          });

          if (updates.length > 0) {
            setPendingUpdates(updates);
          }
          return;
        }

        // Subsequent snapshots: forward directly
        latestByKey.forEach((job) => {
          if (!job.id) return;
          if (processedJobIdsRef.current.has(job.id)) return;

          const angleUpdate = mapBgJobToAngleUpdate(job);
          onJobUpdateRef.current?.(angleToBgJobUpdate(angleUpdate));

          const isTerminal =
            angleUpdate.status === "completed" ||
            angleUpdate.status === "failed";
          if (isTerminal) {
            processedJobIdsRef.current.add(job.id);
          }
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [projectId, enabled]);

  const submitJob = useCallback(
    async (params: SubmitBgJobParams): Promise<SubmitJobResponse> => {
      const response = await fetch("/api/bg/orchestrator/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit bg job");
      }
      return data;
    },
    []
  );

  const cancelJob = useCallback(async (jobId: string): Promise<void> => {
    const response = await fetch("/api/bg/orchestrator/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to cancel job");
    }
  }, []);

  return {
    submitJob,
    cancelJob,
    pendingUpdates,
    clearPendingUpdates,
  };
}

import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';

/**
 * Job status from the orchestrator
 */
export type JobStatus =
  | 'pending'
  | 'submitted'
  | 'polling'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Job document from job_queue collection
 */
export interface JobQueueDocument {
  id: string;
  project_id: string;
  scene_index: number;
  clip_index: number;
  provider_id: string;
  prompt: string;
  image_url?: string;
  duration: number;
  aspect_ratio: string;
  status: JobStatus;
  provider_job_id?: string;
  progress: number;
  video_url?: string;
  s3_file_name?: string;
  error_code?: string;
  error_message?: string;
  error_retryable?: boolean;
  retry_count: number;
  max_retries: number;
  cancellation_requested: boolean;
  cost_usd: number;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  completed_at?: string;
  user_id: string;
  batch_id?: string;
  worker_id?: string;
}

/**
 * Callback for job status updates
 */
export type JobStatusCallback = (job: JobQueueDocument) => void;

/**
 * Callback for multiple jobs updates
 */
export type JobsStatusCallback = (jobs: JobQueueDocument[]) => void;

/**
 * Subscribe to a single job's status updates
 *
 * @param jobId - The job ID to subscribe to
 * @param callback - Called whenever the job document changes
 * @returns Unsubscribe function
 */
export function subscribeToJob(
  jobId: string,
  callback: JobStatusCallback
): Unsubscribe {
  const jobRef = doc(db, 'job_queue', jobId);

  return onSnapshot(jobRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as JobQueueDocument;
      callback(data);
    }
  });
}

/**
 * Subscribe to all jobs for a project
 *
 * @param projectId - The project ID
 * @param callback - Called whenever any job in the project changes
 * @returns Unsubscribe function
 */
export function subscribeToProjectJobs(
  projectId: string,
  callback: JobsStatusCallback
): Unsubscribe {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId)
  );

  return onSnapshot(jobsQuery, (snapshot) => {
    const jobs = snapshot.docs.map((doc) => doc.data() as JobQueueDocument);
    callback(jobs);
  });
}

/**
 * Subscribe to active jobs for a project (non-terminal statuses)
 *
 * @param projectId - The project ID
 * @param callback - Called whenever any active job changes
 * @returns Unsubscribe function
 */
export function subscribeToActiveProjectJobs(
  projectId: string,
  callback: JobsStatusCallback
): Unsubscribe {
  // Note: Firestore doesn't support NOT IN queries well, so we'll filter client-side
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId)
  );

  return onSnapshot(jobsQuery, (snapshot) => {
    const terminalStatuses: JobStatus[] = ['completed', 'failed', 'cancelled'];
    const jobs = snapshot.docs
      .map((doc) => doc.data() as JobQueueDocument)
      .filter((job) => !terminalStatuses.includes(job.status));
    callback(jobs);
  });
}

/**
 * Get all active (non-terminal) jobs for a project (one-time fetch)
 *
 * @param projectId - The project ID
 * @returns Array of active job documents
 */
export async function getActiveProjectJobs(
  projectId: string
): Promise<JobQueueDocument[]> {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId)
  );

  const snapshot = await getDocs(jobsQuery);
  const terminalStatuses: JobStatus[] = ['completed', 'failed', 'cancelled'];

  return snapshot.docs
    .map((docSnapshot) => ({
      ...docSnapshot.data(),
      id: docSnapshot.id,
    } as JobQueueDocument))
    .filter((job) => !terminalStatuses.includes(job.status));
}

/**
 * Get all jobs for a project (one-time fetch)
 *
 * @param projectId - The project ID
 * @returns Array of all job documents
 */
export async function getProjectJobs(
  projectId: string
): Promise<JobQueueDocument[]> {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId)
  );

  const snapshot = await getDocs(jobsQuery);

  return snapshot.docs.map((docSnapshot) => ({
    ...docSnapshot.data(),
    id: docSnapshot.id,
  } as JobQueueDocument));
}

/**
 * Map JobQueueDocument to a format compatible with VideoClip
 */
export function mapJobToClipUpdate(job: JobQueueDocument) {
  return {
    sceneIndex: job.scene_index,
    clipIndex: job.clip_index,
    jobId: job.id,
    status: mapJobStatusToClipStatus(job.status),
    videoUrl: job.video_url || null,
    s3FileName: job.s3_file_name || null,
    error: job.error_message,
    providerId: job.provider_id,
    progress: job.progress,
  };
}

/**
 * Map job status to clip status
 */
function mapJobStatusToClipStatus(
  jobStatus: JobStatus
): 'pending' | 'generating' | 'completed' | 'failed' {
  switch (jobStatus) {
    case 'pending':
      return 'pending';
    case 'submitted':
    case 'polling':
    case 'uploading':
      return 'generating';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'failed';
    default:
      return 'pending';
  }
}
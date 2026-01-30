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
 * Job type (video or image)
 */
export type JobType = 'video' | 'image';

/**
 * Job status from the orchestrator
 */
export type JobStatus =
  | 'pending'
  | 'submitted'
  | 'polling'
  | 'preparing'   // Image: fetching references
  | 'generating'  // Image: calling AI provider
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Job document from job_queue collection
 */
export interface JobQueueDocument {
  id: string;
  type?: JobType;  // 'video' (default) or 'image'
  project_id: string;
  scene_index: number;
  clip_index: number;
  provider_id: string;
  prompt: string;
  image_url?: string;  // Video: source image for video generation
  duration?: number;   // Video only
  aspect_ratio: string;
  status: JobStatus;
  provider_job_id?: string;
  progress: number;
  video_url?: string;  // Video result
  result_image_url?: string;  // Image result (named differently to avoid confusion with source image_url)
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
  // Image-specific fields
  frame_id?: string;
  frame_label?: string;
  style_prompt?: string;
  reference_urls?: string[];
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
    const jobs = snapshot.docs.map((docSnapshot) => ({
      ...docSnapshot.data(),
      id: docSnapshot.id,  // Ensure document ID is included
    } as JobQueueDocument));

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
      .map((docSnapshot) => ({
        ...docSnapshot.data(),
        id: docSnapshot.id,  // Ensure document ID is included
      } as JobQueueDocument))
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
    status: mapJobStatusToClipStatus(job.status, job.retry_count),
    videoUrl: job.video_url || null,
    s3FileName: job.s3_file_name || null,
    error: job.error_message,
    providerId: job.provider_id,
    progress: job.progress,
  };
}

/**
 * Map job status to clip status (for video)
 * - "pending" with retry_count > 0 means it's retrying after a failure
 * - "pending" with retry_count = 0 means it's a new unstarted job
 */
function mapJobStatusToClipStatus(
  jobStatus: JobStatus,
  retryCount: number = 0
): 'pending' | 'generating' | 'completed' | 'failed' | 'retrying' {
  switch (jobStatus) {
    case 'pending':
      // Distinguish between retrying and unstarted
      return retryCount > 0 ? 'retrying' : 'pending';
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


// ============================================================================
// Image Job Functions
// ============================================================================

/**
 * Frame status for ImageGenerator
 */
export type FrameStatus =
  | 'pending'
  | 'preparing'
  | 'generating'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'retrying';

/**
 * Frame update object for ImageGenerator
 */
export interface FrameUpdate {
  frameId: string;
  sceneIndex: number;
  clipIndex: number;
  frameLabel: string;
  jobId: string;
  status: FrameStatus;
  imageUrl: string | null;
  s3FileName: string | null;
  error?: string;
  progress: number;
}

/**
 * Callback for frame updates
 */
export type FrameUpdateCallback = (update: FrameUpdate) => void;

/**
 * Callback for multiple frame updates
 */
export type FrameUpdatesCallback = (updates: FrameUpdate[]) => void;

/**
 * Subscribe to image jobs for a project
 *
 * @param projectId - The project ID
 * @param callback - Called whenever any image job in the project changes
 * @returns Unsubscribe function
 */
export function subscribeToProjectImageJobs(
  projectId: string,
  callback: JobsStatusCallback
): Unsubscribe {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId),
    where('type', '==', 'image')
  );

  return onSnapshot(jobsQuery, (snapshot) => {
    const jobs = snapshot.docs.map((docSnapshot) => ({
      ...docSnapshot.data(),
      id: docSnapshot.id,
    } as JobQueueDocument));

    callback(jobs);
  });
}

/**
 * Get all active (non-terminal) image jobs for a project (one-time fetch)
 *
 * @param projectId - The project ID
 * @returns Array of active image job documents
 */
export async function getActiveProjectImageJobs(
  projectId: string
): Promise<JobQueueDocument[]> {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId),
    where('type', '==', 'image')
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
 * Map JobQueueDocument to a format compatible with ImageGenerator frames
 */
export function mapImageJobToFrameUpdate(job: JobQueueDocument): FrameUpdate {
  return {
    frameId: job.frame_id || job.id,
    sceneIndex: job.scene_index,
    clipIndex: job.clip_index,
    frameLabel: job.frame_label || '',
    jobId: job.id,
    status: mapJobStatusToFrameStatus(job.status, job.retry_count),
    imageUrl: job.result_image_url || null,
    s3FileName: job.s3_file_name || null,
    error: job.error_message,
    progress: job.progress,
  };
}

/**
 * Map job status to frame status (for images)
 * - "pending" with retry_count > 0 means it's retrying after a failure
 * - "pending" with retry_count = 0 means it's a new unstarted job
 */
function mapJobStatusToFrameStatus(
  jobStatus: JobStatus,
  retryCount: number = 0
): FrameStatus {
  switch (jobStatus) {
    case 'pending':
      return retryCount > 0 ? 'retrying' : 'pending';
    case 'preparing':
      return 'preparing';
    case 'generating':
      return 'generating';
    case 'uploading':
      return 'uploading';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'failed';
    default:
      return 'pending';
  }
}
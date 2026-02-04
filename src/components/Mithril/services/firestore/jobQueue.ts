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
 * Job type (video, image, background, prop_design_sheet, panel, or id_converter)
 */
export type JobType = 'video' | 'image' | 'background' | 'prop_design_sheet' | 'panel' | 'id_converter_glossary' | 'id_converter_batch';

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
  type?: JobType;  // 'video' (default), 'image', 'background', or 'prop_design_sheet'
  project_id: string;
  scene_index: number;
  clip_index: number;
  provider_id: string;
  prompt: string;
  image_url?: string;  // Video: source image for video generation; Image/Bg/Prop: generated image result
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
  // Background-specific fields
  bg_id?: string;
  bg_angle?: string;
  bg_name?: string;
  // Prop design sheet-specific fields
  prop_id?: string;
  prop_name?: string;
  prop_category?: string;  // "character" or "object"
  // Panel editor-specific fields
  panel_id?: string;
  session_id?: string;
  file_name?: string;
  target_aspect_ratio?: string;
  refinement_mode?: string;  // "default" | "zoom" | "expand"
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
 * Note: For image jobs, the backend uses `image_url` for the generated result
 * (not `result_image_url` which was a frontend-only distinction)
 */
export function mapImageJobToFrameUpdate(job: JobQueueDocument): FrameUpdate {
  return {
    frameId: job.frame_id || job.id,
    sceneIndex: job.scene_index,
    clipIndex: job.clip_index,
    frameLabel: job.frame_label || '',
    jobId: job.id,
    status: mapJobStatusToFrameStatus(job.status, job.retry_count),
    imageUrl: job.image_url || null,  // Backend uses image_url for generated image result
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


// ============================================================================
// Background Job Functions
// ============================================================================

/**
 * Background angle status
 */
export type AngleStatus =
  | 'pending'
  | 'preparing'
  | 'generating'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'retrying';

/**
 * Angle update object for BgSheetGenerator
 */
export interface AngleUpdate {
  bgId: string;
  angle: string;
  bgName: string;
  jobId: string;
  status: AngleStatus;
  imageUrl: string | null;
  s3FileName: string | null;
  error?: string;
  progress: number;
}

/**
 * Callback for angle updates
 */
export type AngleUpdateCallback = (update: AngleUpdate) => void;

/**
 * Callback for multiple angle updates
 */
export type AngleUpdatesCallback = (updates: AngleUpdate[]) => void;

/**
 * Subscribe to background jobs for a project
 *
 * @param projectId - The project ID
 * @param callback - Called whenever any background job in the project changes
 * @returns Unsubscribe function
 */
export function subscribeToProjectBgJobs(
  projectId: string,
  callback: JobsStatusCallback
): Unsubscribe {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId),
    where('type', '==', 'background')
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
 * Get all active (non-terminal) background jobs for a project (one-time fetch)
 *
 * @param projectId - The project ID
 * @returns Array of active background job documents
 */
export async function getActiveProjectBgJobs(
  projectId: string
): Promise<JobQueueDocument[]> {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId),
    where('type', '==', 'background')
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
 * Map JobQueueDocument to a format compatible with BgSheetGenerator angles
 * Note: For background jobs, the backend uses `image_url` for the generated result
 */
export function mapBgJobToAngleUpdate(job: JobQueueDocument): AngleUpdate {
  return {
    bgId: job.bg_id || '',
    angle: job.bg_angle || '',
    bgName: job.bg_name || '',
    jobId: job.id,
    status: mapJobStatusToAngleStatus(job.status, job.retry_count),
    imageUrl: job.image_url || null,  // Backend uses image_url for generated image result
    s3FileName: job.s3_file_name || null,
    error: job.error_message,
    progress: job.progress,
  };
}

/**
 * Map job status to angle status (for backgrounds)
 * - "pending" with retry_count > 0 means it's retrying after a failure
 * - "pending" with retry_count = 0 means it's a new unstarted job
 */
function mapJobStatusToAngleStatus(
  jobStatus: JobStatus,
  retryCount: number = 0
): AngleStatus {
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


// ============================================================================
// Prop Design Sheet Job Functions
// ============================================================================

/**
 * Prop design sheet status
 */
export type PropStatus =
  | 'pending'
  | 'preparing'
  | 'generating'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

/**
 * Prop update object for PropDesigner
 */
export interface PropUpdate {
  propId: string;
  propName: string;
  category: string;
  jobId: string;
  status: PropStatus;
  imageUrl: string | null;
  s3FileName: string | null;
  error?: string;
  progress: number;
}

/**
 * Callback for prop updates
 */
export type PropUpdateCallback = (update: PropUpdate) => void;

/**
 * Callback for multiple prop updates
 */
export type PropUpdatesCallback = (updates: PropUpdate[]) => void;

/**
 * Subscribe to prop design sheet jobs for a project
 *
 * @param projectId - The project ID
 * @param callback - Called whenever any prop design sheet job in the project changes
 * @returns Unsubscribe function
 */
export function subscribeToProjectPropDesignJobs(
  projectId: string,
  callback: JobsStatusCallback
): Unsubscribe {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId),
    where('type', '==', 'prop_design_sheet')
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
 * Get all active (non-terminal) prop design sheet jobs for a project (one-time fetch)
 *
 * @param projectId - The project ID
 * @returns Array of active prop design sheet job documents
 */
export async function getActiveProjectPropDesignJobs(
  projectId: string
): Promise<JobQueueDocument[]> {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId),
    where('type', '==', 'prop_design_sheet')
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
 * Map JobQueueDocument to a format compatible with PropDesigner props
 * Note: For prop design sheet jobs, the backend uses `image_url` for the generated result
 */
export function mapPropJobToPropUpdate(job: JobQueueDocument): PropUpdate {
  return {
    propId: job.prop_id || '',
    propName: job.prop_name || '',
    category: job.prop_category || '',
    jobId: job.id,
    status: mapJobStatusToPropStatus(job.status, job.retry_count),
    imageUrl: job.image_url || null,  // Backend uses image_url for generated image result
    s3FileName: job.s3_file_name || null,
    error: job.error_message,
    progress: job.progress,
  };
}

/**
 * Map job status to prop status (for prop design sheets)
 * - "pending" with retry_count > 0 means it's retrying after a failure
 * - "pending" with retry_count = 0 means it's a new unstarted job
 */
function mapJobStatusToPropStatus(
  jobStatus: JobStatus,
  retryCount: number = 0
): PropStatus {
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
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}


// ============================================================================
// Panel Editor Job Functions
// ============================================================================

/**
 * Panel job status
 */
export type PanelJobStatus =
  | 'pending'
  | 'preparing'
  | 'generating'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

/**
 * Panel update object for PanelEditor
 */
export interface PanelUpdate {
  panelId: string;
  sessionId: string;
  fileName: string;
  jobId: string;
  status: PanelJobStatus;
  imageUrl: string | null;
  s3FileName: string | null;
  error?: string;
  progress: number;
}

/**
 * Callback for panel updates
 */
export type PanelUpdateCallback = (update: PanelUpdate) => void;

/**
 * Callback for multiple panel updates
 */
export type PanelUpdatesCallback = (updates: PanelUpdate[]) => void;

/**
 * Subscribe to panel jobs for a session
 *
 * @param sessionId - The session ID (unique identifier for the panel editor session)
 * @param callback - Called whenever any panel job in the session changes
 * @returns Unsubscribe function
 */
export function subscribeToSessionPanelJobs(
  sessionId: string,
  callback: JobsStatusCallback
): Unsubscribe {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('session_id', '==', sessionId),
    where('type', '==', 'panel')
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
 * Get all active (non-terminal) panel jobs for a session (one-time fetch)
 *
 * @param sessionId - The session ID
 * @returns Array of active panel job documents
 */
export async function getActiveSessionPanelJobs(
  sessionId: string
): Promise<JobQueueDocument[]> {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('session_id', '==', sessionId),
    where('type', '==', 'panel')
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
 * Map JobQueueDocument to a format compatible with PanelEditor panels
 * Note: For panel jobs, the backend uses `image_url` for the generated result
 */
export function mapPanelJobToPanelUpdate(job: JobQueueDocument): PanelUpdate {
  return {
    panelId: job.panel_id || '',
    sessionId: job.session_id || '',
    fileName: job.file_name || '',
    jobId: job.id,
    status: mapJobStatusToPanelStatus(job.status, job.retry_count),
    imageUrl: job.image_url || null,
    s3FileName: job.s3_file_name || null,
    error: job.error_message,
    progress: job.progress,
  };
}

/**
 * Map job status to panel status
 * - "pending" with retry_count > 0 means it's retrying after a failure
 * - "pending" with retry_count = 0 means it's a new unstarted job
 */
function mapJobStatusToPanelStatus(
  jobStatus: JobStatus,
  retryCount: number = 0
): PanelJobStatus {
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
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}


// ============================================================================
// ID Converter Job Functions
// ============================================================================

/**
 * ID Converter job type
 */
export type IdConverterJobType = 'id_converter_glossary' | 'id_converter_batch';

/**
 * ID Converter job status
 */
export type IdConverterJobStatus =
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

/**
 * ID Converter job update object
 */
export interface IdConverterJobUpdate {
  jobId: string;
  jobType: IdConverterJobType;
  status: IdConverterJobStatus;
  progress: number;
  // Glossary results
  entitiesCount?: number;
  // Batch results
  totalChunks?: number;
  completedChunks?: number;
  currentChunkIndex?: number;
  chunksData?: Array<{ originalIndex: number; originalText: string; translatedText?: string }>;
  // Error info
  error?: string;
}

/**
 * Callback for ID converter job updates
 */
export type IdConverterJobUpdateCallback = (update: IdConverterJobUpdate) => void;

/**
 * Callback for multiple ID converter job updates
 */
export type IdConverterJobUpdatesCallback = (updates: IdConverterJobUpdate[]) => void;

/**
 * Subscribe to ID converter jobs for a project
 *
 * @param projectId - The project ID
 * @param callback - Called whenever any ID converter job in the project changes
 * @returns Unsubscribe function
 */
export function subscribeToProjectIdConverterJobs(
  projectId: string,
  callback: JobsStatusCallback
): Unsubscribe {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId),
    where('type', 'in', ['id_converter_glossary', 'id_converter_batch'])
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
 * Get all active (non-terminal) ID converter jobs for a project (one-time fetch)
 *
 * @param projectId - The project ID
 * @returns Array of active ID converter job documents
 */
export async function getActiveProjectIdConverterJobs(
  projectId: string
): Promise<JobQueueDocument[]> {
  const jobsQuery = query(
    collection(db, 'job_queue'),
    where('project_id', '==', projectId),
    where('type', 'in', ['id_converter_glossary', 'id_converter_batch'])
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
 * Map JobQueueDocument to IdConverterJobUpdate
 */
export function mapIdConverterJobToUpdate(job: JobQueueDocument): IdConverterJobUpdate {
  const jobType = job.type as IdConverterJobType;

  // Extract chunks_data from job document (backend uses camelCase)
  const chunksData = (job as unknown as { chunks_data?: Array<{ originalIndex: number; originalText: string; translatedText?: string }> }).chunks_data;

  return {
    jobId: job.id,
    jobType,
    status: mapJobStatusToIdConverterStatus(job.status, job.retry_count),
    progress: job.progress,
    // Glossary results (from glossary_result field)
    entitiesCount: (job as unknown as { glossary_result?: unknown[] }).glossary_result?.length,
    // Batch results
    totalChunks: (job as unknown as { total_chunks?: number }).total_chunks,
    completedChunks: (job as unknown as { completed_chunks?: number }).completed_chunks,
    currentChunkIndex: (job as unknown as { current_chunk_index?: number }).current_chunk_index,
    chunksData: chunksData?.map(chunk => ({
      originalIndex: chunk.originalIndex,
      originalText: chunk.originalText,
      translatedText: chunk.translatedText,
    })),
    error: job.error_message,
  };
}

/**
 * Map job status to ID converter status
 * - "pending" with retry_count > 0 means it's retrying after a failure
 * - "pending" with retry_count = 0 means it's a new unstarted job
 */
function mapJobStatusToIdConverterStatus(
  jobStatus: JobStatus,
  retryCount: number = 0
): IdConverterJobStatus {
  switch (jobStatus) {
    case 'pending':
      return retryCount > 0 ? 'retrying' : 'pending';
    case 'generating':
      return 'generating';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}
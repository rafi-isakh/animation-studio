import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import type { AspectRatio } from './types';

// ============================================
// CSV Video Types
// ============================================

export interface CsvVideoDocument {
  aspectRatio: AspectRatio;
  providerId?: string;
  createdAt: Timestamp;
}

export interface CsvVideoClipDocument {
  sceneIndex: number;
  clipIndex: number;
  sceneTitle?: string;
  videoPrompt?: string;
  referenceFilename?: string;
  length?: string;
  videoApi?: string | null;
  imageUrl?: string | null;      // S3 URL for start frame
  videoRef?: string | null;
  jobId?: string | null;
  s3FileName?: string | null;
  status?: string;
  error?: string;
  providerId?: string;
}

export interface SaveCsvVideoClipInput {
  clipIndex: number;
  sceneIndex: number;
  sceneTitle: string;
  videoPrompt: string;
  referenceFilename: string;
  length: string;
  videoApi?: string | null;
  imageUrl?: string | null;
}

export interface UpdateCsvVideoClipInput {
  sceneIndex?: number;
  clipIndex?: number;
  videoPrompt?: string;
  length?: string;
  videoApi?: string | null;
  imageUrl?: string | null;
  videoRef?: string | null;
  jobId?: string | null;
  s3FileName?: string | null;
  status?: string;
  error?: string | null;
  providerId?: string;
}

// ============================================
// Firestore References
// ============================================

const getCsvVideoRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'csvVideo', 'data');

const getCsvVideoClipsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'csvVideo', 'data', 'clips');

const getCsvVideoClipRef = (projectId: string, clipId: string) =>
  doc(db, 'projects', projectId, 'csvVideo', 'data', 'clips', clipId);

// ============================================
// CSV Video Functions
// ============================================

/**
 * Get CSV video metadata
 */
export async function getCsvVideoMeta(
  projectId: string
): Promise<CsvVideoDocument | null> {
  const docRef = getCsvVideoRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as CsvVideoDocument;
}

/**
 * Save CSV video metadata
 */
export async function saveCsvVideoMeta(
  projectId: string,
  aspectRatio: AspectRatio,
  providerId?: string
): Promise<void> {
  const docRef = getCsvVideoRef(projectId);

  await setDoc(docRef, {
    aspectRatio,
    providerId: providerId || 'veo3',
    createdAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get all CSV video clips
 */
export async function getCsvVideoClips(projectId: string): Promise<CsvVideoClipDocument[]> {
  const collectionRef = getCsvVideoClipsCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  const clips = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const [sceneIndexStr, clipIndexStr] = docSnapshot.id.split('_');
    return {
      ...data,
      sceneIndex: data.sceneIndex ?? parseInt(sceneIndexStr, 10),
      clipIndex:  data.clipIndex  ?? parseInt(clipIndexStr,  10),
    };
  }) as CsvVideoClipDocument[];

  return clips.sort((a, b) => {
    if (a.sceneIndex !== b.sceneIndex) return a.sceneIndex - b.sceneIndex;
    return a.clipIndex - b.clipIndex;
  });
}

/**
 * Save a CSV video clip
 */
export async function saveCsvVideoClip(
  projectId: string,
  clipId: string,
  input: SaveCsvVideoClipInput
): Promise<void> {
  const docRef = getCsvVideoClipRef(projectId, clipId);

  await setDoc(docRef, {
    clipIndex:          input.clipIndex,
    sceneIndex:         input.sceneIndex,
    sceneTitle:         input.sceneTitle,
    videoPrompt:        input.videoPrompt,
    referenceFilename:  input.referenceFilename,
    length:             input.length,
    videoApi:           input.videoApi ?? null,
    imageUrl:           input.imageUrl ?? null,
    videoRef:           null,
    jobId:              null,
    s3FileName:         null,
    status:             'idle',
  });
}

/**
 * Update CSV video clip status.
 * Uses setDoc with merge to create the document if it doesn't exist.
 */
export async function updateCsvVideoClipStatus(
  projectId: string,
  clipId: string,
  updates: UpdateCsvVideoClipInput
): Promise<void> {
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  const docRef = getCsvVideoClipRef(projectId, clipId);
  await setDoc(docRef, cleanUpdates, { merge: true });
}

/**
 * Update CSV video clip video reference
 */
export async function updateCsvVideoClipVideo(
  projectId: string,
  clipId: string,
  videoRef: string,
  s3FileName: string
): Promise<void> {
  await updateCsvVideoClipStatus(projectId, clipId, {
    videoRef,
    s3FileName,
    status: 'completed',
  });
}

/**
 * Clear all CSV video data
 */
export async function clearCsvVideo(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  const clips = await getCsvVideoClips(projectId);
  for (const clip of clips) {
    const clipRef = getCsvVideoClipRef(projectId, `${clip.sceneIndex}_${clip.clipIndex}`);
    batch.delete(clipRef);
  }

  const metaRef = getCsvVideoRef(projectId);
  batch.delete(metaRef);

  await batch.commit();
}

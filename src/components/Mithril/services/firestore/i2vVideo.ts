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
// I2V Video Types
// ============================================

export interface I2VVideoDocument {
  aspectRatio: AspectRatio;
  providerId?: string;
  createdAt: Timestamp;
}

export interface I2VVideoClipDocument {
  sceneIndex: number;
  clipIndex: number;
  sceneTitle?: string;
  videoPrompt?: string;
  length?: string;
  videoRef?: string | null;
  jobId?: string | null;
  s3FileName?: string | null;
  status?: string;
  error?: string;
  providerId?: string;
}

export interface SaveI2VVideoClipInput {
  clipIndex: number;
  sceneIndex: number;
  sceneTitle: string;
  videoPrompt: string;
  length: string;
}

export interface UpdateI2VVideoClipInput {
  sceneIndex?: number;
  clipIndex?: number;
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

const getI2VVideoRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'i2vVideo', 'data');

const getI2VVideoClipsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'i2vVideo', 'data', 'clips');

const getI2VVideoClipRef = (projectId: string, clipId: string) =>
  doc(db, 'projects', projectId, 'i2vVideo', 'data', 'clips', clipId);

// ============================================
// I2V Video Functions
// ============================================

/**
 * Get I2V video metadata
 */
export async function getI2VVideoMeta(
  projectId: string
): Promise<I2VVideoDocument | null> {
  const docRef = getI2VVideoRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as I2VVideoDocument;
}

/**
 * Save I2V video metadata
 */
export async function saveI2VVideoMeta(
  projectId: string,
  aspectRatio: AspectRatio,
  providerId?: string
): Promise<void> {
  const docRef = getI2VVideoRef(projectId);

  await setDoc(docRef, {
    aspectRatio,
    providerId: providerId || 'sora',
    createdAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get all I2V video clips
 */
export async function getI2VVideoClips(projectId: string): Promise<I2VVideoClipDocument[]> {
  const collectionRef = getI2VVideoClipsCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  const clips = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    // Extract sceneIndex and clipIndex from document ID if not in data
    // Document ID format: "{sceneIndex}_{clipIndex}"
    const [sceneIndexStr, clipIndexStr] = docSnapshot.id.split('_');
    return {
      ...data,
      sceneIndex: data.sceneIndex ?? parseInt(sceneIndexStr, 10),
      clipIndex: data.clipIndex ?? parseInt(clipIndexStr, 10),
    };
  }) as I2VVideoClipDocument[];

  // Sort in memory by sceneIndex, then clipIndex
  return clips.sort((a, b) => {
    if (a.sceneIndex !== b.sceneIndex) {
      return a.sceneIndex - b.sceneIndex;
    }
    return a.clipIndex - b.clipIndex;
  });
}

/**
 * Save an I2V video clip
 */
export async function saveI2VVideoClip(
  projectId: string,
  clipId: string,
  input: SaveI2VVideoClipInput
): Promise<void> {
  const docRef = getI2VVideoClipRef(projectId, clipId);

  await setDoc(docRef, {
    clipIndex: input.clipIndex,
    sceneIndex: input.sceneIndex,
    sceneTitle: input.sceneTitle,
    videoPrompt: input.videoPrompt,
    length: input.length,
    videoRef: null,
    jobId: null,
    s3FileName: null,
    status: 'pending',
  });
}

/**
 * Update I2V video clip status
 * Uses setDoc with merge to create the document if it doesn't exist
 */
export async function updateI2VVideoClipStatus(
  projectId: string,
  clipId: string,
  updates: UpdateI2VVideoClipInput
): Promise<void> {
  // Filter out undefined values - Firestore doesn't accept undefined
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  const docRef = getI2VVideoClipRef(projectId, clipId);
  // Use setDoc with merge to handle both create and update cases
  await setDoc(docRef, cleanUpdates, { merge: true });
}

/**
 * Update I2V video clip video reference
 */
export async function updateI2VVideoClipVideo(
  projectId: string,
  clipId: string,
  videoRef: string,
  s3FileName: string
): Promise<void> {
  await updateI2VVideoClipStatus(projectId, clipId, {
    videoRef,
    s3FileName,
    status: 'completed',
  });
}

/**
 * Clear all I2V video data
 */
export async function clearI2VVideo(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all clips
  const clips = await getI2VVideoClips(projectId);
  for (const clip of clips) {
    const clipRef = getI2VVideoClipRef(projectId, `${clip.sceneIndex}_${clip.clipIndex}`);
    batch.delete(clipRef);
  }

  // Delete metadata
  const metaRef = getI2VVideoRef(projectId);
  batch.delete(metaRef);

  await batch.commit();
}

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
// NSFW Video Types
// ============================================

export interface NsfwVideoDocument {
  prompt: string;
  aspectRatio: AspectRatio;
  providerId?: string;
  batchSize?: number;
  createdAt: Timestamp;
}

export interface NsfwVideoClipDocument {
  sceneIndex: number;
  clipIndex: number;
  videoRef?: string | null;
  jobId?: string | null;
  s3FileName?: string | null;
  status?: string;
  error?: string;
  providerId?: string;
}

export interface SaveNsfwVideoClipInput {
  clipIndex: number;
  sceneIndex: number;
}

export interface UpdateNsfwVideoClipInput {
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

const getNsfwVideoRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'nsfwVideo', 'data');

const getNsfwVideoClipsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'nsfwVideo', 'data', 'clips');

const getNsfwVideoClipRef = (projectId: string, clipId: string) =>
  doc(db, 'projects', projectId, 'nsfwVideo', 'data', 'clips', clipId);

// ============================================
// NSFW Video Functions
// ============================================

/**
 * Get NSFW video metadata
 */
export async function getNsfwVideoMeta(
  projectId: string
): Promise<NsfwVideoDocument | null> {
  const docRef = getNsfwVideoRef(projectId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as NsfwVideoDocument;
}

/**
 * Save NSFW video metadata
 */
export async function saveNsfwVideoMeta(
  projectId: string,
  data: Omit<NsfwVideoDocument, 'createdAt'>
): Promise<void> {
  const docRef = getNsfwVideoRef(projectId);
  await setDoc(docRef, { ...data, createdAt: Timestamp.now() });

  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get all NSFW video clips
 */
export async function getNsfwVideoClips(
  projectId: string
): Promise<NsfwVideoClipDocument[]> {
  const collectionRef = getNsfwVideoClipsCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  const clips = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const [sceneIndexStr, clipIndexStr] = docSnapshot.id.split('_');
    return {
      ...data,
      sceneIndex: data.sceneIndex ?? parseInt(sceneIndexStr, 10),
      clipIndex:  data.clipIndex  ?? parseInt(clipIndexStr,  10),
    };
  }) as NsfwVideoClipDocument[];

  return clips.sort((a, b) => a.clipIndex - b.clipIndex);
}

/**
 * Save an NSFW video clip (initial state)
 */
export async function saveNsfwVideoClip(
  projectId: string,
  clipId: string,
  input: SaveNsfwVideoClipInput
): Promise<void> {
  const docRef = getNsfwVideoClipRef(projectId, clipId);
  await setDoc(docRef, {
    clipIndex:  input.clipIndex,
    sceneIndex: input.sceneIndex,
    videoRef:   null,
    jobId:      null,
    s3FileName: null,
    status:     'pending',
  });
}

/**
 * Update NSFW video clip status
 */
export async function updateNsfwVideoClipStatus(
  projectId: string,
  clipId: string,
  updates: UpdateNsfwVideoClipInput
): Promise<void> {
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  );
  const docRef = getNsfwVideoClipRef(projectId, clipId);
  await setDoc(docRef, cleanUpdates, { merge: true });
}

/**
 * Clear all NSFW video data
 */
export async function clearNsfwVideo(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  const clips = await getNsfwVideoClips(projectId);
  for (const clip of clips) {
    const clipRef = getNsfwVideoClipRef(
      projectId,
      `${clip.sceneIndex}_${clip.clipIndex}`
    );
    batch.delete(clipRef);
  }

  const metaRef = getNsfwVideoRef(projectId);
  batch.delete(metaRef);

  await batch.commit();
}

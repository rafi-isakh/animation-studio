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
import {
  VideoDocument,
  VideoClipDocument,
  AspectRatio,
  SaveVideoClipInput,
  UpdateVideoClipInput,
} from './types';

const getVideoRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'storyboard', 'video');

const getVideoClipsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'storyboard', 'video', 'clips');

const getVideoClipRef = (projectId: string, clipId: string) =>
  doc(db, 'projects', projectId, 'storyboard', 'video', 'clips', clipId);

/**
 * Get video metadata
 */
export async function getVideoMeta(
  projectId: string
): Promise<VideoDocument | null> {
  const docRef = getVideoRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as VideoDocument;
}

/**
 * Save video metadata
 */
export async function saveVideoMeta(
  projectId: string,
  aspectRatio: AspectRatio,
  providerId?: string
): Promise<void> {
  const docRef = getVideoRef(projectId);

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
 * Get all video clips
 * Note: We fetch all documents without orderBy to handle legacy documents
 * that may not have sceneIndex/clipIndex fields. Sorting is done in memory.
 */
export async function getVideoClips(projectId: string): Promise<VideoClipDocument[]> {
  const collectionRef = getVideoClipsCollection(projectId);
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
  }) as VideoClipDocument[];

  // Sort in memory by sceneIndex, then clipIndex
  return clips.sort((a, b) => {
    if (a.sceneIndex !== b.sceneIndex) {
      return a.sceneIndex - b.sceneIndex;
    }
    return a.clipIndex - b.clipIndex;
  });
}

/**
 * Save a video clip
 */
export async function saveVideoClip(
  projectId: string,
  clipId: string,
  input: SaveVideoClipInput
): Promise<void> {
  const docRef = getVideoClipRef(projectId, clipId);

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
 * Update video clip status
 * Uses setDoc with merge to create the document if it doesn't exist
 */
export async function updateVideoClipStatus(
  projectId: string,
  clipId: string,
  updates: UpdateVideoClipInput
): Promise<void> {
  // Filter out undefined values - Firestore doesn't accept undefined
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  const docRef = getVideoClipRef(projectId, clipId);
  // Use setDoc with merge to handle both create and update cases
  await setDoc(docRef, cleanUpdates, { merge: true });
}

/**
 * Update video clip video reference
 */
export async function updateVideoClipVideo(
  projectId: string,
  clipId: string,
  videoRef: string,
  s3FileName: string
): Promise<void> {
  await updateVideoClipStatus(projectId, clipId, {
    videoRef,
    s3FileName,
    status: 'completed',
  });
}

/**
 * Clear all video data
 */
export async function clearVideo(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all clips
  const clips = await getVideoClips(projectId);
  for (const clip of clips) {
    const clipRef = getVideoClipRef(projectId, `${clip.sceneIndex}_${clip.clipIndex}`);
    batch.delete(clipRef);
  }

  // Delete metadata
  const metaRef = getVideoRef(projectId);
  batch.delete(metaRef);

  await batch.commit();
}
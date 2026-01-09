import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  updateDoc,
  writeBatch,
  Timestamp,
  query,
  orderBy,
  UpdateData,
  DocumentData,
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
  aspectRatio: AspectRatio
): Promise<void> {
  const docRef = getVideoRef(projectId);

  await setDoc(docRef, {
    aspectRatio,
    createdAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get all video clips
 */
export async function getVideoClips(projectId: string): Promise<VideoClipDocument[]> {
  const collectionRef = getVideoClipsCollection(projectId);
  const q = query(collectionRef, orderBy('sceneIndex'), orderBy('clipIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
  })) as VideoClipDocument[];
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
 */
export async function updateVideoClipStatus(
  projectId: string,
  clipId: string,
  updates: UpdateVideoClipInput
): Promise<void> {
  const docRef = getVideoClipRef(projectId, clipId);
  await updateDoc(docRef, updates as UpdateData<DocumentData>);
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
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
// Webnovel Trailer Types
// ============================================

export interface WebnovelTrailerDocument {
  aspectRatio: AspectRatio;
  providerId?: string;
  createdAt: Timestamp;
}

export interface WebnovelTrailerClipDocument {
  sceneIndex: number;
  clipIndex: number;
  sceneTitle?: string;
  videoPrompt?: string;
  length?: string;
  videoApi?: string | null;
  imageUrl?: string | null;
  videoRef?: string | null;
  jobId?: string | null;
  s3FileName?: string | null;
  status?: string;
  error?: string;
  providerId?: string;
}

export interface SaveWebnovelTrailerClipInput {
  clipIndex: number;
  sceneIndex: number;
  sceneTitle: string;
  videoPrompt: string;
  length: string;
  videoApi?: string | null;
  imageUrl?: string | null;
}

export interface UpdateWebnovelTrailerClipInput {
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

const getWebnovelTrailerRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'webnovelTrailer', 'data');

const getWebnovelTrailerClipsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'webnovelTrailer', 'data', 'clips');

const getWebnovelTrailerClipRef = (projectId: string, clipId: string) =>
  doc(db, 'projects', projectId, 'webnovelTrailer', 'data', 'clips', clipId);

// ============================================
// Webnovel Trailer Functions
// ============================================

export async function getWebnovelTrailerMeta(
  projectId: string
): Promise<WebnovelTrailerDocument | null> {
  const docRef = getWebnovelTrailerRef(projectId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as WebnovelTrailerDocument;
}

export async function saveWebnovelTrailerMeta(
  projectId: string,
  aspectRatio: AspectRatio,
  providerId?: string
): Promise<void> {
  const docRef = getWebnovelTrailerRef(projectId);
  await setDoc(docRef, {
    aspectRatio,
    providerId: providerId || 'veo3',
    createdAt: Timestamp.now(),
  });

  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

export async function getWebnovelTrailerClips(projectId: string): Promise<WebnovelTrailerClipDocument[]> {
  const collectionRef = getWebnovelTrailerClipsCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  const clips = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    const [sceneIndexStr, clipIndexStr] = docSnapshot.id.split('_');
    return {
      ...data,
      sceneIndex: data.sceneIndex ?? parseInt(sceneIndexStr, 10),
      clipIndex:  data.clipIndex  ?? parseInt(clipIndexStr,  10),
    };
  }) as WebnovelTrailerClipDocument[];

  return clips.sort((a, b) => {
    if (a.sceneIndex !== b.sceneIndex) return a.sceneIndex - b.sceneIndex;
    return a.clipIndex - b.clipIndex;
  });
}

export async function saveWebnovelTrailerClip(
  projectId: string,
  clipId: string,
  input: SaveWebnovelTrailerClipInput
): Promise<void> {
  const docRef = getWebnovelTrailerClipRef(projectId, clipId);
  await setDoc(docRef, {
    clipIndex:   input.clipIndex,
    sceneIndex:  input.sceneIndex,
    sceneTitle:  input.sceneTitle,
    videoPrompt: input.videoPrompt,
    length:      input.length,
    videoApi:    input.videoApi ?? null,
    imageUrl:    input.imageUrl ?? null,
    videoRef:    null,
    jobId:       null,
    s3FileName:  null,
    status:      'idle',
  });
}

export async function updateWebnovelTrailerClipStatus(
  projectId: string,
  clipId: string,
  updates: UpdateWebnovelTrailerClipInput
): Promise<void> {
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  const docRef = getWebnovelTrailerClipRef(projectId, clipId);
  await setDoc(docRef, cleanUpdates, { merge: true });
}

export async function clearWebnovelTrailer(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  const clips = await getWebnovelTrailerClips(projectId);
  for (const clip of clips) {
    const clipRef = getWebnovelTrailerClipRef(projectId, `${clip.sceneIndex}_${clip.clipIndex}`);
    batch.delete(clipRef);
  }

  const metaRef = getWebnovelTrailerRef(projectId);
  batch.delete(metaRef);

  await batch.commit();
}

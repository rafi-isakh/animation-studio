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

// ============================================
// T2V NSFW Video Types
// ============================================

export type T2VNsfwClipStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'retrying';

export interface T2VNsfwVideoDocument {
  aspectRatio: '16:9' | '9:16';
  providerId?: string;
  createdAt: Timestamp;
}

export interface T2VNsfwClipDocument {
  clipNumber: number;
  promptVariant: 'A' | 'B' | 'C' | null;
  frameLabel: string;
  imageRef: string | null;
  videoPrompt: string;
  videoRef: string | null;
  jobId: string | null;
  s3FileName: string | null;
  status: T2VNsfwClipStatus;
  error?: string;
  providerId?: string;
}

export interface SaveT2VNsfwClipInput {
  clipNumber: number;
  promptVariant: 'A' | 'B' | 'C' | null;
  frameLabel: string;
  imageRef: string | null;
  videoPrompt: string;
}

export interface UpdateT2VNsfwClipInput {
  videoPrompt?: string;
  videoRef?: string | null;
  jobId?: string | null;
  s3FileName?: string | null;
  status?: T2VNsfwClipStatus;
  error?: string | null;
  providerId?: string;
}

// ============================================
// Firestore References
// ============================================

const getMetaRef = (projectId: string) =>
  doc(db, 'projects', projectId, 't2vNsfwVideo', 'data');

const getClipsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 't2vNsfwVideo', 'data', 'clips');

const getClipRef = (projectId: string, clipNumber: number) =>
  doc(db, 'projects', projectId, 't2vNsfwVideo', 'data', 'clips', `clip_${String(clipNumber).padStart(4, '0')}`);

// ============================================
// CRUD
// ============================================

export async function getT2VNsfwVideoMeta(projectId: string): Promise<T2VNsfwVideoDocument | null> {
  const snap = await getDoc(getMetaRef(projectId));
  return snap.exists() ? (snap.data() as T2VNsfwVideoDocument) : null;
}

export async function saveT2VNsfwVideoMeta(
  projectId: string,
  data: { aspectRatio: '16:9' | '9:16'; providerId?: string }
): Promise<void> {
  await setDoc(getMetaRef(projectId), { ...data, createdAt: Timestamp.now() }, { merge: true });
  await setDoc(doc(db, 'projects', projectId), { updatedAt: Timestamp.now() }, { merge: true });
}

export async function getT2VNsfwClips(projectId: string): Promise<T2VNsfwClipDocument[]> {
  const snap = await getDocs(getClipsCollection(projectId));
  const clips = snap.docs.map((d) => d.data() as T2VNsfwClipDocument);
  return clips.sort((a, b) => a.clipNumber - b.clipNumber);
}

export async function saveT2VNsfwClips(
  projectId: string,
  clips: SaveT2VNsfwClipInput[]
): Promise<void> {
  const batch = writeBatch(db);
  for (const clip of clips) {
    batch.set(getClipRef(projectId, clip.clipNumber), {
      clipNumber: clip.clipNumber,
      promptVariant: clip.promptVariant,
      frameLabel: clip.frameLabel,
      imageRef: clip.imageRef,
      videoPrompt: clip.videoPrompt,
      videoRef: null,
      jobId: null,
      s3FileName: null,
      status: 'pending',
    });
  }
  await batch.commit();
}

export async function updateT2VNsfwClip(
  projectId: string,
  clipNumber: number,
  updates: UpdateT2VNsfwClipInput
): Promise<void> {
  const clean = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
  await setDoc(getClipRef(projectId, clipNumber), clean, { merge: true });
}

export async function clearT2VNsfwVideo(projectId: string): Promise<void> {
  const clips = await getT2VNsfwClips(projectId);
  const batch = writeBatch(db);
  for (const clip of clips) {
    batch.delete(getClipRef(projectId, clip.clipNumber));
  }
  batch.delete(getMetaRef(projectId));
  await batch.commit();
}

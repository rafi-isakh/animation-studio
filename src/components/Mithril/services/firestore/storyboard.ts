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
  StoryboardDocument,
  SceneDocument,
  ClipDocument,
  VoicePromptDocument,
  SaveSceneInput,
  SaveClipInput,
  UpdateClipInput,
} from './types';

const getStoryboardRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'storyboard', 'data');

const getVoicePromptsRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'storyboard', 'voicePrompts');

const getScenesCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'storyboard', 'data', 'scenes');

const getSceneRef = (projectId: string, sceneIndex: number) =>
  doc(db, 'projects', projectId, 'storyboard', 'data', 'scenes', `scene_${sceneIndex}`);

const getClipsCollection = (projectId: string, sceneIndex: number) =>
  collection(
    db,
    'projects',
    projectId,
    'storyboard',
    'data',
    'scenes',
    `scene_${sceneIndex}`,
    'clips'
  );

const getClipRef = (projectId: string, sceneIndex: number, clipIndex: number) =>
  doc(
    db,
    'projects',
    projectId,
    'storyboard',
    'data',
    'scenes',
    `scene_${sceneIndex}`,
    'clips',
    `clip_${clipIndex}`
  );

/**
 * Get storyboard metadata
 */
export async function getStoryboardMeta(
  projectId: string
): Promise<StoryboardDocument | null> {
  const docRef = getStoryboardRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as StoryboardDocument;
}

/**
 * Save storyboard metadata
 */
export async function saveStoryboardMeta(
  projectId: string,
  aspectRatio?: string
): Promise<void> {
  const docRef = getStoryboardRef(projectId);

  await setDoc(docRef, {
    generatedAt: Timestamp.now(),
    aspectRatio: aspectRatio || '16:9',
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get voice prompts
 */
export async function getVoicePrompts(
  projectId: string
): Promise<VoicePromptDocument[]> {
  const docRef = getVoicePromptsRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return [];
  }

  return docSnap.data().prompts as VoicePromptDocument[];
}

/**
 * Save voice prompts
 */
export async function saveVoicePrompts(
  projectId: string,
  prompts: VoicePromptDocument[]
): Promise<void> {
  const docRef = getVoicePromptsRef(projectId);
  await setDoc(docRef, { prompts });
}

/**
 * Get all scenes
 */
export async function getScenes(projectId: string): Promise<SceneDocument[]> {
  const collectionRef = getScenesCollection(projectId);
  const q = query(collectionRef, orderBy('sceneIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data()) as SceneDocument[];
}

/**
 * Save a scene
 */
export async function saveScene(
  projectId: string,
  sceneIndex: number,
  input: SaveSceneInput
): Promise<void> {
  const docRef = getSceneRef(projectId, sceneIndex);

  await setDoc(docRef, {
    sceneIndex,
    sceneTitle: input.sceneTitle,
  });
}

/**
 * Get all clips for a scene
 */
export async function getClips(
  projectId: string,
  sceneIndex: number
): Promise<ClipDocument[]> {
  const collectionRef = getClipsCollection(projectId, sceneIndex);
  const q = query(collectionRef, orderBy('clipIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data()) as ClipDocument[];
}

/**
 * Save a clip
 */
export async function saveClip(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  input: SaveClipInput
): Promise<void> {
  const docRef = getClipRef(projectId, sceneIndex, clipIndex);

  await setDoc(docRef, {
    clipIndex,
    ...input,
    imageRef: input.imageRef || '',
    selectedBgId: input.selectedBgId || null,
  });
}

/**
 * Update a clip field
 */
export async function updateClipField(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  field: string,
  value: string
): Promise<void> {
  const docRef = getClipRef(projectId, sceneIndex, clipIndex);
  await updateDoc(docRef, { [field]: value });
}

/**
 * Update clip image
 */
export async function updateClipImage(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  imageRef: string
): Promise<void> {
  const docRef = getClipRef(projectId, sceneIndex, clipIndex);
  await updateDoc(docRef, { imageRef });
}

/**
 * Update a clip
 */
export async function updateClip(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  updates: UpdateClipInput
): Promise<void> {
  const docRef = getClipRef(projectId, sceneIndex, clipIndex);
  await updateDoc(docRef, updates as UpdateData<DocumentData>);
}

/**
 * Clear all storyboard data (cascade delete scenes and clips)
 */
export async function clearStoryboard(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  // Get all scenes
  const scenes = await getScenes(projectId);

  // Delete all clips for each scene, then the scene
  for (const scene of scenes) {
    const clips = await getClips(projectId, scene.sceneIndex);
    for (const clip of clips) {
      const clipRef = getClipRef(projectId, scene.sceneIndex, clip.clipIndex);
      batch.delete(clipRef);
    }
    const sceneRef = getSceneRef(projectId, scene.sceneIndex);
    batch.delete(sceneRef);
  }

  // Delete voice prompts
  const voicePromptsRef = getVoicePromptsRef(projectId);
  batch.delete(voicePromptsRef);

  // Delete storyboard metadata
  const storyboardRef = getStoryboardRef(projectId);
  batch.delete(storyboardRef);

  await batch.commit();
}
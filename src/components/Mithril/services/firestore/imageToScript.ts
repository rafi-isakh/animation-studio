import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  I2VScriptDocument,
  I2VSceneDocument,
  I2VClipDocument,
  I2VVoicePromptDocument,
  SaveI2VScriptInput,
  SaveI2VSceneInput,
  SaveI2VClipInput,
} from './types';

const getScriptRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'i2vScript', 'data');

const getVoicePromptsRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'i2vScript', 'voicePrompts');

const getScenesCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'i2vScript', 'data', 'scenes');

const getSceneRef = (projectId: string, sceneIndex: number) =>
  doc(db, 'projects', projectId, 'i2vScript', 'data', 'scenes', `scene_${sceneIndex}`);

const getClipsCollection = (projectId: string, sceneIndex: number) =>
  collection(
    db,
    'projects',
    projectId,
    'i2vScript',
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
    'i2vScript',
    'data',
    'scenes',
    `scene_${sceneIndex}`,
    'clips',
    `clip_${clipIndex}`
  );

/**
 * Get I2V script metadata
 */
export async function getI2VScriptMeta(
  projectId: string
): Promise<I2VScriptDocument | null> {
  const docRef = getScriptRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as I2VScriptDocument;
}

/**
 * Save I2V script metadata
 */
export async function saveI2VScriptMeta(
  projectId: string,
  input: SaveI2VScriptInput
): Promise<void> {
  const docRef = getScriptRef(projectId);

  await setDoc(docRef, {
    ...input,
    generatedAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get voice prompts
 */
export async function getI2VVoicePrompts(
  projectId: string
): Promise<I2VVoicePromptDocument[]> {
  const docRef = getVoicePromptsRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return [];
  }

  return docSnap.data().prompts as I2VVoicePromptDocument[];
}

/**
 * Save voice prompts
 */
export async function saveI2VVoicePrompts(
  projectId: string,
  prompts: I2VVoicePromptDocument[]
): Promise<void> {
  const docRef = getVoicePromptsRef(projectId);
  await setDoc(docRef, { prompts });
}

/**
 * Get all scenes
 */
export async function getI2VScenes(projectId: string): Promise<I2VSceneDocument[]> {
  const collectionRef = getScenesCollection(projectId);
  const q = query(collectionRef, orderBy('sceneIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data()) as I2VSceneDocument[];
}

/**
 * Save a scene
 */
export async function saveI2VScene(
  projectId: string,
  sceneIndex: number,
  input: SaveI2VSceneInput
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
export async function getI2VClips(
  projectId: string,
  sceneIndex: number
): Promise<I2VClipDocument[]> {
  const collectionRef = getClipsCollection(projectId, sceneIndex);
  const q = query(collectionRef, orderBy('clipIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data()) as I2VClipDocument[];
}

/**
 * Save a clip
 */
export async function saveI2VClip(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  input: SaveI2VClipInput
): Promise<void> {
  const docRef = getClipRef(projectId, sceneIndex, clipIndex);

  await setDoc(docRef, {
    clipIndex,
    ...input,
  });
}

/**
 * Clear all I2V script data (cascade delete scenes and clips)
 */
export async function clearI2VScript(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  // Get all scenes
  const scenes = await getI2VScenes(projectId);

  // Delete all clips for each scene, then the scene
  for (const scene of scenes) {
    const clips = await getI2VClips(projectId, scene.sceneIndex);
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

  // Delete script metadata
  const scriptRef = getScriptRef(projectId);
  batch.delete(scriptRef);

  await batch.commit();
}

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
  I2VStoryboardDocument,
  I2VStoryboardSceneDocument,
  I2VStoryboardClipDocument,
  I2VStoryboardAssetDocument,
  I2VVoicePromptDocument,
  SaveI2VStoryboardInput,
  SaveI2VStoryboardSceneInput,
  SaveI2VStoryboardClipInput,
  SaveI2VStoryboardAssetInput,
} from './types';

// Collection paths
const getStoryboardRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'i2vStoryboard', 'data');

const getVoicePromptsRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'i2vStoryboard', 'voicePrompts');

const getAssetsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'i2vStoryboard', 'data', 'assets');

const getAssetRef = (projectId: string, assetId: string) =>
  doc(db, 'projects', projectId, 'i2vStoryboard', 'data', 'assets', assetId);

const getScenesCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'i2vStoryboard', 'data', 'scenes');

const getSceneRef = (projectId: string, sceneIndex: number) =>
  doc(db, 'projects', projectId, 'i2vStoryboard', 'data', 'scenes', `scene_${sceneIndex}`);

const getClipsCollection = (projectId: string, sceneIndex: number) =>
  collection(
    db,
    'projects',
    projectId,
    'i2vStoryboard',
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
    'i2vStoryboard',
    'data',
    'scenes',
    `scene_${sceneIndex}`,
    'clips',
    `clip_${clipIndex}`
  );

/**
 * Get I2V storyboard metadata
 */
export async function getI2VStoryboardMeta(
  projectId: string
): Promise<I2VStoryboardDocument | null> {
  const docRef = getStoryboardRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as I2VStoryboardDocument;
}

/**
 * Save I2V storyboard metadata
 */
export async function saveI2VStoryboardMeta(
  projectId: string,
  input: SaveI2VStoryboardInput
): Promise<void> {
  const docRef = getStoryboardRef(projectId);

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
export async function getI2VStoryboardVoicePrompts(
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
export async function saveI2VStoryboardVoicePrompts(
  projectId: string,
  prompts: I2VVoicePromptDocument[]
): Promise<void> {
  const docRef = getVoicePromptsRef(projectId);
  await setDoc(docRef, { prompts });
}

/**
 * Get all assets
 */
export async function getI2VStoryboardAssets(
  projectId: string
): Promise<I2VStoryboardAssetDocument[]> {
  const collectionRef = getAssetsCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map((doc) => doc.data()) as I2VStoryboardAssetDocument[];
}

/**
 * Save an asset
 */
export async function saveI2VStoryboardAsset(
  projectId: string,
  input: SaveI2VStoryboardAssetInput
): Promise<void> {
  const docRef = getAssetRef(projectId, input.id);
  await setDoc(docRef, input);
}

/**
 * Delete an asset
 */
export async function deleteI2VStoryboardAsset(
  projectId: string,
  assetId: string
): Promise<void> {
  const docRef = getAssetRef(projectId, assetId);
  await deleteDoc(docRef);
}

/**
 * Get all scenes
 */
export async function getI2VStoryboardScenes(
  projectId: string
): Promise<I2VStoryboardSceneDocument[]> {
  const collectionRef = getScenesCollection(projectId);
  const q = query(collectionRef, orderBy('sceneIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data()) as I2VStoryboardSceneDocument[];
}

/**
 * Save a scene
 */
export async function saveI2VStoryboardScene(
  projectId: string,
  sceneIndex: number,
  input: SaveI2VStoryboardSceneInput
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
export async function getI2VStoryboardClips(
  projectId: string,
  sceneIndex: number
): Promise<I2VStoryboardClipDocument[]> {
  const collectionRef = getClipsCollection(projectId, sceneIndex);
  const q = query(collectionRef, orderBy('clipIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => doc.data()) as I2VStoryboardClipDocument[];
}

/**
 * Save a clip
 */
export async function saveI2VStoryboardClip(
  projectId: string,
  sceneIndex: number,
  clipIndex: number,
  input: SaveI2VStoryboardClipInput
): Promise<void> {
  const docRef = getClipRef(projectId, sceneIndex, clipIndex);

  await setDoc(docRef, {
    clipIndex,
    ...input,
  });
}

/**
 * Save all storyboard data at once (bulk save)
 */
export async function saveI2VStoryboardAll(
  projectId: string,
  data: {
    meta: SaveI2VStoryboardInput;
    scenes: Array<{
      sceneTitle: string;
      clips: SaveI2VStoryboardClipInput[];
    }>;
    voicePrompts: I2VVoicePromptDocument[];
    assets: SaveI2VStoryboardAssetInput[];
  }
): Promise<void> {
  // Clear existing data first
  await clearI2VStoryboard(projectId);

  const batch = writeBatch(db);

  // Save metadata
  const metaRef = getStoryboardRef(projectId);
  batch.set(metaRef, {
    ...data.meta,
    generatedAt: Timestamp.now(),
  });

  // Save voice prompts
  const voicePromptsRef = getVoicePromptsRef(projectId);
  batch.set(voicePromptsRef, { prompts: data.voicePrompts });

  await batch.commit();

  // Save scenes and clips (separate batches due to size limits)
  for (let sIdx = 0; sIdx < data.scenes.length; sIdx++) {
    const scene = data.scenes[sIdx];
    const sceneBatch = writeBatch(db);

    const sceneRef = getSceneRef(projectId, sIdx);
    sceneBatch.set(sceneRef, {
      sceneIndex: sIdx,
      sceneTitle: scene.sceneTitle,
    });

    for (let cIdx = 0; cIdx < scene.clips.length; cIdx++) {
      const clipRef = getClipRef(projectId, sIdx, cIdx);
      sceneBatch.set(clipRef, {
        clipIndex: cIdx,
        ...scene.clips[cIdx],
      });
    }

    await sceneBatch.commit();
  }

  // Save assets (separate batch)
  if (data.assets.length > 0) {
    const assetBatch = writeBatch(db);
    for (const asset of data.assets) {
      const assetRef = getAssetRef(projectId, asset.id);
      assetBatch.set(assetRef, asset);
    }
    await assetBatch.commit();
  }

  // Update project timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Load all storyboard data at once
 */
export async function loadI2VStoryboardAll(
  projectId: string
): Promise<{
  meta: I2VStoryboardDocument | null;
  scenes: Array<{
    sceneTitle: string;
    clips: I2VStoryboardClipDocument[];
  }>;
  voicePrompts: I2VVoicePromptDocument[];
  assets: I2VStoryboardAssetDocument[];
} | null> {
  const meta = await getI2VStoryboardMeta(projectId);

  if (!meta) {
    return null;
  }

  const sceneDocs = await getI2VStoryboardScenes(projectId);
  const voicePrompts = await getI2VStoryboardVoicePrompts(projectId);
  const assets = await getI2VStoryboardAssets(projectId);

  const scenes = await Promise.all(
    sceneDocs.map(async (sceneDoc) => {
      const clips = await getI2VStoryboardClips(projectId, sceneDoc.sceneIndex);
      return {
        sceneTitle: sceneDoc.sceneTitle,
        clips,
      };
    })
  );

  return {
    meta,
    scenes,
    voicePrompts,
    assets,
  };
}

/**
 * Clear all I2V storyboard data (cascade delete)
 */
export async function clearI2VStoryboard(projectId: string): Promise<void> {
  // Get all scenes and delete their clips
  const scenes = await getI2VStoryboardScenes(projectId);

  for (const scene of scenes) {
    const clips = await getI2VStoryboardClips(projectId, scene.sceneIndex);
    const clipBatch = writeBatch(db);

    for (const clip of clips) {
      const clipRef = getClipRef(projectId, scene.sceneIndex, clip.clipIndex);
      clipBatch.delete(clipRef);
    }

    const sceneRef = getSceneRef(projectId, scene.sceneIndex);
    clipBatch.delete(sceneRef);

    await clipBatch.commit();
  }

  // Delete assets
  const assets = await getI2VStoryboardAssets(projectId);
  if (assets.length > 0) {
    const assetBatch = writeBatch(db);
    for (const asset of assets) {
      const assetRef = getAssetRef(projectId, asset.id);
      assetBatch.delete(assetRef);
    }
    await assetBatch.commit();
  }

  // Delete voice prompts and metadata
  const mainBatch = writeBatch(db);
  const voicePromptsRef = getVoicePromptsRef(projectId);
  mainBatch.delete(voicePromptsRef);
  const storyboardRef = getStoryboardRef(projectId);
  mainBatch.delete(storyboardRef);

  await mainBatch.commit();
}

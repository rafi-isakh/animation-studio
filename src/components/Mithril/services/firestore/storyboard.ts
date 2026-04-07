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
  CollectionReference,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  StoryboardDocument,
  StoryboardPartDocument,
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
  jobIdOrAspectRatio?: string,
  aspectRatio?: string,
  characterIdSummary?: Array<{ characterId: string; description: string }>,
  genre?: string
): Promise<void> {
  const docRef = getStoryboardRef(projectId);

  // Determine if the second parameter is a jobId or aspectRatio
  // jobIds are typically UUIDs or Firestore IDs, aspectRatios are like "16:9"
  const isJobId = jobIdOrAspectRatio && !jobIdOrAspectRatio.includes(':');
  const actualJobId = isJobId ? jobIdOrAspectRatio : undefined;
  const actualAspectRatio = isJobId ? aspectRatio : jobIdOrAspectRatio;

  await setDoc(docRef, {
    generatedAt: Timestamp.now(),
    aspectRatio: actualAspectRatio || '16:9',
    ...(actualJobId ? { jobId: actualJobId } : {}),
    ...(characterIdSummary !== undefined ? { characterIdSummary } : {}),
    ...(genre !== undefined ? { genre } : {}),
  }, { merge: true });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Update storyboard job ID
 */
export async function updateStoryboardJobId(
  projectId: string,
  jobId: string | null
): Promise<void> {
  const docRef = getStoryboardRef(projectId);

  if (jobId) {
    await setDoc(docRef, { jobId }, { merge: true });
  } else {
    // Clear the jobId by setting to null
    await setDoc(docRef, { jobId: null }, { merge: true });
  }
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
  await setDoc(docRef, { prompts: prompts || [] });
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

// ============================================================
// Part-namespaced storyboard functions
// Projects store each novel part separately under:
//   projects/{id}/storyboard/parts/part_{partIndex}/...
// ============================================================

// ── Ref helpers ──────────────────────────────────────────────

const getPartsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'storyboard', 'data', 'parts');

const getPartMetaRef = (projectId: string, partIndex: number) =>
  doc(
    db,
    'projects',
    projectId,
    'storyboard',
    'data',
    'parts',
    `part_${partIndex}`,
    'meta',
    'data'
  );

const getPartVoicePromptsRef = (projectId: string, partIndex: number) =>
  doc(
    db,
    'projects',
    projectId,
    'storyboard',
    'data',
    'parts',
    `part_${partIndex}`,
    'voicePrompts',
    'data'
  );

const getPartScenesCollection = (projectId: string, partIndex: number) =>
  collection(
    db,
    'projects',
    projectId,
    'storyboard',
    'data',
    'parts',
    `part_${partIndex}`,
    'scenes'
  );

const getPartSceneRef = (projectId: string, partIndex: number, sceneIndex: number) =>
  doc(
    db,
    'projects',
    projectId,
    'storyboard',
    'data',
    'parts',
    `part_${partIndex}`,
    'scenes',
    `scene_${sceneIndex}`
  );

const getPartClipsCollection = (projectId: string, partIndex: number, sceneIndex: number) =>
  collection(
    db,
    'projects',
    projectId,
    'storyboard',
    'data',
    'parts',
    `part_${partIndex}`,
    'scenes',
    `scene_${sceneIndex}`,
    'clips'
  );

const getPartClipRef = (projectId: string, partIndex: number, sceneIndex: number, clipIndex: number) =>
  doc(
    db,
    'projects',
    projectId,
    'storyboard',
    'data',
    'parts',
    `part_${partIndex}`,
    'scenes',
    `scene_${sceneIndex}`,
    'clips',
    `clip_${clipIndex}`
  );

// ── Read functions ───────────────────────────────────────────

/**
 * Get all available part indices by listing the parts sub-collection.
 * Returns sorted 0-based part indices.
 */
export async function getAvailablePartIndices(projectId: string): Promise<number[]> {
  const partsRef = getPartsCollection(projectId);
  const snapshot = await getDocs(partsRef);
  return snapshot.docs
    .map((d) => parseInt(d.id.replace('part_', ''), 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);
}

/**
 * Get metadata for a specific part.
 */
export async function getPartMeta(
  projectId: string,
  partIndex: number
): Promise<StoryboardPartDocument | null> {
  const snap = await getDoc(getPartMetaRef(projectId, partIndex));
  return snap.exists() ? (snap.data() as StoryboardPartDocument) : null;
}

/**
 * Get voice prompts for a specific part.
 */
export async function getPartVoicePrompts(
  projectId: string,
  partIndex: number
): Promise<VoicePromptDocument[]> {
  const snap = await getDoc(getPartVoicePromptsRef(projectId, partIndex));
  if (!snap.exists()) return [];
  const data = snap.data();
  return Array.isArray(data?.prompts) ? data.prompts : [];
}

/**
 * Get all scenes for a specific part (without clips).
 */
export async function getPartScenes(
  projectId: string,
  partIndex: number
): Promise<SceneDocument[]> {
  const q = query(getPartScenesCollection(projectId, partIndex), orderBy('sceneIndex'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as SceneDocument);
}

/**
 * Get all clips for a scene within a specific part.
 */
export async function getPartClips(
  projectId: string,
  partIndex: number,
  sceneIndex: number
): Promise<ClipDocument[]> {
  const q = query(getPartClipsCollection(projectId, partIndex, sceneIndex), orderBy('clipIndex'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as ClipDocument);
}

/**
 * Load the full storyboard for a specific part (scenes with clips populated).
 */
export async function loadStoryboardPart(
  projectId: string,
  partIndex: number
): Promise<{
  meta: StoryboardPartDocument | null;
  scenes: SceneDocument[];
  clips: ClipDocument[][];
  voicePrompts: VoicePromptDocument[];
}> {
  const [meta, scenes, voicePrompts] = await Promise.all([
    getPartMeta(projectId, partIndex),
    getPartScenes(projectId, partIndex),
    getPartVoicePrompts(projectId, partIndex),
  ]);

  const clips = await Promise.all(
    scenes.map((scene) => getPartClips(projectId, partIndex, scene.sceneIndex))
  );

  return { meta, scenes, clips, voicePrompts };
}

// ── Write functions ──────────────────────────────────────────

/**
 * Save metadata for a specific part.
 */
export async function savePartMeta(
  projectId: string,
  partIndex: number,
  data: Partial<StoryboardPartDocument>
): Promise<void> {
  // Ensure the parent part document exists (Firestore requires it for subcollections)
  const partRef = doc(getPartsCollection(projectId), `part_${partIndex}`);
  await setDoc(partRef, { partIndex }, { merge: true });

  await setDoc(getPartMetaRef(projectId, partIndex), {
    partIndex,
    generatedAt: Timestamp.now(),
    ...data,
  }, { merge: true });
}

/**
 * Save voice prompts for a specific part.
 */
export async function savePartVoicePrompts(
  projectId: string,
  partIndex: number,
  prompts: VoicePromptDocument[]
): Promise<void> {
  await setDoc(getPartVoicePromptsRef(projectId, partIndex), { prompts });
}

/**
 * Save a scene within a specific part.
 */
export async function savePartScene(
  projectId: string,
  partIndex: number,
  sceneIndex: number,
  input: SaveSceneInput
): Promise<void> {
  await setDoc(getPartSceneRef(projectId, partIndex, sceneIndex), {
    sceneIndex,
    sceneTitle: input.sceneTitle,
    partIndex,
  });
}

/**
 * Save a clip within a specific part's scene.
 */
export async function savePartClip(
  projectId: string,
  partIndex: number,
  sceneIndex: number,
  clipIndex: number,
  input: SaveClipInput
): Promise<void> {
  await setDoc(getPartClipRef(projectId, partIndex, sceneIndex, clipIndex), {
    clipIndex,
    partIndex,
    story: input.story,
    imagePrompt: input.imagePrompt,
    imagePromptEnd: input.imagePromptEnd ?? null,
    videoPrompt: input.videoPrompt,
    soraVideoPrompt: input.soraVideoPrompt,
    veoVideoPrompt: input.veoVideoPrompt,
    pixAiPrompt: input.pixAiPrompt ?? null,
    backgroundPrompt: input.backgroundPrompt,
    backgroundId: input.backgroundId,
    characterInfo: input.characterInfo ?? null,
    dialogue: input.dialogue,
    dialogueEn: input.dialogueEn,
    narration: input.narration ?? null,
    narrationEn: input.narrationEn ?? null,
    sfx: input.sfx,
    sfxEn: input.sfxEn,
    bgm: input.bgm,
    bgmEn: input.bgmEn,
    length: input.length,
    accumulatedTime: input.accumulatedTime,
    trailerScriptKo: input.trailerScriptKo ?? null,
    trailerScriptEn: input.trailerScriptEn ?? null,
    imageRef: input.imageRef ?? '',
    selectedBgId: input.selectedBgId ?? null,
  });
}

/**
 * Update a single field on a clip within a specific part.
 */
export async function updatePartClipField(
  projectId: string,
  partIndex: number,
  sceneIndex: number,
  clipIndex: number,
  field: string,
  value: string
): Promise<void> {
  const ref = getPartClipRef(projectId, partIndex, sceneIndex, clipIndex);
  await updateDoc(ref, { [field]: value } as UpdateData<DocumentData>);
}

/**
 * Update the image reference on a clip within a specific part.
 */
export async function updatePartClipImage(
  projectId: string,
  partIndex: number,
  sceneIndex: number,
  clipIndex: number,
  imageRef: string
): Promise<void> {
  const ref = getPartClipRef(projectId, partIndex, sceneIndex, clipIndex);
  await updateDoc(ref, { imageRef } as UpdateData<DocumentData>);
}

// ── Delete functions ─────────────────────────────────────────

/**
 * Delete all storyboard data for a single part (scenes, clips, meta, voicePrompts).
 * Uses chunked batches to stay under Firestore's 500-write limit.
 */
export async function clearStoryboardPart(projectId: string, partIndex: number): Promise<void> {
  const MAX_OPS = 490;
  let batch = writeBatch(db);
  let opCount = 0;

  const flush = async () => {
    if (opCount > 0) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  };

  const del = async (ref: ReturnType<typeof doc>) => {
    batch.delete(ref);
    opCount++;
    if (opCount >= MAX_OPS) await flush();
  };

  const scenes = await getPartScenes(projectId, partIndex);
  for (const scene of scenes) {
    const clips = await getPartClips(projectId, partIndex, scene.sceneIndex);
    for (const clip of clips) {
      await del(getPartClipRef(projectId, partIndex, scene.sceneIndex, clip.clipIndex));
    }
    await del(getPartSceneRef(projectId, partIndex, scene.sceneIndex));
  }

  // Delete meta and voicePrompts
  await del(getPartMetaRef(projectId, partIndex));
  await del(getPartVoicePromptsRef(projectId, partIndex));

  // Delete the part root document
  await del(doc(getPartsCollection(projectId), `part_${partIndex}`));

  await flush();
}

// ── Migration ────────────────────────────────────────────────

/**
 * One-time migration: copies old flat-path storyboard data to part_0.
 * No-op if part_0 already exists or if the old path is empty.
 * Returns true if migration was performed.
 */
export async function migrateOldStoryboardToPartZero(projectId: string): Promise<boolean> {
  // Skip if part_0 already exists
  const existingParts = await getAvailablePartIndices(projectId);
  if (existingParts.length > 0) return false;

  // Check if old path has data
  const oldScenes = await getScenes(projectId);
  if (oldScenes.length === 0) return false;

  // Check for active job — skip migration if job is still running
  const oldMeta = await getStoryboardMeta(projectId);
  if (oldMeta?.jobId) return false;

  // Copy meta
  await savePartMeta(projectId, 0, {
    partIndex: 0,
    characterIdSummary: oldMeta?.characterIdSummary,
    genre: oldMeta?.genre,
  });

  // Copy voice prompts
  const oldVoicePrompts = await getVoicePrompts(projectId);
  if (oldVoicePrompts.length > 0) {
    await savePartVoicePrompts(projectId, 0, oldVoicePrompts);
  }

  // Copy scenes and clips
  for (const scene of oldScenes) {
    await savePartScene(projectId, 0, scene.sceneIndex, { sceneTitle: scene.sceneTitle });
    const clips = await getClips(projectId, scene.sceneIndex);
    for (const clip of clips) {
      await savePartClip(projectId, 0, scene.sceneIndex, clip.clipIndex, {
        story: clip.story,
        imagePrompt: clip.imagePrompt,
        imagePromptEnd: clip.imagePromptEnd,
        videoPrompt: clip.videoPrompt,
        soraVideoPrompt: clip.soraVideoPrompt,
        veoVideoPrompt: clip.veoVideoPrompt,
        pixAiPrompt: clip.pixAiPrompt,
        backgroundPrompt: clip.backgroundPrompt,
        backgroundId: clip.backgroundId,
        characterInfo: clip.characterInfo,
        dialogue: clip.dialogue,
        dialogueEn: clip.dialogueEn,
        narration: clip.narration,
        narrationEn: clip.narrationEn,
        sfx: clip.sfx,
        sfxEn: clip.sfxEn,
        bgm: clip.bgm,
        bgmEn: clip.bgmEn,
        length: clip.length,
        accumulatedTime: clip.accumulatedTime,
        imageRef: clip.imageRef,
        selectedBgId: clip.selectedBgId,
      });
    }
  }

  return true;
}

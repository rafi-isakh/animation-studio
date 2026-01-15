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
  ImageGenDocument,
  ImageGenFrameDocument,
  ImageGenAspectRatio,
  SaveImageGenFrameInput,
  UpdateImageGenFrameInput,
} from './types';

// ============================================================
// Reference Helpers
// ============================================================

const getImageGenRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'imageGen', 'settings');

const getImageGenFramesCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'imageGen', 'settings', 'frames');

const getImageGenFrameRef = (projectId: string, frameId: string) =>
  doc(db, 'projects', projectId, 'imageGen', 'settings', 'frames', frameId);

// ============================================================
// Settings Management
// ============================================================

/**
 * Get ImageGen metadata/settings
 */
export async function getImageGenMeta(
  projectId: string
): Promise<ImageGenDocument | null> {
  const docRef = getImageGenRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as ImageGenDocument;
}

/**
 * Save ImageGen metadata/settings
 */
export async function saveImageGenMeta(
  projectId: string,
  stylePrompt: string,
  aspectRatio: ImageGenAspectRatio
): Promise<void> {
  const docRef = getImageGenRef(projectId);

  await setDoc(docRef, {
    stylePrompt,
    aspectRatio,
    generatedAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

// ============================================================
// Frame Management
// ============================================================

/**
 * Get all ImageGen frames
 * Sorted by sceneIndex, then clipIndex
 */
export async function getImageGenFrames(
  projectId: string
): Promise<ImageGenFrameDocument[]> {
  const collectionRef = getImageGenFramesCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  const frames = snapshot.docs.map((docSnapshot) => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
    };
  }) as ImageGenFrameDocument[];

  // Sort by sceneIndex, then clipIndex
  return frames.sort((a, b) => {
    if (a.sceneIndex !== b.sceneIndex) {
      return a.sceneIndex - b.sceneIndex;
    }
    return a.clipIndex - b.clipIndex;
  });
}

/**
 * Save a single ImageGen frame
 */
export async function saveImageGenFrame(
  projectId: string,
  frameId: string,
  input: SaveImageGenFrameInput
): Promise<void> {
  const docRef = getImageGenFrameRef(projectId, frameId);

  await setDoc(docRef, {
    sceneIndex: input.sceneIndex,
    clipIndex: input.clipIndex,
    frameLabel: input.frameLabel,
    frameNumber: input.frameNumber,
    shotGroup: input.shotGroup,
    prompt: input.prompt,
    backgroundId: input.backgroundId,
    refFrame: input.refFrame,
    imageRef: input.imageRef || '',
    status: input.status || 'pending',
    remixPrompt: input.remixPrompt || '',
    remixImageRef: input.remixImageRef || null,
    editedImageRef: input.editedImageRef || null,
  });
}

/**
 * Save multiple ImageGen frames at once
 */
export async function saveImageGenFrames(
  projectId: string,
  frames: { id: string; input: SaveImageGenFrameInput }[]
): Promise<void> {
  const batch = writeBatch(db);

  for (const { id, input } of frames) {
    const docRef = getImageGenFrameRef(projectId, id);
    batch.set(docRef, {
      sceneIndex: input.sceneIndex,
      clipIndex: input.clipIndex,
      frameLabel: input.frameLabel,
      frameNumber: input.frameNumber,
      shotGroup: input.shotGroup,
      prompt: input.prompt,
      backgroundId: input.backgroundId,
      refFrame: input.refFrame,
      imageRef: input.imageRef || '',
      status: input.status || 'pending',
      remixPrompt: input.remixPrompt || '',
      remixImageRef: input.remixImageRef || null,
      editedImageRef: input.editedImageRef || null,
    });
  }

  await batch.commit();
}

/**
 * Update an ImageGen frame
 * Uses setDoc with merge to handle both create and update cases
 */
export async function updateImageGenFrame(
  projectId: string,
  frameId: string,
  updates: UpdateImageGenFrameInput
): Promise<void> {
  const docRef = getImageGenFrameRef(projectId, frameId);
  await setDoc(docRef, updates, { merge: true });
}

/**
 * Update frame image reference after S3 upload
 */
export async function updateImageGenFrameImage(
  projectId: string,
  frameId: string,
  imageRef: string
): Promise<void> {
  await updateImageGenFrame(projectId, frameId, {
    imageRef,
    status: 'completed',
  });
}

/**
 * Update frame remix image reference
 */
export async function updateImageGenFrameRemix(
  projectId: string,
  frameId: string,
  remixImageRef: string
): Promise<void> {
  await updateImageGenFrame(projectId, frameId, {
    remixImageRef,
  });
}

/**
 * Update frame edited image reference
 */
export async function updateImageGenFrameEdited(
  projectId: string,
  frameId: string,
  editedImageRef: string
): Promise<void> {
  await updateImageGenFrame(projectId, frameId, {
    editedImageRef,
  });
}

// ============================================================
// Stage Cleanup
// ============================================================

/**
 * Clear all ImageGen data (settings + all frames)
 */
export async function clearImageGen(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all frames
  const frames = await getImageGenFrames(projectId);
  for (const frame of frames) {
    const frameRef = getImageGenFrameRef(projectId, frame.id);
    batch.delete(frameRef);
  }

  // Delete settings
  const settingsRef = getImageGenRef(projectId);
  batch.delete(settingsRef);

  await batch.commit();
}

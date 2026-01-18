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
  UpdateData,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  BgSheetDocument,
  BackgroundDocument,
  BackgroundAngleImage,
  SaveBgSheetSettingsInput,
  SaveBackgroundInput,
  UpdateBackgroundInput,
} from './types';

const getSettingsRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'bgSheet', 'settings');

const getBackgroundsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'bgSheet', 'settings', 'backgrounds');

const getBackgroundRef = (projectId: string, bgId: string) =>
  doc(db, 'projects', projectId, 'bgSheet', 'settings', 'backgrounds', bgId);

/**
 * Get background sheet settings
 */
export async function getBgSheetSettings(
  projectId: string
): Promise<BgSheetDocument | null> {
  const docRef = getSettingsRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as BgSheetDocument;
}

/**
 * Save background sheet settings
 */
export async function saveBgSheetSettings(
  projectId: string,
  input: SaveBgSheetSettingsInput
): Promise<void> {
  const docRef = getSettingsRef(projectId);

  await setDoc(docRef, {
    styleKeyword: input.styleKeyword,
    backgroundBasePrompt: input.backgroundBasePrompt,
    generatedAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get all backgrounds
 */
export async function getBackgrounds(projectId: string): Promise<BackgroundDocument[]> {
  const collectionRef = getBackgroundsCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as BackgroundDocument[];
}

/**
 * Save a new background
 * Returns the auto-generated Firestore document ID
 */
export async function saveBackground(
  projectId: string,
  input: SaveBackgroundInput
): Promise<string> {
  const collectionRef = getBackgroundsCollection(projectId);
  const newDocRef = doc(collectionRef);

  await setDoc(newDocRef, {
    name: input.name,
    description: input.description,
    angles: input.angles || [],
  });

  return newDocRef.id;
}

/**
 * Save a background with a specific ID (for imported backgrounds)
 * Creates or overwrites the document with the given ID
 */
export async function saveBackgroundWithId(
  projectId: string,
  bgId: string,
  input: SaveBackgroundInput
): Promise<void> {
  const docRef = getBackgroundRef(projectId, bgId);
  await setDoc(docRef, {
    name: input.name,
    description: input.description,
    angles: input.angles || [],
  });
}

/**
 * Update a background
 */
export async function updateBackground(
  projectId: string,
  bgId: string,
  updates: UpdateBackgroundInput
): Promise<void> {
  const docRef = getBackgroundRef(projectId, bgId);
  await updateDoc(docRef, updates as UpdateData<DocumentData>);
}

/**
 * Update a specific angle's image
 * Creates the background document if it doesn't exist (upsert behavior)
 */
export async function updateBackgroundAngleImage(
  projectId: string,
  bgId: string,
  angle: string,
  imageRef: string,
  prompt: string,
  bgName?: string,
  bgDescription?: string
): Promise<void> {
  const docRef = getBackgroundRef(projectId, bgId);
  const docSnap = await getDoc(docRef);

  let angles: BackgroundAngleImage[] = [];

  if (docSnap.exists()) {
    const data = docSnap.data() as BackgroundDocument;
    angles = data.angles || [];
  }

  // Find and update or add the angle
  const existingIndex = angles.findIndex((a) => a.angle === angle);
  const newAngle: BackgroundAngleImage = {
    angle: angle as BackgroundAngleImage['angle'],
    imageRef,
    prompt,
  };

  if (existingIndex >= 0) {
    angles[existingIndex] = newAngle;
  } else {
    angles.push(newAngle);
  }

  // Use setDoc with merge to create or update the document
  await setDoc(docRef, {
    name: bgName || `Background ${bgId}`,
    description: bgDescription || '',
    angles,
  }, { merge: true });
}

/**
 * Delete a background
 */
export async function deleteBackground(
  projectId: string,
  bgId: string
): Promise<void> {
  const docRef = getBackgroundRef(projectId, bgId);
  await deleteDoc(docRef);
}

/**
 * Clear all background sheet data (settings + all backgrounds)
 */
export async function clearBgSheet(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all backgrounds
  const backgrounds = await getBackgrounds(projectId);
  for (const bg of backgrounds) {
    const bgRef = getBackgroundRef(projectId, bg.id);
    batch.delete(bgRef);
  }

  // Delete settings
  const settingsRef = getSettingsRef(projectId);
  batch.delete(settingsRef);

  await batch.commit();
}
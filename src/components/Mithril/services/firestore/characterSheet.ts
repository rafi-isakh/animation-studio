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
  CharacterSheetDocument,
  CharacterDocument,
  SaveCharacterSheetSettingsInput,
  SaveCharacterInput,
  UpdateCharacterInput,
} from './types';

const getSettingsRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'characterSheet', 'settings');

const getCharactersCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'characterSheet', 'settings', 'characters');

const getCharacterRef = (projectId: string, characterId: string) =>
  doc(db, 'projects', projectId, 'characterSheet', 'settings', 'characters', characterId);

/**
 * Get character sheet settings
 */
export async function getCharacterSheetSettings(
  projectId: string
): Promise<CharacterSheetDocument | null> {
  const docRef = getSettingsRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as CharacterSheetDocument;
}

/**
 * Save character sheet settings
 */
export async function saveCharacterSheetSettings(
  projectId: string,
  input: SaveCharacterSheetSettingsInput
): Promise<void> {
  const docRef = getSettingsRef(projectId);

  await setDoc(docRef, {
    styleKeyword: input.styleKeyword,
    characterBasePrompt: input.characterBasePrompt,
    generatedAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get all characters
 */
export async function getCharacters(projectId: string): Promise<CharacterDocument[]> {
  const collectionRef = getCharactersCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CharacterDocument[];
}

/**
 * Save a new character
 * Returns the auto-generated Firestore document ID
 */
export async function saveCharacter(
  projectId: string,
  input: SaveCharacterInput
): Promise<string> {
  const collectionRef = getCharactersCollection(projectId);
  const newDocRef = doc(collectionRef);

  await setDoc(newDocRef, {
    name: input.name,
    appearance: input.appearance,
    clothing: input.clothing,
    personality: input.personality,
    backgroundStory: input.backgroundStory,
    imageRef: input.imageRef || '',
    imagePrompt: input.imagePrompt || '',
  });

  return newDocRef.id;
}

/**
 * Update a character
 */
export async function updateCharacter(
  projectId: string,
  characterId: string,
  updates: UpdateCharacterInput
): Promise<void> {
  const docRef = getCharacterRef(projectId, characterId);
  await updateDoc(docRef, updates as UpdateData<DocumentData>);
}

/**
 * Update character image
 */
export async function updateCharacterImage(
  projectId: string,
  characterId: string,
  imageRef: string,
  imagePrompt: string
): Promise<void> {
  await updateCharacter(projectId, characterId, { imageRef, imagePrompt });
}

/**
 * Delete a character
 */
export async function deleteCharacter(
  projectId: string,
  characterId: string
): Promise<void> {
  const docRef = getCharacterRef(projectId, characterId);
  await deleteDoc(docRef);
}

/**
 * Clear all character sheet data (settings + all characters)
 */
export async function clearCharacterSheet(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all characters
  const characters = await getCharacters(projectId);
  for (const char of characters) {
    const charRef = getCharacterRef(projectId, char.id);
    batch.delete(charRef);
  }

  // Delete settings
  const settingsRef = getSettingsRef(projectId);
  batch.delete(settingsRef);

  await batch.commit();
}
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  CharacterSheetDocument,
  CharacterDocument,
  ModeDocument,
  StyleSlotDocument,
  SaveCharacterSheetSettingsInput,
  SaveCharacterInput,
  UpdateCharacterInput,
  SaveModeInput,
  UpdateModeInput,
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

  const data: Record<string, unknown> = {
    styleKeyword: input.styleKeyword,
    characterBasePrompt: input.characterBasePrompt,
    generatedAt: Timestamp.now(),
  };

  // Add optional new fields if provided
  if (input.genre !== undefined) {
    data.genre = input.genre;
  }
  if (input.styleSlots !== undefined) {
    data.styleSlots = input.styleSlots;
  }
  if (input.activeStyleIndex !== undefined) {
    data.activeStyleIndex = input.activeStyleIndex;
  }

  await setDoc(docRef, data, { merge: true });

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
    // Role & Identity (with defaults for backward compatibility)
    role: input.role || 'unknown',
    isProtagonist: input.isProtagonist || false,
    age: input.age || '',
    gender: input.gender || '',
    traits: input.traits || '',
    // Description fields
    appearance: input.appearance,
    clothing: input.clothing,
    personality: input.personality,
    backgroundStory: input.backgroundStory,
    // Profile image
    profileImageRef: input.profileImageRef || '',
    profileImagePrompt: input.profileImagePrompt || '',
    // Master sheet image
    masterSheetImageRef: input.masterSheetImageRef || '',
    masterSheetImagePrompt: input.masterSheetImagePrompt || '',
    // Legacy fields (map to master sheet for backward compatibility)
    imageRef: input.imageRef || input.masterSheetImageRef || '',
    imagePrompt: input.imagePrompt || input.masterSheetImagePrompt || '',
  });

  return newDocRef.id;
}

/**
 * Update a character
 * Uses setDoc with merge to create the document if it doesn't exist
 */
export async function updateCharacter(
  projectId: string,
  characterId: string,
  updates: UpdateCharacterInput
): Promise<void> {
  const docRef = getCharacterRef(projectId, characterId);
  // Use setDoc with merge to handle both create and update cases
  // This prevents "No document to update" errors when the character
  // was extracted but not yet saved to Firestore
  await setDoc(docRef, updates, { merge: true });
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

// ============================================
// Profile Image Functions
// ============================================

/**
 * Update character profile image
 */
export async function updateCharacterProfileImage(
  projectId: string,
  characterId: string,
  profileImageRef: string,
  profileImagePrompt: string
): Promise<void> {
  await updateCharacter(projectId, characterId, {
    profileImageRef,
    profileImagePrompt,
  });
}

// ============================================
// Master Sheet Image Functions
// ============================================

/**
 * Update character master sheet image
 */
export async function updateCharacterMasterSheetImage(
  projectId: string,
  characterId: string,
  masterSheetImageRef: string,
  masterSheetImagePrompt: string
): Promise<void> {
  await updateCharacter(projectId, characterId, {
    masterSheetImageRef,
    masterSheetImagePrompt,
    // Also update legacy fields for backward compatibility
    imageRef: masterSheetImageRef,
    imagePrompt: masterSheetImagePrompt,
  });
}

// ============================================
// Mode Functions
// ============================================

const getModesCollection = (projectId: string, characterId: string) =>
  collection(db, 'projects', projectId, 'characterSheet', 'settings', 'characters', characterId, 'modes');

const getModeRef = (projectId: string, characterId: string, modeId: string) =>
  doc(db, 'projects', projectId, 'characterSheet', 'settings', 'characters', characterId, 'modes', modeId);

/**
 * Get all modes for a character
 */
export async function getModes(
  projectId: string,
  characterId: string
): Promise<ModeDocument[]> {
  const collectionRef = getModesCollection(projectId, characterId);
  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    characterId,
    ...doc.data(),
  })) as ModeDocument[];
}

/**
 * Save a new mode for a character
 * Returns the auto-generated Firestore document ID
 */
export async function saveMode(
  projectId: string,
  input: SaveModeInput
): Promise<string> {
  const collectionRef = getModesCollection(projectId, input.characterId);
  // Use provided ID or auto-generate one
  const docRef = input.id
    ? doc(collectionRef, input.id)
    : doc(collectionRef);

  await setDoc(docRef, {
    characterId: input.characterId,
    name: input.name,
    description: input.description,
    prompt: input.prompt,
    imageRef: input.imageRef || '',
  });

  return docRef.id;
}

/**
 * Update a mode
 * Uses setDoc with merge to create the document if it doesn't exist
 */
export async function updateMode(
  projectId: string,
  characterId: string,
  modeId: string,
  updates: UpdateModeInput
): Promise<void> {
  const docRef = getModeRef(projectId, characterId, modeId);
  // Use setDoc with merge to handle both create and update cases
  await setDoc(docRef, updates, { merge: true });
}

/**
 * Update mode image
 */
export async function updateModeImage(
  projectId: string,
  characterId: string,
  modeId: string,
  imageRef: string
): Promise<void> {
  await updateMode(projectId, characterId, modeId, { imageRef });
}

/**
 * Delete a mode
 */
export async function deleteMode(
  projectId: string,
  characterId: string,
  modeId: string
): Promise<void> {
  const docRef = getModeRef(projectId, characterId, modeId);
  await deleteDoc(docRef);
}

/**
 * Delete all modes for a character
 */
export async function clearModes(
  projectId: string,
  characterId: string
): Promise<void> {
  const modes = await getModes(projectId, characterId);
  const batch = writeBatch(db);

  for (const mode of modes) {
    const modeRef = getModeRef(projectId, characterId, mode.id);
    batch.delete(modeRef);
  }

  await batch.commit();
}

// ============================================
// Style Slots Functions
// ============================================

/**
 * Save style slots (replaces all slots)
 */
export async function saveStyleSlots(
  projectId: string,
  styleSlots: StyleSlotDocument[],
  activeStyleIndex: number | null
): Promise<void> {
  await saveCharacterSheetSettings(projectId, {
    styleKeyword: '', // Will be merged, not overwritten
    characterBasePrompt: '', // Will be merged, not overwritten
    styleSlots,
    activeStyleIndex,
  });
}

/**
 * Get style slots from settings
 */
export async function getStyleSlots(
  projectId: string
): Promise<{ slots: StyleSlotDocument[]; activeIndex: number | null }> {
  const settings = await getCharacterSheetSettings(projectId);
  return {
    slots: settings?.styleSlots || [],
    activeIndex: settings?.activeStyleIndex ?? null,
  };
}
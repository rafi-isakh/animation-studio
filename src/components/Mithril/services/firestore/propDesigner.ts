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
  PropDesignerDocument,
  PropDocument,
  PropContextDocument,
  DetectedIdDocument,
  SavePropDesignerSettingsInput,
  SavePropInput,
  UpdatePropInput,
} from './types';
import { deletePropImages } from '../s3';

// ============================================
// Document References
// ============================================

const getSettingsRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'propDesigner', 'settings');

const getPropsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'propDesigner', 'settings', 'props');

const getPropRef = (projectId: string, propId: string) =>
  doc(db, 'projects', projectId, 'propDesigner', 'settings', 'props', propId);

const getDetectedIdsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'propDesigner', 'settings', 'detectedIds');

const getDetectedIdRef = (projectId: string, detectedIdId: string) =>
  doc(db, 'projects', projectId, 'propDesigner', 'settings', 'detectedIds', detectedIdId);

// ============================================
// Settings Functions
// ============================================

/**
 * Get prop designer settings
 */
export async function getPropDesignerSettings(
  projectId: string
): Promise<PropDesignerDocument | null> {
  const docRef = getSettingsRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as PropDesignerDocument;
}

/**
 * Save prop designer settings
 */
export async function savePropDesignerSettings(
  projectId: string,
  input: SavePropDesignerSettingsInput
): Promise<void> {
  const docRef = getSettingsRef(projectId);

  const data: Record<string, unknown> = {
    styleKeyword: input.styleKeyword,
    propBasePrompt: input.propBasePrompt,
    generatedAt: Timestamp.now(),
  };

  if (input.genre !== undefined) {
    data.genre = input.genre;
  }

  await setDoc(docRef, data, { merge: true });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

// ============================================
// Prop Functions
// ============================================

/**
 * Get all props
 */
export async function getProps(projectId: string): Promise<PropDocument[]> {
  const collectionRef = getPropsCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as PropDocument[];
}

/**
 * Get a single prop by ID
 */
export async function getProp(
  projectId: string,
  propId: string
): Promise<PropDocument | null> {
  const docRef = getPropRef(projectId, propId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as PropDocument;
}

/**
 * Save a new prop
 * If input.id is provided, uses that as the document ID
 * Otherwise, auto-generates a Firestore document ID
 * Returns the document ID used
 */
export async function saveProp(
  projectId: string,
  input: SavePropInput
): Promise<string> {
  const collectionRef = getPropsCollection(projectId);
  // Use provided ID or auto-generate
  const docRef = input.id
    ? doc(collectionRef, input.id)
    : doc(collectionRef);

  // Build the document data with all fields
  const data: Record<string, unknown> = {
    name: input.name,
    category: input.category,
    description: input.description,
    descriptionKo: input.descriptionKo,
    csvDescription: input.csvDescription,
    appearingClips: input.appearingClips,
    contextPrompts: input.contextPrompts || [],
    designSheetPrompt: input.designSheetPrompt || '',
    designSheetImageRef: input.designSheetImageRef || '',
    referenceImageRef: input.referenceImageRef || '',
  };

  // Add multiple reference images if provided
  if (input.referenceImageRefs) {
    data.referenceImageRefs = input.referenceImageRefs;
  }

  // Add character metadata (Easy Mode fields)
  if (input.age !== undefined) data.age = input.age;
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.hairColor !== undefined) data.hairColor = input.hairColor;
  if (input.hairStyle !== undefined) data.hairStyle = input.hairStyle;
  if (input.eyeColor !== undefined) data.eyeColor = input.eyeColor;
  if (input.personality !== undefined) data.personality = input.personality;
  if (input.role !== undefined) data.role = input.role;

  // Add variant detection fields
  if (input.isVariant !== undefined) data.isVariant = input.isVariant;
  if (input.variantDetails !== undefined) data.variantDetails = input.variantDetails;
  if (input.variantVisuals !== undefined) data.variantVisuals = input.variantVisuals;

  await setDoc(docRef, data);

  return docRef.id;
}

/**
 * Update a prop
 * Uses setDoc with merge to create the document if it doesn't exist
 */
export async function updateProp(
  projectId: string,
  propId: string,
  updates: UpdatePropInput
): Promise<void> {
  const docRef = getPropRef(projectId, propId);
  await setDoc(docRef, updates, { merge: true });
}

/**
 * Update prop design sheet image
 */
export async function updatePropDesignSheetImage(
  projectId: string,
  propId: string,
  designSheetImageRef: string,
  designSheetPrompt: string
): Promise<void> {
  await updateProp(projectId, propId, { designSheetImageRef, designSheetPrompt });
}

/**
 * Update prop reference image
 */
export async function updatePropReferenceImage(
  projectId: string,
  propId: string,
  referenceImageRef: string
): Promise<void> {
  await updateProp(projectId, propId, { referenceImageRef });
}

/**
 * Delete a prop
 */
export async function deleteProp(
  projectId: string,
  propId: string
): Promise<void> {
  const docRef = getPropRef(projectId, propId);
  await deleteDoc(docRef);
}

// ============================================
// Detected IDs Functions
// ============================================

/**
 * Get all detected IDs
 */
export async function getDetectedIds(projectId: string): Promise<DetectedIdDocument[]> {
  const collectionRef = getDetectedIdsCollection(projectId);
  const snapshot = await getDocs(collectionRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as DetectedIdDocument[];
}

/**
 * Save detected IDs (replaces all)
 */
export async function saveDetectedIds(
  projectId: string,
  detectedIds: DetectedIdDocument[]
): Promise<void> {
  const batch = writeBatch(db);

  // Delete existing detected IDs
  const existing = await getDetectedIds(projectId);
  for (const existingId of existing) {
    const docRef = getDetectedIdRef(projectId, existingId.id);
    batch.delete(docRef);
  }

  // Add new detected IDs
  for (const detectedId of detectedIds) {
    const docRef = getDetectedIdRef(projectId, detectedId.id);
    batch.set(docRef, {
      category: detectedId.category,
      clipIds: detectedId.clipIds,
      contexts: detectedId.contexts,
      occurrences: detectedId.occurrences,
    });
  }

  await batch.commit();
}

/**
 * Update a single detected ID's category
 */
export async function updateDetectedIdCategory(
  projectId: string,
  detectedIdId: string,
  category: 'character' | 'object'
): Promise<void> {
  const docRef = getDetectedIdRef(projectId, detectedIdId);
  await setDoc(docRef, { category }, { merge: true });
}

// ============================================
// Clear Functions
// ============================================

/**
 * Clear all prop designer data (settings + all props + detected IDs)
 * Also deletes all prop images from S3
 */
export async function clearPropDesigner(projectId: string): Promise<void> {
  // Step 1: Delete all prop images from S3 first
  try {
    const props = await getProps(projectId);
    console.log(`[clearPropDesigner] Deleting ${props.length} props from S3`);
    
    for (const prop of props) {
      try {
        await deletePropImages(projectId, prop.id);
        console.log(`[clearPropDesigner] Deleted S3 images for prop: ${prop.id}`);
      } catch (error) {
        console.warn(`[clearPropDesigner] Failed to delete S3 images for prop ${prop.id}:`, error);
      }
    }
  } catch (error) {
    console.warn("[clearPropDesigner] Error deleting prop images from S3:", error);
  }

  // Step 2: Delete Firestore documents
  const batch = writeBatch(db);
  let hasDeletes = false;

  // Delete all props - wrap in try-catch to handle BloomFilter errors on empty collections
  try {
    const props = await getProps(projectId);
    for (const prop of props) {
      const propRef = getPropRef(projectId, prop.id);
      batch.delete(propRef);
      hasDeletes = true;
    }
  } catch (error) {
    // BloomFilter errors can occur on empty/new collections - safe to ignore
    console.warn("[clearPropDesigner] Error fetching props for deletion (may be empty):", error);
  }

  // Delete all detected IDs - wrap in try-catch to handle BloomFilter errors
  try {
    const detectedIds = await getDetectedIds(projectId);
    for (const detectedId of detectedIds) {
      const detectedIdRef = getDetectedIdRef(projectId, detectedId.id);
      batch.delete(detectedIdRef);
      hasDeletes = true;
    }
  } catch (error) {
    // BloomFilter errors can occur on empty/new collections - safe to ignore
    console.warn("[clearPropDesigner] Error fetching detected IDs for deletion (may be empty):", error);
  }

  // Delete settings - always try to delete
  const settingsRef = getSettingsRef(projectId);
  batch.delete(settingsRef);
  hasDeletes = true;

  // Only commit if there are deletes to perform
  if (hasDeletes) {
    try {
      await batch.commit();
    } catch (error) {
      // If batch commit fails (e.g., no documents exist), log and continue
      console.warn("Batch commit warning:", error);
    }
  }
}

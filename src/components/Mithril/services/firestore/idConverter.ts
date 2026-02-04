import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  IdConverterDocument,
  IdConverterEntity,
  IdConverterChunk,
  SaveIdConverterInput,
  UpdateIdConverterInput,
} from './types';

const getIdConverterRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'idConverter', 'data');

/**
 * Get IdConverter document
 */
export async function getIdConverter(projectId: string): Promise<IdConverterDocument | null> {
  const docRef = getIdConverterRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.log("[Firestore:idConverter] getIdConverter - document not found for project:", projectId);
    return null;
  }

  const data = docSnap.data() as IdConverterDocument;
  console.log("[Firestore:idConverter] getIdConverter - loaded document, glossaryJobId:", data.glossaryJobId, "currentStep:", data.currentStep);
  return data;
}

/**
 * Save IdConverter document (creates or overwrites)
 */
export async function saveIdConverter(
  projectId: string,
  input: SaveIdConverterInput
): Promise<void> {
  const docRef = getIdConverterRef(projectId);

  const data: Record<string, unknown> = {
    fileName: input.fileName,
    originalFullText: input.originalFullText,
    fileUri: input.fileUri || null,
    glossary: input.glossary || [],
    chunks: input.chunks || [],
    currentStep: input.currentStep || 'upload',
    generatedAt: Timestamp.now(),
  };
  if (input.glossaryJobId !== undefined) data.glossaryJobId = input.glossaryJobId;
  if (input.batchJobId !== undefined) data.batchJobId = input.batchJobId;

  await setDoc(docRef, data);

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Update IdConverter document (partial update)
 */
export async function updateIdConverter(
  projectId: string,
  input: UpdateIdConverterInput
): Promise<void> {
  const docRef = getIdConverterRef(projectId);

  // Build update object with only defined fields
  const updateData: Record<string, unknown> = {};
  if (input.fileName !== undefined) updateData.fileName = input.fileName;
  if (input.originalFullText !== undefined) updateData.originalFullText = input.originalFullText;
  if (input.fileUri !== undefined) updateData.fileUri = input.fileUri;
  if (input.glossary !== undefined) updateData.glossary = input.glossary;
  if (input.chunks !== undefined) updateData.chunks = input.chunks;
  if (input.currentStep !== undefined) updateData.currentStep = input.currentStep;
  if (input.glossaryJobId !== undefined) updateData.glossaryJobId = input.glossaryJobId;
  if (input.batchJobId !== undefined) updateData.batchJobId = input.batchJobId;
  updateData.generatedAt = Timestamp.now();

  console.log("[Firestore:idConverter] updateIdConverter - fields to write:", Object.keys(updateData));

  await setDoc(docRef, updateData, { merge: true });
  console.log("[Firestore:idConverter] updateIdConverter - write complete");

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Update glossary only
 */
export async function updateIdConverterGlossary(
  projectId: string,
  glossary: IdConverterEntity[]
): Promise<void> {
  await updateIdConverter(projectId, { glossary });
}

/**
 * Update chunks only
 */
export async function updateIdConverterChunks(
  projectId: string,
  chunks: IdConverterChunk[]
): Promise<void> {
  await updateIdConverter(projectId, { chunks });
}

/**
 * Update current step
 */
export async function updateIdConverterStep(
  projectId: string,
  currentStep: IdConverterDocument['currentStep']
): Promise<void> {
  await updateIdConverter(projectId, { currentStep });
}

/**
 * Delete IdConverter document
 */
export async function deleteIdConverter(projectId: string): Promise<void> {
  const docRef = getIdConverterRef(projectId);
  await deleteDoc(docRef);
}

import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { StorySplitsDocument, SaveStorySplitsInput } from './types';

const getStorySplitsRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'storySplits', 'data');

/**
 * Get story splits document
 */
export async function getStorySplits(
  projectId: string
): Promise<StorySplitsDocument | null> {
  const docRef = getStorySplitsRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as StorySplitsDocument;
}

/**
 * Save story splits document
 */
export async function saveStorySplits(
  projectId: string,
  input: SaveStorySplitsInput
): Promise<void> {
  const docRef = getStorySplitsRef(projectId);

  const data: Record<string, unknown> = {
    guidelines: input.guidelines,
    parts: input.parts,
    generatedAt: Timestamp.now(),
  };

  if (input.jobId !== undefined) {
    data.jobId = input.jobId;
  }

  await setDoc(docRef, data, { merge: true });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Update just the jobId in story splits document
 */
export async function updateStorySplitsJobId(
  projectId: string,
  jobId: string | null
): Promise<void> {
  const docRef = getStorySplitsRef(projectId);
  await setDoc(docRef, { jobId }, { merge: true });
}

/**
 * Delete story splits document
 */
export async function deleteStorySplits(projectId: string): Promise<void> {
  const docRef = getStorySplitsRef(projectId);
  await deleteDoc(docRef);
}
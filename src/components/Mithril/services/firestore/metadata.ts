import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { ProjectMetadata, UpdateProjectInput } from './types';

/**
 * Get project metadata
 */
export async function getMetadata(projectId: string): Promise<ProjectMetadata | null> {
  const docRef = doc(db, 'projects', projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as ProjectMetadata;
}

/**
 * Update project metadata
 */
export async function updateMetadata(
  projectId: string,
  updates: UpdateProjectInput
): Promise<void> {
  const docRef = doc(db, 'projects', projectId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update current stage
 */
export async function updateCurrentStage(
  projectId: string,
  stage: number
): Promise<void> {
  await updateMetadata(projectId, { currentStage: stage });
}


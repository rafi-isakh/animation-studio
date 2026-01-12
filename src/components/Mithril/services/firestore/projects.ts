import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  ProjectMetadata,
  CreateProjectInput,
  UpdateProjectInput,
} from './types';

const PROJECTS_COLLECTION = 'projects';

/**
 * Create a new project
 */
export async function createProject(
  input: CreateProjectInput
): Promise<string> {
  const now = Timestamp.now();

  const projectData = {
    name: input.name,
    createdAt: now,
    updatedAt: now,
    currentStage: 1,
  };

  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
  return docRef.id;
}

/**
 * Get a single project by ID
 */
export async function getProject(
  projectId: string
): Promise<ProjectMetadata | null> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
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
 * List all projects (ordered by updatedAt desc)
 */
export async function listProjects(): Promise<ProjectMetadata[]> {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    orderBy('updatedAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ProjectMetadata[];
}

/**
 * Update a project's metadata
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectInput
): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update the current stage of a project
 */
export async function updateCurrentStage(
  projectId: string,
  stage: number
): Promise<void> {
  await updateProject(projectId, { currentStage: stage });
}

/**
 * Delete a project and all its subcollections
 * Note: Firestore doesn't automatically delete subcollections,
 * so we need to delete them manually or use a Cloud Function
 */
export async function deleteProject(projectId: string): Promise<void> {
  // For now, just delete the project document
  // TODO: Add cascade delete for subcollections (chapter, storySplits, etc.)
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(docRef);
}
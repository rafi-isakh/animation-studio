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
 * Helper to delete all documents in a collection
 */
async function deleteCollection(
  collectionRef: ReturnType<typeof collection>
): Promise<number> {
  const snapshot = await getDocs(collectionRef);
  const deletePromises = snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref));
  await Promise.all(deletePromises);
  return snapshot.docs.length;
}

/**
 * Delete a project and all its data
 * Firestore doesn't automatically delete subcollections,
 * so we delete them manually in the correct order (deepest first)
 *
 * Structure:
 * projects/{projectId}/
 * ├── chapter/data
 * ├── storySplits/data
 * ├── characterSheet/settings
 * ├── characterSheet/settings/characters/{charId}
 * ├── bgSheet/settings
 * ├── bgSheet/settings/backgrounds/{bgId}
 * ├── storyboard/data
 * ├── storyboard/voicePrompts
 * ├── storyboard/data/scenes/scene_{idx}
 * ├── storyboard/video
 * └── storyboard/video/clips/{clipId}
 */
export async function deleteProject(projectId: string): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);

  // 1. Delete deepest nested collections first
  // Characters subcollection: characterSheet/settings/characters/*
  await deleteCollection(
    collection(db, PROJECTS_COLLECTION, projectId, 'characterSheet', 'settings', 'characters')
  ).catch(() => {});

  // Backgrounds subcollection: bgSheet/settings/backgrounds/*
  await deleteCollection(
    collection(db, PROJECTS_COLLECTION, projectId, 'bgSheet', 'settings', 'backgrounds')
  ).catch(() => {});

  // Storyboard scenes: storyboard/data/scenes/*
  await deleteCollection(
    collection(db, PROJECTS_COLLECTION, projectId, 'storyboard', 'data', 'scenes')
  ).catch(() => {});

  // Video clips: storyboard/video/clips/*
  await deleteCollection(
    collection(db, PROJECTS_COLLECTION, projectId, 'storyboard', 'video', 'clips')
  ).catch(() => {});

  // 2. Delete stage documents (with correct paths)
  const stageDocRefs = [
    doc(db, PROJECTS_COLLECTION, projectId, 'chapter', 'data'),
    doc(db, PROJECTS_COLLECTION, projectId, 'storySplits', 'data'),
    doc(db, PROJECTS_COLLECTION, projectId, 'characterSheet', 'settings'),
    doc(db, PROJECTS_COLLECTION, projectId, 'bgSheet', 'settings'),
    doc(db, PROJECTS_COLLECTION, projectId, 'storyboard', 'data'),
    doc(db, PROJECTS_COLLECTION, projectId, 'storyboard', 'voicePrompts'),
    doc(db, PROJECTS_COLLECTION, projectId, 'storyboard', 'video'),
  ];

  await Promise.all(
    stageDocRefs.map((docRef) =>
      deleteDoc(docRef).catch(() => {}) // Ignore errors if document doesn't exist
    )
  );

  // 3. Finally, delete the project document itself
  await deleteDoc(projectRef);
}
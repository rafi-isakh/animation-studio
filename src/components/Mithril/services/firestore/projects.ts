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
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  ProjectMetadata,
  CreateProjectInput,
  UpdateProjectInput,
  MithrilUserRole,
} from './types';

// User context for access control
export interface UserContext {
  id: string;
  role: MithrilUserRole;
}

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
    projectType: input.projectType,
    ownerId: input.ownerId,
    createdAt: now,
    updatedAt: now,
    currentStage: 1,
  };

  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
  return docRef.id;
}

/**
 * Check if user has access to a project
 * Admin can access all projects, users can only access their own
 */
function hasProjectAccess(project: ProjectMetadata, user: UserContext): boolean {
  if (user.role === 'admin') return true;
  return project.ownerId === user.id;
}

/**
 * Get a single project by ID
 * @param projectId - The project ID
 * @param user - Optional user context for access control. If provided, checks access.
 */
export async function getProject(
  projectId: string,
  user?: UserContext
): Promise<ProjectMetadata | null> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();
  const project = {
    id: docSnap.id,
    ...data,
    // Default to 'text-to-video' for existing projects without projectType
    projectType: data.projectType || 'text-to-video',
    // Default ownerId for legacy projects (assign to empty string, only admins can access)
    ownerId: data.ownerId || '',
  } as ProjectMetadata;

  // Check access if user context provided
  if (user && !hasProjectAccess(project, user)) {
    return null; // Return null if user doesn't have access
  }

  return project;
}

/**
 * List projects based on user role
 * Admin: sees all projects
 * User: sees only projects they own
 * @param user - User context for filtering
 */
export async function listProjects(user: UserContext): Promise<ProjectMetadata[]> {
  let q;

  if (user.role === 'admin') {
    // Admin sees all projects
    q = query(
      collection(db, PROJECTS_COLLECTION),
      orderBy('updatedAt', 'desc')
    );
  } else {
    // Regular user sees only their own projects
    q = query(
      collection(db, PROJECTS_COLLECTION),
      where('ownerId', '==', user.id),
      orderBy('updatedAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      // Default to 'text-to-video' for existing projects without projectType
      projectType: data.projectType || 'text-to-video',
      // Default ownerId for legacy projects
      ownerId: data.ownerId || '',
    };
  }) as ProjectMetadata[];
}

/**
 * Update a project's metadata
 * @param projectId - The project ID
 * @param updates - The fields to update
 * @param user - Optional user context for access control
 * @throws Error if user doesn't have access
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectInput,
  user?: UserContext
): Promise<void> {
  // Check access if user context provided
  if (user) {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    if (!hasProjectAccess(project, user)) {
      throw new Error('Access denied');
    }
  }

  const docRef = doc(db, PROJECTS_COLLECTION, projectId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update the current stage of a project
 * @param projectId - The project ID
 * @param stage - The new stage number
 * @param user - Optional user context for access control
 */
export async function updateCurrentStage(
  projectId: string,
  stage: number,
  user?: UserContext
): Promise<void> {
  await updateProject(projectId, { currentStage: stage }, user);
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
 *
 * @param projectId - The project ID
 * @param user - Optional user context for access control
 * @throws Error if user doesn't have access
 */
export async function deleteProject(projectId: string, user?: UserContext): Promise<void> {
  // Check access if user context provided
  if (user) {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    if (!hasProjectAccess(project, user)) {
      throw new Error('Access denied');
    }
  }
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
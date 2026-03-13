import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import { getProjectPrefix } from '../s3/types';
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

function shouldResetCopyField(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase();
  if (normalized.endsWith('jobid')) return true;
  if (normalized === 'sessionid') return true;
  if (normalized === 'originalpageid') return true;
  return false;
}

function transformCopiedValue(value: unknown, sourcePrefix: string, destinationPrefix: string): unknown {
  if (typeof value === 'string') {
    return value.includes(sourcePrefix)
      ? value.replaceAll(sourcePrefix, destinationPrefix)
      : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => transformCopiedValue(item, sourcePrefix, destinationPrefix));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const sourceObject = value as Record<string, unknown>;
  const transformed: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(sourceObject)) {
    if (shouldResetCopyField(key)) {
      continue;
    }

    transformed[key] = transformCopiedValue(nestedValue, sourcePrefix, destinationPrefix);
  }

  return transformed;
}

async function copyDocumentIfExists(
  sourcePath: string[],
  destinationPath: string[],
  sourcePrefix: string,
  destinationPrefix: string
): Promise<void> {
  const sourceRef = doc(db, ...sourcePath);
  const sourceSnapshot = await getDoc(sourceRef);

  if (!sourceSnapshot.exists()) {
    return;
  }

  const destinationRef = doc(db, ...destinationPath);
  const sourceData = sourceSnapshot.data();
  const transformedData = transformCopiedValue(sourceData, sourcePrefix, destinationPrefix) as Record<string, unknown>;

  await setDoc(destinationRef, transformedData);
}

async function copyCollectionWithNested(
  sourcePath: string[],
  destinationPath: string[],
  sourcePrefix: string,
  destinationPrefix: string,
  copyNested?: (sourceDocPath: string[], destinationDocPath: string[]) => Promise<void>
): Promise<void> {
  const sourceCollectionRef = collection(db, ...sourcePath);
  const sourceSnapshot = await getDocs(sourceCollectionRef);

  for (const sourceDoc of sourceSnapshot.docs) {
    const destinationDocPath = [...destinationPath, sourceDoc.id];
    const destinationRef = doc(db, ...destinationDocPath);
    const transformedData = transformCopiedValue(
      sourceDoc.data(),
      sourcePrefix,
      destinationPrefix
    ) as Record<string, unknown>;

    await setDoc(destinationRef, transformedData);

    if (copyNested) {
      await copyNested([...sourcePath, sourceDoc.id], destinationDocPath);
    }
  }
}

/**
 * Duplicate a project and all Firestore input/generated data.
 * S3 media copy is handled separately by the S3 service.
 */
export async function copyProject(
  sourceProjectId: string,
  newName: string,
  user?: UserContext
): Promise<ProjectMetadata> {
  const sourceProject = await getProject(sourceProjectId, user);

  if (!sourceProject) {
    throw new Error('Project not found');
  }

  const trimmedName = newName.trim();
  if (!trimmedName) {
    throw new Error('Project name is required');
  }

  const now = Timestamp.now();
  const destinationProjectData = {
    name: trimmedName,
    projectType: sourceProject.projectType,
    ownerId: sourceProject.ownerId,
    createdAt: now,
    updatedAt: now,
    currentStage: sourceProject.currentStage || 1,
  };

  const destinationProjectRef = await addDoc(collection(db, PROJECTS_COLLECTION), destinationProjectData);
  const destinationProjectId = destinationProjectRef.id;
  const sourcePrefix = getProjectPrefix(sourceProjectId);
  const destinationPrefix = getProjectPrefix(destinationProjectId);

  try {
    // Single-doc stage roots
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'chapter', 'data'],
      ['projects', destinationProjectId, 'chapter', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'idConverter', 'data'],
      ['projects', destinationProjectId, 'idConverter', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'storySplits', 'data'],
      ['projects', destinationProjectId, 'storySplits', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'characterSheet', 'settings'],
      ['projects', destinationProjectId, 'characterSheet', 'settings'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'propDesigner', 'settings'],
      ['projects', destinationProjectId, 'propDesigner', 'settings'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'bgSheet', 'settings'],
      ['projects', destinationProjectId, 'bgSheet', 'settings'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'storyboard', 'data'],
      ['projects', destinationProjectId, 'storyboard', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'storyboard', 'voicePrompts'],
      ['projects', destinationProjectId, 'storyboard', 'voicePrompts'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'storyboard', 'video'],
      ['projects', destinationProjectId, 'storyboard', 'video'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'imageGen', 'settings'],
      ['projects', destinationProjectId, 'imageGen', 'settings'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'imageSplitter', 'data'],
      ['projects', destinationProjectId, 'imageSplitter', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'panelEditor', 'data'],
      ['projects', destinationProjectId, 'panelEditor', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'i2vScript', 'data'],
      ['projects', destinationProjectId, 'i2vScript', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'i2vScript', 'voicePrompts'],
      ['projects', destinationProjectId, 'i2vScript', 'voicePrompts'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'i2vStoryboard', 'data'],
      ['projects', destinationProjectId, 'i2vStoryboard', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'i2vStoryboard', 'voicePrompts'],
      ['projects', destinationProjectId, 'i2vStoryboard', 'voicePrompts'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'i2vVideo', 'data'],
      ['projects', destinationProjectId, 'i2vVideo', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'csvVideo', 'data'],
      ['projects', destinationProjectId, 'csvVideo', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'nsfwVideo', 'data'],
      ['projects', destinationProjectId, 'nsfwVideo', 'data'],
      sourcePrefix,
      destinationPrefix
    );
    await copyDocumentIfExists(
      ['projects', sourceProjectId, 'styleConverter', 'data'],
      ['projects', destinationProjectId, 'styleConverter', 'data'],
      sourcePrefix,
      destinationPrefix
    );

    // Collections and nested collections
    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'characterSheet', 'settings', 'characters'],
      ['projects', destinationProjectId, 'characterSheet', 'settings', 'characters'],
      sourcePrefix,
      destinationPrefix,
      async (sourceCharacterPath, destinationCharacterPath) => {
        await copyCollectionWithNested(
          [...sourceCharacterPath, 'modes'],
          [...destinationCharacterPath, 'modes'],
          sourcePrefix,
          destinationPrefix
        );
      }
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'propDesigner', 'settings', 'props'],
      ['projects', destinationProjectId, 'propDesigner', 'settings', 'props'],
      sourcePrefix,
      destinationPrefix
    );
    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'propDesigner', 'settings', 'detectedIds'],
      ['projects', destinationProjectId, 'propDesigner', 'settings', 'detectedIds'],
      sourcePrefix,
      destinationPrefix
    );
    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'bgSheet', 'settings', 'backgrounds'],
      ['projects', destinationProjectId, 'bgSheet', 'settings', 'backgrounds'],
      sourcePrefix,
      destinationPrefix
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'storyboard', 'data', 'scenes'],
      ['projects', destinationProjectId, 'storyboard', 'data', 'scenes'],
      sourcePrefix,
      destinationPrefix,
      async (sourceScenePath, destinationScenePath) => {
        await copyCollectionWithNested(
          [...sourceScenePath, 'clips'],
          [...destinationScenePath, 'clips'],
          sourcePrefix,
          destinationPrefix
        );
      }
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'storyboard', 'video', 'clips'],
      ['projects', destinationProjectId, 'storyboard', 'video', 'clips'],
      sourcePrefix,
      destinationPrefix
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'imageGen', 'settings', 'frames'],
      ['projects', destinationProjectId, 'imageGen', 'settings', 'frames'],
      sourcePrefix,
      destinationPrefix
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'imageSplitter', 'data', 'pages'],
      ['projects', destinationProjectId, 'imageSplitter', 'data', 'pages'],
      sourcePrefix,
      destinationPrefix,
      async (sourcePagePath, destinationPagePath) => {
        await copyCollectionWithNested(
          [...sourcePagePath, 'panels'],
          [...destinationPagePath, 'panels'],
          sourcePrefix,
          destinationPrefix
        );
      }
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'panelEditor', 'data', 'panels'],
      ['projects', destinationProjectId, 'panelEditor', 'data', 'panels'],
      sourcePrefix,
      destinationPrefix
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'i2vScript', 'data', 'scenes'],
      ['projects', destinationProjectId, 'i2vScript', 'data', 'scenes'],
      sourcePrefix,
      destinationPrefix,
      async (sourceScenePath, destinationScenePath) => {
        await copyCollectionWithNested(
          [...sourceScenePath, 'clips'],
          [...destinationScenePath, 'clips'],
          sourcePrefix,
          destinationPrefix
        );
      }
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'i2vStoryboard', 'data', 'assets'],
      ['projects', destinationProjectId, 'i2vStoryboard', 'data', 'assets'],
      sourcePrefix,
      destinationPrefix
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'i2vStoryboard', 'data', 'scenes'],
      ['projects', destinationProjectId, 'i2vStoryboard', 'data', 'scenes'],
      sourcePrefix,
      destinationPrefix,
      async (sourceScenePath, destinationScenePath) => {
        await copyCollectionWithNested(
          [...sourceScenePath, 'clips'],
          [...destinationScenePath, 'clips'],
          sourcePrefix,
          destinationPrefix
        );
      }
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'i2vVideo', 'data', 'clips'],
      ['projects', destinationProjectId, 'i2vVideo', 'data', 'clips'],
      sourcePrefix,
      destinationPrefix
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'csvVideo', 'data', 'clips'],
      ['projects', destinationProjectId, 'csvVideo', 'data', 'clips'],
      sourcePrefix,
      destinationPrefix
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'nsfwVideo', 'data', 'clips'],
      ['projects', destinationProjectId, 'nsfwVideo', 'data', 'clips'],
      sourcePrefix,
      destinationPrefix
    );

    await copyCollectionWithNested(
      ['projects', sourceProjectId, 'styleConverter', 'data', 'panels'],
      ['projects', destinationProjectId, 'styleConverter', 'data', 'panels'],
      sourcePrefix,
      destinationPrefix
    );

    await updateDoc(doc(db, PROJECTS_COLLECTION, destinationProjectId), {
      updatedAt: Timestamp.now(),
    });

    const copiedProject = await getProject(destinationProjectId, user);
    if (!copiedProject) {
      throw new Error('Failed to fetch copied project');
    }

    return copiedProject;
  } catch (error) {
    await deleteProject(destinationProjectId).catch(() => {});
    throw error;
  }
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
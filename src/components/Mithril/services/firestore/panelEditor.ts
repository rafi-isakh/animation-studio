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

// Firestore document types

export interface PanelEditorDocument {
  sessionId: string;
  targetAspectRatio: string;
  provider: string;
  totalPanels: number;
  updatedAt: Timestamp;
}

export interface PanelEditorPanelDocument {
  id: string;
  panelIndex: number;
  fileName: string;
  originalImageRef: string; // S3 URL for original uploaded image
  resultImageRef?: string;  // S3 URL for generated result
  status: string;           // ProcessingStatus value
  error?: string;
}

// Firestore refs

const getPanelEditorRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'panelEditor', 'data');

const getPanelsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'panelEditor', 'data', 'panels');

const getPanelRef = (projectId: string, panelId: string) =>
  doc(db, 'projects', projectId, 'panelEditor', 'data', 'panels', panelId);

/**
 * Get panel editor metadata (sessionId, config)
 */
export async function getPanelEditorMeta(
  projectId: string
): Promise<PanelEditorDocument | null> {
  const docRef = getPanelEditorRef(projectId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as PanelEditorDocument;
}

/**
 * Save panel editor metadata
 */
export async function savePanelEditorMeta(
  projectId: string,
  data: {
    sessionId: string;
    targetAspectRatio: string;
    provider: string;
    totalPanels: number;
  }
): Promise<void> {
  const docRef = getPanelEditorRef(projectId);
  await setDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Get all saved panels
 */
export async function getPanelEditorPanels(
  projectId: string
): Promise<PanelEditorPanelDocument[]> {
  const collectionRef = getPanelsCollection(projectId);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs
    .map((d) => ({ ...d.data(), id: d.id }) as PanelEditorPanelDocument)
    .sort((a, b) => (a.fileName ?? '').localeCompare(b.fileName ?? '', undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * Save a single panel result to Firestore
 */
export async function savePanelEditorPanel(
  projectId: string,
  panelId: string,
  data: Omit<PanelEditorPanelDocument, 'id'>
): Promise<void> {
  const docRef = getPanelRef(projectId, panelId);
  await setDoc(docRef, { id: panelId, ...data });
}

/**
 * Update a panel's result (after job completes)
 */
export async function updatePanelEditorPanelResult(
  projectId: string,
  panelId: string,
  resultImageRef: string,
  status: string
): Promise<void> {
  const docRef = getPanelRef(projectId, panelId);
  await setDoc(docRef, { resultImageRef, status }, { merge: true });
}

/**
 * Update a panel's status/error
 */
export async function updatePanelEditorPanelStatus(
  projectId: string,
  panelId: string,
  status: string,
  error?: string
): Promise<void> {
  const docRef = getPanelRef(projectId, panelId);
  await setDoc(docRef, { status, ...(error !== undefined ? { error } : {}) }, { merge: true });
}

/**
 * Delete a single panel
 */
export async function deletePanelEditorPanel(
  projectId: string,
  panelId: string
): Promise<void> {
  const docRef = getPanelRef(projectId, panelId);
  await deleteDoc(docRef);
}

/**
 * Clear all panel editor data for a project
 */
export async function clearPanelEditorData(
  projectId: string
): Promise<void> {
  const batch = writeBatch(db);

  const panels = await getPanelEditorPanels(projectId);
  for (const panel of panels) {
    batch.delete(getPanelRef(projectId, panel.id));
  }

  batch.delete(getPanelEditorRef(projectId));
  await batch.commit();
}

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;
}

export interface StyleConverterDocument {
  sessionId: string;
  targetAspectRatio: string;
  totalPanels: number;
  updatedAt: Timestamp;
}

export interface StyleConverterPanelDocument {
  id: string;
  panelIndex: number;
  fileName: string;
  originalImageRef: string;
  resultImageRef?: string;
  status: string;
  error?: string;
  prompt?: string;
  category?: string;
}

const getStyleConverterRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'styleConverter', 'data');

const getPanelsCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'styleConverter', 'data', 'panels');

const getPanelRef = (projectId: string, panelId: string) =>
  doc(db, 'projects', projectId, 'styleConverter', 'data', 'panels', panelId);

export async function getStyleConverterMeta(
  projectId: string
): Promise<StyleConverterDocument | null> {
  const docRef = getStyleConverterRef(projectId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docSnap.data() as StyleConverterDocument;
}

export async function saveStyleConverterMeta(
  projectId: string,
  data: {
    sessionId: string;
    targetAspectRatio: string;
    totalPanels: number;
  }
): Promise<void> {
  const docRef = getStyleConverterRef(projectId);
  await setDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function getStyleConverterPanels(
  projectId: string
): Promise<StyleConverterPanelDocument[]> {
  const collectionRef = getPanelsCollection(projectId);
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map((panelDoc) => ({
    ...panelDoc.data(),
    id: panelDoc.id,
  })) as StyleConverterPanelDocument[];
}

export async function saveStyleConverterPanel(
  projectId: string,
  panelId: string,
  data: Omit<StyleConverterPanelDocument, 'id'>
): Promise<void> {
  const docRef = getPanelRef(projectId, panelId);
  await setDoc(docRef, stripUndefined({ id: panelId, ...data }));
}

export async function updateStyleConverterPanel(
  projectId: string,
  panelId: string,
  updates: Partial<Omit<StyleConverterPanelDocument, 'id'>>
): Promise<void> {
  const docRef = getPanelRef(projectId, panelId);
  await setDoc(docRef, stripUndefined(updates), { merge: true });
}

export async function deleteStyleConverterPanel(
  projectId: string,
  panelId: string
): Promise<void> {
  const docRef = getPanelRef(projectId, panelId);
  await deleteDoc(docRef);
}

export async function clearStyleConverterData(projectId: string): Promise<void> {
  const batch = writeBatch(db);
  const panels = await getStyleConverterPanels(projectId);

  for (const panel of panels) {
    batch.delete(getPanelRef(projectId, panel.id));
  }

  batch.delete(getStyleConverterRef(projectId));
  await batch.commit();
}
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firestore';
import {
  ImageSplitterDocument,
  MangaPageDocument,
  MangaPanelDocument,
  SaveMangaPageInput,
  SaveMangaPanelInput,
  ReadingDirection,
} from './types';

const getImageSplitterRef = (projectId: string) =>
  doc(db, 'projects', projectId, 'imageSplitter', 'data');

const getPagesCollection = (projectId: string) =>
  collection(db, 'projects', projectId, 'imageSplitter', 'data', 'pages');

const getPageRef = (projectId: string, pageIndex: number) =>
  doc(db, 'projects', projectId, 'imageSplitter', 'data', 'pages', `page_${pageIndex}`);

const getPanelsCollection = (projectId: string, pageIndex: number) =>
  collection(
    db,
    'projects',
    projectId,
    'imageSplitter',
    'data',
    'pages',
    `page_${pageIndex}`,
    'panels'
  );

const getPanelRef = (projectId: string, pageIndex: number, panelIndex: number) =>
  doc(
    db,
    'projects',
    projectId,
    'imageSplitter',
    'data',
    'pages',
    `page_${pageIndex}`,
    'panels',
    `panel_${panelIndex}`
  );

/**
 * Get image splitter metadata
 */
export async function getImageSplitterMeta(
  projectId: string
): Promise<ImageSplitterDocument | null> {
  const docRef = getImageSplitterRef(projectId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as ImageSplitterDocument;
}

/**
 * Save image splitter metadata
 */
export async function saveImageSplitterMeta(
  projectId: string,
  readingDirection: ReadingDirection,
  totalPages: number,
  totalPanels: number
): Promise<void> {
  const docRef = getImageSplitterRef(projectId);

  await setDoc(docRef, {
    readingDirection,
    totalPages,
    totalPanels,
    generatedAt: Timestamp.now(),
  });

  // Update project metadata timestamp
  const projectRef = doc(db, 'projects', projectId);
  await setDoc(projectRef, { updatedAt: Timestamp.now() }, { merge: true });
}

/**
 * Get all manga pages
 */
export async function getMangaPages(projectId: string): Promise<MangaPageDocument[]> {
  const collectionRef = getPagesCollection(projectId);
  const q = query(collectionRef, orderBy('pageIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as MangaPageDocument[];
}

/**
 * Save a manga page
 */
export async function saveMangaPage(
  projectId: string,
  pageIndex: number,
  input: SaveMangaPageInput
): Promise<string> {
  const pageId = `page_${pageIndex}`;
  const docRef = getPageRef(projectId, pageIndex);

  await setDoc(docRef, {
    id: pageId,
    pageIndex,
    fileName: input.fileName,
    imageRef: input.imageRef,
    readingDirection: input.readingDirection,
    status: input.status || 'pending',
    panelCount: 0,
    createdAt: Timestamp.now(),
  });

  return pageId;
}

/**
 * Update manga page panel count
 */
export async function updateMangaPagePanelCount(
  projectId: string,
  pageIndex: number,
  panelCount: number
): Promise<void> {
  const docRef = getPageRef(projectId, pageIndex);
  await setDoc(docRef, { panelCount, status: 'completed' }, { merge: true });
}

/**
 * Get all panels for a page
 */
export async function getMangaPanels(
  projectId: string,
  pageIndex: number
): Promise<MangaPanelDocument[]> {
  const collectionRef = getPanelsCollection(projectId, pageIndex);
  const q = query(collectionRef, orderBy('panelIndex'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as MangaPanelDocument[];
}

/**
 * Save a manga panel
 */
export async function saveMangaPanel(
  projectId: string,
  pageIndex: number,
  panelIndex: number,
  input: SaveMangaPanelInput
): Promise<string> {
  const panelId = `panel_${panelIndex}`;
  const docRef = getPanelRef(projectId, pageIndex, panelIndex);

  await setDoc(docRef, {
    id: panelId,
    panelIndex,
    box_2d: input.box_2d,
    label: input.label,
    imageRef: input.imageRef || '',
  });

  return panelId;
}

/**
 * Update manga panel image
 */
export async function updateMangaPanelImage(
  projectId: string,
  pageIndex: number,
  panelIndex: number,
  imageRef: string
): Promise<void> {
  const docRef = getPanelRef(projectId, pageIndex, panelIndex);
  await setDoc(docRef, { imageRef }, { merge: true });
}

/**
 * Clear all image splitter data (cascade delete pages and panels)
 */
export async function clearImageSplitter(projectId: string): Promise<void> {
  const batch = writeBatch(db);

  // Get all pages
  const pages = await getMangaPages(projectId);

  // Delete all panels for each page, then the page
  for (const page of pages) {
    const panels = await getMangaPanels(projectId, page.pageIndex);
    for (const panel of panels) {
      const panelRef = getPanelRef(projectId, page.pageIndex, panel.panelIndex);
      batch.delete(panelRef);
    }
    const pageRef = getPageRef(projectId, page.pageIndex);
    batch.delete(pageRef);
  }

  // Delete image splitter metadata
  const imageSplitterRef = getImageSplitterRef(projectId);
  batch.delete(imageSplitterRef);

  await batch.commit();
}

/**
 * Delete a single manga page and its panels
 */
export async function deleteMangaPage(
  projectId: string,
  pageIndex: number
): Promise<void> {
  const batch = writeBatch(db);

  // Delete all panels for this page
  const panels = await getMangaPanels(projectId, pageIndex);
  for (const panel of panels) {
    const panelRef = getPanelRef(projectId, pageIndex, panel.panelIndex);
    batch.delete(panelRef);
  }

  // Delete the page
  const pageRef = getPageRef(projectId, pageIndex);
  batch.delete(pageRef);

  await batch.commit();
}

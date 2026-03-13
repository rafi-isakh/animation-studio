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
    // Store original page ID for matching with job queue
    ...(input.originalPageId ? { originalPageId: input.originalPageId } : {}),
    // Store dimensions for proper resize calculations
    ...(input.width ? { width: input.width } : {}),
    ...(input.height ? { height: input.height } : {}),
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
    ...(input.storyboard ? { storyboard: input.storyboard } : {}),
  });

  return panelId;
}

/**
 * Replace all panels for a page with a normalized ordered list.
 */
export async function replaceMangaPanels(
  projectId: string,
  pageIndex: number,
  panels: SaveMangaPanelInput[]
): Promise<void> {
  const batch = writeBatch(db);

  const existingPanels = await getMangaPanels(projectId, pageIndex);
  for (const panel of existingPanels) {
    const panelRef = getPanelRef(projectId, pageIndex, panel.panelIndex);
    batch.delete(panelRef);
  }

  panels.forEach((panel, panelIndex) => {
    const panelRef = getPanelRef(projectId, pageIndex, panelIndex);
    batch.set(panelRef, {
      id: `panel_${panelIndex}`,
      panelIndex,
      box_2d: panel.box_2d,
      label: String(panelIndex + 1),
      imageRef: panel.imageRef || '',
      ...(panel.storyboard ? { storyboard: panel.storyboard } : {}),
    });
  });

  const pageRef = getPageRef(projectId, pageIndex);
  batch.set(
    pageRef,
    {
      panelCount: panels.length,
      status: panels.length > 0 ? 'completed' : 'pending',
    },
    { merge: true }
  );

  await batch.commit();
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
 * Reset analyzed ImageSplitter data while keeping uploaded page entries.
 * Clears all panel documents and resets each page to pending with panelCount = 0.
 */
export async function resetImageSplitterAnalysis(
  projectId: string,
  readingDirection: ReadingDirection
): Promise<void> {
  const batch = writeBatch(db);

  const pages = await getMangaPages(projectId);

  for (const page of pages) {
    const panels = await getMangaPanels(projectId, page.pageIndex);
    for (const panel of panels) {
      const panelRef = getPanelRef(projectId, page.pageIndex, panel.panelIndex);
      batch.delete(panelRef);
    }

    const pageRef = getPageRef(projectId, page.pageIndex);
    batch.set(
      pageRef,
      {
        status: 'pending',
        panelCount: 0,
      },
      { merge: true }
    );
  }

  const imageSplitterRef = getImageSplitterRef(projectId);
  batch.set(
    imageSplitterRef,
    {
      readingDirection,
      totalPages: pages.length,
      totalPanels: 0,
      generatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  await batch.commit();
}

/**
 * Reset analyzed data for one page while keeping the uploaded page entry.
 */
export async function resetMangaPageAnalysis(
  projectId: string,
  pageIndex: number
): Promise<void> {
  const batch = writeBatch(db);
  const panels = await getMangaPanels(projectId, pageIndex);

  for (const panel of panels) {
    const panelRef = getPanelRef(projectId, pageIndex, panel.panelIndex);
    batch.delete(panelRef);
  }

  const pageRef = getPageRef(projectId, pageIndex);
  batch.set(
    pageRef,
    {
      panelCount: 0,
      status: 'pending',
    },
    { merge: true }
  );

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

"use client";

import { useReducer, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import { useMithril } from '../../MithrilContext';
import { imageSplitterReducer, initialState } from './reducer';
import type { ImageSplitterState, MangaPage, MangaPanel, ReadingDirection } from './types';
import {
  getImageSplitterMeta,
  getMangaPages,
  getMangaPanels,
  saveImageSplitterMeta,
  saveMangaPage,
  saveMangaPanel,
  updateMangaPagePanelCount,
  clearImageSplitter,
  deleteMangaPage,
} from '../../services/firestore';
import {
  uploadI2VPageImage,
  uploadI2VPanelImage,
  deleteI2VPageImage,
  deleteI2VPanelImage,
  clearAllI2VImages,
} from '../../services/s3/images';
import { compressImage, compressBase64Image } from '../ImageToScriptWriter/utils/imageCompression';

// Image file extensions we support
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
};

// Helper: Check if filename is an image
function isImageFile(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

// Helper: Get MIME type from filename
function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  return MIME_TYPES[ext || ''] || 'image/jpeg';
}

// Helper: Generate unique ID
function generateId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper: Process array with concurrency limit
async function processWithConcurrency<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = [];
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

// Helper: Convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Helper: Crop panel from image using canvas
function cropPanel(imageUrl: string, box_2d: number[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const [ymin, xmin, ymax, xmax] = box_2d;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      // Convert 0-1000 scale to actual pixel coordinates
      const x = Math.floor((xmin / 1000) * imgWidth);
      const y = Math.floor((ymin / 1000) * imgHeight);
      const width = Math.floor(((xmax - xmin) / 1000) * imgWidth);
      const height = Math.floor(((ymax - ymin) / 1000) * imgHeight);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = imageUrl;
  });
}

export function useImageSplitter() {
  const { setStageResult, currentProjectId } = useMithril();
  const [state, dispatch] = useReducer(imageSplitterReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  // Keep a ref to current state for cleanup and async operations
  const stateRef = useRef<ImageSplitterState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load data from Firestore when project changes
  useEffect(() => {
    if (!currentProjectId || isLoadingRef.current) return;

    const loadFromFirestore = async () => {
      isLoadingRef.current = true;
      try {
        const meta = await getImageSplitterMeta(currentProjectId);
        if (!meta) {
          isLoadingRef.current = false;
          return;
        }

        // Load pages
        const firestorePages = await getMangaPages(currentProjectId);
        const loadedPages: MangaPage[] = [];

        for (const page of firestorePages) {
          // Load panels for this page
          const firestorePanels = await getMangaPanels(currentProjectId, page.pageIndex);
          const panels: MangaPanel[] = firestorePanels.map((p) => ({
            id: p.id,
            box_2d: p.box_2d,
            label: p.label,
            imageUrl: p.imageRef, // S3 URL stored as imageRef
          }));

          loadedPages.push({
            id: page.id,
            pageIndex: page.pageIndex, // Store original index for deletion
            previewUrl: page.imageRef, // S3 URL for preview
            fileName: page.fileName,
            panels,
            status: page.status as 'pending' | 'processing' | 'completed' | 'error',
            readingDirection: page.readingDirection as ReadingDirection,
          });
        }

        if (loadedPages.length > 0) {
          dispatch({ type: 'ADD_PAGES', pages: loadedPages });
          dispatch({ type: 'SET_READING_DIRECTION', direction: meta.readingDirection as ReadingDirection });
          // Also set stage result for downstream stages
          setStageResult(1, { pages: loadedPages.filter((p) => p.status === 'completed') });
        }
      } catch (error) {
        console.error('Error loading ImageSplitter data from Firestore:', error);
      } finally {
        isLoadingRef.current = false;
      }
    };

    loadFromFirestore();
  }, [currentProjectId, setStageResult]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      stateRef.current.pages.forEach((page) => {
        if (page.previewUrl && page.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(page.previewUrl);
        }
      });
    };
  }, []); // Only on unmount

  // Extract images from ZIP file
  const extractImagesFromZip = useCallback(
    async (zipFile: File, readingDirection: ReadingDirection): Promise<MangaPage[]> => {
      const zip = await JSZip.loadAsync(zipFile);
      const extractedPages: MangaPage[] = [];

      const imageFiles = Object.keys(zip.files)
        .filter((filename) => {
          const file = zip.files[filename];
          return (
            !file.dir &&
            !filename.startsWith('__') &&
            !filename.includes('/__') &&
            isImageFile(filename)
          );
        })
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      for (const filename of imageFiles) {
        const zipEntry = zip.files[filename];
        const blob = await zipEntry.async('blob');
        const mimeType = getMimeType(filename);
        const file = new File([blob], filename.split('/').pop() || filename, { type: mimeType });

        extractedPages.push({
          id: generateId(),
          file,
          previewUrl: URL.createObjectURL(blob),
          fileName: file.name,
          panels: [],
          status: 'pending',
          readingDirection,
        });
      }

      return extractedPages;
    },
    []
  );

  // Handle file upload
  const upload = useCallback(
    async (files: FileList | File[]) => {
      const newPages: MangaPage[] = [];
      const fileList = Array.from(files);

      for (const file of fileList) {
        // Handle ZIP files
        if (
          file.type === 'application/zip' ||
          file.type === 'application/x-zip-compressed' ||
          file.name.endsWith('.zip')
        ) {
          try {
            const extractedPages = await extractImagesFromZip(file, state.readingDirection);
            newPages.push(...extractedPages);
          } catch (error) {
            console.error('Failed to extract ZIP file:', error);
          }
          continue;
        }

        // Handle image files
        if (file.type.startsWith('image/')) {
          newPages.push({
            id: generateId(),
            file,
            previewUrl: URL.createObjectURL(file),
            fileName: file.name,
            panels: [],
            status: 'pending',
            readingDirection: state.readingDirection,
          });
        }
      }

      if (newPages.length > 0) {
        dispatch({ type: 'ADD_PAGES', pages: newPages });
      }
    },
    [state.readingDirection, extractImagesFromZip]
  );

  // Process a single page
  const processPage = useCallback(
    async (page: MangaPage, signal: AbortSignal): Promise<MangaPanel[]> => {
      if (!page.file) {
        throw new Error('No file available for processing');
      }

      // Compress image for API call (1500px max width, 80% quality)
      // to stay under Vercel's 4.5MB request body limit.
      // Panel cropping still uses original resolution via page.previewUrl.
      const base64Image = await compressImage(page.file, 1500, 0.8);

      const response = await fetch('/api/manga/split-panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          readingDirection: page.readingDirection,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to detect panels');
      }

      const data = await response.json();
      const detectedPanels: MangaPanel[] = data.panels || [];

      // Crop each panel
      const panelsWithImages = await Promise.all(
        detectedPanels.map(async (panel) => {
          try {
            const croppedImage = await cropPanel(page.previewUrl, panel.box_2d);
            return { ...panel, imageUrl: croppedImage };
          } catch (cropError) {
            console.warn(`Failed to crop panel ${panel.id}:`, cropError);
            return panel;
          }
        })
      );

      return panelsWithImages;
    },
    []
  );

  // Start processing all pending pages
  const process = useCallback(async () => {
    const pendingPages = stateRef.current.pages.filter((p) => p.status === 'pending');
    if (pendingPages.length === 0) return;

    // Create abort controller for this processing session
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    dispatch({ type: 'START_PROCESSING', total: pendingPages.length });
    const startTime = Date.now();

    // Track panel counts as we process
    let totalPanelsProcessed = 0;
    const processedPages: { page: MangaPage; pageIndex: number; panels: MangaPanel[] }[] = [];

    for (let i = 0; i < pendingPages.length; i++) {
      const page = pendingPages[i];
      if (signal.aborted) break;

      dispatch({ type: 'UPDATE_PAGE_STATUS', id: page.id, status: 'processing' });

      try {
        const panels = await processPage(page, signal);
        dispatch({ type: 'SET_PAGE_PANELS', id: page.id, panels });
        totalPanelsProcessed += panels.length;

        // Track for Firestore save
        const pageIndex = stateRef.current.pages.findIndex((p) => p.id === page.id);
        processedPages.push({ page, pageIndex, panels });
      } catch (error) {
        if (signal.aborted) break;
        console.error('Error processing page:', error);
        dispatch({ type: 'UPDATE_PAGE_STATUS', id: page.id, status: 'error' });
      }

      dispatch({ type: 'INCREMENT_PROGRESS' });
    }

    // Calculate stats and finish processing immediately (UI becomes responsive)
    const endTime = Date.now();
    const durationMinutes = ((endTime - startTime) / 60000).toFixed(2);

    dispatch({
      type: 'FINISH_PROCESSING',
      stats: {
        duration: durationMinutes,
        pageCount: pendingPages.length,
        panelCount: totalPanelsProcessed,
      },
    });

    // Save to Firestore and S3 in the background (non-blocking)
    if (currentProjectId && processedPages.length > 0) {
      (async () => {
        try {
          // Save metadata
          const totalPages = stateRef.current.pages.length;
          const totalPanels = stateRef.current.pages.reduce((acc, p) => acc + p.panels.length, 0);
          await saveImageSplitterMeta(
            currentProjectId,
            stateRef.current.readingDirection,
            totalPages,
            totalPanels
          );

          // Save each processed page and its panels (parallelize panel uploads)
          for (const { page, pageIndex, panels } of processedPages) {
            let pageImageRef = '';

            // Upload page image to S3 if we have file data
            if (page.file) {
              try {
                // Compress page image for S3 upload (max 1500px, 80% quality)
                // to stay under Vercel's 4.5MB request body limit
                const pageBase64 = await compressImage(page.file, 1500, 0.8);
                pageImageRef = await uploadI2VPageImage(
                  currentProjectId,
                  pageIndex,
                  pageBase64,
                  'image/jpeg'
                );
              } catch (uploadError) {
                console.error(`Failed to upload page ${pageIndex} to S3:`, uploadError);
              }
            }

            await saveMangaPage(currentProjectId, pageIndex, {
              fileName: page.fileName,
              imageRef: pageImageRef,
              readingDirection: page.readingDirection,
              status: 'completed',
            });

            // Store pageIndex in local state for proper deletion later
            dispatch({ type: 'SET_PAGE_INDEX', id: page.id, pageIndex });

            // Upload panels to S3 with concurrency limit (3 at a time)
            await processWithConcurrency(
              panels,
              async (panel, panelIndex) => {
                let panelImageRef = '';

                if (panel.imageUrl) {
                  try {
                    let panelBase64 = panel.imageUrl.includes(',')
                      ? panel.imageUrl.split(',')[1]
                      : panel.imageUrl;

                    // Compress if too large for Vercel's 4.5MB limit
                    if (panelBase64.length > 3 * 1024 * 1024) {
                      panelBase64 = await compressBase64Image(panelBase64, 1200, 0.75);
                    }

                    panelImageRef = await uploadI2VPanelImage(
                      currentProjectId,
                      pageIndex,
                      panelIndex,
                      panelBase64,
                      'image/jpeg'
                    );
                  } catch (uploadError) {
                    console.error(`Failed to upload panel ${pageIndex}-${panelIndex} to S3:`, uploadError);
                  }
                }

                await saveMangaPanel(currentProjectId, pageIndex, panelIndex, {
                  box_2d: panel.box_2d,
                  label: panel.label || `Panel ${panelIndex + 1}`,
                  imageRef: panelImageRef,
                });
              },
              3 // Concurrency limit: 3 panels uploading at once
            );

            // Update panel count
            await updateMangaPagePanelCount(currentProjectId, pageIndex, panels.length);
          }
        } catch (error) {
          console.error('Error saving to Firestore/S3:', error);
        }
      })();
    }

    abortControllerRef.current = null;
  }, [processPage, currentProjectId]);

  // Cancel ongoing processing
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Remove a page
  const remove = useCallback(async (id: string) => {
    // Find page by ID
    const page = stateRef.current.pages.find((p) => p.id === id);
    if (!page) return;

    // Use stored pageIndex (from Firestore) or fall back to array position for new uploads
    const pageIndex = page.pageIndex ?? stateRef.current.pages.findIndex((p) => p.id === id);

    // Revoke preview URL if it's a blob
    if (page.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(page.previewUrl);
    }

    dispatch({ type: 'REMOVE_PAGE', id });

    // Delete from Firestore and S3 (only if page was saved to Firestore)
    if (currentProjectId && page.pageIndex !== undefined) {
      try {
        // Delete panel images from S3
        if (page.panels?.length > 0) {
          await Promise.all(
            page.panels.map((_, panelIndex) =>
              deleteI2VPanelImage(currentProjectId, pageIndex, panelIndex).catch((err) =>
                console.error(`Error deleting panel ${panelIndex} from S3:`, err)
              )
            )
          );
        }

        // Delete page image from S3
        await deleteI2VPageImage(currentProjectId, pageIndex).catch((err) =>
          console.error('Error deleting page image from S3:', err)
        );

        // Delete from Firestore
        await deleteMangaPage(currentProjectId, pageIndex);
      } catch (error) {
        console.error('Error deleting page from Firestore:', error);
      }
    }
  }, [currentProjectId]);

  // Clear all data
  const clear = useCallback(async () => {
    // Revoke all blob URLs
    stateRef.current.pages.forEach((page) => {
      if (page.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(page.previewUrl);
      }
    });

    dispatch({ type: 'RESET' });

    // Clear from Firestore and S3
    if (currentProjectId) {
      try {
        // Delete all I2V images from S3
        await clearAllI2VImages(currentProjectId);
        // Clear Firestore data
        await clearImageSplitter(currentProjectId);
      } catch (error) {
        console.error('Error clearing ImageSplitter from Firestore/S3:', error);
      }
    }
  }, [currentProjectId]);

  // Set reading direction
  const setReadingDirection = useCallback((direction: ReadingDirection) => {
    dispatch({ type: 'SET_READING_DIRECTION', direction });
  }, []);

  // Download panels as ZIP
  const downloadZip = useCallback(async () => {
    const completedPages = state.pages.filter(
      (p) => p.status === 'completed' && p.panels.length > 0
    );
    if (completedPages.length === 0) return;

    const zip = new JSZip();
    let hasContent = false;

    completedPages.forEach((page) => {
      page.panels.forEach((panel, idx) => {
        if (panel.imageUrl) {
          const base64Data = panel.imageUrl.includes(',')
            ? panel.imageUrl.split(',')[1]
            : panel.imageUrl;

          const baseName = page.fileName.replace(/\.[^/.]+$/, '');
          const filename = `${baseName}_panel_${String(idx + 1).padStart(2, '0')}.jpg`;

          zip.file(filename, base64Data, { base64: true });
          hasContent = true;
        }
      });
    });

    if (hasContent) {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manga_panels.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [state.pages]);

  // Export panels as JSON
  const exportJSON = useCallback(() => {
    const completedPages = state.pages.filter(
      (p) => p.status === 'completed' && p.panels.length > 0
    );
    if (completedPages.length === 0) return;

    const exportData = {
      meta: {
        app: 'Toonyz Mithril',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalPages: completedPages.length,
        totalPanels: completedPages.reduce((acc, p) => acc + p.panels.length, 0),
      },
      storyboard: completedPages.flatMap((page, pageIdx) =>
        page.panels.map((panel, panelIdx) => ({
          id: panel.id,
          sourcePage: page.fileName,
          pageOrder: pageIdx + 1,
          panelOrder: panelIdx + 1,
          readingDirection: page.readingDirection,
          box_2d: panel.box_2d,
          label: panel.label,
          imageBase64: panel.imageUrl,
        }))
      ),
      pages: completedPages.map((page, pageIdx) => ({
        fileName: page.fileName,
        pageOrder: pageIdx + 1,
        readingDirection: page.readingDirection,
        panels: page.panels.map((panel, panelIdx) => ({
          id: panel.id,
          panelOrder: panelIdx + 1,
          box_2d: panel.box_2d,
          label: panel.label,
          imageBase64: panel.imageUrl,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manga_panels_sequence.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state.pages]);

  // Save completed results to MithrilContext for next stage
  const saveToStageResult = useCallback(() => {
    const completedPages = state.pages.filter((p) => p.status === 'completed');
    setStageResult(1, { pages: completedPages });
  }, [state.pages, setStageResult]);

  // Derived state
  const hasResults = state.pages.some((p) => p.panels.length > 0);
  const pendingCount = state.pages.filter((p) => p.status === 'pending').length;

  return {
    // State
    state,

    // Derived state
    hasResults,
    pendingCount,

    // Actions
    upload,
    process,
    cancelProcessing,
    remove,
    clear,
    setReadingDirection,
    downloadZip,
    exportJSON,
    saveToStageResult,
  };
}

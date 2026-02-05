"use client";

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { useMithril } from '../../MithrilContext';
import { imageSplitterReducer, initialState } from './reducer';
import type { ImageSplitterState, MangaPage, MangaPanel, ReadingDirection, ProcessingStatus } from './types';
import {
  getImageSplitterMeta,
  getMangaPages,
  getMangaPanels,
  clearImageSplitter,
  deleteMangaPage,
  saveMangaPage,
  saveMangaPanel,
  saveImageSplitterMeta,
  updateMangaPagePanelCount,
} from '../../services/firestore';
import {
  deleteI2VPageImage,
  deleteI2VPanelImage,
  clearAllI2VImages,
} from '../../services/s3/images';
import { compressImage } from '../ImageToScriptWriter/utils/imageCompression';
import { usePanelSplitterOrchestrator, PanelSplitterJobUpdate } from './usePanelSplitterOrchestrator';
import {
  PanelSplitterJobStatus,
  getAllProjectPanelSplitterJobs,
  mapPanelSplitterJobToUpdate,
} from '../../services/firestore/jobQueue';

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

// Helper: Map orchestrator status to local processing status
function mapOrchestratorStatus(status: PanelSplitterJobStatus): ProcessingStatus {
  switch (status) {
    case 'pending':
    case 'preparing':
    case 'retrying':
      return 'pending';
    case 'generating':
    case 'cropping':
    case 'uploading':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'error';
    default:
      return 'pending';
  }
}

export function useImageSplitter() {
  const { setStageResult, currentProjectId, customApiKey } = useMithril();
  const [state, dispatch] = useReducer(imageSplitterReducer, initialState);
  const isLoadingRef = useRef(false);
  const processingStartTimeRef = useRef<number | null>(null);

  // Track active jobs: pageId -> jobId
  const [activeJobs, setActiveJobs] = useState<Record<string, string>>({});

  // Control when Firestore subscription starts (prevents race condition with loadFromFirestore)
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);

  // Reset subscription state when project changes (prevents race condition on project switch)
  useEffect(() => {
    setSubscriptionEnabled(false);
  }, [currentProjectId]);

  // Keep a ref to current state for cleanup and async operations
  const stateRef = useRef<ImageSplitterState>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);


  // Track active jobs ref for use in callback
  const activeJobsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    activeJobsRef.current = activeJobs;
  }, [activeJobs]);

  // Persist completed page results to Firestore
  const persistPageResults = useCallback(async (
    pageId: string,
    pageIndex: number,
    fileName: string,
    pageImageUrl: string | undefined,
    panels: Array<{ id: string; box_2d: number[]; label: string; imageUrl?: string }>,
    readingDirection: ReadingDirection
  ) => {
    if (!currentProjectId) return;

    try {
      // Save the manga page (update existing or create new)
      await saveMangaPage(currentProjectId, pageIndex, {
        fileName,
        imageRef: pageImageUrl || '',
        readingDirection,
        status: 'completed',
        originalPageId: pageId, // Preserve original ID for matching with job queue
      });

      // Save each panel
      for (let i = 0; i < panels.length; i++) {
        const panel = panels[i];
        await saveMangaPanel(currentProjectId, pageIndex, i, {
          box_2d: panel.box_2d,
          label: panel.label,
          imageRef: panel.imageUrl || '',
        });
      }

      // Update page panel count
      await updateMangaPagePanelCount(currentProjectId, pageIndex, panels.length);

      console.log(`[ImageSplitter] Persisted page ${pageIndex} with ${panels.length} panels`);
    } catch (error) {
      console.error(`[ImageSplitter] Failed to persist page ${pageIndex}:`, error);
    }
  }, [currentProjectId]);

  // Handle page updates from orchestrator
  const handlePageUpdate = useCallback((update: PanelSplitterJobUpdate) => {
    const { pageId, pageIndex, fileName, status, panels, pageImageUrl } = update;

    // Find page in state
    const page = stateRef.current.pages.find((p) => p.id === pageId);
    if (!page) return;

    // Only process updates for pages that are still processing
    if (page.status !== 'processing') return;

    // Map orchestrator status to local status
    const localStatus = mapOrchestratorStatus(status);

    if (localStatus === 'completed' && panels) {
      // Update page with detected panels from backend (already includes S3 URLs)
      const mappedPanels = panels.map((p) => ({
        id: p.id,
        box_2d: p.box_2d,
        label: p.label,
        imageUrl: p.imageUrl, // S3 URL from backend
      }));

      dispatch({
        type: 'SET_PAGE_PANELS',
        id: pageId,
        panels: mappedPanels,
        previewUrl: pageImageUrl, // S3 URL for the source page
      });

      // Persist results to Firestore (async, fire-and-forget)
      persistPageResults(pageId, pageIndex, fileName, pageImageUrl, mappedPanels, page.readingDirection);

    } else if (localStatus === 'error') {
      dispatch({ type: 'UPDATE_PAGE_STATUS', id: pageId, status: 'error' });
    } else if (localStatus === 'processing' && page.status !== 'processing') {
      dispatch({ type: 'UPDATE_PAGE_STATUS', id: pageId, status: 'processing' });
    }
  }, [persistPageResults]);

  // Track the number of pages submitted for processing (for stats)
  const submittedPageCountRef = useRef<number>(0);

  // Check if all jobs are complete and finish processing
  // Simplified: just check page statuses, ignore activeJobs for completion detection
  useEffect(() => {
    if (!state.isProcessing) return;

    const processingPages = state.pages.filter((p) => p.status === 'processing');
    const pendingPages = state.pages.filter((p) => p.status === 'pending');

    // Finish when no pages are 'processing' or 'pending' and we have pages
    if (processingPages.length === 0 && state.pages.length > 0 && pendingPages.length === 0) {
      // All jobs completed
      const endTime = Date.now();
      const startTime = processingStartTimeRef.current || endTime;
      const durationMinutes = ((endTime - startTime) / 60000).toFixed(2);

      const completedPages = state.pages.filter((p) => p.status === 'completed');
      const totalPanels = completedPages.reduce((acc, p) => acc + p.panels.length, 0);

      // Save metadata to Firestore
      if (currentProjectId && completedPages.length > 0) {
        saveImageSplitterMeta(
          currentProjectId,
          state.readingDirection,
          completedPages.length,
          totalPanels
        ).catch((error) => {
          console.error('[ImageSplitter] Failed to save metadata:', error);
        });
      }

      // Update stage result for downstream stages
      setStageResult(1, { pages: completedPages });

      dispatch({
        type: 'FINISH_PROCESSING',
        stats: {
          duration: durationMinutes,
          pageCount: submittedPageCountRef.current,
          panelCount: totalPanels,
        },
      });

      processingStartTimeRef.current = null;
      submittedPageCountRef.current = 0;
    }
  }, [state.isProcessing, state.pages, state.readingDirection, currentProjectId, setStageResult]);

  // Initialize orchestrator (subscription controlled by subscriptionEnabled to prevent race condition)
  const { submitBatch, cancelAllJobs } = usePanelSplitterOrchestrator({
    projectId: currentProjectId,
    customApiKey,
    onPageUpdate: handlePageUpdate,
    enabled: subscriptionEnabled,
  });

  // Load data from Firestore when project changes
  useEffect(() => {
    if (!currentProjectId || isLoadingRef.current) return;

    // Don't reload if we're actively processing or already have pages
    if (stateRef.current.isProcessing || stateRef.current.pages.length > 0) {
      setSubscriptionEnabled(true);
      return;
    }

    const loadFromFirestore = async () => {
      isLoadingRef.current = true;
      try {
        const meta = await getImageSplitterMeta(currentProjectId);
        if (!meta) {
          isLoadingRef.current = false;
          // Enable subscription even with no data (user might start new processing)
          setSubscriptionEnabled(true);
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
            // Use originalPageId if available (for matching with job queue), otherwise fall back to Firestore id
            id: page.originalPageId || page.id,
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

        // Check for jobs and restore state
        const allJobDocs = await getAllProjectPanelSplitterJobs(currentProjectId);

        // Separate active and completed jobs
        const terminalStatuses = ['completed', 'failed', 'cancelled'];
        const activeJobDocs = allJobDocs.filter((job) => !terminalStatuses.includes(job.status));
        const completedJobDocs = allJobDocs.filter((job) => job.status === 'completed');

        // Find pages that are marked as processing but have completed jobs
        const processingPageIds = loadedPages
          .filter((p) => p.status === 'processing')
          .map((p) => p.id);

        const jobsCompletedWhileAway = completedJobDocs.filter(
          (job) => job.page_id && processingPageIds.includes(job.page_id)
        );

        // Process completed jobs that weren't persisted (job completed while user was away)
        for (const job of jobsCompletedWhileAway) {
          if (!job.page_id) continue;
          console.log(`[ImageSplitter] Found completed job for page ${job.page_id}, applying results`);
          const update = mapPanelSplitterJobToUpdate(job);

          if (update.panels && update.panels.length > 0) {
            // Update local state with panels
            dispatch({
              type: 'SET_PAGE_PANELS',
              id: job.page_id,
              panels: update.panels.map((p) => ({
                id: p.id,
                box_2d: p.box_2d,
                label: p.label,
                imageUrl: p.imageUrl,
              })),
              previewUrl: update.pageImageUrl,
            });

            // Persist to Firestore
            try {
              await saveMangaPage(currentProjectId, update.pageIndex, {
                fileName: update.fileName,
                imageRef: update.pageImageUrl || '',
                readingDirection: loadedPages.find((p) => p.id === job.page_id)?.readingDirection || 'rtl',
                status: 'completed',
                originalPageId: job.page_id,
              });

              for (let i = 0; i < update.panels.length; i++) {
                const panel = update.panels[i];
                await saveMangaPanel(currentProjectId, update.pageIndex, i, {
                  box_2d: panel.box_2d,
                  label: panel.label,
                  imageRef: panel.imageUrl || '',
                });
              }

              await updateMangaPagePanelCount(currentProjectId, update.pageIndex, update.panels.length);
              console.log(`[ImageSplitter] Persisted completed job results for page ${job.page_id}`);
            } catch (error) {
              console.error(`[ImageSplitter] Failed to persist completed job for page ${job.page_id}:`, error);
            }
          }
        }

        // Simplified restoration: just check if any pages are still processing
        const processingPages = loadedPages.filter((p) => p.status === 'processing');

        if (processingPages.length > 0) {
          // There are pages still processing - enter processing mode
          console.log(`[ImageSplitter] Found ${processingPages.length} pages still processing, entering processing mode`);
          dispatch({ type: 'START_PROCESSING', total: processingPages.length });
          processingStartTimeRef.current = Date.now();
          // The Firestore subscription will handle updates
        }
      } catch (error) {
        console.error('Error loading ImageSplitter data from Firestore:', error);
      } finally {
        isLoadingRef.current = false;
        // Enable subscription after loading completes (prevents race condition)
        // This ensures activeJobsRef.current is set before any subscription events are processed
        setSubscriptionEnabled(true);
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

  // Start processing all pending pages via orchestrator
  const process = useCallback(async () => {
    const pendingPages = stateRef.current.pages.filter((p) => p.status === 'pending');
    if (pendingPages.length === 0) return;

    dispatch({ type: 'START_PROCESSING', total: pendingPages.length });
    processingStartTimeRef.current = Date.now();
    submittedPageCountRef.current = 0; // Will be set after successful submission

    // Prepare batch submission - compress images and build payload
    const pagesToSubmit: Array<{
      pageId: string;
      pageIndex: number;
      fileName: string;
      imageBase64: string;
      readingDirection: ReadingDirection;
    }> = [];

    for (let i = 0; i < pendingPages.length; i++) {
      const page = pendingPages[i];
      if (!page.file) {
        console.warn(`Page ${page.id} has no file, skipping`);
        continue;
      }

      try {
        // Compress image for submission (1500px max, 80% quality)
        const base64Image = await compressImage(page.file, 1500, 0.8);
        const pageIndex = stateRef.current.pages.findIndex((p) => p.id === page.id);

        pagesToSubmit.push({
          pageId: page.id,
          pageIndex,
          fileName: page.fileName,
          imageBase64: base64Image,
          readingDirection: page.readingDirection,
        });
      } catch (error) {
        console.error(`Failed to compress page ${page.id}:`, error);
        dispatch({ type: 'UPDATE_PAGE_STATUS', id: page.id, status: 'error' });
      }
    }

    if (pagesToSubmit.length === 0) {
      dispatch({
        type: 'FINISH_PROCESSING',
        stats: { duration: '0', pageCount: 0, panelCount: 0 },
      });
      return;
    }

    // Submit batch to orchestrator
    const result = await submitBatch({
      pages: pagesToSubmit,
      readingDirection: stateRef.current.readingDirection,
    });

    if (!result.success) {
      console.error('Failed to submit batch:', result.error);
      // Mark all pages as error
      pagesToSubmit.forEach((page) => {
        dispatch({ type: 'UPDATE_PAGE_STATUS', id: page.pageId, status: 'error' });
      });
      dispatch({
        type: 'FINISH_PROCESSING',
        stats: { duration: '0', pageCount: 0, panelCount: 0 },
      });
      return;
    }

    // Track active jobs: pageId -> jobId
    const jobMap: Record<string, string> = {};
    result.jobs?.forEach((job, idx) => {
      if (pagesToSubmit[idx]) {
        jobMap[pagesToSubmit[idx].pageId] = job.jobId;
      }
    });
    setActiveJobs(jobMap);
    submittedPageCountRef.current = pagesToSubmit.length; // Track for completion stats

    // Mark all submitted pages as processing
    pagesToSubmit.forEach((page) => {
      dispatch({ type: 'UPDATE_PAGE_STATUS', id: page.pageId, status: 'processing' });
    });

    // Save pages to Firestore with status='processing' so they persist across navigation
    if (currentProjectId) {
      try {
        // Save metadata first
        await saveImageSplitterMeta(
          currentProjectId,
          stateRef.current.readingDirection,
          pagesToSubmit.length,
          0 // panels will be counted after completion
        );

        // Save each page with processing status (no imageRef yet - will be set on completion)
        for (const page of pagesToSubmit) {
          await saveMangaPage(currentProjectId, page.pageIndex, {
            fileName: page.fileName,
            imageRef: '', // Will be populated when job completes
            readingDirection: page.readingDirection,
            status: 'processing',
            originalPageId: page.pageId, // Store original ID for matching with job queue
          });
          // Also store pageIndex in local state for later reference
          dispatch({ type: 'SET_PAGE_INDEX', id: page.pageId, pageIndex: page.pageIndex });
        }
        console.log(`[ImageSplitter] Saved ${pagesToSubmit.length} pages to Firestore with status=processing`);
      } catch (error) {
        console.error('[ImageSplitter] Failed to save pages to Firestore:', error);
      }
    }

    // Processing will complete via Firestore updates handled by handlePageUpdate
  }, [submitBatch, currentProjectId]);

  // Cancel ongoing processing via orchestrator
  const cancelProcessing = useCallback(async () => {
    const jobIds = Object.values(activeJobs);
    if (jobIds.length > 0) {
      await cancelAllJobs(jobIds);
    }
    setActiveJobs({});

    // Reset processing pages to pending
    stateRef.current.pages
      .filter((p) => p.status === 'processing')
      .forEach((page) => {
        dispatch({ type: 'UPDATE_PAGE_STATUS', id: page.id, status: 'pending' });
      });

    dispatch({
      type: 'FINISH_PROCESSING',
      stats: null as unknown as { duration: string; pageCount: number; panelCount: number },
    });
    processingStartTimeRef.current = null;
  }, [activeJobs, cancelAllJobs]);

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

    // Helper to check if URL is an S3/CloudFront URL that needs proxying
    const isS3Url = (url: string) =>
      url.includes('s3.amazonaws.com') ||
      url.includes('s3.ap-northeast-2.amazonaws.com') ||
      url.includes('cloudfront.net');

    for (const page of completedPages) {
      for (let idx = 0; idx < page.panels.length; idx++) {
        const panel = page.panels[idx];
        if (panel.imageUrl) {
          const baseName = page.fileName.replace(/\.[^/.]+$/, '');
          const filename = `${baseName}_panel_${String(idx + 1).padStart(2, '0')}.jpg`;

          try {
            // Check if it's a URL (S3) or base64 data
            if (panel.imageUrl.startsWith('http://') || panel.imageUrl.startsWith('https://')) {
              // Use proxy for S3 URLs to avoid CORS issues
              const fetchUrl = isS3Url(panel.imageUrl)
                ? `/api/mithril/s3/proxy?url=${encodeURIComponent(panel.imageUrl)}`
                : panel.imageUrl;

              const response = await fetch(fetchUrl);
              if (response.ok) {
                const blob = await response.blob();
                zip.file(filename, blob);
                hasContent = true;
              }
            } else {
              // Handle base64 data
              const base64Data = panel.imageUrl.includes(',')
                ? panel.imageUrl.split(',')[1]
                : panel.imageUrl;
              zip.file(filename, base64Data, { base64: true });
              hasContent = true;
            }
          } catch (error) {
            console.error(`Failed to add panel ${idx} from ${page.fileName} to ZIP:`, error);
          }
        }
      }
    }

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

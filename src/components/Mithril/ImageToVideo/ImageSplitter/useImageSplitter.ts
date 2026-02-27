"use client";

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { useToast } from '@/hooks/use-toast';
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

// Helper: Get image dimensions from File
function getImageDimensions(file: File): Promise<{ w: number; h: number }>;
// Helper: Get image dimensions from URL (overload)
function getImageDimensions(fileOrUrl: string): Promise<{ w: number; h: number }>;
// Implementation
function getImageDimensions(fileOrUrl: File | string): Promise<{ w: number; h: number }> {
  return new Promise(async (resolve) => {
    const img = new Image();
    let objectUrl: string | null = null;

    if (typeof fileOrUrl === 'string') {
      // Check if URL is S3/CloudFront URL that needs proxying
      const isS3Url = (url: string) =>
        url.includes('s3.amazonaws.com') ||
        url.includes('s3.ap-northeast-2.amazonaws.com') ||
        url.includes('cloudfront.net');

      if (isS3Url(fileOrUrl)) {
        // Use proxy for S3 URLs to avoid CORS issues
        try {
          const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(fileOrUrl)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            console.error('Failed to fetch image through proxy for dimensions');
            resolve({ w: 0, h: 0 });
            return;
          }
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          img.src = objectUrl;
        } catch (error) {
          console.error('Error fetching image through proxy for dimensions:', error);
          resolve({ w: 0, h: 0 });
          return;
        }
      } else {
        // Other remote URLs - use directly with crossOrigin
        img.crossOrigin = 'anonymous';
        img.src = fileOrUrl;
      }
    } else {
      // File object - create blob URL
      objectUrl = URL.createObjectURL(fileOrUrl);
      img.src = objectUrl;
    }

    img.onload = () => {
      resolve({ w: img.naturalWidth || img.width, h: img.naturalHeight || img.height });
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      resolve({ w: 0, h: 0 });
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  });
}

// Helper: Apply padding to panel box coordinates (0-1000 scale)
function applyPaddingToBox(box_2d: number[], padding: number): number[] {
  const [ymin, xmin, ymax, xmax] = box_2d;

  // Apply padding (padding is in pixels, need to convert based on image scale)
  // Assuming 0-1000 scale, convert pixel padding to scale units
  const paddingScale = padding; // Direct padding in scale units for simplicity

  return [
    Math.max(0, ymin - paddingScale),     // ymin
    Math.max(0, xmin - paddingScale),     // xmin
    Math.min(1000, ymax + paddingScale),  // ymax
    Math.min(1000, xmax + paddingScale),  // xmax
  ];
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
  const { toast } = useToast();
  const [state, dispatch] = useReducer(imageSplitterReducer, initialState);
  const isLoadingRef = useRef(false);
  const processingStartTimeRef = useRef<number | null>(null);

  // Track active jobs: pageId -> jobId
  const [activeJobs, setActiveJobs] = useState<Record<string, string>>({});

  // Auto-transcription state
  const [isAnalyzingScript, setIsAnalyzingScript] = useState(false);
  const [scriptProgress, setScriptProgress] = useState('');

  // Panel padding state (in 0-1000 scale units, ~50 units ≈ 5% of image)
  const [panelPadding, setPanelPadding] = useState(50);

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
    readingDirection: ReadingDirection,
    width?: number,
    height?: number
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
        width, // Save dimensions for resize calculations
        height,
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

    } catch (error) {
      console.error(`[ImageSplitter] Failed to persist page ${pageIndex}:`, error);
    }
  }, [currentProjectId]);

  // Handle page updates from orchestrator
  const handlePageUpdate = useCallback((update: PanelSplitterJobUpdate) => {
    const { pageId, pageIndex, fileName, status, panels, pageImageUrl } = update;

    // Find page in state
    const page = stateRef.current.pages.find((p) => p.id === pageId);
    if (!page) {
      console.warn('[ImageSplitter] handlePageUpdate: page not found in state for id', pageId,
        '| pages in state:', stateRef.current.pages.map(p => ({ id: p.id, status: p.status, previewUrl: p.previewUrl?.slice(0, 60) })));
      return;
    }

    // Only process updates for pages that are still processing
    if (page.status !== 'processing') {
      console.warn('[ImageSplitter] handlePageUpdate: SKIPPED — page.status is', page.status, '(not "processing")');
      return;
    }

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

      // Keep the existing blob previewUrl during the current session — it already
      // shows the correct image. Only fall back to the S3 URL when there is no
      // blob URL (e.g. the page was loaded from Firestore without a local blob).
      const keepBlobUrl = page.previewUrl?.startsWith('blob:');
      const newPreviewUrl = keepBlobUrl ? undefined : pageImageUrl

      dispatch({
        type: 'SET_PAGE_PANELS',
        id: pageId,
        panels: mappedPanels,
        previewUrl: newPreviewUrl,
      });

      // Persist results to Firestore (async, fire-and-forget)
      persistPageResults(pageId, pageIndex, fileName, pageImageUrl, mappedPanels, page.readingDirection, page.width, page.height);

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
            storyboard: p.storyboard, // Load storyboard data if exists
          }));

          // Load dimensions from Firestore or get from image if missing
          let width = page.width;
          let height = page.height;

          // If dimensions are missing (backward compatibility), load image to get them
          if (!width || !height) {
            try {
              const dims = await getImageDimensions(page.imageRef);
              width = dims.w;
              height = dims.h;
            } catch (error) {
              console.warn(`Failed to get dimensions for page ${page.pageIndex}:`, error);
            }
          }

          loadedPages.push({
            // Use originalPageId if available (for matching with job queue), otherwise fall back to Firestore id
            id: page.originalPageId || page.id,
            pageIndex: page.pageIndex, // Store original index for deletion
            // Append cache-busting param so CloudFront serves the latest version on load
            previewUrl: (() => {
              const url = page.imageRef ? `${page.imageRef}?t=${Date.now()}` : page.imageRef;
              return url;
            })(),
            fileName: page.fileName,
            panels,
            status: page.status as 'pending' | 'processing' | 'completed' | 'error',
            readingDirection: page.readingDirection as ReadingDirection,
            width,
            height,
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
            } catch (error) {
              console.error(`[ImageSplitter] Failed to persist completed job for page ${job.page_id}:`, error);
            }
          }
        }

        // Simplified restoration: just check if any pages are still processing
        const processingPages = loadedPages.filter((p) => p.status === 'processing');

        if (processingPages.length > 0) {
          // There are pages still processing - enter processing mode
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
        
        const dims = await getImageDimensions(file);

        extractedPages.push({
          id: generateId(),
          file,
          previewUrl: URL.createObjectURL(blob),
          fileName: file.name,
          panels: [],
          status: 'pending',
          readingDirection,
          width: dims.w,
          height: dims.h,
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
            toast({
              variant: 'destructive',
              title: 'Failed to extract ZIP file',
              description: 'The ZIP file may be corrupted or use an unsupported compression format. Try re-creating it with standard ZIP compression.',
            });
          }
          continue;
        }

        // Handle image files
        if (file.type.startsWith('image/')) {
          const dims = await getImageDimensions(file);
          
          newPages.push({
            id: generateId(),
            file,
            previewUrl: URL.createObjectURL(file),
            fileName: file.name,
            panels: [],
            status: 'pending',
            readingDirection: state.readingDirection,
            width: dims.w,
            height: dims.h,
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
          const pageData = stateRef.current.pages.find((p) => p.id === page.pageId);
          await saveMangaPage(currentProjectId, page.pageIndex, {
            fileName: page.fileName,
            imageRef: '', // Will be populated when job completes
            readingDirection: page.readingDirection,
            status: 'processing',
            originalPageId: page.pageId, // Store original ID for matching with job queue
            width: pageData?.width, // Store dimensions for resize calculations
            height: pageData?.height,
          });
          // Also store pageIndex in local state for later reference
          dispatch({ type: 'SET_PAGE_INDEX', id: page.pageId, pageIndex: page.pageIndex });
        }
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

  // Helper to crop panel from source image using box_2d coordinates
  const cropPanelFromSource = useCallback(async (
    sourceImageUrl: string,
    box_2d: number[],
    width: number,
    height: number
  ): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const img = new Image();

      // Helper to check if URL is an S3/CloudFront URL that needs proxying
      const isS3Url = (url: string) =>
        url.includes('s3.amazonaws.com') ||
        url.includes('s3.ap-northeast-2.amazonaws.com') ||
        url.includes('cloudfront.net');

      // Load source image through proxy if needed
      let imageSrc = sourceImageUrl;
      if (isS3Url(sourceImageUrl)) {
        try {
          const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(sourceImageUrl)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            reject(new Error('Failed to fetch image through proxy'));
            return;
          }
          const blob = await response.blob();
          imageSrc = URL.createObjectURL(blob);
        } catch (error) {
          reject(error);
          return;
        }
      } else if (!sourceImageUrl.startsWith('blob:') && !sourceImageUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        try {
          const [ymin, xmin, ymax, xmax] = box_2d;

          // Convert from 0-1000 scale to pixel coordinates
          const cropX = (xmin / 1000) * width;
          const cropY = (ymin / 1000) * height;
          const cropWidth = ((xmax - xmin) / 1000) * width;
          const cropHeight = ((ymax - ymin) / 1000) * height;

          // Create canvas and crop
          const canvas = document.createElement('canvas');
          canvas.width = cropWidth;
          canvas.height = cropHeight;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw cropped section
          ctx.drawImage(
            img,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );

          const result = canvas.toDataURL('image/jpeg', 0.9);

          // Clean up blob URL if we created one
          if (imageSrc.startsWith('blob:') && imageSrc !== sourceImageUrl) {
            URL.revokeObjectURL(imageSrc);
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        if (imageSrc.startsWith('blob:') && imageSrc !== sourceImageUrl) {
          URL.revokeObjectURL(imageSrc);
        }
        reject(new Error('Failed to load image'));
      };

      img.src = imageSrc;
    });
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

    // Collect storyboard scripts for export
    const scriptLines: string[] = [];
    scriptLines.push('='.repeat(80));
    scriptLines.push('MANGA STORYBOARD SCRIPT');
    scriptLines.push('Generated by Toonyz Mithril');
    scriptLines.push(`Exported: ${new Date().toLocaleString()}`);
    scriptLines.push('='.repeat(80));
    scriptLines.push('');

    for (let pageIdx = 0; pageIdx < completedPages.length; pageIdx++) {
      const page = completedPages[pageIdx];
      const baseName = page.fileName.replace(/\.[^/.]+$/, '');

      // Add page header to script
      scriptLines.push('─'.repeat(80));
      scriptLines.push(`PAGE ${pageIdx + 1}: ${page.fileName}`);
      scriptLines.push(`Reading Direction: ${page.readingDirection === 'rtl' ? 'Right-to-Left' : 'Left-to-Right'}`);
      scriptLines.push(`Total Panels: ${page.panels.length}`);
      scriptLines.push('─'.repeat(80));
      scriptLines.push('');

      for (let idx = 0; idx < page.panels.length; idx++) {
        const panel = page.panels[idx];
        const filename = `${baseName}_panel_${String(idx + 1).padStart(2, '0')}.jpg`;

        // Add panel info to script
        scriptLines.push(`[PANEL ${idx + 1}] (${filename})`);
        if (panel.storyboard?.text) {
          scriptLines.push(panel.storyboard.text);
        } else {
          scriptLines.push('(No script available)');
        }
        scriptLines.push('');

        // Add panel image to ZIP - use current box_2d to crop from source
        try {
          // Always re-crop from source using current box_2d to respect manual resizing
          if (page.previewUrl && page.width && page.height) {
            const croppedImage = await cropPanelFromSource(
              page.previewUrl,
              panel.box_2d,
              page.width,
              page.height
            );

            // Remove data URL prefix
            const base64Data = croppedImage.includes(',')
              ? croppedImage.split(',')[1]
              : croppedImage;

            zip.file(filename, base64Data, { base64: true });
            hasContent = true;
          } else if (panel.imageUrl) {
            // Fallback to stored panel image if source not available
            if (panel.imageUrl.startsWith('http://') || panel.imageUrl.startsWith('https://')) {
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
              const base64Data = panel.imageUrl.includes(',')
                ? panel.imageUrl.split(',')[1]
                : panel.imageUrl;
              zip.file(filename, base64Data, { base64: true });
              hasContent = true;
            }
          }
        } catch (error) {
          console.error(`Failed to add panel ${idx} from ${page.fileName} to ZIP:`, error);
        }
      }

      scriptLines.push('');
    }

    // Add storyboard script text file to ZIP
    scriptLines.push('='.repeat(80));
    scriptLines.push('END OF STORYBOARD SCRIPT');
    scriptLines.push('='.repeat(80));
    const scriptContent = scriptLines.join('\n');
    zip.file('storyboard_script.txt', scriptContent);

    if (hasContent) {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manga_panels.zip';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [state.pages, cropPanelFromSource]);

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

  // Set active page
  const setActivePage = useCallback((id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_PAGE', id });
  }, []);

  // Add panel manually
  const addPanel = useCallback((panel: MangaPanel) => {
    if (!state.activePageId) return;
    dispatch({ type: 'ADD_PANEL', pageId: state.activePageId, panel });
  }, [state.activePageId]);

  // Delete panel
  const deletePanel = useCallback((panelId: string) => {
    if (!state.activePageId) return;
    dispatch({ type: 'DELETE_PANEL', pageId: state.activePageId, panelId });
  }, [state.activePageId]);

  // Update panel
  const updatePanel = useCallback((panelId: string, updates: Partial<MangaPanel>) => {
    if (!state.activePageId) return;
    dispatch({ type: 'UPDATE_PANEL', pageId: state.activePageId, panelId, panel: updates });
  }, [state.activePageId]);

  // Update panel storyboard
  const updatePanelStoryboard = useCallback((panelId: string, text: string) => {
    if (!state.activePageId) return;
    dispatch({ type: 'UPDATE_PANEL_STORYBOARD', pageId: state.activePageId, panelId, text });
  }, [state.activePageId]);

  // Apply padding to all panels in active page
  const applyPaddingToActivePage = useCallback(async () => {
    const page = stateRef.current.pages.find(p => p.id === stateRef.current.activePageId);
    if (!page || page.panels.length === 0) return;

    // Apply padding to all panels
    const paddedPanels = page.panels.map(panel => ({
      ...panel,
      box_2d: applyPaddingToBox(panel.box_2d, panelPadding)
    }));

    // Update state
    dispatch({
      type: 'SET_PAGE_PANELS',
      id: page.id,
      panels: paddedPanels,
    });

    // Persist to Firestore if page has pageIndex
    if (currentProjectId && page.pageIndex !== undefined) {
      try {
        for (let i = 0; i < paddedPanels.length; i++) {
          const panel = paddedPanels[i];
          await saveMangaPanel(currentProjectId, page.pageIndex, i, {
            box_2d: panel.box_2d,
            label: panel.label || '',
            imageRef: panel.imageUrl || '',
            storyboard: panel.storyboard,
          });
        }
        toast({
          title: 'Padding applied',
          description: `Applied ${panelPadding} units of padding to ${paddedPanels.length} panels.`,
        });
      } catch (error) {
        console.error('Failed to persist padded panels to Firestore:', error);
      }
    }
  }, [panelPadding, currentProjectId, toast]);

  // Create annotated image with panel boxes drawn for AI analysis
  const createAnnotatedImage = useCallback(async (page: MangaPage): Promise<string> => {
    return new Promise(async (resolve) => {
      const img = new Image();

      // Helper to check if URL is an S3/CloudFront URL that needs proxying
      const isS3Url = (url: string) =>
        url.includes('s3.amazonaws.com') ||
        url.includes('s3.ap-northeast-2.amazonaws.com') ||
        url.includes('cloudfront.net');

      // Use proxy for S3 URLs to avoid CORS issues, otherwise use direct URL
      let imageSrc = page.previewUrl;
      if (isS3Url(page.previewUrl)) {
        // For S3 URLs, fetch through proxy and convert to blob URL
        try {
          const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(page.previewUrl)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            console.error('Failed to fetch image through proxy');
            resolve('');
            return;
          }
          const blob = await response.blob();
          imageSrc = URL.createObjectURL(blob);
        } catch (error) {
          console.error('Error fetching image through proxy:', error);
          resolve('');
          return;
        }
      } else if (!page.previewUrl.startsWith('blob:') && !page.previewUrl.startsWith('data:')) {
        // For other remote URLs (not blob or data), set crossOrigin
        img.crossOrigin = 'anonymous';
      }

      img.src = imageSrc;

      await new Promise((r) => {
        img.onload = r;
        img.onerror = () => {
          console.error('Failed to load image for annotation');
          // Clean up blob URL if we created one
          if (imageSrc.startsWith('blob:') && imageSrc !== page.previewUrl) {
            URL.revokeObjectURL(imageSrc);
          }
          resolve('');
        };
      });

      // Limit dimension to 2000px for good OCR but reasonable payload
      const MAX_DIM = 2000;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      let scale = 1;

      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = width / height;
        if (width > height) {
          width = MAX_DIM;
          height = MAX_DIM / ratio;
        } else {
          height = MAX_DIM;
          width = MAX_DIM * ratio;
        }
        scale = width / (img.naturalWidth || img.width);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      // Draw scaled image
      ctx.drawImage(img, 0, 0, width, height);

      // Draw panel boxes and labels
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 4;
      ctx.font = 'bold 24px Arial';

      page.panels.forEach((panel) => {
        const [ymin, xmin, ymax, xmax] = panel.box_2d;

        // Convert from 0-1000 scale to pixel coordinates
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        const s_xmin = (xmin / 1000) * imgWidth * scale;
        const s_ymin = (ymin / 1000) * imgHeight * scale;
        const s_w = ((xmax - xmin) / 1000) * imgWidth * scale;
        const s_h = ((ymax - ymin) / 1000) * imgHeight * scale;

        // Draw box
        ctx.strokeRect(s_xmin, s_ymin, s_w, s_h);

        // Draw label background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(s_xmin, s_ymin - 30, 40, 30);

        // Draw label text
        ctx.fillStyle = '#00FF00';
        ctx.fillText(panel.label || '?', s_xmin + 8, s_ymin - 7);
      });

      const result = canvas.toDataURL('image/jpeg', 0.8);

      // Clean up blob URL if we created one for S3 proxy
      if (imageSrc.startsWith('blob:') && imageSrc !== page.previewUrl) {
        URL.revokeObjectURL(imageSrc);
      }

      resolve(result);
    });
  }, []);

  // Analyze all pages with storyboard transcription
  const analyzeScriptAll = useCallback(async () => {
    if (isAnalyzingScript || stateRef.current.pages.length === 0) return;

    // Only analyze completed pages with panels
    const pagesWithPanels = stateRef.current.pages.filter(
      (p) => p.status === 'completed' && p.panels.length > 0
    );

    if (pagesWithPanels.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No panels to analyze',
        description: 'Please detect panels first using Auto-Detect.',
      });
      return;
    }

    setIsAnalyzingScript(true);

    // Process pages sequentially to avoid rate limits
    for (let i = 0; i < pagesWithPanels.length; i++) {
      const page = pagesWithPanels[i];
      setScriptProgress(`${i + 1}/${pagesWithPanels.length}`);

      try {
        // Create annotated image with panel boxes
        const annotatedImageBase64 = await createAnnotatedImage(page);
        if (!annotatedImageBase64) {
          console.error(`Failed to create annotated image for page ${page.id}`);
          continue;
        }

        // Remove data URL prefix if present
        const base64Data = annotatedImageBase64.includes(',')
          ? annotatedImageBase64.split(',')[1]
          : annotatedImageBase64;

        // Call API to analyze storyboard
        // Send numeric labels (1, 2, 3...) to match what AI returns
        const response = await fetch('/api/manga/analyze-storyboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            panels: page.panels.map((_, idx) => ({ label: String(idx + 1) })),
            apiKey: customApiKey,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Storyboard analysis failed:', error);
          continue;
        }

        const result = await response.json();

        // Update panels with storyboard data
        if (result.success && result.panels) {
          const storyboardMap: Record<string, string> = {};
          result.panels.forEach((p: { label: string; script: string }) => {
            storyboardMap[p.label] = p.script;
          });


          // Create updated panels with storyboard - match by index position
          const updatedPanels = page.panels.map((panel, idx) => {
            const numericLabel = String(idx + 1); // 1, 2, 3...
            const script = storyboardMap[numericLabel];
            const hasStoryboard = !!script;
            return {
              ...panel,
              storyboard: script ? { text: script } : panel.storyboard,
            };
          });

          // Update state with storyboard data
          dispatch({
            type: 'SET_PAGE_PANELS',
            id: page.id,
            panels: updatedPanels,
          });

          // Persist to Firestore if page has pageIndex
          if (currentProjectId && page.pageIndex !== undefined) {
            try {
              for (let j = 0; j < updatedPanels.length; j++) {
                const panel = updatedPanels[j];
                if (panel.storyboard) {
                  await saveMangaPanel(currentProjectId, page.pageIndex, j, {
                    box_2d: panel.box_2d,
                    label: panel.label || '',
                    imageRef: panel.imageUrl || '',
                    storyboard: panel.storyboard,
                  });
                }
              }
            } catch (error) {
              console.error('Failed to persist storyboard to Firestore:', error);
            }
          }
        }
      } catch (error) {
        console.error(`Error analyzing page ${page.id}:`, error);
      }
    }

    setIsAnalyzingScript(false);
    setScriptProgress('');

    toast({
      title: 'Transcription complete',
      description: `Analyzed ${pagesWithPanels.length} pages.`,
    });
  }, [isAnalyzingScript, createAnnotatedImage, customApiKey, currentProjectId, toast]);

  // Derived state
  const hasResults = state.pages.some((p) => p.panels.length > 0);
  const pendingCount = state.pages.filter((p) => p.status === 'pending').length;
  const activePage = state.pages.find((p) => p.id === state.activePageId);

  return {
    // State
    state,

    // Derived state
    hasResults,
    pendingCount,
    activePage,

    // Transcription state
    isAnalyzingScript,
    scriptProgress,

    // Padding state
    panelPadding,
    setPanelPadding,

    // Actions
    upload,
    process,
    cancelProcessing,
    remove,
    clear,
    setReadingDirection,
    setActivePage,
    addPanel,
    deletePanel,
    updatePanel,
    updatePanelStoryboard,
    applyPaddingToActivePage,
    downloadZip,
    exportJSON,
    saveToStageResult,
    analyzeScriptAll,
  };
}

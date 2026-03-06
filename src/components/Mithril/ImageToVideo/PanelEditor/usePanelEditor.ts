import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { panelEditorReducer, initialState } from './reducer';
import {
  PanelData,
  PanelEditorConfig,
  AspectRatio,
  ProcessingStatus,
} from './types';
import { usePanelOrchestrator, PanelUpdate } from './usePanelOrchestrator';
import { useMithril } from '../../MithrilContext';
import { compressImage } from '../ImageToScriptWriter/utils/imageCompression';
import { getMangaPages, getMangaPanels } from '../../services/firestore/imageSplitter';
import {
  getPanelEditorMeta,
  savePanelEditorMeta,
  getPanelEditorPanels,
  savePanelEditorPanel,
  updatePanelEditorPanelResult,
  updatePanelEditorPanelStatus,
  deletePanelEditorPanel,
  clearPanelEditorData,
} from '../../services/firestore/panelEditor';
import { uploadI2VPanelEditorImage } from '../../services/s3/images';

interface UsePanelEditorOptions {
  projectId: string;  // Project ID from MithrilContext for S3 storage
}

export function usePanelEditor({ projectId }: UsePanelEditorOptions) {
  const [state, dispatch] = useReducer(panelEditorReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const cancelProcessingRef = useRef(false);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  // Session ID: loaded from Firestore if exists, otherwise generated fresh
  const [sessionId, setSessionId] = useState<string>('');
  const sessionIdRef = useRef<string>('');

  // Use the global API key from MithrilContext (same field shown in the top-right key input)
  const { customApiKey } = useMithril();

  // Provider selection
  const [provider, setProvider] = useState<'gemini' | 'grok' | 'z_image_turbo' | 'flux2_dev'>('gemini');

  // Loading state for pre-populating file library from ImageSplitter results
  const [isLoadingSplitterPanels, setIsLoadingSplitterPanels] = useState(false);

  // Loading state for restoring panels from Firestore
  const [isLoadingPanels, setIsLoadingPanels] = useState(false);

  // Track active jobs: panelId -> jobId mapping
  const activeJobsRef = useRef<Map<string, string>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeJobsRef.current.clear();
    };
  }, []);

  // ── Load persisted data from Firestore on mount ──────────────────────
  useEffect(() => {
    if (!projectId || isLoadingRef.current) return;
    isLoadingRef.current = true;

    const load = async () => {
      setIsLoadingPanels(true);
      try {
        // 1. Load meta (sessionId, config, provider)
        const meta = await getPanelEditorMeta(projectId);
        let sid: string;
        if (meta?.sessionId) {
          sid = meta.sessionId;
          if (meta.targetAspectRatio) {
            dispatch({ type: 'SET_CONFIG', config: { targetAspectRatio: meta.targetAspectRatio as AspectRatio } });
          }
          if (meta.provider) {
            setProvider(meta.provider as 'gemini' | 'grok' | 'z_image_turbo' | 'flux2_dev');
          }
        } else {
          sid = uuidv4();
        }
        sessionIdRef.current = sid;
        setSessionId(sid);

        // 2. Load saved panels
        const savedPanels = await getPanelEditorPanels(projectId);
        if (savedPanels.length > 0 && isMountedRef.current) {
          const panels: PanelData[] = [];

          for (const saved of savedPanels) {
            const imageUrl = saved.originalImageRef;
            if (!imageUrl) continue;

            try {
              // Fetch original from S3 proxy to recreate File object
              const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(imageUrl)}`;
              const response = await fetch(proxyUrl);
              if (!response.ok) continue;

              const blob = await response.blob();
              const mimeType = blob.type || 'image/jpeg';
              const file = new File([blob], saved.fileName, { type: mimeType });

              panels.push({
                id: saved.id,
                file,
                previewUrl: URL.createObjectURL(file),
                fileName: saved.fileName,
                status: (saved.status as ProcessingStatus) || ProcessingStatus.Idle,
                resultUrl: saved.resultImageRef,
                error: saved.error,
                originalImageRef: imageUrl,
              });
            } catch {
              // Skip panels that fail to load
            }
          }

          if (panels.length > 0 && isMountedRef.current) {
            dispatch({ type: 'ADD_PANELS', panels });
          }
        }
      } catch {
        // First visit — no data yet, generate fresh sessionId
        const sid = uuidv4();
        sessionIdRef.current = sid;
        setSessionId(sid);
      } finally {
        isLoadingRef.current = false;
        if (isMountedRef.current) {
          setIsLoadingPanels(false);
        }
      }
    };

    load();
  }, [projectId]);

  // ── Pre-populate file library with panels from ImageSplitter ─────────
  useEffect(() => {
    if (!projectId) return;

    const loadSplitterPanels = async () => {
      setIsLoadingSplitterPanels(true);
      try {
        const pages = await getMangaPages(projectId);
        if (!pages.length) return;

        const files: File[] = [];

        const sortedPages = [...pages].sort((a, b) => a.pageIndex - b.pageIndex);
        for (const page of sortedPages) {
          const panels = await getMangaPanels(projectId, page.pageIndex);
          const sortedPanels = [...panels].sort((a, b) => a.panelIndex - b.panelIndex);

          for (const panel of sortedPanels) {
            if (!panel.imageRef) continue;

            try {
              const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(panel.imageRef)}`;
              const response = await fetch(proxyUrl);
              if (!response.ok) continue;

              const blob = await response.blob();
              const mimeType = blob.type || 'image/jpeg';
              const ext = mimeType.split('/')[1] || 'jpg';
              const fileName = `page${page.pageIndex + 1}_panel${panel.panelIndex + 1}.${ext}`;
              // Attach the S3 URL as a custom property so we can use it as originalImageRef
              const file = new File([blob], fileName, { type: mimeType });
              (file as File & { _s3Url?: string })._s3Url = panel.imageRef;
              files.push(file);
            } catch {
              // Skip panels that fail to load
            }
          }
        }

        if (files.length > 0 && isMountedRef.current) {
          dispatch({ type: 'ADD_FILES_TO_LIBRARY', files });
        }
      } catch {
        // Silently skip if no ImageSplitter data exists for this project
      } finally {
        if (isMountedRef.current) {
          setIsLoadingSplitterPanels(false);
        }
      }
    };

    loadSplitterPanels();
  }, [projectId]);

  // ── Persist panel to Firestore + upload original to S3 (background) ──
  const persistNewPanel = useCallback(async (panel: PanelData) => {
    if (!projectId) return;

    try {
      let originalImageRef = panel.originalImageRef;

      // If no S3 URL yet, upload original to S3
      if (!originalImageRef) {
        const base64 = await compressImage(panel.file, 1500, 0.8);
        originalImageRef = await uploadI2VPanelEditorImage(projectId, panel.id, base64, 'image/jpeg');
        // Update in-memory panel with the S3 URL
        dispatch({
          type: 'UPDATE_PANEL',
          id: panel.id,
          updates: { originalImageRef },
        });
      }

      // Save to Firestore
      await savePanelEditorPanel(projectId, panel.id, {
        panelIndex: stateRef.current.panels.findIndex((p) => p.id === panel.id),
        fileName: panel.fileName,
        originalImageRef,
        status: panel.status,
      });

      // Save/update meta
      await savePanelEditorMeta(projectId, {
        sessionId: sessionIdRef.current,
        targetAspectRatio: stateRef.current.config.targetAspectRatio,
        provider,
        totalPanels: stateRef.current.panels.length,
      });
    } catch (err) {
      console.error('Failed to persist panel:', err);
    }
  }, [projectId, provider]);

  // ── Handle panel updates from Firestore ──────────────────────────────
  const handlePanelUpdate = useCallback((update: PanelUpdate) => {
    if (!isMountedRef.current) return;

    // Only process updates for panels we're tracking
    const trackedJobId = activeJobsRef.current.get(update.panelId);
    if (!trackedJobId || trackedJobId !== update.jobId) {
      return;
    }

    // Map orchestrator status to ProcessingStatus
    let status: ProcessingStatus;
    switch (update.status) {
      case 'completed':
        status = ProcessingStatus.Success;
        break;
      case 'failed':
      case 'cancelled':
        status = ProcessingStatus.Error;
        break;
      case 'pending':
      case 'preparing':
      case 'generating':
      case 'uploading':
      case 'retrying':
        status = ProcessingStatus.Pending;
        break;
      default:
        status = ProcessingStatus.Idle;
    }

    dispatch({
      type: 'UPDATE_PANEL',
      id: update.panelId,
      updates: {
        status,
        resultUrl: update.imageUrl || undefined,
        error: update.error,
      },
    });

    // Persist result to Firestore on terminal states
    if (update.status === 'completed' && update.imageUrl && projectId) {
      updatePanelEditorPanelResult(projectId, update.panelId, update.imageUrl, ProcessingStatus.Success)
        .catch((err) => console.error('Failed to persist panel result:', err));
    } else if ((update.status === 'failed' || update.status === 'cancelled') && projectId) {
      updatePanelEditorPanelStatus(projectId, update.panelId, ProcessingStatus.Error, update.error)
        .catch((err) => console.error('Failed to persist panel status:', err));
    }

    // Clean up tracking on terminal states
    if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
      activeJobsRef.current.delete(update.panelId);
    }
  }, [projectId]);

  // Use the panel orchestrator hook (only enable after sessionId is loaded)
  const { submitJob, cancelJob, pendingUpdates, clearPendingUpdates } = usePanelOrchestrator({
    sessionId: sessionId || null,
    onPanelUpdate: handlePanelUpdate,
    enabled: !!sessionId,
  });

  // Apply pending updates from initial Firestore snapshot
  useEffect(() => {
    if (pendingUpdates.length === 0) return;

    pendingUpdates.forEach((update) => {
      const isTerminal = update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled';
      // Always set activeJobsRef so handlePanelUpdate's guard doesn't filter out the update.
      // For in-flight jobs this also re-tracks them for subsequent snapshots.
      activeJobsRef.current.set(update.panelId, update.jobId);
      handlePanelUpdate(update);
      // handlePanelUpdate already deletes terminal jobs from activeJobsRef
    });
    clearPendingUpdates();
  }, [pendingUpdates, handlePanelUpdate, clearPendingUpdates]);

  // ── Add files to library ─────────────────────────────────────────────
  const addFilesToLibrary = useCallback((files: File[]) => {
    dispatch({ type: 'ADD_FILES_TO_LIBRARY', files });
  }, []);

  // ── Import all files from library to workspace ───────────────────────
  const importAllFromLibrary = useCallback(() => {
    const libraryFiles = Object.values(state.fileLibrary) as (File & { _s3Url?: string })[];
    if (libraryFiles.length === 0) return;
    const newPanels: PanelData[] = libraryFiles.map((file) => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      status: ProcessingStatus.Idle,
      originalImageRef: file._s3Url,
    }));
    dispatch({ type: 'ADD_PANELS', panels: newPanels });
    // Persist each panel in background
    newPanels.forEach((p) => persistNewPanel(p));
  }, [state.fileLibrary, persistNewPanel]);

  // ── Add files from manifest to processing queue ──────────────────────
  const addPanelsFromManifest = useCallback((files: File[]) => {
    const newPanels: PanelData[] = files.map((file) => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      status: ProcessingStatus.Idle,
    }));
    dispatch({ type: 'ADD_PANELS', panels: newPanels });
    newPanels.forEach((p) => persistNewPanel(p));
  }, [persistNewPanel]);

  // ── Add files directly to panels (for direct upload) ─────────────────
  const addPanels = useCallback((files: File[]) => {
    const newPanels: PanelData[] = files.map((file) => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      status: ProcessingStatus.Idle,
    }));
    dispatch({ type: 'ADD_PANELS', panels: newPanels });
    newPanels.forEach((p) => persistNewPanel(p));
  }, [persistNewPanel]);

  // ── Load pre-constructed panels (for project restore from JSON) ──────
  const loadPanels = useCallback(async (panels: PanelData[], config?: Partial<PanelEditorConfig>) => {
    // Cancel active jobs and clear existing panels
    const cancelPromises: Promise<void>[] = [];
    activeJobsRef.current.forEach((jobId) => {
      cancelPromises.push(cancelJob({ jobId }).catch(console.error));
    });
    await Promise.all(cancelPromises);
    activeJobsRef.current.clear();

    // Clear Firestore data for this project
    if (projectId) {
      await clearPanelEditorData(projectId).catch(console.error);
    }

    dispatch({ type: 'CLEAR_PANELS' });
    if (config) dispatch({ type: 'SET_CONFIG', config });
    dispatch({ type: 'ADD_PANELS', panels });
    panels.forEach((p) => persistNewPanel(p));
  }, [cancelJob, projectId, persistNewPanel]);

  // ── Remove a panel ───────────────────────────────────────────────────
  const removePanel = useCallback((id: string) => {
    // Cancel any active job for this panel
    const jobId = activeJobsRef.current.get(id);
    if (jobId) {
      cancelJob({ jobId }).catch(console.error);
      activeJobsRef.current.delete(id);
    }
    dispatch({ type: 'REMOVE_PANEL', id });
    // Remove from Firestore
    if (projectId) {
      deletePanelEditorPanel(projectId, id).catch(console.error);
    }
  }, [cancelJob, projectId]);

  // ── Update config ────────────────────────────────────────────────────
  const updateConfig = useCallback((config: Partial<PanelEditorConfig>) => {
    dispatch({ type: 'SET_CONFIG', config });
    // Persist updated config
    if (projectId && sessionIdRef.current) {
      savePanelEditorMeta(projectId, {
        sessionId: sessionIdRef.current,
        targetAspectRatio: config.targetAspectRatio || stateRef.current.config.targetAspectRatio,
        provider,
        totalPanels: stateRef.current.panels.length,
      }).catch(console.error);
    }
  }, [projectId, provider]);

  // ── Process single panel via orchestrator ─────────────────────────────
  const processSinglePanel = useCallback(
    async (id: string, refinementMode: 'default' | 'zoom' | 'expand' = 'default') => {
      const panel = stateRef.current.panels.find((p) => p.id === id);
      if (!panel) return;

      // Cancel any existing job for this panel
      const existingJobId = activeJobsRef.current.get(id);
      if (existingJobId) {
        try {
          await cancelJob({ jobId: existingJobId });
        } catch {
          // Ignore cancel errors
        }
        activeJobsRef.current.delete(id);
      }

      // Update status to pending
      dispatch({
        type: 'UPDATE_PANEL',
        id,
        updates: { status: ProcessingStatus.Pending, error: undefined },
      });

      try {
        // Compress image to stay within Firestore's ~1MB document size limit
        const imageBase64 = await compressImage(panel.file, 1500, 0.8);

        // Submit job to orchestrator
        const response = await submitJob({
          projectId,
          sessionId: sessionIdRef.current,
          panelId: panel.id,
          fileName: panel.fileName,
          imageBase64,
          mimeType: 'image/jpeg',
          targetAspectRatio: stateRef.current.config.targetAspectRatio,
          refinementMode,
          apiKey: customApiKey || undefined,
          provider,
        });

        // Track this job
        activeJobsRef.current.set(id, response.jobId);

        // Status updates will come via Firestore subscription
      } catch (error: unknown) {
        if (!isMountedRef.current) return;

        if (cancelProcessingRef.current) {
          dispatch({
            type: 'UPDATE_PANEL',
            id,
            updates: { status: ProcessingStatus.Idle },
          });
          return;
        }

        dispatch({
          type: 'UPDATE_PANEL',
          id,
          updates: {
            status: ProcessingStatus.Error,
            error: error instanceof Error ? error.message : 'Processing failed',
          },
        });
      }
    },
    [projectId, customApiKey, provider, submitJob, cancelJob]
  );

  // ── Process all panels ───────────────────────────────────────────────
  const processAllPanels = useCallback(async () => {
    cancelProcessingRef.current = false;
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });

    const pendingPanels = stateRef.current.panels.filter(
      (p) => p.status === ProcessingStatus.Idle || p.status === ProcessingStatus.Error
    );

    const concurrency = 2;
    const queue = [...pendingPanels];

    const worker = async () => {
      while (queue.length > 0) {
        if (cancelProcessingRef.current) break;
        const panel = queue.shift();
        if (panel) {
          if (cancelProcessingRef.current) break;
          await processSinglePanel(panel.id);
          // Small delay between submissions to avoid overwhelming the backend
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    };

    const workers = Array(concurrency)
      .fill(null)
      .map(() => worker());
    await Promise.all(workers);

    if (cancelProcessingRef.current) {
      // Read current state to avoid resetting panels that already completed
      stateRef.current.panels.forEach((p) => {
        if (p.status === ProcessingStatus.Pending) {
          dispatch({
            type: 'UPDATE_PANEL',
            id: p.id,
            updates: { status: ProcessingStatus.Idle },
          });
        }
      });
    }

    dispatch({ type: 'SET_PROCESSING', isProcessing: false });
    cancelProcessingRef.current = false;
  }, [processSinglePanel]);

  // ── Cancel processing ────────────────────────────────────────────────
  const cancelProcessing = useCallback(async () => {
    cancelProcessingRef.current = true;

    // Cancel all active jobs
    const cancelPromises: Promise<void>[] = [];
    activeJobsRef.current.forEach((jobId) => {
      cancelPromises.push(cancelJob({ jobId }).catch(console.error));
    });
    await Promise.all(cancelPromises);
    activeJobsRef.current.clear();

    // Read current state to avoid resetting panels that already completed
    stateRef.current.panels.forEach((p) => {
      if (p.status === ProcessingStatus.Pending) {
        dispatch({
          type: 'UPDATE_PANEL',
          id: p.id,
          updates: { status: ProcessingStatus.Idle },
        });
      }
    });
    dispatch({ type: 'SET_PROCESSING', isProcessing: false });
  }, [cancelJob]);

  // ── Retry / Refine ───────────────────────────────────────────────────
  const retryPanel = useCallback(
    (id: string) => {
      processSinglePanel(id, 'default');
    },
    [processSinglePanel]
  );

  const refinePanel = useCallback(
    (id: string, mode: 'zoom' | 'expand') => {
      processSinglePanel(id, mode);
    },
    [processSinglePanel]
  );

  // ── Clear all panels ─────────────────────────────────────────────────
  const clearPanels = useCallback(async () => {
    // Cancel all active jobs first
    const cancelPromises: Promise<void>[] = [];
    activeJobsRef.current.forEach((jobId) => {
      cancelPromises.push(cancelJob({ jobId }).catch(console.error));
    });
    await Promise.all(cancelPromises);
    activeJobsRef.current.clear();

    dispatch({ type: 'CLEAR_PANELS' });

    // Clear Firestore data
    if (projectId) {
      clearPanelEditorData(projectId).catch(console.error);
    }
  }, [cancelJob, projectId]);

  // ── Computed values ──────────────────────────────────────────────────
  const successCount = state.panels.filter(
    (p) => p.status === ProcessingStatus.Success
  ).length;

  const hasResults = successCount > 0;

  return {
    state,
    sessionId,
    provider,
    setProvider,
    isLoadingSplitterPanels,
    isLoadingPanels,
    addFilesToLibrary,
    importAllFromLibrary,
    addPanelsFromManifest,
    addPanels,
    loadPanels,
    removePanel,
    updateConfig,
    processSinglePanel,
    processAllPanels,
    cancelProcessing,
    retryPanel,
    refinePanel,
    clearPanels,
    successCount,
    hasResults,
  };
}

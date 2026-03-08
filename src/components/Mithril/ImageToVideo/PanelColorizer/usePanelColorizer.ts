import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { panelColorizerReducer, initialState } from './reducer';
import {
  PanelData,
  PanelColorizerConfig,
  AspectRatio,
  ProcessingStatus,
  ReferenceImage,
} from './types';
import { usePanelColorizerOrchestrator, PanelColorizerUpdate } from './usePanelColorizerOrchestrator';
import { useMithril } from '../../MithrilContext';
import { compressImage } from '../ImageToScriptWriter/utils/imageCompression';
import { getMangaPages, getMangaPanels } from '../../services/firestore/imageSplitter';

interface UsePanelColorizerOptions {
  projectId: string;
}

// Helper to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function usePanelColorizer({ projectId }: UsePanelColorizerOptions) {
  const [state, dispatch] = useReducer(panelColorizerReducer, initialState);
  const cancelProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Generate a unique session ID for this instance
  const [sessionId, setSessionId] = useState(() => uuidv4());

  // Use the global API key from MithrilContext
  const { customApiKey } = useMithril();

  // Provider selection
  const [provider, setProvider] = useState<'gemini' | 'grok' | 'z_image_turbo' | 'flux2_dev'>('gemini');

  // Loading state for pre-populating from ImageSplitter
  const [isLoadingSplitterPanels, setIsLoadingSplitterPanels] = useState(false);

  // Track active jobs: panelId -> jobId
  const activeJobsRef = useRef<Map<string, string>>(new Map());

  // Reset state when projectId changes
  const prevProjectIdRef = useRef(projectId);
  useEffect(() => {
    if (prevProjectIdRef.current !== projectId && prevProjectIdRef.current !== '') {
      dispatch({ type: 'RESET_STATE' });
      activeJobsRef.current.clear();
      setSessionId(uuidv4());
    }
    prevProjectIdRef.current = projectId;
  }, [projectId]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeJobsRef.current.clear();
    };
  }, []);

  // Pre-populate from ImageSplitter
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
              files.push(new File([blob], fileName, { type: mimeType }));
            } catch {
              // Skip panels that fail to load
            }
          }
        }

        if (files.length > 0 && isMountedRef.current) {
          dispatch({ type: 'ADD_FILES_TO_LIBRARY', files });
        }
      } catch {
        // Silently skip if no ImageSplitter data
      } finally {
        if (isMountedRef.current) {
          setIsLoadingSplitterPanels(false);
        }
      }
    };

    loadSplitterPanels();
  }, [projectId]);

  // Handle panel updates from Firestore
  const handlePanelUpdate = useCallback((update: PanelColorizerUpdate) => {
    if (!isMountedRef.current) return;

    const trackedJobId = activeJobsRef.current.get(update.panelId);
    if (!trackedJobId || trackedJobId !== update.jobId) {
      return;
    }

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

    if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
      activeJobsRef.current.delete(update.panelId);
    }
  }, []);

  // Use the orchestrator hook
  const { submitJob, cancelJob, pendingUpdates, clearPendingUpdates } = usePanelColorizerOrchestrator({
    sessionId,
    onPanelUpdate: handlePanelUpdate,
    enabled: true,
  });

  // Apply pending updates from initial Firestore snapshot
  useEffect(() => {
    if (pendingUpdates.length === 0) return;

    pendingUpdates.forEach((update) => {
      const isTerminal = update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled';
      if (!isTerminal) {
        activeJobsRef.current.set(update.panelId, update.jobId);
      }
      handlePanelUpdate(update);
    });
    clearPendingUpdates();
  }, [pendingUpdates, handlePanelUpdate, clearPendingUpdates]);

  // Add files to library
  const addFilesToLibrary = useCallback((files: File[]) => {
    dispatch({ type: 'ADD_FILES_TO_LIBRARY', files });
  }, []);

  // Import all from library
  const importAllFromLibrary = useCallback(() => {
    const libraryFiles = Object.values(state.fileLibrary) as File[];
    if (libraryFiles.length === 0) return;
    const newPanels: PanelData[] = libraryFiles.map((file) => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      status: ProcessingStatus.Idle,
    }));
    dispatch({ type: 'ADD_PANELS', panels: newPanels });
  }, [state.fileLibrary]);

  // Add panels directly
  const addPanels = useCallback((files: File[]) => {
    const newPanels: PanelData[] = files.map((file) => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      status: ProcessingStatus.Idle,
    }));
    dispatch({ type: 'ADD_PANELS', panels: newPanels });
  }, []);

  // Add reference images
  const addReferenceImages = useCallback(async (files: File[]) => {
    const refs: ReferenceImage[] = [];
    for (const file of files) {
      const base64 = await fileToBase64(file);
      refs.push({
        id: uuidv4(),
        file,
        previewUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type || 'image/png',
      });
    }
    dispatch({ type: 'ADD_REFERENCE_IMAGES', images: refs });
  }, []);

  // Remove a reference image
  const removeReferenceImage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_REFERENCE_IMAGE', id });
  }, []);

  // Set global prompt
  const setGlobalPrompt = useCallback((prompt: string) => {
    dispatch({ type: 'SET_GLOBAL_PROMPT', prompt });
  }, []);

  // Remove a panel
  const removePanel = useCallback((id: string) => {
    const jobId = activeJobsRef.current.get(id);
    if (jobId) {
      cancelJob({ jobId }).catch(console.error);
      activeJobsRef.current.delete(id);
    }
    dispatch({ type: 'REMOVE_PANEL', id });
  }, [cancelJob]);

  // Update config
  const updateConfig = useCallback((config: Partial<PanelColorizerConfig>) => {
    dispatch({ type: 'SET_CONFIG', config });
  }, []);

  // Process single panel via orchestrator
  const processSinglePanel = useCallback(
    async (id: string) => {
      const panel = state.panels.find((p) => p.id === id);
      if (!panel) return;

      // Cancel existing job
      const existingJobId = activeJobsRef.current.get(id);
      if (existingJobId) {
        try {
          await cancelJob({ jobId: existingJobId });
        } catch {
          // Ignore cancel errors
        }
        activeJobsRef.current.delete(id);
      }

      dispatch({
        type: 'UPDATE_PANEL',
        id,
        updates: { status: ProcessingStatus.Pending, error: undefined },
      });

      try {
        // Compress image
        const imageBase64 = await compressImage(panel.file, 1500, 0.8);

        // Prepare reference images
        const referenceImages = state.referenceImages.map((ref) => ({
          base64: ref.base64,
          mimeType: ref.mimeType,
        }));

        // Submit job
        const response = await submitJob({
          projectId,
          sessionId,
          panelId: panel.id,
          fileName: panel.fileName,
          imageBase64,
          mimeType: 'image/jpeg',
          referenceImages,
          globalPrompt: state.globalPrompt,
          targetAspectRatio: state.config.targetAspectRatio,
          apiKey: customApiKey || undefined,
          provider,
        });

        activeJobsRef.current.set(id, response.jobId);
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
    [state.panels, state.config.targetAspectRatio, state.globalPrompt, state.referenceImages, projectId, sessionId, customApiKey, provider, submitJob, cancelJob]
  );

  // Process all panels
  const processAllPanels = useCallback(async () => {
    cancelProcessingRef.current = false;
    dispatch({ type: 'SET_PROCESSING', isProcessing: true });

    const pendingPanels = state.panels.filter(
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
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    };

    const workers = Array(concurrency)
      .fill(null)
      .map(() => worker());
    await Promise.all(workers);

    if (cancelProcessingRef.current) {
      state.panels.forEach((p) => {
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
  }, [state.panels, processSinglePanel]);

  // Cancel processing
  const cancelProcessing = useCallback(async () => {
    cancelProcessingRef.current = true;

    const cancelPromises: Promise<void>[] = [];
    activeJobsRef.current.forEach((jobId) => {
      cancelPromises.push(cancelJob({ jobId }).catch(console.error));
    });
    await Promise.all(cancelPromises);
    activeJobsRef.current.clear();

    state.panels.forEach((p) => {
      if (p.status === ProcessingStatus.Pending) {
        dispatch({
          type: 'UPDATE_PANEL',
          id: p.id,
          updates: { status: ProcessingStatus.Idle },
        });
      }
    });
    dispatch({ type: 'SET_PROCESSING', isProcessing: false });
  }, [state.panels, cancelJob]);

  // Retry a single panel
  const retryPanel = useCallback(
    (id: string) => {
      processSinglePanel(id);
    },
    [processSinglePanel]
  );

  // Helper: fetch an image URL and return compressed base64
  const fetchImageAsBase64 = useCallback(async (url: string): Promise<string> => {
    const fetchUrl = url.startsWith('http')
      ? `/api/mithril/s3/proxy?url=${encodeURIComponent(url)}`
      : url;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: blob.type || 'image/jpeg' });
    return compressImage(file, 1500, 0.8);
  }, []);

  // Remix: re-process the generated result with a custom user prompt
  const remixPanel = useCallback(
    async (id: string, remixPrompt: string) => {
      const panel = state.panels.find((p) => p.id === id);
      if (!panel?.resultUrl) return;

      const existingJobId = activeJobsRef.current.get(id);
      if (existingJobId) {
        try { await cancelJob({ jobId: existingJobId }); } catch { /* ignore */ }
        activeJobsRef.current.delete(id);
      }

      dispatch({ type: 'UPDATE_PANEL', id, updates: { status: ProcessingStatus.Pending, error: undefined } });

      try {
        const imageBase64 = await fetchImageAsBase64(panel.resultUrl);

        const response = await submitJob({
          projectId,
          sessionId,
          panelId: id,
          fileName: panel.fileName,
          imageBase64,
          mimeType: 'image/jpeg',
          referenceImages: [],
          globalPrompt: remixPrompt,
          targetAspectRatio: state.config.targetAspectRatio,
          apiKey: customApiKey || undefined,
          provider,
          mode: 'remix',
        });

        activeJobsRef.current.set(id, response.jobId);
      } catch (error: unknown) {
        if (!isMountedRef.current) return;
        dispatch({
          type: 'UPDATE_PANEL',
          id,
          updates: {
            status: ProcessingStatus.Error,
            error: error instanceof Error ? error.message : 'Remix failed',
          },
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.panels, state.config.targetAspectRatio, projectId, sessionId, customApiKey, provider, submitJob, cancelJob, fetchImageAsBase64]
  );

  // Time of Day: re-colorize the original panel with the generated result as color reference
  const convertTimeOfDay = useCallback(
    async (id: string, time: string) => {
      const panel = state.panels.find((p) => p.id === id);
      if (!panel?.resultUrl) return;

      const existingJobId = activeJobsRef.current.get(id);
      if (existingJobId) {
        try { await cancelJob({ jobId: existingJobId }); } catch { /* ignore */ }
        activeJobsRef.current.delete(id);
      }

      dispatch({
        type: 'UPDATE_PANEL',
        id,
        updates: { status: ProcessingStatus.Pending, error: undefined, timeOfDay: time },
      });

      try {
        const originalBase64 = await compressImage(panel.file, 1500, 0.8);
        const resultBase64 = await fetchImageAsBase64(panel.resultUrl);

        const response = await submitJob({
          projectId,
          sessionId,
          panelId: id,
          fileName: panel.fileName,
          imageBase64: originalBase64,
          mimeType: 'image/jpeg',
          referenceImages: [{ base64: resultBase64, mimeType: 'image/jpeg' }],
          globalPrompt: `Change the time of day to ${time}. Maintain the character colors from the reference image exactly.`,
          targetAspectRatio: state.config.targetAspectRatio,
          apiKey: customApiKey || undefined,
          provider,
          timeOfDay: time,
        });

        activeJobsRef.current.set(id, response.jobId);
      } catch (error: unknown) {
        if (!isMountedRef.current) return;
        dispatch({
          type: 'UPDATE_PANEL',
          id,
          updates: {
            status: ProcessingStatus.Error,
            error: error instanceof Error ? error.message : 'Time conversion failed',
            timeOfDay: undefined,
          },
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.panels, state.config.targetAspectRatio, projectId, sessionId, customApiKey, provider, submitJob, cancelJob, fetchImageAsBase64]
  );

  // Clear all panels
  const clearPanels = useCallback(async () => {
    const cancelPromises: Promise<void>[] = [];
    activeJobsRef.current.forEach((jobId) => {
      cancelPromises.push(cancelJob({ jobId }).catch(console.error));
    });
    await Promise.all(cancelPromises);
    activeJobsRef.current.clear();

    dispatch({ type: 'CLEAR_PANELS' });
  }, [cancelJob]);

  // Computed values
  const successCount = state.panels.filter(
    (p) => p.status === ProcessingStatus.Success
  ).length;

  const hasResults = successCount > 0;

  return {
    state,
    sessionId,
    isLoadingSplitterPanels,
    addFilesToLibrary,
    importAllFromLibrary,
    addPanels,
    addReferenceImages,
    removeReferenceImage,
    setGlobalPrompt,
    removePanel,
    updateConfig,
    processSinglePanel,
    processAllPanels,
    cancelProcessing,
    retryPanel,
    remixPanel,
    convertTimeOfDay,
    clearPanels,
    provider,
    setProvider,
    successCount,
    hasResults,
  };
}

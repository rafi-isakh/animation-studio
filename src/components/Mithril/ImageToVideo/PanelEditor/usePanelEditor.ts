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

// Helper to read file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove Data-URI prefix to get pure base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface UsePanelEditorOptions {
  projectId: string;  // Project ID from MithrilContext for S3 storage
}

export function usePanelEditor({ projectId }: UsePanelEditorOptions) {
  const [state, dispatch] = useReducer(panelEditorReducer, initialState);
  const cancelProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Generate a unique session ID for this panel editor instance
  const [sessionId] = useState(() => uuidv4());

  // API key for Gemini - user can provide this
  const [apiKey, setApiKey] = useState<string>('');

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

  // Handle panel updates from Firestore
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

    // Clean up tracking on terminal states
    if (update.status === 'completed' || update.status === 'failed' || update.status === 'cancelled') {
      activeJobsRef.current.delete(update.panelId);
    }
  }, []);

  // Use the panel orchestrator hook
  const { submitJob, cancelJob } = usePanelOrchestrator({
    sessionId,
    onPanelUpdate: handlePanelUpdate,
    enabled: true,
  });

  // Add files to library
  const addFilesToLibrary = useCallback((files: File[]) => {
    dispatch({ type: 'ADD_FILES_TO_LIBRARY', files });
  }, []);

  // Add files from manifest to processing queue
  const addPanelsFromManifest = useCallback((files: File[]) => {
    const newPanels: PanelData[] = files.map((file) => ({
      id: uuidv4(),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      status: ProcessingStatus.Idle,
    }));
    dispatch({ type: 'ADD_PANELS', panels: newPanels });
  }, []);

  // Add files directly to panels (for direct upload)
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

  // Remove a panel
  const removePanel = useCallback((id: string) => {
    // Cancel any active job for this panel
    const jobId = activeJobsRef.current.get(id);
    if (jobId) {
      cancelJob({ jobId }).catch(console.error);
      activeJobsRef.current.delete(id);
    }
    dispatch({ type: 'REMOVE_PANEL', id });
  }, [cancelJob]);

  // Update config
  const updateConfig = useCallback((config: Partial<PanelEditorConfig>) => {
    dispatch({ type: 'SET_CONFIG', config });
  }, []);

  // Process single panel via orchestrator
  const processSinglePanel = useCallback(
    async (id: string, refinementMode: 'default' | 'zoom' | 'expand' = 'default') => {
      const panel = state.panels.find((p) => p.id === id);
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
        // Convert file to base64
        const imageBase64 = await fileToBase64(panel.file);

        // Submit job to orchestrator
        const response = await submitJob({
          projectId,
          sessionId,
          panelId: panel.id,
          fileName: panel.fileName,
          imageBase64,
          mimeType: panel.file.type || 'image/png',
          targetAspectRatio: state.config.targetAspectRatio,
          refinementMode,
          apiKey: apiKey || undefined,
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
    [state.panels, state.config.targetAspectRatio, projectId, sessionId, apiKey, submitJob, cancelJob]
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

    // Cancel all active jobs
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
      processSinglePanel(id, 'default');
    },
    [processSinglePanel]
  );

  // Refine a panel
  const refinePanel = useCallback(
    (id: string, mode: 'zoom' | 'expand') => {
      processSinglePanel(id, mode);
    },
    [processSinglePanel]
  );

  // Clear all panels
  const clearPanels = useCallback(async () => {
    // Cancel all active jobs first
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
    apiKey,
    setApiKey,
    addFilesToLibrary,
    addPanelsFromManifest,
    addPanels,
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

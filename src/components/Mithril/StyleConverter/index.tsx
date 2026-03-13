"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { ControlBar } from './ControlBar';
import { FileLibrary } from './FileLibrary';
import { PanelCard } from './PanelCard';
import { PanelData, AppConfig, AspectRatio, ProcessingStatus } from './types';
import { useMithril } from '@/components/Mithril/MithrilContext';
import { useMithrilAuth } from '@/components/Mithril/auth/MithrilAuthContext';
import {
  subscribeToSessionStyleConverterJobs,
  mapStyleConverterJobToUpdate,
} from '@/components/Mithril/services/firestore/jobQueue';
import {
  clearStyleConverterData,
  deleteStyleConverterPanel,
  getStyleConverterMeta,
  getStyleConverterPanels,
  saveStyleConverterMeta,
  saveStyleConverterPanel,
  updateStyleConverterPanel,
} from '@/components/Mithril/services/firestore/styleConverter';
import {
  deleteI2VPanelEditorImage,
  uploadI2VPanelEditorImage,
} from '@/components/Mithril/services/s3/images';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DEBUG = false;
const log = (...args: unknown[]) => DEBUG && console.log('[StyleConverter]', ...args);
const warn = (...args: unknown[]) => DEBUG && console.warn('[StyleConverter:WARN]', ...args);
const normalizePanelFileName = (value?: string) => (value || '').trim().toLowerCase();
const fileToBase64DataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
  const arr = base64.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mimeType });
};

// Map backend job status to UI ProcessingStatus
function mapBackendStatus(status: string): ProcessingStatus {
  switch (status) {
    case 'completed': return ProcessingStatus.Success;
    case 'failed':
    case 'cancelled': return ProcessingStatus.Error;
    default: return ProcessingStatus.Pending; // pending, preparing, generating, uploading, retrying
  }
}

export default function StyleConverter() {
  const { currentProjectId } = useMithril();
  const { refreshSession } = useMithrilAuth();

  const [fileLibrary, setFileLibrary] = useState<Record<string, File>>({});
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [config, setConfig] = useState<AppConfig>({ targetAspectRatio: AspectRatio.Portrait });
  const [globalProcessing, setGlobalProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Stable session ID restored from Firestore when available
  const sessionIdRef = useRef<string>('');
  // Map panelId â†’ jobId for cancellation
  const activeJobsRef = useRef<Map<string, string>>(new Map());
  // Stable ref for reading current panels in callbacks without stale closures
  const panelsRef = useRef<PanelData[]>(panels);
  panelsRef.current = panels;
  const isLoadingRef = useRef(false);

  const persistMeta = useCallback(async (
    nextSessionId: string = sessionIdRef.current,
    nextConfig: AppConfig = config,
    totalPanels: number = panelsRef.current.length,
  ) => {
    if (!currentProjectId || !nextSessionId) return;
    await saveStyleConverterMeta(currentProjectId, {
      sessionId: nextSessionId,
      targetAspectRatio: nextConfig.targetAspectRatio,
      totalPanels,
    });
  }, [config, currentProjectId]);

  const persistPanel = useCallback(async (panel: PanelData, panelIndex: number) => {
    if (!currentProjectId) return;
    
    // Skip persisting panels that were loaded from storage - they're already persisted
    if (panel._fromStorage && panel.originalImageRef) {
      log(`SKIP persistPanel: panel="${panel.file.name}" (id=${panel.id.slice(0, 8)}...) - already in storage`);
      return;
    }
    
    log(`START persistPanel: panel="${panel.file.name}" (id=${panel.id.slice(0, 8)}...) _fromStorage=${panel._fromStorage} hasImageRef=${!!panel.originalImageRef}`);

    let originalImageRef = panel.originalImageRef;
    if (!originalImageRef) {
      log(`  uploading to S3...`);
      const dataUri = await fileToBase64DataUri(panel.file);
      originalImageRef = await uploadI2VPanelEditorImage(
        currentProjectId,
        panel.id,
        dataUri.split(',')[1],
        panel.file.type || 'image/jpeg',
      );
      log(`  S3 upload done: ${originalImageRef}`);
      setPanels((prev) => prev.map((current) => (
        current.id === panel.id ? { ...current, originalImageRef } : current
      )));
    }

    log(`  saving to Firestore...`);
    await saveStyleConverterPanel(currentProjectId, panel.id, {
      panelIndex,
      fileName: panel.fileName || panel.file.name,
      originalImageRef,
      resultImageRef: panel.resultUrl,
      status: panel.status,
      error: panel.error,
      prompt: panel.prompt,
      category: panel.category,
    });
    log(`DONE persistPanel: panel="${panel.file.name}"`);
  }, [currentProjectId]);

  const clearPersistedWorkspace = useCallback(async () => {
    if (!currentProjectId) return;

    const persistedPanels = await getStyleConverterPanels(currentProjectId).catch(() => []);
    await Promise.all(
      persistedPanels.map((panel) =>
        deleteI2VPanelEditorImage(currentProjectId, panel.id).catch(() => undefined)
      )
    );
    await clearStyleConverterData(currentProjectId).catch(() => undefined);
  }, [currentProjectId]);

  useEffect(() => {
    if (!currentProjectId || isLoadingRef.current) return;
    isLoadingRef.current = true;

    const load = async () => {
      try {
        log(`MOUNT LOAD: starting load for project=${currentProjectId.slice(0, 8)}...`);
        const meta = await getStyleConverterMeta(currentProjectId);
        const restoredSessionId = meta?.sessionId || uuidv4();
        sessionIdRef.current = restoredSessionId;
        setSessionId(restoredSessionId);
        log(`  sessionId restored: ${restoredSessionId.slice(0, 8)}...`);

        if (meta?.targetAspectRatio) {
          setConfig({ targetAspectRatio: meta.targetAspectRatio as AspectRatio });
        }

        const savedPanels = await getStyleConverterPanels(currentProjectId);
        log(`  found ${savedPanels.length} panels in Firestore`);
        if (savedPanels.length === 0) {
          log(`MOUNT LOAD: no panels to restore`);
          return;
        }

        const sortedPanels = [...savedPanels].sort((left, right) => left.panelIndex - right.panelIndex);
        const uniqueByFileName = new Map<string, typeof sortedPanels[number]>();
        const duplicatePanels: typeof sortedPanels = [];

        for (const panel of sortedPanels) {
          const normalized = normalizePanelFileName(panel.fileName);
          if (!normalized) {
            uniqueByFileName.set(panel.id, panel);
            continue;
          }
          if (uniqueByFileName.has(normalized)) {
            duplicatePanels.push(panel);
            continue;
          }
          uniqueByFileName.set(normalized, panel);
        }

        if (duplicatePanels.length > 0) {
          warn(
            `  found ${duplicatePanels.length} duplicate persisted panels (same fileName). Cleaning duplicates...`,
            duplicatePanels.map((panel) => `${panel.fileName}#${panel.id.slice(0, 8)}...`),
          );
          await Promise.all(
            duplicatePanels.map(async (panel) => {
              await deleteStyleConverterPanel(currentProjectId, panel.id).catch(() => undefined);
              await deleteI2VPanelEditorImage(currentProjectId, panel.id).catch(() => undefined);
            }),
          );
        }

        const dedupedPanels = Array.from(uniqueByFileName.values());
        log(`  deduped to ${dedupedPanels.length} unique panels by fileName`);

        const loadedPanels: PanelData[] = [];
        const nextFileLibrary: Record<string, File> = {};

        for (const savedPanel of dedupedPanels) {
          if (!savedPanel.originalImageRef) {
            warn(`  skipping panel ${savedPanel.id}: no originalImageRef`);
            continue;
          }

          try {
            log(`  loading panel: "${savedPanel.fileName}" (id=${savedPanel.id.slice(0, 8)}...)`);
            const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(savedPanel.originalImageRef)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) {
              warn(`    fetch failed status=${response.status}`);
              continue;
            }

            const blob = await response.blob();
            const mimeType = blob.type || 'image/jpeg';
            const file = new File([blob], savedPanel.fileName, { type: mimeType });
            nextFileLibrary[file.name] = file;
            loadedPanels.push({
              id: savedPanel.id,
              file,
              fileName: savedPanel.fileName,
              previewUrl: URL.createObjectURL(file),
              status: (savedPanel.status as ProcessingStatus) || ProcessingStatus.Idle,
              resultUrl: savedPanel.resultImageRef,
              error: savedPanel.error,
              prompt: savedPanel.prompt,
              category: savedPanel.category,
              originalImageRef: savedPanel.originalImageRef,
              _fromStorage: true, // Mark as loaded from storage to prevent re-persist
            });
            log(`    ✓ loaded: "${savedPanel.fileName}"`);
          } catch (e) {
            warn(`    failed to load: ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        log(`MOUNT LOAD: setting ${loadedPanels.length} panels to state`);
        setFileLibrary(nextFileLibrary);
        setPanels(loadedPanels);
      } finally {
        isLoadingRef.current = false;
      }
    };

    load();
  }, [currentProjectId]);

  // â”€â”€ Firestore subscription â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    if (!sessionId) return;
    log(`JOB SUBSCRIPTION: subscribing to jobs for sessionId=${sessionId.slice(0, 8)}...`);
    const unsubscribe = subscribeToSessionStyleConverterJobs(sessionId, (jobs) => {
      log(`JOB UPDATE: received ${jobs.length} jobs`);
      jobs.forEach((job) => {
        const update = mapStyleConverterJobToUpdate(job);
        const uiStatus = mapBackendStatus(update.status);
        log(`  job panelId=${update.panelId.slice(0,8)}... status=${update.status} uiStatus=${uiStatus}`);

        // Track jobId for cancellation
        if (update.panelId && update.jobId) {
          activeJobsRef.current.set(update.panelId, update.jobId);
        }

        setPanels((prev) =>
          prev.map((p) => {
            if (p.id !== update.panelId) return p;
            const result: PanelData = {
              ...p,
              status: uiStatus,
              progress: update.progress,
              jobId: update.jobId,
              _fromStorage: false, // Clear flag when panel is modified with job results
            };
            if (uiStatus === ProcessingStatus.Success && update.imageUrl) {
              result.resultUrl = update.imageUrl;
            }
            if (uiStatus === ProcessingStatus.Error && update.error) {
              result.error = update.error;
            }
            return result;
          })
        );

        if (currentProjectId) {
          log(`    persisting job update to Firestore...`);
          void updateStyleConverterPanel(currentProjectId, update.panelId, {
            status: uiStatus,
            resultImageRef: update.imageUrl || undefined,
            error: update.error,
          });
        }
      });

      // If no jobs are active (all terminal), clear globalProcessing
      const activeStatuses = ['pending', 'preparing', 'generating', 'uploading', 'retrying'];
      const hasActive = jobs.some((j) => activeStatuses.includes(j.status));
      if (!hasActive) {
        setGlobalProcessing(false);
      }
    });

    return () => unsubscribe();
  }, [currentProjectId, sessionId]);

  // â”€â”€ Library / panel management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleFilesAddedToLibrary = useCallback((files: File[]) => {
    log(`handleFilesAddedToLibrary: ${files.length} files added`, files.map(f => f.name));
    
    setFileLibrary((prev) => {
      const next = { ...prev };
      files.forEach((f) => { next[f.name] = f; });
      return next;
    });

    setPanels((prev) => {
      log(`  current panels: ${prev.length}`, prev.map(p => `"${p.file.name}" (id=${p.id.slice(0,8)}... _fromStorage=${p._fromStorage})`));
      const existingNames = new Set(prev.map((p) => normalizePanelFileName(p.file.name)));
      const incomingSeenNames = new Set<string>();
      const duplicateFiles: File[] = [];
      const newFiles: File[] = [];

      for (const file of files) {
        const normalized = normalizePanelFileName(file.name);
        if (existingNames.has(normalized) || incomingSeenNames.has(normalized)) {
          duplicateFiles.push(file);
          continue;
        }
        incomingSeenNames.add(normalized);
        newFiles.push(file);
      }
      
      if (duplicateFiles.length > 0) {
        log(`  skipping ${duplicateFiles.length} duplicates:`, duplicateFiles.map(f => f.name));
      }
      
      const newPanels: PanelData[] = newFiles.map((file) => ({
        id: uuidv4(),
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        status: ProcessingStatus.Idle,
        // Don't set _fromStorage for newly added files - they need to be persisted
      }));
      
      log(`  creating ${newPanels.length} new panels:`, newPanels.map(p => `"${p.file.name}"`));
      newPanels.forEach((panel, index) => {
        log(`  persisting panel ${index}: "${panel.file.name}"`);
        void persistPanel(panel, prev.length + index);
      });
      void persistMeta(sessionIdRef.current || uuidv4(), config, prev.length + newPanels.length);
      return [...prev, ...newPanels];
    });
  }, [config, persistMeta, persistPanel]);

  const handleApplyPrompts = useCallback(
    (promptsData: { filename: string; prompt: string; category?: string }[]) => {
      setPanels((prev) =>
        prev.map((panel) => {
          const match = promptsData.find(
            (p) => p.filename.toLowerCase() === panel.file.name.toLowerCase(),
          );
          if (!match) return panel;
          const updatedPanel = { ...panel, prompt: match.prompt, category: match.category, _fromStorage: false };
          if (currentProjectId) {
            void updateStyleConverterPanel(currentProjectId, panel.id, {
              prompt: match.prompt,
              category: match.category,
            });
          }
          return updatedPanel;
        }),
      );
    },
    [currentProjectId],
  );

  const removePanel = useCallback((id: string) => {
    setPanels((prev) => {
      const panel = prev.find((p) => p.id === id);
      if (panel?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(panel.previewUrl);
      const nextPanels = prev.filter((p) => p.id !== id);
      if (currentProjectId) {
        void deleteI2VPanelEditorImage(currentProjectId, id).catch(() => undefined);
        void deleteStyleConverterPanel(currentProjectId, id);
        void persistMeta(sessionIdRef.current, config, nextPanels.length);
      }
      return nextPanels;
    });
  }, [config, currentProjectId, persistMeta]);

  const handleUpdatePrompt = useCallback((id: string, newPrompt: string) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, prompt: newPrompt, _fromStorage: false } : p)));
    if (currentProjectId) {
      void updateStyleConverterPanel(currentProjectId, id, { prompt: newPrompt });
    }
  }, [currentProjectId]);

  // â”€â”€ Processing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const submitSinglePanel = useCallback(
    async (id: string) => {
      const panel = panelsRef.current.find((p) => p.id === id);
      if (!panel) return;

      setPanels((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: ProcessingStatus.Pending, error: undefined, progress: 0 } : p)),
      );

      try {
        const dataUri = await fileToBase64DataUri(panel.file);
        const imageBase64 = dataUri.split(',')[1];
        const mimeType = panel.file.type || 'image/jpeg';
        const prompts = panel.prompt?.trim() || 'masterpiece, best quality, detailed illustration, anime style';

        const response = await fetch('/api/style-converter/orchestrator/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: currentProjectId || 'default',
            sessionId: sessionIdRef.current,
            panelId: id,
            fileName: panel.file.name,
            imageBase64,
            mimeType,
            prompts,
            targetAspectRatio: config.targetAspectRatio,
          }),
        });

        const data = await response.json();
        if (response.status === 401) {
          await refreshSession();
          throw new Error('Session expired. Please log in again.');
        }
        if (!response.ok) throw new Error(data.error || `Submit failed (${response.status})`);

        if (data.jobId) {
          activeJobsRef.current.set(id, data.jobId);
        }
        if (currentProjectId) {
          void updateStyleConverterPanel(currentProjectId, id, {
            status: ProcessingStatus.Pending,
            error: undefined,
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setPanels((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: ProcessingStatus.Error, error: message } : p)),
        );
        if (currentProjectId) {
          void updateStyleConverterPanel(currentProjectId, id, {
            status: ProcessingStatus.Error,
            error: message,
          });
        }
      }
    },
    [config.targetAspectRatio, currentProjectId, refreshSession],
  );

  const handleProcessAll = useCallback(async () => {
    setGlobalProcessing(true);

    const pending = panelsRef.current.filter(
      (p) => p.status === ProcessingStatus.Idle || p.status === ProcessingStatus.Error,
    );

    // Submit all panels concurrently (backend throttles via MAX_CONCURRENT_JOBS_PER_PROJECT)
    await Promise.all(pending.map((p) => submitSinglePanel(p.id)));
  }, [submitSinglePanel]);

  const handleCancelAll = useCallback(async () => {
    // Cancel all active jobs via the orchestrator
    const cancelPromises: Promise<void>[] = [];
    activeJobsRef.current.forEach((jobId) => {
      cancelPromises.push(
        fetch('/api/style-converter/orchestrator/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        }).then(() => undefined).catch(() => undefined)
      );
    });
    await Promise.all(cancelPromises);
    activeJobsRef.current.clear();

    setPanels((prev) =>
      prev.map((p) =>
        p.status === ProcessingStatus.Pending ? { ...p, status: ProcessingStatus.Idle } : p,
      ),
    );
    setGlobalProcessing(false);
  }, []);

  const handleClearAll = useCallback(async () => {
    if (panelsRef.current.length === 0 && Object.keys(fileLibrary).length === 0) {
      return;
    }

    const confirmed = window.confirm('Clear the Style Converter workspace? This removes all local and persisted panel data for this project.');
    if (!confirmed) {
      return;
    }

    const cancelPromises: Promise<void>[] = [];
    activeJobsRef.current.forEach((jobId) => {
      cancelPromises.push(
        fetch('/api/style-converter/orchestrator/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        }).then(() => undefined).catch(() => undefined)
      );
    });
    await Promise.all(cancelPromises);
    activeJobsRef.current.clear();

    panelsRef.current.forEach((panel) => {
      if (panel.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(panel.previewUrl);
      }
    });

    await clearPersistedWorkspace();

    const nextSessionId = uuidv4();
    sessionIdRef.current = nextSessionId;
    setSessionId(nextSessionId);
    setFileLibrary({});
    setPanels([]);
    setGlobalProcessing(false);
  }, [clearPersistedWorkspace, fileLibrary]);

  const handleRetry = useCallback(
    (id: string) => {
      submitSinglePanel(id);
    },
    [submitSinglePanel],
  );

  // â”€â”€ Download ZIP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleDownloadAll = useCallback(async () => {
    const successful = panelsRef.current.filter(
      (p) => p.status === ProcessingStatus.Success && p.resultUrl,
    );
    if (successful.length === 0) return;

    const zip = new JSZip();
    const usedNames = new Set<string>();

    await Promise.all(
      successful.map(async (panel) => {
        let fileName = panel.file.name;
        if (usedNames.has(fileName)) {
          const parts = fileName.split('.');
          const ext = parts.pop();
          const base = parts.join('.');
          let counter = 1;
          while (usedNames.has(fileName)) { fileName = `${base} (${counter++}).${ext}`; }
        }
        usedNames.add(fileName);

        const url = panel.resultUrl!;
        if (url.startsWith('data:')) {
          // Legacy base64 data URI
          const base64Data = url.split(',')[1];
          zip.file(fileName, base64Data, { base64: true });
        } else {
          // CloudFront / S3 URL â€” fetch via proxy to avoid CORS
          const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(url)}`;
          const res = await fetch(proxyUrl);
          const blob = await res.blob();
          zip.file(fileName, blob);
        }
      })
    );

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `style-converter-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate ZIP.');
    }
  }, []);

  // â”€â”€ Save / Load project JSON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleSaveProject = async () => {
    if (panels.length === 0) return;
    try {
      const serializable = await Promise.all(
        panels.map(async (p) => ({
          id: p.id,
          status: p.status,
          resultUrl: p.resultUrl,
          error: p.error,
          prompt: p.prompt,
          category: p.category,
          originalData: await fileToBase64DataUri(p.file),
          originalName: p.file.name,
          originalType: p.file.type,
        })),
      );

      const blob = new Blob(
        [JSON.stringify({ version: 1, createdAt: new Date().toISOString(), config, panels: serializable })],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `style-converter-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to save project.');
    }
  };

  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        log(`handleLoadProject: loading "${file.name}"`);
        const json = JSON.parse(ev.target?.result as string);
        if (json.config) setConfig(json.config);
        if (json.panels && Array.isArray(json.panels)) {
          log(`  found ${json.panels.length} panels in JSON`);
          const loaded: PanelData[] = json.panels.map((p: {
            id?: string;
            originalData: string;
            originalName: string;
            originalType: string;
            status: ProcessingStatus;
            resultUrl?: string;
            error?: string;
            prompt?: string;
            category?: string;
          }) => {
            const f = base64ToFile(p.originalData, p.originalName, p.originalType);
            return {
              id: p.id || uuidv4(),
              file: f,
              fileName: f.name,
              previewUrl: URL.createObjectURL(f),
              status: p.status,
              resultUrl: p.resultUrl,
              error: p.error,
              prompt: p.prompt,
              category: p.category,
            };
          });
          if (currentProjectId) {
            log(`  clearing persisted workspace...`);
            await clearPersistedWorkspace();
            const restoredSessionId = sessionIdRef.current || uuidv4();
            sessionIdRef.current = restoredSessionId;
            setSessionId(restoredSessionId);
            log(`  persisting ${loaded.length} panels...`);
            await Promise.all(loaded.map((panel, index) => persistPanel(panel, index)));
            await persistMeta(restoredSessionId, json.config || config, loaded.length);
            log(`  persisting meta done`);
          }
          setFileLibrary(Object.fromEntries(loaded.map((panel) => [panel.file.name, panel.file])));
          setPanels(loaded);
          log(`handleLoadProject: complete`);
        }
      } catch (e) {
        warn(`handleLoadProject error: ${e instanceof Error ? e.message : String(e)}`);
        alert('Invalid project file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const successCount = panels.filter((p) => p.status === ProcessingStatus.Success).length;

  return (
    <div className="flex flex-col bg-gray-900 text-gray-100">
      <ControlBar
        config={config}
        onConfigChange={(c) => {
          const nextConfig = { ...config, ...c };
          setConfig(nextConfig);
          void persistMeta(sessionIdRef.current, nextConfig, panelsRef.current.length);
        }}
        onProcessAll={handleProcessAll}
        onCancel={handleCancelAll}
        onClearAll={handleClearAll}
        onDownloadAll={handleDownloadAll}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        isProcessing={globalProcessing}
        panelCount={panels.length}
        successCount={successCount}
      />

      <main className="w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-8">
        {/* Data Storage + CSV import */}
        <section>
          <FileLibrary
            files={fileLibrary}
            onFilesAdded={handleFilesAddedToLibrary}
            onApplyPrompts={handleApplyPrompts}
          />
        </section>

        {/* Workspace */}
        <section className="flex flex-col gap-6 pb-20">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-gray-300">Workspace</h2>
            <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
              {panels.length} items
            </span>
            {successCount > 0 && (
              <span className="text-xs bg-green-900/40 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                {successCount} done
              </span>
            )}
          </div>

          {panels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <p className="text-sm">Add images in the Data Storage above to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {panels.map((panel) => (
                <PanelCard
                  key={panel.id}
                  panel={panel}
                  onRemove={removePanel}
                  onRetry={handleRetry}
                  onUpdatePrompt={handleUpdatePrompt}
                  targetRatio={config.targetAspectRatio}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

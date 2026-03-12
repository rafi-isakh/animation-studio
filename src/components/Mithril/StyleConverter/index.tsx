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

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function StyleConverter() {
  const { currentProjectId } = useMithril();
  const { refreshSession } = useMithrilAuth();

  const [fileLibrary, setFileLibrary] = useState<Record<string, File>>({});
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [config, setConfig] = useState<AppConfig>({ targetAspectRatio: AspectRatio.Portrait });
  const [globalProcessing, setGlobalProcessing] = useState(false);

  // Stable session ID for this component mount â€” used to correlate Firestore jobs
  const sessionIdRef = useRef<string>(uuidv4());
  // Map panelId â†’ jobId for cancellation
  const activeJobsRef = useRef<Map<string, string>>(new Map());
  // Stable ref for reading current panels in callbacks without stale closures
  const panelsRef = useRef<PanelData[]>(panels);
  panelsRef.current = panels;

  // â”€â”€ Firestore subscription â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const unsubscribe = subscribeToSessionStyleConverterJobs(sessionId, (jobs) => {
      jobs.forEach((job) => {
        const update = mapStyleConverterJobToUpdate(job);
        const uiStatus = mapBackendStatus(update.status);

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
      });

      // If no jobs are active (all terminal), clear globalProcessing
      const activeStatuses = ['pending', 'preparing', 'generating', 'uploading', 'retrying'];
      const hasActive = jobs.some((j) => activeStatuses.includes(j.status));
      if (!hasActive) {
        setGlobalProcessing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // â”€â”€ Library / panel management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleFilesAddedToLibrary = useCallback((files: File[]) => {
    setFileLibrary((prev) => {
      const next = { ...prev };
      files.forEach((f) => { next[f.name] = f; });
      return next;
    });

    setPanels((prev) => {
      const existingNames = new Set(prev.map((p) => p.file.name));
      const newPanels: PanelData[] = files
        .filter((f) => !existingNames.has(f.name))
        .map((file) => ({
          id: uuidv4(),
          file,
          previewUrl: URL.createObjectURL(file),
          status: ProcessingStatus.Idle,
        }));
      return [...prev, ...newPanels];
    });
  }, []);

  const handleApplyPrompts = useCallback(
    (promptsData: { filename: string; prompt: string; category?: string }[]) => {
      setPanels((prev) =>
        prev.map((panel) => {
          const match = promptsData.find(
            (p) => p.filename.toLowerCase() === panel.file.name.toLowerCase(),
          );
          return match ? { ...panel, prompt: match.prompt, category: match.category } : panel;
        }),
      );
    },
    [],
  );

  const removePanel = useCallback((id: string) => {
    setPanels((prev) => {
      const panel = prev.find((p) => p.id === id);
      if (panel?.previewUrl?.startsWith('blob:')) URL.revokeObjectURL(panel.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleUpdatePrompt = useCallback((id: string, newPrompt: string) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, prompt: newPrompt } : p)));
  }, []);

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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setPanels((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: ProcessingStatus.Error, error: message } : p)),
        );
      }
    },
    [config.targetAspectRatio, currentProjectId],
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
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.config) setConfig(json.config);
        if (json.panels && Array.isArray(json.panels)) {
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
              previewUrl: URL.createObjectURL(f),
              status: p.status,
              resultUrl: p.resultUrl,
              error: p.error,
              prompt: p.prompt,
              category: p.category,
            };
          });
          setPanels(loaded);
        }
      } catch {
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
        onConfigChange={(c) => setConfig((prev) => ({ ...prev, ...c }))}
        onProcessAll={handleProcessAll}
        onCancel={handleCancelAll}
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

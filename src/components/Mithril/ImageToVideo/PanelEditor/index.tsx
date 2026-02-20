"use client";

import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { ControlBar } from './ControlBar';
import { FileLibrary } from './FileLibrary';
import { PanelCard } from './PanelCard';
import { usePanelEditor } from './usePanelEditor';
import { useMithril } from '../../MithrilContext';
import { ProcessingStatus, PanelData } from './types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcnUI/Select';

// Helper to read file to base64 for saving JSON
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

// Helper base64 to File for loading JSON
const base64ToFile = (
  base64: string,
  filename: string,
  mimeType: string
): File => {
  const arr = base64.split(',');
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeType });
};

// Re-export types for external consumers
export type {
  AspectRatio,
  ProcessingStatus,
  PanelData,
  PanelEditorConfig,
  PanelEditorState,
} from './types';

export default function PanelEditor() {
  const { currentProjectId } = useMithril();

  const {
    state,
    provider,
    setProvider,
    addFilesToLibrary,
    addPanelsFromManifest,
    addPanels,
    removePanel,
    updateConfig,
    processAllPanels,
    cancelProcessing,
    retryPanel,
    refinePanel,
    successCount,
  } = usePanelEditor({ projectId: currentProjectId || '' });

  const { fileLibrary, panels, config, isProcessing } = state;

  // Bulk Download ZIP
  const handleDownloadAll = useCallback(async () => {
    const successfulPanels = panels.filter(
      (p) => p.status === ProcessingStatus.Success && p.resultUrl
    );
    if (successfulPanels.length === 0) return;

    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (const panel of successfulPanels) {
      // Logic to preserve original filename
      let originalName = panel.fileName;
      const lastDotIndex = originalName.lastIndexOf('.');
      let baseName =
        lastDotIndex !== -1
          ? originalName.substring(0, lastDotIndex)
          : originalName;

      // Ensure unique filenames in zip
      let fileName = `${baseName}-edited.png`;
      let counter = 1;
      while (usedNames.has(fileName)) {
        fileName = `${baseName}-edited-${counter}.png`;
        counter++;
      }
      usedNames.add(fileName);

      // resultUrl can be data:image/png;base64,..., blob:, or https:// (S3)
      if (panel.resultUrl?.startsWith('data:')) {
        const base64Data = panel.resultUrl.split(',')[1];
        zip.file(fileName, base64Data, { base64: true });
      } else if (panel.resultUrl?.startsWith('blob:') || panel.resultUrl?.startsWith('http')) {
        // Handle blob URLs and remote URLs (S3)
        try {
          const response = await fetch(panel.resultUrl);
          const blob = await response.blob();
          zip.file(fileName, blob);
        } catch (err) {
          console.error(`Failed to fetch image for ${fileName}`, err);
        }
      }
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `panel-editor-batch-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP', err);
      alert('Failed to generate ZIP file.');
    }
  }, [panels]);

  // Save Project to JSON
  const handleSaveProject = async () => {
    if (panels.length === 0) return;

    try {
      const serializablePanels = await Promise.all(
        panels.map(async (p) => {
          const base64Original = await fileToBase64(p.file);
          return {
            id: p.id,
            status: p.status,
            resultUrl: p.resultUrl,
            error: p.error,
            originalData: base64Original,
            originalName: p.fileName,
            originalType: p.file.type,
          };
        })
      );

      const data = {
        version: 1,
        createdAt: new Date().toISOString(),
        config,
        panels: serializablePanels,
      };

      const blob = new Blob([JSON.stringify(data)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `panel-editor-project-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to save project', err);
      alert('Failed to save project.');
    }
  };

  // Load Project from JSON
  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (json.config) updateConfig(json.config);
        if (json.panels && Array.isArray(json.panels)) {
          const loadedPanels: PanelData[] = json.panels.map((p: any) => {
            const file = base64ToFile(
              p.originalData,
              p.originalName,
              p.originalType
            );
            return {
              id: p.id || uuidv4(),
              file: file,
              previewUrl: URL.createObjectURL(file),
              fileName: p.originalName,
              status: p.status,
              resultUrl: p.resultUrl,
              error: p.error,
            };
          });
          // Clear existing panels first then add loaded ones
          // This is a simplified approach; a more robust solution would use the reducer
          loadedPanels.forEach((panel) => {
            addPanels([panel.file]);
          });
        }
      } catch (err) {
        console.error('Failed to load project', err);
        alert('Invalid project file or format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Panel Editor</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Transform comic panels into text-free illustrations with AI
        </p>
      </div>

      {/* Settings: Provider */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            AI Provider
          </label>
          <Select
            value={provider}
            onValueChange={(v) => setProvider(v as 'gemini' | 'grok')}
            disabled={state.isProcessing}
          >
            <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectItem value="gemini" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">Gemini <span className="text-gray-500 dark:text-gray-400 font-normal">(gemini-2.0-flash-exp)</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Google — image editing with source image</span>
                </div>
              </SelectItem>
              <SelectItem value="grok" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">Grok Aurora <span className="text-gray-500 dark:text-gray-400 font-normal">(grok-2-image-1212)</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">xAI — vision analysis + image generation</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {provider === 'grok' && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Enter your xAI API key in the field above
            </p>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <ControlBar
        config={config}
        onConfigChange={updateConfig}
        onProcessAll={processAllPanels}
        onCancel={cancelProcessing}
        onDownloadAll={handleDownloadAll}
        onSaveProject={handleSaveProject}
        onLoadProject={handleLoadProject}
        isProcessing={isProcessing}
        panelCount={panels.length}
        successCount={successCount}
      />

      {/* Data Storage Section */}
      <FileLibrary
        files={fileLibrary}
        onFilesAdded={addFilesToLibrary}
        onManifestLoaded={addPanelsFromManifest}
      />

      {/* Workspace / Processing Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Workspace</h3>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {panels.length} items
          </span>
        </div>

        {panels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <p className="text-lg">
              Upload files or load via manifest to begin
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {panels.map((panel) => (
              <PanelCard
                key={panel.id}
                panel={panel}
                onRemove={removePanel}
                onRetry={retryPanel}
                onRefine={refinePanel}
                targetRatio={config.targetAspectRatio}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useCallback, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import { usePanelColorizer } from './usePanelColorizer';
import { useMithril } from '../../MithrilContext';
import { ProcessingStatus, PanelData, AspectRatio } from './types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcnUI/Select';

// Helper to read file to base64 for saving JSON
const fileToBase64Full = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

type ViewMode = 'upload' | 'editor';

export default function PanelColorizer() {
  const { currentProjectId } = useMithril();
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('upload');

  const {
    state,
    isLoadingSplitterPanels,
    addFilesToLibrary,
    importAllFromLibrary,
    addPanels,
    addReferenceImages,
    removeReferenceImage,
    setGlobalPrompt,
    removePanel,
    updateConfig,
    processAllPanels,
    cancelProcessing,
    retryPanel,
    remixPanel,
    convertTimeOfDay,
    provider,
    setProvider,
    successCount,
  } = usePanelColorizer({ projectId: currentProjectId || '' });

  const { fileLibrary, panels, referenceImages, globalPrompt, config, isProcessing } = state;

  // Handle file drop/select for panels
  const handlePanelDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        addFilesToLibrary(files);
      }
    },
    [addFilesToLibrary]
  );

  // Handle reference file selection
  const handleReferenceSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) {
        addReferenceImages(files);
      }
      e.target.value = '';
    },
    [addReferenceImages]
  );

  // Bulk Download ZIP
  const handleDownloadAll = useCallback(async () => {
    const successfulPanels = panels.filter(
      (p) => p.status === ProcessingStatus.Success && p.resultUrl
    );
    if (successfulPanels.length === 0) return;

    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (const panel of successfulPanels) {
      let originalName = panel.fileName;
      const lastDotIndex = originalName.lastIndexOf('.');
      let baseName =
        lastDotIndex !== -1
          ? originalName.substring(0, lastDotIndex)
          : originalName;

      let fileName = `${baseName}-colorized.png`;
      let counter = 1;
      while (usedNames.has(fileName)) {
        fileName = `${baseName}-colorized-${counter}.png`;
        counter++;
      }
      usedNames.add(fileName);

      if (panel.resultUrl?.startsWith('data:')) {
        const base64Data = panel.resultUrl.split(',')[1];
        zip.file(fileName, base64Data, { base64: true });
      } else if (panel.resultUrl?.startsWith('blob:') || panel.resultUrl?.startsWith('http')) {
        try {
          const fetchUrl = panel.resultUrl.startsWith('http')
            ? `/api/mithril/s3/proxy?url=${encodeURIComponent(panel.resultUrl)}`
            : panel.resultUrl;
          const response = await fetch(fetchUrl);
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
      a.download = `colorized-panels-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate ZIP', err);
    }
  }, [panels]);

  if (viewMode === 'editor') {
    return (
      <PanelEditor
        panels={panels}
        onBack={() => setViewMode('upload')}
        onDownloadAll={handleDownloadAll}
        onRegenerate={retryPanel}
        onRemix={remixPanel}
        onConvertTimeOfDay={convertTimeOfDay}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Panel Colorizer</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Colorize B&W manga panels into full-color anime-style images with AI
        </p>
      </div>

      {/* Settings */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
        {/* Aspect Ratio */}
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Output Aspect Ratio
          </label>
          <Select
            value={config.targetAspectRatio}
            onValueChange={(v) => updateConfig({ targetAspectRatio: v as AspectRatio })}
            disabled={isProcessing}
          >
            <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Select ratio" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectItem value="16:9" className="cursor-pointer">16:9 (Landscape)</SelectItem>
              <SelectItem value="9:16" className="cursor-pointer">9:16 (Portrait)</SelectItem>
              <SelectItem value="1:1" className="cursor-pointer">1:1 (Square)</SelectItem>
              <SelectItem value="4:3" className="cursor-pointer">4:3 (Standard)</SelectItem>
              <SelectItem value="3:4" className="cursor-pointer">3:4 (Wide)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AI Provider */}
        <div className="max-w-xs">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            AI Provider
          </label>
          <Select
            value={provider}
            onValueChange={(v) => setProvider(v as 'gemini' | 'gemini_flash' | 'grok' | 'z_image_turbo' | 'flux2_dev')}
            disabled={isProcessing}
          >
            <SelectTrigger className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
              <SelectItem value="gemini" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">Gemini <span className="text-gray-500 dark:text-gray-400 font-normal">(gemini-3-pro-image-preview)</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Google — supports reference images for color extraction</span>
                </div>
              </SelectItem>
              <SelectItem value="gemini_flash" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">Gemini Flash <span className="text-gray-500 dark:text-gray-400 font-normal">(gemini-3.1-flash-image-preview)</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Google — fast generation, supports reference images</span>
                </div>
              </SelectItem>
              <SelectItem value="grok" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">Grok Aurora <span className="text-gray-500 dark:text-gray-400 font-normal">(grok-2-image-1212)</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">xAI — prompt-only colorization (no reference images)</span>
                </div>
              </SelectItem>
              <SelectItem value="z_image_turbo" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">Z-Image Turbo <span className="text-gray-500 dark:text-gray-400 font-normal">(z-image-turbo)</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">ModelsLab — fast image-to-image (no reference images)</span>
                </div>
              </SelectItem>
              <SelectItem value="flux2_dev" className="cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-medium">Flux2 Dev <span className="text-gray-500 dark:text-gray-400 font-normal">(flux-2-dev)</span></span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">ModelsLab — Flux2 image-to-image (no reference images)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {(provider === 'grok' || provider === 'z_image_turbo' || provider === 'flux2_dev') && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Enter your {provider === 'grok' ? 'xAI' : 'ModelsLab'} API key in the field above. Reference images will not be used with this provider.
            </p>
          )}
        </div>

        {/* Color References */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Color References (Character Sheets)
          </label>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            Upload character sheets to extract hair color, eye color, and skin tone for colorization
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {referenceImages.map((ref) => (
              <div key={ref.id} className="relative group">
                <img
                  src={ref.previewUrl}
                  alt="Reference"
                  className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                />
                <button
                  onClick={() => removeReferenceImage(ref.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() => referenceInputRef.current?.click()}
              className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400 hover:border-[#DB2777] hover:text-[#DB2777] transition-colors"
              disabled={isProcessing}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <input
            ref={referenceInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleReferenceSelect}
            className="hidden"
          />
        </div>

        {/* Global Prompt */}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Scene Description (Optional)
          </label>
          <textarea
            value={globalPrompt}
            onChange={(e) => setGlobalPrompt(e.target.value)}
            placeholder="Describe lighting, atmosphere, time of day, color palette... (e.g., 'warm sunset lighting, golden hour, soft shadows')"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#DB2777]"
            rows={2}
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {panels.length} panels
          </span>
          {successCount > 0 && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              {successCount} colorized
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {successCount > 0 && (
            <button
              onClick={handleDownloadAll}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Download ZIP
            </button>
          )}
          {successCount > 0 && (
            <button
              onClick={() => setViewMode('editor')}
              className="px-3 py-1.5 text-xs font-medium text-[#DB2777] dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-md hover:bg-pink-100 dark:hover:bg-pink-900/40"
            >
              Go to Editor →
            </button>
          )}
          {isProcessing ? (
            <button
              onClick={cancelProcessing}
              className="px-4 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={processAllPanels}
              disabled={panels.length === 0}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#DB2777] hover:bg-[#BE185D] rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Colorize All
            </button>
          )}
        </div>
      </div>

      {/* File Library */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">File Library</h3>
          <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
            {Object.keys(fileLibrary).length} files
          </span>
          {isLoadingSplitterPanels && (
            <span className="text-xs text-[#DB2777]">Loading from ImageSplitter...</span>
          )}
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handlePanelDrop}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-[#DB2777] dark:hover:border-[#DB2777] transition-colors"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;
            input.onchange = (e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length > 0) addFilesToLibrary(files);
            };
            input.click();
          }}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drop manga panels here or click to browse
          </p>
        </div>

        {/* Library file list + Import All */}
        {Object.keys(fileLibrary).length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
              {Object.keys(fileLibrary).map((name) => (
                <span
                  key={name}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded"
                >
                  {name}
                </span>
              ))}
            </div>
            <button
              onClick={importAllFromLibrary}
              className="px-3 py-1.5 text-xs font-medium text-[#DB2777] dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-md hover:bg-pink-100 dark:hover:bg-pink-900/40 whitespace-nowrap ml-2"
            >
              Import All
            </button>
          </div>
        )}
      </div>

      {/* Workspace / Panel Grid */}
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
              Upload manga panels and add to workspace to begin colorization
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Panel Card Component
function PanelCard({
  panel,
  onRemove,
  onRetry,
}: {
  panel: PanelData;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const statusLabel = (() => {
    switch (panel.status) {
      case ProcessingStatus.Idle:
        return null;
      case ProcessingStatus.Pending:
        return (
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full animate-pulse">
            Colorizing...
          </span>
        );
      case ProcessingStatus.Success:
        return (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
            Colorized
          </span>
        );
      case ProcessingStatus.Error:
        return (
          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
            Error
          </span>
        );
    }
  })();

  const resultSrc = panel.resultUrl?.startsWith('http')
    ? `/api/mithril/s3/proxy?url=${encodeURIComponent(panel.resultUrl)}`
    : panel.resultUrl;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
            {panel.fileName}
          </span>
          {statusLabel}
        </div>
        <div className="flex items-center gap-1">
          {(panel.status === ProcessingStatus.Error || panel.status === ProcessingStatus.Success) && (
            <button
              onClick={() => onRetry(panel.id)}
              className="px-2 py-1 text-xs text-[#DB2777] dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded"
              title="Retry colorization"
            >
              Retry
            </button>
          )}
          <button
            onClick={() => onRemove(panel.id)}
            className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Remove"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Content: Side by side comparison */}
      <div className="grid grid-cols-2 gap-0">
        {/* Original */}
        <div className="border-r border-gray-200 dark:border-gray-700">
          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-900/50 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Original</span>
          </div>
          <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            <img
              src={panel.previewUrl}
              alt="Original"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Colorized */}
        <div>
          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-900/50 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Colorized</span>
          </div>
          <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
            {panel.status === ProcessingStatus.Pending ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">Processing...</span>
              </div>
            ) : panel.status === ProcessingStatus.Success && resultSrc ? (
              <div className="relative group/img w-full h-full flex items-center justify-center">
                <img
                  src={resultSrc}
                  alt="Colorized"
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(resultSrc);
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        const lastDot = panel.fileName.lastIndexOf('.');
                        const baseName = lastDot !== -1 ? panel.fileName.substring(0, lastDot) : panel.fileName;
                        link.download = `${baseName}-colorized.png`;
                        link.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error('Failed to download image', err);
                      }
                    }}
                    className="bg-black/70 text-white p-2 rounded hover:bg-black/90"
                    title="Download Image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : panel.status === ProcessingStatus.Error ? (
              <div className="text-center p-4">
                <span className="text-xs text-red-400">{panel.error || 'Processing failed'}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Not processed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel Editor View ────────────────────────────────────────────────────────

const TIME_OF_DAY_OPTIONS = ['Morning', 'Daylight', 'Evening', 'Night'] as const;

function PanelEditor({
  panels,
  onBack,
  onDownloadAll,
  onRegenerate,
  onRemix,
  onConvertTimeOfDay,
}: {
  panels: PanelData[];
  onBack: () => void;
  onDownloadAll: () => void;
  onRegenerate: (id: string) => void;
  onRemix: (id: string, prompt: string) => void;
  onConvertTimeOfDay: (id: string, time: string) => void;
}) {
  const completedPanels = panels.filter((p) => p.status === ProcessingStatus.Success && p.resultUrl);

  return (
    <div className="space-y-4">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg sticky top-0 z-10">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Panel Editor</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Review, refine, and remix your results</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ← Back to Upload
          </button>
          {completedPanels.length > 0 && (
            <button
              onClick={onDownloadAll}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Download All (ZIP)
            </button>
          )}
        </div>
      </div>

      {/* Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {panels.map((panel, index) => (
          <EditorPanelCard
            key={panel.id}
            panel={panel}
            index={index}
            onRegenerate={onRegenerate}
            onRemix={onRemix}
            onConvertTimeOfDay={onConvertTimeOfDay}
          />
        ))}
      </div>

      {panels.length === 0 && (
        <div className="py-16 text-center text-gray-500 dark:text-gray-400">
          <p>No panels in workspace. Go back to upload panels first.</p>
        </div>
      )}
    </div>
  );
}

function EditorPanelCard({
  panel,
  index,
  onRegenerate,
  onRemix,
  onConvertTimeOfDay,
}: {
  panel: PanelData;
  index: number;
  onRegenerate: (id: string) => void;
  onRemix: (id: string, prompt: string) => void;
  onConvertTimeOfDay: (id: string, time: string) => void;
}) {
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixPrompt, setRemixPrompt] = useState('');

  const resultSrc = panel.resultUrl?.startsWith('http')
    ? `/api/mithril/s3/proxy?url=${encodeURIComponent(panel.resultUrl)}`
    : panel.resultUrl;

  const isProcessing = panel.status === ProcessingStatus.Pending;
  const hasResult = panel.status === ProcessingStatus.Success && resultSrc;

  const handleRemixSubmit = () => {
    if (!remixPrompt.trim()) return;
    onRemix(panel.id, remixPrompt);
    setRemixOpen(false);
    setRemixPrompt('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
      {/* Image Preview */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0">
        {hasResult ? (
          <img src={resultSrc!} alt={`Panel ${index + 1}`} className="w-full h-full object-contain" />
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">
            {isProcessing ? 'Processing...' : 'No result yet'}
          </span>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#DB2777] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        {/* Panel label + status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">Panel {index + 1}</span>
          {panel.status === ProcessingStatus.Success && (
            <span className="text-xs text-green-500">Colorized</span>
          )}
          {panel.status === ProcessingStatus.Error && (
            <span className="text-xs text-red-400 truncate max-w-[140px]" title={panel.error}>Error</span>
          )}
          {isProcessing && (
            <span className="text-xs text-yellow-500 animate-pulse">Processing...</span>
          )}
        </div>

        {/* Regenerate / Remix buttons */}
        {hasResult && !remixOpen && (
          <div className="flex gap-2">
            <button
              onClick={() => onRegenerate(panel.id)}
              disabled={isProcessing}
              className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              🔄 Regenerate
            </button>
            <button
              onClick={() => { setRemixOpen(true); setRemixPrompt(''); }}
              disabled={isProcessing}
              className="flex-1 px-2 py-1.5 text-xs font-medium text-[#DB2777] dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded hover:bg-pink-100 dark:hover:bg-pink-900/40 disabled:opacity-50"
            >
              🎨 Remix
            </button>
          </div>
        )}

        {/* Remix prompt input */}
        {remixOpen && (
          <div className="space-y-2">
            <textarea
              className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200 placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#DB2777]"
              placeholder="e.g. make it rainy, add dramatic lighting..."
              rows={2}
              value={remixPrompt}
              onChange={(e) => setRemixPrompt(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleRemixSubmit}
                disabled={!remixPrompt.trim()}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-[#DB2777] hover:bg-[#BE185D] rounded disabled:opacity-50"
              >
                Generate Remix
              </button>
              <button
                onClick={() => setRemixOpen(false)}
                className="px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Time of Day */}
        {hasResult && !remixOpen && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Time of Day
            </p>
            <div className="grid grid-cols-4 gap-1">
              {TIME_OF_DAY_OPTIONS.map((time) => (
                <button
                  key={time}
                  onClick={() => onConvertTimeOfDay(panel.id, time)}
                  disabled={isProcessing}
                  className={`py-1 text-[10px] rounded border transition-colors disabled:opacity-50 ${
                    panel.timeOfDay === time
                      ? 'bg-indigo-900/50 border-indigo-500 text-indigo-200 dark:bg-indigo-900/60'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

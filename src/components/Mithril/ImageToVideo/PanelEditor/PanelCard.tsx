"use client";

import React, { useRef, useState } from 'react';
import { PanelData, ProcessingStatus, AspectRatio } from './types';
import {
  TrashIcon,
  RefreshIcon,
  DownloadIcon,
  ArrowRightIcon,
  PlayIcon,
  ZoomInIcon,
  ArrowsExpandIcon,
  XMarkIcon,
  PaintBrushIcon,
} from './Icons';
import { InteractiveCanvas, InteractiveCanvasHandle } from './InteractiveCanvas';
import { InpaintModal } from './InpaintModal';

interface PanelCardProps {
  panel: PanelData;
  index: number;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRefine: (id: string, mode: 'zoom' | 'expand') => void;
  onInpaint: (id: string, maskDataUrl: string, prompt: string, strength: number, width: number, height: number) => void;
  targetRatio: AspectRatio;
}

export const PanelCard: React.FC<PanelCardProps> = ({
  panel,
  index,
  onRemove,
  onCancel,
  onRetry,
  onRefine,
  onInpaint,
  targetRatio,
}) => {
  const isIdle = panel.status === ProcessingStatus.Idle;
  const isProcessing = panel.status === ProcessingStatus.Pending;
  const isSuccess = panel.status === ProcessingStatus.Success;
  const isError = panel.status === ProcessingStatus.Error;

  const canvasRef = useRef<InteractiveCanvasHandle>(null);
  const [isInpaintOpen, setIsInpaintOpen] = useState(false);

  const handleDownload = () => {
    const fileName = `${String(index + 1).padStart(3, '0')}.png`;

    if (canvasRef.current && panel.resultUrl) {
      canvasRef.current.download(fileName);
    } else if (panel.resultUrl) {
      const link = document.createElement('a');
      link.href = panel.resultUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 shadow-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
        <span
          className="text-xs font-mono text-gray-600 dark:text-gray-400 truncate max-w-[200px]"
          title={panel.fileName}
        >
          {panel.fileName}
        </span>
        <div className="flex items-center gap-2">
          {isProcessing && (
            <button
              onClick={() => onCancel(panel.id)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-500/50 rounded-lg transition-colors"
              title="Cancel"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              Cancel
            </button>
          )}
          {isError && (
            <button
              onClick={() => onRetry(panel.id)}
              className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Retry"
            >
              <RefreshIcon />
            </button>
          )}
          {isSuccess && (
            <button
              onClick={() => onRetry(panel.id)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Regenerate Original"
            >
              <RefreshIcon />
            </button>
          )}
          <button
            onClick={() => onRemove(panel.id)}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Remove"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-center">
        {/* Source Image */}
        <div className="relative group rounded-lg overflow-hidden bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 flex items-center justify-center min-h-[300px] h-full">
          <img
            src={panel.previewUrl}
            alt="Original"
            className="w-full h-full object-contain max-h-[400px]"
          />
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium">
            ORIGINAL
          </div>
        </div>

        {/* Arrow / Status Indicator */}
        <div className="flex justify-center py-2 md:py-0">
          {isProcessing ? (
            <RefreshIcon className="text-[#DB2777] w-8 h-8" spin />
          ) : isError ? (
            <div className="text-red-500 font-bold text-xl">!</div>
          ) : (
            <ArrowRightIcon className="text-gray-400 dark:text-gray-600 w-6 h-6 rotate-90 md:rotate-0" />
          )}
        </div>

        {/* Result Column (Interactive Canvas + Actions) */}
        <div className="flex flex-col gap-3 min-w-0 h-full">
          <div
            className={`relative flex-1 flex flex-col items-center justify-center min-h-[300px] ${
              isSuccess ? '' : 'bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700'
            }`}
          >
            {isSuccess && panel.resultUrl ? (
              <div className="w-full h-full flex flex-col relative items-center justify-center">
                <InteractiveCanvas
                  ref={canvasRef}
                  src={
                    panel.resultUrl.startsWith('http')
                      ? `/api/mithril/s3/proxy?url=${encodeURIComponent(panel.resultUrl)}`
                      : panel.resultUrl
                  }
                  targetRatio={targetRatio}
                  className="w-full"
                  maxHeight={400}
                />

                <button
                  onClick={handleDownload}
                  className="absolute top-2 right-10 p-2 bg-white dark:bg-gray-800/90 hover:bg-[#DB2777] text-gray-700 dark:text-white hover:text-white rounded-lg shadow-lg transition-colors backdrop-blur-sm z-20 border border-gray-300 dark:border-gray-600"
                  title="Download Current View"
                >
                  <DownloadIcon />
                </button>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <div className="w-full max-w-[120px] h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-[#DB2777] animate-[loading_1.5s_ease-in-out_infinite] w-1/2"></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-500 animate-pulse">
                  Generating illustration...
                </span>
              </div>
            ) : isError ? (
              <div className="p-4 text-center">
                <p className="text-sm text-red-500 dark:text-red-400 mb-2">Processing Failed</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {panel.error || 'Unknown error'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-600 p-8">
                <button
                  onClick={() => onRetry(panel.id)}
                  className="group flex flex-col items-center gap-2 hover:text-[#DB2777] transition-colors"
                >
                  <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700 group-hover:border-[#DB2777] group-hover:bg-[#DB2777]/10 transition-all">
                    <PlayIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs uppercase tracking-wider font-medium">
                    Convert This Panel
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions Footer */}
          {isSuccess && (
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => onRefine(panel.id, 'zoom')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-[#DB2777]/10 dark:hover:bg-[#DB2777]/20 text-gray-700 dark:text-gray-300 hover:text-[#DB2777] rounded-lg border border-gray-300 dark:border-gray-700 hover:border-[#DB2777]/50 transition-all text-xs font-medium"
                title="AI: Re-generate with tight crop"
              >
                <ZoomInIcon className="w-4 h-4" />
                Refine: Zoom
              </button>
              <button
                onClick={() => onRefine(panel.id, 'expand')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-purple-500/50 transition-all text-xs font-medium"
                title="AI: Re-generate with outpainting"
              >
                <ArrowsExpandIcon className="w-4 h-4" />
                Refine: Expand
              </button>
              <button
                onClick={() => setIsInpaintOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-orange-500/50 transition-all text-xs font-medium"
                title="AI: Paint over a region to regenerate it"
              >
                <PaintBrushIcon className="w-4 h-4" />
                Inpaint
              </button>
            </div>
          )}

          {/* Inpaint Modal */}
          {isInpaintOpen && (panel.resultUrl || panel.originalImageRef) && (
            <InpaintModal
              imageUrl={(panel.resultUrl || panel.originalImageRef)!}
              onSubmit={(maskDataUrl, prompt, strength, width, height) => {
                setIsInpaintOpen(false);
                onInpaint(panel.id, maskDataUrl, prompt, strength, width, height);
              }}
              onClose={() => setIsInpaintOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

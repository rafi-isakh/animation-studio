"use client";

import React, { useRef } from 'react';
import { PanelData, ProcessingStatus, AspectRatio } from './types';
import {
  TrashIcon,
  RefreshIcon,
  DownloadIcon,
  ArrowRightIcon,
  PlayIcon,
} from './Icons';
import { InteractiveCanvas, InteractiveCanvasHandle } from './InteractiveCanvas';

interface PanelCardProps {
  panel: PanelData;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onUpdatePrompt: (id: string, newPrompt: string) => void;
  onUpdateImageWeight: (id: string, imageWeight: number) => void;
  targetRatio: AspectRatio;
}

export const PanelCard: React.FC<PanelCardProps> = ({
  panel,
  onRemove,
  onRetry,
  onUpdatePrompt,
  onUpdateImageWeight,
  targetRatio,
}) => {
  const isIdle = panel.status === ProcessingStatus.Idle;
  const isProcessing = panel.status === ProcessingStatus.Pending;
  const isSuccess = panel.status === ProcessingStatus.Success;
  const isError = panel.status === ProcessingStatus.Error;

  const canvasRef = useRef<InteractiveCanvasHandle>(null);
  const resultSrc = panel.resultUrl
    ? panel.resultUrl.startsWith('http')
      ? `/api/mithril/s3/proxy?url=${encodeURIComponent(panel.resultUrl)}`
      : panel.resultUrl
    : undefined;

  const handleDownload = () => {
    if (canvasRef.current && resultSrc) {
      canvasRef.current.download(panel.file.name);
    } else if (resultSrc) {
      const link = document.createElement('a');
      link.href = resultSrc;
      link.download = panel.file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800/80">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-mono text-gray-400 truncate max-w-[200px]"
            title={panel.file.name}
          >
            {panel.file.name}
          </span>
          {panel.category && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-600/20 text-pink-300 border border-pink-600/30">
              {panel.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(isError || isSuccess) && (
            <button
              onClick={() => onRetry(panel.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                isError
                  ? 'text-red-400 hover:bg-red-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={isError ? 'Retry' : 'Regenerate'}
            >
              <RefreshIcon />
            </button>
          )}
          <button
            onClick={() => onRemove(panel.id)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="Remove"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-start">
        {/* Source + Prompt */}
        <div className="flex flex-col gap-3 h-full">
          <div className="relative rounded-lg overflow-hidden bg-gray-900 border border-gray-700 flex items-center justify-center min-h-[250px] flex-1">
            <img
              src={panel.previewUrl}
              alt="Original"
              className="w-full h-full object-contain max-h-[300px]"
            />
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium">
              ORIGINAL
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400">PixAI Prompt</label>
            <textarea
              value={panel.prompt || ''}
              onChange={(e) => onUpdatePrompt(panel.id, e.target.value)}
              placeholder="e.g. 1girl, masterpiece, best quality, anime style..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-200 placeholder-gray-600 focus:border-pink-600 focus:ring-1 focus:ring-pink-600 transition-all resize-none h-20"
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-medium text-gray-400">이미지 가중치</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={panel.imageWeight.toFixed(2)}
                onChange={(e) => onUpdateImageWeight(panel.id, Number.parseFloat(e.target.value || '0'))}
                className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-200 focus:border-pink-600 focus:ring-1 focus:ring-pink-600 transition-all"
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={panel.imageWeight}
              onChange={(e) => onUpdateImageWeight(panel.id, Number.parseFloat(e.target.value))}
              className="accent-pink-600"
            />
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-2 md:py-0 self-center">
          {isProcessing ? (
            <RefreshIcon className="text-pink-600 w-8 h-8" spin />
          ) : isError ? (
            <div className="text-red-500 font-bold text-2xl">!</div>
          ) : (
            <ArrowRightIcon className="text-gray-600 w-6 h-6 rotate-90 md:rotate-0" />
          )}
        </div>

        {/* Result */}
        <div className="flex flex-col gap-3 min-w-0 h-full">
          <div
            className={`relative flex-1 flex flex-col items-center justify-center min-h-[300px] ${
              isSuccess ? '' : 'bg-gray-900 rounded-lg border border-gray-700'
            }`}
          >
            {isSuccess && panel.resultUrl ? (
              <div className="w-full h-full flex flex-col relative items-center justify-center">
                <InteractiveCanvas
                  ref={canvasRef}
                  src={resultSrc || panel.resultUrl}
                  targetRatio={targetRatio}
                  className="w-full"
                  maxHeight={400}
                />
                <button
                  onClick={handleDownload}
                  className="absolute top-2 right-10 p-2 bg-gray-800/90 hover:bg-pink-600 text-white rounded-lg shadow-lg transition-colors backdrop-blur-sm z-20 border border-gray-600"
                  title="Download"
                >
                  <DownloadIcon />
                </button>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center gap-2 p-6 text-center">
                <div className="w-full max-w-[120px] h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite] w-1/2" />
                </div>
                <span className="text-xs text-gray-500 animate-pulse">Generating…</span>
              </div>
            ) : isError ? (
              <div className="p-4 text-center">
                <p className="text-sm text-red-400 mb-2">Processing Failed</p>
                <p className="text-xs text-gray-500 break-words">{panel.error || 'Unknown error'}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 p-8">
                <button
                  onClick={() => onRetry(panel.id)}
                  className="group flex flex-col items-center gap-2 hover:text-pink-400 transition-colors"
                >
                  <div className="p-3 bg-gray-800 rounded-full border border-gray-700 group-hover:border-pink-600 group-hover:bg-pink-600/10 transition-all">
                    <PlayIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs uppercase tracking-wider font-medium">Convert This Panel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

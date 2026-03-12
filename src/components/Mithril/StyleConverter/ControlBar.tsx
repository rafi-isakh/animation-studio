"use client";

import React, { useRef } from 'react';
import { AspectRatio, AppConfig } from './types';
import { SparklesIcon, SaveIcon, FolderOpenIcon, XMarkIcon, ArchiveBoxIcon } from './Icons';

interface ControlBarProps {
  config: AppConfig;
  onConfigChange: (newConfig: Partial<AppConfig>) => void;
  onProcessAll: () => void;
  onCancel: () => void;
  onDownloadAll: () => void;
  onSaveProject: () => void;
  onLoadProject: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isProcessing: boolean;
  panelCount: number;
  successCount: number;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  config,
  onConfigChange,
  onProcessAll,
  onCancel,
  onDownloadAll,
  onSaveProject,
  onLoadProject,
  isProcessing,
  panelCount,
  successCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4">
        {/* Title + Mobile Save/Load */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">

          {/* Mobile Save/Load */}
          <div className="flex md:hidden gap-2">
            <button
              onClick={onSaveProject}
              className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-gray-700"
            >
              <SaveIcon />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white border border-gray-700"
            >
              <FolderOpenIcon />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
          {/* Desktop Save/Load */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={onSaveProject}
              disabled={panelCount === 0}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white border border-gray-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save Project JSON"
            >
              <SaveIcon className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white border border-gray-700 text-sm font-medium transition-colors"
              title="Load Project JSON"
            >
              <FolderOpenIcon className="w-4 h-4" />
              Load
            </button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              ref={fileInputRef}
              onChange={onLoadProject}
            />
          </div>

          {/* Aspect Ratio */}
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm font-medium whitespace-nowrap">Output:</span>
            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
              {Object.values(AspectRatio).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => onConfigChange({ targetAspectRatio: ratio })}
                  disabled={isProcessing}
                  className={`px-2 py-1.5 md:px-3 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    config.targetAspectRatio === ratio
                      ? 'bg-pink-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            {successCount > 0 && !isProcessing && (
              <button
                onClick={onDownloadAll}
                className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg bg-gray-800 hover:bg-gray-700 text-pink-400 border border-pink-500/30"
              >
                <ArchiveBoxIcon className="w-4 h-4" />
                ZIP
              </button>
            )}

            {isProcessing ? (
              <button
                onClick={onCancel}
                className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 hover:border-red-400 animate-pulse"
              >
                <XMarkIcon className="w-4 h-4" />
                Cancel
              </button>
            ) : (
              <button
                onClick={onProcessAll}
                disabled={panelCount === 0}
                className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-lg ${
                  panelCount === 0
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                    : 'bg-[#DB2777] hover:bg-[#BE185D] text-white shadow-pink-600/25 active:scale-95'
                }`}
              >
                <SparklesIcon className="w-4 h-4" />
                Convert All ({panelCount})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

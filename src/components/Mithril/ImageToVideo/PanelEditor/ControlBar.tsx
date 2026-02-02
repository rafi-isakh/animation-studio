"use client";

import React, { useRef } from 'react';
import { AspectRatio, PanelEditorConfig } from './types';
import { SparklesIcon, SaveIcon, FolderOpenIcon, XMarkIcon, ArchiveBoxIcon } from './Icons';

interface ControlBarProps {
  config: PanelEditorConfig;
  onConfigChange: (newConfig: Partial<PanelEditorConfig>) => void;
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

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {/* Save/Load Actions */}
      <div className="flex gap-2">
        <button
          onClick={onSaveProject}
          disabled={panelCount === 0}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save Project JSON"
        >
          <SaveIcon className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={handleLoadClick}
          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 text-sm font-medium transition-colors"
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
        <span className="text-gray-600 dark:text-gray-400 text-sm font-medium whitespace-nowrap">
          Output Ratio:
        </span>
        <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-300 dark:border-gray-600">
          {Object.values(AspectRatio).map((ratio) => (
            <button
              key={ratio}
              onClick={() => onConfigChange({ targetAspectRatio: ratio })}
              disabled={isProcessing}
              className={`px-2 py-1.5 md:px-3 rounded-md text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                config.targetAspectRatio === ratio
                  ? 'bg-[#DB2777] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {successCount > 0 && !isProcessing && (
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-[#DB2777] border border-[#DB2777]/30"
          >
            <ArchiveBoxIcon className="w-4 h-4" />
            ZIP
          </button>
        )}

        {isProcessing ? (
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-colors bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/50"
          >
            <XMarkIcon className="w-4 h-4" />
            Cancel
          </button>
        ) : (
          <button
            onClick={onProcessAll}
            disabled={panelCount === 0}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-colors ${
              panelCount === 0
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-[#DB2777] hover:bg-[#BE185D] text-white'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            Convert All ({panelCount})
          </button>
        )}
      </div>
    </div>
  );
};

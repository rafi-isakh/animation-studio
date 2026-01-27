"use client";

import { useRef, useEffect } from "react";
import { Upload, Scissors, Loader2, Check, AlertCircle, Download, FileJson, X } from "lucide-react";
import { useImageSplitter } from "./useImageSplitter";

// Re-export types for external consumers
export type { ProcessingStatus, ReadingDirection, MangaPanel, MangaPage } from "./types";

export default function ImageSplitter() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    state,
    hasResults,
    pendingCount,
    upload,
    process,
    cancelProcessing,
    remove,
    setReadingDirection,
    downloadZip,
    exportJSON,
    saveToStageResult,
  } = useImageSplitter();

  const { pages, isProcessing, progress, readingDirection, processingStats } = state;

  // Save results when processing completes
  useEffect(() => {
    if (!isProcessing && hasResults) {
      saveToStageResult();
    }
  }, [isProcessing, hasResults, saveToStageResult]);

  // Handle file input change
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      upload(files);
    }
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Manga Panel Splitter</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Upload manga/comic pages to automatically detect and split into individual panels
        </p>
      </div>

      {/* Reading Direction Toggle */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">Reading Direction:</span>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setReadingDirection('rtl')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              readingDirection === 'rtl'
                ? 'bg-[#DB2777] text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            RTL (Manga)
          </button>
          <button
            onClick={() => setReadingDirection('ltr')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              readingDirection === 'ltr'
                ? 'bg-[#DB2777] text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            LTR (Comic)
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-[#DB2777] transition-colors"
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Drag and drop manga pages here, or click to upload
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Supports: JPG, PNG, WebP, ZIP
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.zip,application/zip"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-[#DB2777]">Processing...</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{progress.current} / {progress.total}</span>
              <button
                onClick={cancelProcessing}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-[#DB2777] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={process}
          disabled={isProcessing || pendingCount === 0}
          className="px-6 py-2.5 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4" />
              Split Panels ({pendingCount} pending)
            </>
          )}
        </button>

        <button
          onClick={downloadZip}
          disabled={!hasResults}
          className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download ZIP
        </button>

        <button
          onClick={exportJSON}
          disabled={!hasResults}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FileJson className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      {/* Processing Stats */}
      {processingStats && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center text-green-700 dark:text-green-400 text-sm">
          <Check className="w-4 h-4 mr-2" />
          <span>
            Processed <strong>{processingStats.pageCount}</strong> pages ({processingStats.panelCount} panels) in <strong>{processingStats.duration}</strong> minutes.
          </span>
        </div>
      )}

      {/* Page Grid */}
      {pages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pages.map(page => (
            <PageCard key={page.id} page={page} onRemove={remove} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {pages.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-gray-400 dark:text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}

// Extracted PageCard component for cleaner rendering
interface PageCardProps {
  page: {
    id: string;
    previewUrl: string;
    fileName: string;
    status: string;
    panels: { id: string }[];
  };
  onRemove: (id: string) => void;
}

function PageCard({ page, onRemove }: PageCardProps) {
  return (
    <div
      className={`group relative rounded-lg overflow-hidden border-2 transition-all ${
        page.status === 'processing' ? 'border-yellow-500 ring-2 ring-yellow-500/20' :
        page.status === 'completed' ? 'border-green-500' :
        page.status === 'error' ? 'border-red-500' :
        'border-gray-200 dark:border-gray-700 hover:border-gray-300'
      }`}
    >
      <img
        src={page.previewUrl}
        className="w-full h-40 object-cover bg-gray-100 dark:bg-gray-800"
        alt={page.fileName}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-2">
        <span className="text-xs text-white truncate">{page.fileName}</span>
        <div className="flex items-center gap-1 mt-1">
          {page.status === 'pending' && (
            <span className="text-gray-300 text-[10px] font-medium uppercase">Pending</span>
          )}
          {page.status === 'processing' && (
            <span className="text-yellow-400 text-[10px] font-medium uppercase flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing
            </span>
          )}
          {page.status === 'completed' && (
            <span className="text-green-400 text-[10px] font-medium uppercase flex items-center gap-1">
              <Check className="w-3 h-3" />
              {page.panels.length} panels
            </span>
          )}
          {page.status === 'error' && (
            <span className="text-red-400 text-[10px] font-medium uppercase flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Error
            </span>
          )}
        </div>
      </div>
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(page.id);
        }}
        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
      >
        &times;
      </button>
    </div>
  );
}

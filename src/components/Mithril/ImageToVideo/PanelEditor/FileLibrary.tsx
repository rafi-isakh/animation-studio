"use client";

import React, { useState } from 'react';
import { UploadIcon, DocumentTextIcon, PlayIcon } from './Icons';

interface FileLibraryProps {
  files: Record<string, File>;
  isLoading?: boolean;
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (fileName: string) => void;
  onImportFile: (fileName: string) => void;
  onClearStorage: () => void;
  onImportAll: () => void;
  onManifestLoaded: (filesToProcess: File[]) => void;
}

export const FileLibrary: React.FC<FileLibraryProps> = ({
  files,
  isLoading = false,
  onFilesAdded,
  onRemoveFile,
  onImportFile,
  onClearStorage,
  onImportAll,
  onManifestLoaded,
}) => {
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingManifest, setIsDraggingManifest] = useState(false);
  const [manifestError, setManifestError] = useState<string>();
  const [processedCount, setProcessedCount] = useState<number>();

  const fileList = Object.keys(files).sort();

  // Image Drop Handlers
  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(true);
  };
  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
  };
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
    if (e.dataTransfer.files?.length) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  };
  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  // Manifest Handler
  const processManifestFile = async (file: File) => {
    setManifestError(undefined);
    setProcessedCount(undefined);

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
      setManifestError('Please upload a .txt file');
      return;
    }

    try {
      const text = await file.text();
      // Split by new line, trim whitespace, remove empty lines
      const filenames = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const foundFiles: File[] = [];
      const missingFiles: string[] = [];

      filenames.forEach((name) => {
        // Try exact match first
        if (files[name]) {
          foundFiles.push(files[name]);
        } else {
          // Case insensitive check as fallback
          const lowerName = name.toLowerCase();
          const foundKey = Object.keys(files).find(
            (k) => k.toLowerCase() === lowerName
          );
          if (foundKey) {
            foundFiles.push(files[foundKey]);
          } else {
            missingFiles.push(name);
          }
        }
      });

      if (foundFiles.length === 0) {
        setManifestError('No matching files found in storage.');
        return;
      }

      setProcessedCount(foundFiles.length);
      onManifestLoaded(foundFiles);

      if (missingFiles.length > 0) {
        console.warn('Missing files from manifest:', missingFiles);
        setManifestError(
          `Loaded ${foundFiles.length} files. ${missingFiles.length} files not found in storage.`
        );
      }
    } catch (err) {
      setManifestError('Failed to read text file.');
    }
  };

  const handleManifestDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingManifest(true);
  };
  const handleManifestDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingManifest(false);
  };
  const handleManifestDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingManifest(false);
    if (e.dataTransfer.files?.[0]) {
      processManifestFile(e.dataTransfer.files[0]);
    }
  };
  const handleManifestInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      processManifestFile(e.target.files[0]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Data Storage (2/3 width) */}
      <div className="lg:col-span-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 flex flex-col overflow-hidden h-[400px]">
        <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            Data Storage{' '}
            {isLoading ? (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Loading panels...
              </span>
            ) : (
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400">
                {fileList.length} files
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            {fileList.length > 0 && (
              <button
                onClick={onClearStorage}
                className="text-xs bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300 px-3 py-1.5 rounded-lg transition-colors border border-red-300/60 dark:border-red-700/60"
              >
                Clear Storage
              </button>
            )}
            {fileList.length > 0 && (
              <button
                onClick={onImportAll}
                className="text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-[#DB2777] px-3 py-1.5 rounded-lg transition-colors border border-[#DB2777]/30 flex items-center gap-1.5"
              >
                <PlayIcon className="w-3 h-3" />
                Push All to Workspace
              </button>
            )}
            <label className="cursor-pointer text-xs bg-[#DB2777] hover:bg-[#BE185D] text-white px-3 py-1.5 rounded-lg transition-colors">
              + Add Images
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleImageInputChange}
              />
            </label>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Drop Zone overlay or empty state */}
          {fileList.length === 0 ? (
            <div
              onDragOver={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              onDrop={handleImageDrop}
              className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed m-4 rounded-xl transition-all ${
                isDraggingImages
                  ? 'border-[#DB2777] bg-[#DB2777]/10'
                  : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              <UploadIcon />
              <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                {isLoading ? 'Loading panels from Image Splitter...' : 'Drag & Drop panel images here'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {isLoading ? 'This may take a moment.' : 'Panels from Image Splitter are loaded automatically.'}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <ul className="space-y-1">
                {fileList.map((filename, idx) => (
                  <li
                    key={`${filename}-${idx}`}
                    className="px-3 py-2 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded flex items-center justify-between group transition-colors"
                  >
                    <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate select-all flex-1 min-w-0 mr-2">
                      {filename}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-500 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400">
                        {(files[filename].size / 1024).toFixed(0)}KB
                      </span>
                      <button
                        onClick={() => onImportFile(filename)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-[#DB2777] dark:hover:text-[#DB2777] transition-all p-0.5 rounded"
                        title="Push to workspace"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onRemoveFile(filename)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all p-0.5 rounded"
                        title="Remove from library"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Active Drag Overlay for when list is full */}
          {fileList.length > 0 && isDraggingImages && (
            <div
              onDragOver={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              onDrop={handleImageDrop}
              className="absolute inset-0 z-10 bg-[#DB2777]/80 backdrop-blur-sm flex items-center justify-center border-4 border-[#DB2777] rounded-xl m-1"
            >
              <p className="text-white font-bold text-xl">
                Drop to Add More Files
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Manifest Loader (1/3 width) */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 flex flex-col h-[400px]">
        <div className="p-4 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Process via Manifest</h2>
        </div>

        <div
          onDragOver={handleManifestDragOver}
          onDragLeave={handleManifestDragLeave}
          onDrop={handleManifestDrop}
          className={`flex-1 flex flex-col items-center justify-center p-6 m-4 border-2 border-dashed rounded-xl transition-all relative ${
            isDraggingManifest
              ? 'border-green-500 bg-green-500/10'
              : 'border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-900/30'
          }`}
        >
          <DocumentTextIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p className="text-center text-sm text-gray-700 dark:text-gray-300 mb-4">
            Upload <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.txt</code> list
            of filenames to process
          </p>

          <label className="cursor-pointer bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg border border-gray-300 dark:border-gray-600">
            Select Text File
            <input
              type="file"
              accept=".txt"
              className="hidden"
              onChange={handleManifestInputChange}
            />
          </label>

          {manifestError && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-900/50 rounded text-xs text-red-600 dark:text-red-200 text-center w-full">
              {manifestError}
            </div>
          )}

          {processedCount !== undefined && !manifestError && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-900/50 rounded text-xs text-green-600 dark:text-green-200 text-center w-full">
              Queueing {processedCount} panels...
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-500">
          <p>1. Upload images to Data Storage.</p>
          <p>2. &quot;Push All&quot; OR upload .txt manifest.</p>
          <p>3. Files appear in Workspace for conversion.</p>
        </div>
      </div>
    </div>
  );
};

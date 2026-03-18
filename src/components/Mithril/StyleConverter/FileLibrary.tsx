"use client";

import React, { useState, useCallback } from 'react';
import { UploadIcon, DocumentTextIcon } from './Icons';

interface FileLibraryProps {
  files: Record<string, File>;
  onFilesAdded: (files: File[]) => void;
  onApplyPrompts: (prompts: { filename: string; prompt: string; category?: string }[]) => number;
}

export const FileLibrary: React.FC<FileLibraryProps> = ({
  files,
  onFilesAdded,
  onApplyPrompts,
}) => {
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingCsv, setIsDraggingCsv] = useState(false);
  const [csvError, setCsvError] = useState<string>();
  const [appliedCount, setAppliedCount] = useState<number>();

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [filenameColIdx, setFilenameColIdx] = useState(0);
  const [promptColIdx, setPromptColIdx] = useState(1);
  const [categoryColIdx, setCategoryColIdx] = useState(-1);

  const fileList = Object.keys(files).sort();

  // ── Image handlers ───────────────────────────────────────────────────
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImages(false);
    if (e.dataTransfer.files?.length) onFilesAdded(Array.from(e.dataTransfer.files));
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onFilesAdded(Array.from(e.target.files));
  };

  // ── CSV handlers ─────────────────────────────────────────────────────
  const processCSV = useCallback(async (file: File) => {
    setCsvError(undefined);
    setAppliedCount(undefined);
    setCsvHeaders([]);
    setCsvRows([]);

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setCsvError('Please upload a .csv file');
      return;
    }

    try {
      const text = await file.text();

      // Parse the whole document to correctly handle multi-line quoted fields
      const parseCSV = (src: string): string[][] => {
        const result: string[][] = [];
        let row: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < src.length; i++) {
          const char = src[i];
          if (char === '"') {
            if (inQuotes && src[i + 1] === '"') { current += '"'; i++; }
            else inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            row.push(current); current = '';
          } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && src[i + 1] === '\n') i++;
            row.push(current); current = '';
            if (row.some((c) => c.trim())) result.push(row);
            row = [];
          } else {
            current += char;
          }
        }
        row.push(current);
        if (row.some((c) => c.trim())) result.push(row);
        return result;
      };

      const allRows = parseCSV(text);
      if (allRows.length === 0) { setCsvError('CSV is empty'); return; }

      const headers = allRows[0];
      const rows = allRows.slice(1);

      const lower = headers.map((h) => h.trim().toLowerCase());
      let fnIdx = lower.findIndex((h) => h.includes('file') || h.includes('name') || h.includes('image'));
      let prIdx = lower.findIndex((h) => h.includes('prompt') || h.includes('pix'));
      let catIdx = lower.findIndex((h) => h.includes('category') || h.includes('class'));

      if (fnIdx === -1) fnIdx = 0;
      if (prIdx === -1 && headers.length > 1) prIdx = 1;

      setCsvHeaders(headers);
      setCsvRows(rows);
      setFilenameColIdx(fnIdx !== -1 ? fnIdx : 0);
      setPromptColIdx(prIdx !== -1 ? prIdx : headers.length > 1 ? 1 : -1);
      setCategoryColIdx(catIdx !== -1 ? catIdx : -1);
    } catch {
      setCsvError('Failed to read CSV file');
    }
  }, []);

  const handleApplyCSV = () => {
    if (promptColIdx === -1) { setCsvError('Please select a prompt column'); return; }

    const allMapped = csvRows.map((row) => ({
      filename: row[filenameColIdx]?.trim(),
      prompt: row[promptColIdx]?.trim(),
      category: categoryColIdx !== -1 ? row[categoryColIdx]?.trim() : undefined,
    }));

    const promptsData = allMapped.filter((p) => p.filename && p.prompt);

    if (promptsData.length === 0) { setCsvError('No valid prompt rows found'); return; }

    const matchedCount = onApplyPrompts(promptsData);
    const skippedCount = csvRows.length - promptsData.length;
    setAppliedCount(matchedCount);
    if (skippedCount > 0) {
      setCsvError(`${skippedCount} row(s) skipped (missing filename or prompt).`);
    }
    setCsvHeaders([]);
    setCsvRows([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Data Storage (files list) */}
      <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 flex flex-col overflow-hidden h-[400px] relative">
        <div className="p-4 border-b border-gray-700 bg-gray-800/80 flex justify-between items-center">
          <h2 className="font-semibold text-gray-200 flex items-center gap-2">
            Data Storage{' '}
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-400">
              {fileList.length} files
            </span>
          </h2>
          <div className="flex flex-col items-end gap-1">
            <label className="cursor-pointer text-xs bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded-lg transition-colors">
              + Add Images
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageInput} />
            </label>
            <span className="text-[10px] text-gray-500">Please upload in PNG format</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {fileList.length === 0 ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingImages(true); }}
              onDragLeave={() => setIsDraggingImages(false)}
              onDrop={handleImageDrop}
              className={`flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed m-4 rounded-xl transition-all ${
                isDraggingImages
                  ? 'border-pink-600 bg-pink-600/10'
                  : 'border-gray-700 text-gray-500'
              }`}
            >
              <UploadIcon />
              <p className="mt-2 text-sm font-medium">Drag & drop panel images here</p>
              <p className="text-xs opacity-60">Panels are auto-added to the workspace</p>
              <p className="mt-1 text-xs text-yellow-500/80 font-medium">Please upload images in PNG format</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2">
              <ul className="space-y-1">
                {fileList.map((filename, idx) => (
                  <li
                    key={`${filename}-${idx}`}
                    className="px-3 py-2 bg-gray-900/50 hover:bg-gray-700/50 rounded flex items-center justify-between group transition-colors"
                  >
                    <span className="text-sm font-mono text-gray-300 truncate select-all">{filename}</span>
                    <span className="text-xs text-gray-600 group-hover:text-gray-400">
                      {(files[filename].size / 1024).toFixed(0)}KB
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {fileList.length > 0 && isDraggingImages && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingImages(true); }}
              onDragLeave={() => setIsDraggingImages(false)}
              onDrop={handleImageDrop}
              className="absolute inset-0 z-10 bg-pink-950/80 backdrop-blur-sm flex items-center justify-center border-4 border-pink-600 rounded-xl m-1"
            >
              <p className="text-white font-bold text-xl">Drop to Add More Files</p>
            </div>
          )}
        </div>
      </div>

      {/* CSV Prompt Importer */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-[400px]">
        <div className="p-4 border-b border-gray-700 bg-gray-800/80">
          <h2 className="font-semibold text-gray-200">Import Prompts (CSV)</h2>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingCsv(true); }}
          onDragLeave={() => setIsDraggingCsv(false)}
          onDrop={(e) => { e.preventDefault(); setIsDraggingCsv(false); if (e.dataTransfer.files?.[0]) processCSV(e.dataTransfer.files[0]); }}
          className={`flex-1 flex flex-col items-center justify-center p-6 m-4 border-2 border-dashed rounded-xl transition-all relative ${
            isDraggingCsv ? 'border-pink-500 bg-pink-500/10' : 'border-gray-600 bg-gray-900/30'
          }`}
        >
          {csvHeaders.length > 0 ? (
            <div className="w-full flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-gray-200">Map CSV Columns</h3>
              <div className="flex flex-col gap-2 text-sm">
                <label className="flex justify-between items-center">
                  <span className="text-gray-400">Filename:</span>
                  <select
                    className="bg-gray-700 text-white rounded px-2 py-1 w-32"
                    value={filenameColIdx}
                    onChange={(e) => setFilenameColIdx(Number(e.target.value))}
                  >
                    {csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </label>
                <label className="flex justify-between items-center">
                  <span className="text-gray-400">Prompt:</span>
                  <select
                    className="bg-gray-700 text-white rounded px-2 py-1 w-32"
                    value={promptColIdx}
                    onChange={(e) => setPromptColIdx(Number(e.target.value))}
                  >
                    <option value={-1}>-- None --</option>
                    {csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </label>
                <label className="flex justify-between items-center">
                  <span className="text-gray-400">Category:</span>
                  <select
                    className="bg-gray-700 text-white rounded px-2 py-1 w-32"
                    value={categoryColIdx}
                    onChange={(e) => setCategoryColIdx(Number(e.target.value))}
                  >
                    <option value={-1}>-- Auto --</option>
                    {csvHeaders.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </label>
              </div>
              <button
                onClick={handleApplyCSV}
                className="mt-2 bg-pink-600 hover:bg-pink-500 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Apply Prompts
              </button>
              <button
                onClick={() => { setCsvHeaders([]); setCsvRows([]); }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <DocumentTextIcon className="w-12 h-12 text-gray-500 mb-4" />
              <p className="text-center text-sm text-gray-300 mb-4">
                Upload <code className="bg-gray-700 px-1 rounded">.csv</code> with filenames and prompts
              </p>
              <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg border border-gray-600">
                Select CSV File
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) processCSV(e.target.files[0]); }}
                />
              </label>
            </>
          )}

          {csvError && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-900/50 rounded text-xs text-red-200 text-center w-full">
              {csvError}
            </div>
          )}
          {appliedCount !== undefined && !csvError && (
            <div className="mt-4 p-3 bg-green-900/30 border border-green-900/50 rounded text-xs text-green-200 text-center w-full">
              Applied prompts to {appliedCount} panels.
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-900/50 border-t border-gray-700 text-xs text-gray-500">
          <p>1. Upload images (auto-added to workspace).</p>
          <p>2. Upload .csv to map prompts by filename.</p>
          <p>3. Process panels with pixAI.</p>
        </div>
      </div>
    </div>
  );
};

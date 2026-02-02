"use client";

import React, { useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Save,
  Download,
  Split,
  ArrowRight,
  Loader2,
  FileJson,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { useStoryboardEditor } from './useStoryboardEditor';
import { StoryboardTable } from './StoryboardTable';
import { GeneratorView } from './GeneratorView';
import type { AspectRatio } from './types';

export default function StoryboardEditor() {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const {
    state,
    totalClips,
    hasEndPrompts,
    hasData,
    setView,
    setAspectRatio,
    updateClip,
    addAssets,
    updateAssetTags,
    deleteAsset,
    importJSONProject,
    importCSV,
    saveProject,
    downloadCSV,
    loadFromPreviousStage,
  } = useStoryboardEditor();

  const { storyboardData, voicePrompts, assets, aspectRatio, ui } = state;

  // Handle JSON import
  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      importJSONProject(file);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'Failed to import project'
      );
    }
    if (e.target) e.target.value = '';
  };

  // Handle CSV import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      importCSV(file);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to import CSV');
    }
    if (e.target) e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Storyboard Editor
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Edit and manage your storyboard with visual frame generation
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clips</p>
              <p className="text-2xl font-bold text-[#DB2777]">{totalClips}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            {ui.view === 'generator' ? (
              <button
                onClick={() => setView('table')}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-lg flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Table View
              </button>
            ) : hasData ? (
              <button
                onClick={() => setView('generator')}
                className="px-4 py-2 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg flex items-center gap-2"
              >
                Generator View
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}

            {/* Aspect Ratio */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Aspect:</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
              >
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="1:1">1:1</option>
              </select>
            </div>

            {/* Import/Export */}
            <button
              onClick={() => jsonFileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <FileJson className="w-4 h-4" />
              Load JSON
            </button>
            <input
              type="file"
              ref={jsonFileInputRef}
              onChange={handleJSONImport}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => csvFileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Import CSV
            </button>
            <input
              type="file"
              ref={csvFileInputRef}
              onChange={handleCSVImport}
              accept=".csv"
              className="hidden"
            />

            <button
              onClick={saveProject}
              disabled={!hasData}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>

            {ui.view === 'table' && (
              <button
                onClick={downloadCSV}
                disabled={!hasData}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {ui.view === 'table' ? (
        <StoryboardTable
          data={storyboardData}
          voicePrompts={voicePrompts}
          hasEndPrompt={hasEndPrompts}
        />
      ) : (
        <div className="min-h-[600px]">
          <GeneratorView
            scenes={storyboardData}
            assets={assets}
            aspectRatio={aspectRatio}
            onUpdateClip={updateClip}
            onAddAssets={addAssets}
            onUpdateAssetTags={updateAssetTags}
            onDeleteAsset={deleteAsset}
          />
        </div>
      )}
    </div>
  );
}

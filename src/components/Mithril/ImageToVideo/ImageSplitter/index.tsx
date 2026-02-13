"use client";

import { useRef, useEffect } from "react";
import { Upload, Scissors, Loader2, Check, AlertCircle, Download, Trash2, X } from "lucide-react";
import { useImageSplitter } from "./useImageSplitter";

// Re-export types for external consumers
export type { ProcessingStatus, ReadingDirection, MangaPanel, MangaPage } from "./types";

// -- Icons --
const MagicWandIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const SpinnerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const PlusIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

export default function ImageSplitter() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    state,
    hasResults,
    pendingCount,
    activePage,
    upload,
    process,
    cancelProcessing,
    remove,
    clear,
    setReadingDirection,
    setActivePage,
    deletePanel,
    downloadZip,
    exportJSON,
    saveToStageResult,
  } = useImageSplitter();

  const { pages, isProcessing, readingDirection, processingStats } = state;

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

  const errorCount = pages.filter(p => p.status === 'error').length;
  const processableCount = pendingCount + errorCount;

  return (
    <div className="flex relative" style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.zip,application/zip"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* -- Left Sidebar -- */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0 z-10">
        <div className="p-4 border-b border-gray-700 bg-gray-800 space-y-3 flex-shrink-0">
          <label 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center w-full p-3 bg-[#DB2777] hover:bg-[#BE185D] text-white rounded cursor-pointer transition-colors shadow-md font-bold text-sm"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Upload Pages
          </label>
          
          <button 
            onClick={process}
            disabled={isProcessing || processableCount === 0}
            className="flex items-center justify-center w-full p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors shadow-md font-medium text-xs relative overflow-hidden"
          >
            {isProcessing ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-2" />
                Processing...
              </>
            ) : (
              <>
                <MagicWandIcon className="w-4 h-4 mr-2" />
                {errorCount > 0 ? `Auto-Detect / Retry (${processableCount})` : `Auto-Detect All (${pendingCount})`}
              </>
            )}
            {isProcessing && (
              <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-pulse w-full"></div>
            )}
          </button>

          {/* Reading Direction Toggle */}
          <div className="flex bg-gray-700 rounded p-1">
            <button
              onClick={() => setReadingDirection('rtl')}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                readingDirection === 'rtl'
                  ? 'bg-[#DB2777] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              RTL
            </button>
            <button
              onClick={() => setReadingDirection('ltr')}
              className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                readingDirection === 'ltr'
                  ? 'bg-[#DB2777] text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              LTR
            </button>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}>
          {pages.map((page) => (
            <div 
              key={page.id}
              onClick={() => setActivePage(page.id)}
              className={`relative group flex items-start p-2 rounded cursor-pointer border-2 transition-all ${
                page.id === state.activePageId ? 'border-[#DB2777] bg-gray-700' : 'border-transparent hover:bg-gray-700/50'
              }`}
            >
              <div className="w-16 h-20 bg-gray-900 rounded overflow-hidden flex-shrink-0 border border-gray-600 relative">
                <img src={page.previewUrl} className="w-full h-full object-cover" alt="" />
                
                {/* Status Overlay */}
                {page.status === 'processing' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <SpinnerIcon className="w-6 h-6 text-white" />
                  </div>
                )}
                {page.status === 'completed' && (
                  <div className="absolute bottom-0 right-0 bg-green-500 text-white p-0.5 rounded-tl">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                {page.status === 'error' && (
                  <div className="absolute bottom-0 right-0 bg-red-500 text-white p-0.5 rounded-tl">
                    <span className="text-[10px] font-bold px-1">!</span>
                  </div>
                )}
              </div>
              <div className="ml-3 overflow-hidden flex-1">
                <p className="text-xs font-medium text-gray-200 truncate" title={page.fileName}>{page.fileName}</p>
                <span className="text-[10px] text-gray-400 mt-1 block bg-gray-900 w-max px-1.5 py-0.5 rounded">
                  {page.panels.length} Panels
                </span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  remove(page.id);
                }}
                className="absolute top-1 right-1 p-1 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-700 bg-gray-800 space-y-2 flex-shrink-0">
          <button
            onClick={downloadZip}
            disabled={!hasResults}
            className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded font-bold shadow transition-colors text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Download (.zip)
          </button>

          <button
            onClick={() => {
              if (confirm('Clear all pages and panels? This will delete all data from storage.')) {
                clear();
              }
            }}
            disabled={pages.length === 0}
            className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded font-bold shadow transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </button>
        </div>
      </div>

      {/* -- Main Workspace -- */}
      <div className="flex-1 bg-gray-900 flex flex-col overflow-hidden relative select-none">
        {activePage ? (
          <div className="flex-1 overflow-auto flex items-start justify-center p-8 relative">
            <div 
              className="relative shadow-2xl border border-gray-700 select-none group/canvas"
              style={{ maxWidth: '90%' }} 
            >
              <img 
                src={activePage.previewUrl} 
                className={`block max-w-full select-none pointer-events-none transition-opacity ${activePage.status === 'processing' ? 'opacity-70' : 'opacity-100'}`}
                draggable={false}
                style={{ maxHeight: 'calc(100vh - 350px)' }}
                alt="Work area" 
              />

              {/* Page Processing Overlay on Main Canvas */}
              {activePage.status === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                  <div className="bg-gray-900/80 p-4 rounded-xl flex flex-col items-center shadow-2xl border border-[#DB2777]/50 backdrop-blur-sm">
                    <SpinnerIcon className="h-8 w-8 text-[#DB2777] mb-2" />
                    <p className="text-sm font-bold text-pink-200">Detecting Panels...</p>
                  </div>
                </div>
              )}
              
              {/* Render Panels */}
              {activePage.panels.map((panel) => {
                if (!activePage.width || !activePage.height) return null;
                
                const top = (panel.box_2d[0] / 1000) * 100;
                const left = (panel.box_2d[1] / 1000) * 100;
                const height = ((panel.box_2d[2] - panel.box_2d[0]) / 1000) * 100;
                const width = ((panel.box_2d[3] - panel.box_2d[1]) / 1000) * 100;

                return (
                  <div
                    key={panel.id}
                    className="absolute group border-2 border-green-400 hover:border-yellow-200 z-20"
                    style={{
                      top: `${top}%`,
                      left: `${left}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    }}
                  >
                    {/* Panel Body BG */}
                    <div className="absolute inset-0 bg-green-500/10 group-hover:bg-green-500/20 transition-colors" />

                    {/* Label */}
                    <div className="absolute -top-3 -left-3 bg-green-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow border border-white pointer-events-none z-30">
                      {panel.label}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePanel(panel.id);
                      }}
                      className="absolute -top-3 -right-3 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 shadow border border-white transition-opacity z-30 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Upload className="w-16 h-16 mb-4 text-gray-600" />
            <p className="text-lg">Select a page to start</p>
            <p className="text-sm mt-2 opacity-50">Upload manga pages to begin panel detection</p>
          </div>
        )}

        {/* Processing Stats */}
        {processingStats && !isProcessing && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center text-green-700 dark:text-green-400 text-sm shadow-lg z-50">
            <Check className="w-4 h-4 mr-2" />
            <span>
              Processed <strong>{pages.length}</strong> pages ({processingStats.panelCount} panels) in <strong>{processingStats.duration}</strong> minutes.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

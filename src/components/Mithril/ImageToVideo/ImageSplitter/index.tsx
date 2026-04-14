"use client";

import React, { useRef, useEffect, useState, useMemo, MouseEvent } from "react";
import { Upload, Check, Download, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { useImageSplitter } from "./useImageSplitter";
import type { MangaPanel } from "./types";

// Re-export types for external consumers
export type { ProcessingStatus, ReadingDirection, MangaPanel, MangaPage } from "./types";

// -- Types --
interface Point { x: number; y: number; }
type DragMode = 'draw' | 'move' | 'resize-nw' | 'resize-ne' | 'resize-sw' | 'resize-se' | 'resize-n' | 'resize-s' | 'resize-w' | 'resize-e';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const DEFAULT_ZOOM = 0.1;
const ZOOM_STEP = 0.1;

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
  const workspaceRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    hasResults,
    pendingCount,
    activePage,
    isAnalyzingScript,
    scriptProgress,
    upload,
    process,
    remove,
    clear,
    setReadingDirection,
    setActivePage,
    addPanel,
    deletePanel,
    updatePanel,
    cropAndUpdatePanelImage,
    updatePanelStoryboard,
    downloadZip,
    saveToStageResult,
    analyzeScriptAll,
    resetAnalyzedData,
    clearActivePagePanels,
    pdfParseProgress,
  } = useImageSplitter();

  const { pages, isProcessing, readingDirection, processingStats } = state;

  // Interaction State
  const [dragMode, setDragMode] = useState<DragMode | null>(null);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  
  // For Drawing New Box
  const [newBoxStart, setNewBoxStart] = useState<Point | null>(null);
  const [currentRect, setCurrentRect] = useState<number[] | null>(null); // [top, left, height, width] %

  const [autoSavingPanelId, setAutoSavingPanelId] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [isWorkspaceFocused, setIsWorkspaceFocused] = useState(false);

  // Save results when processing completes
  useEffect(() => {
    if (!isProcessing && hasResults) {
      saveToStageResult();
    }
  }, [isProcessing, hasResults, saveToStageResult]);

  useEffect(() => {
    if (activePage) {
    }
  }, [activePage]);

  useEffect(() => {
    setZoom(DEFAULT_ZOOM);
  }, [activePage?.id]);

  const clampZoom = (nextZoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))));

  const getStepZoom = (nextZoom: number) => clampZoom(Math.round(nextZoom / ZOOM_STEP) * ZOOM_STEP);

  const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('textarea, input, [contenteditable="true"]'));
  };

  const displaySize = useMemo(() => {
    if (!activePage?.width || !activePage?.height) {
      return { width: 0, height: 0 };
    }

    return {
      width: Math.max(activePage.width * zoom, 1),
      height: Math.max(activePage.height * zoom, 1),
    };
  }, [activePage?.height, activePage?.width, zoom]);

  const changeZoom = (direction: 'in' | 'out') => {
    setZoom((currentZoom) => {
      const nextZoom = direction === 'in'
        ? currentZoom + ZOOM_STEP
        : currentZoom - ZOOM_STEP;
      return getStepZoom(nextZoom);
    });
  };

  const resetZoom = () => {
    setZoom(DEFAULT_ZOOM);
  };

  const zoomPercentageLabel = `${Math.round(zoom * 100)}%`;

  // Handle file input change
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      upload(files);
    }
    event.target.value = "";
  };

  // -- Coordinate Helpers --
  const getRelativeCoords = (e: MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // -- Mouse Handlers --
  const handleMouseDown = (e: MouseEvent, panelId?: string, mode?: DragMode) => {
    if (!activePage) return;
    e.stopPropagation();

    if (!isEditableTarget(e.target) && !(e.target instanceof HTMLElement && e.target.closest('button'))) {
      workspaceRef.current?.focus();
    }

    // If clicking inside a text area, do NOT trigger drag
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') {
      return;
    }

    // If clicking on a handle or panel body
    if (panelId && mode) {
      setDragMode(mode);
      setActivePanelId(panelId);
      setStartPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    // If clicking on a button, don't draw
    if ((e.target as HTMLElement).closest('button')) return;
    
    // Draw new box
    const coords = getRelativeCoords(e);
    setNewBoxStart(coords);
    setDragMode('draw');
    setCurrentRect(null);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragMode || !activePage || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    if (dragMode === 'draw' && newBoxStart) {
      const coords = getRelativeCoords(e);
      const left = Math.min(newBoxStart.x, coords.x);
      const top = Math.min(newBoxStart.y, coords.y);
      const width = Math.abs(coords.x - newBoxStart.x);
      const height = Math.abs(coords.y - newBoxStart.y);
      setCurrentRect([top, left, height, width]);
      return;
    }

    // Move/Resize - work with 0-1000 scale
    if (activePanelId && startPoint && activePage.width && activePage.height) {
      const panel = activePage.panels.find(p => p.id === activePanelId);
      if (!panel) return;

      const dxPx = e.clientX - startPoint.x;
      const dyPx = e.clientY - startPoint.y;
      
      // Convert screen delta to 0-1000 scale
      const scaleX = 1000 / rect.width;
      const scaleY = 1000 / rect.height;
      
      const dx = dxPx * scaleX;
      const dy = dyPx * scaleY;

      let [ymin, xmin, ymax, xmax] = panel.box_2d;

      if (dragMode === 'move') {
        let newYmin = ymin + dy;
        let newYmax = ymax + dy;
        let newXmin = xmin + dx;
        let newXmax = xmax + dx;

        // Constrain Y
        if (newYmin < 0) {
          newYmax += (0 - newYmin);
          newYmin = 0;
        }
        if (newYmax > 1000) {
          newYmin -= (newYmax - 1000);
          newYmax = 1000;
        }
        if (newYmin < 0) newYmin = 0;

        // Constrain X
        if (newXmin < 0) {
          newXmax += (0 - newXmin);
          newXmin = 0;
        }
        if (newXmax > 1000) {
          newXmin -= (newXmax - 1000);
          newXmax = 1000;
        }
        if (newXmin < 0) newXmin = 0;

        ymin = newYmin;
        ymax = newYmax;
        xmin = newXmin;
        xmax = newXmax;
      } else {
        // Resize with Constraints (minimum 20 units)
        const MIN_SIZE = 20;
        if (dragMode === 'resize-nw') {
          ymin = Math.max(0, Math.min(ymin + dy, ymax - MIN_SIZE));
          xmin = Math.max(0, Math.min(xmin + dx, xmax - MIN_SIZE));
        } else if (dragMode === 'resize-ne') {
          ymin = Math.max(0, Math.min(ymin + dy, ymax - MIN_SIZE));
          xmax = Math.min(1000, Math.max(xmax + dx, xmin + MIN_SIZE));
        } else if (dragMode === 'resize-sw') {
          ymax = Math.min(1000, Math.max(ymax + dy, ymin + MIN_SIZE));
          xmin = Math.max(0, Math.min(xmin + dx, xmax - MIN_SIZE));
        } else if (dragMode === 'resize-se') {
          ymax = Math.min(1000, Math.max(ymax + dy, ymin + MIN_SIZE));
          xmax = Math.min(1000, Math.max(xmax + dx, xmin + MIN_SIZE));
        } else if (dragMode === 'resize-n') {
          ymin = Math.max(0, Math.min(ymin + dy, ymax - MIN_SIZE));
        } else if (dragMode === 'resize-s') {
          ymax = Math.min(1000, Math.max(ymax + dy, ymin + MIN_SIZE));
        } else if (dragMode === 'resize-w') {
          xmin = Math.max(0, Math.min(xmin + dx, xmax - MIN_SIZE));
        } else if (dragMode === 'resize-e') {
          xmax = Math.min(1000, Math.max(xmax + dx, xmin + MIN_SIZE));
        }
      }

      // Update Panel
      updatePanel(panel.id, { box_2d: [ymin, xmin, ymax, xmax] });
      setStartPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    const wasResizeOrMove = dragMode && dragMode !== 'draw';
    const panelToSave = activePanelId;

    if (dragMode === 'draw' && newBoxStart && currentRect && activePage) {
      // Commit new box if large enough
      if (currentRect[2] > 1 && currentRect[3] > 1) {
        const topPct = currentRect[0] / 100;
        const leftPct = currentRect[1] / 100;
        const hPct = currentRect[2] / 100;
        const wPct = currentRect[3] / 100;

        const ymin = Math.round(topPct * 1000);
        const xmin = Math.round(leftPct * 1000);
        const ymax = Math.round((topPct + hPct) * 1000);
        const xmax = Math.round((leftPct + wPct) * 1000);

        const newPanel: MangaPanel = {
          id: `panel-${Date.now()}`,
          box_2d: [ymin, xmin, ymax, xmax],
          label: String(activePage.panels.length + 1)
        };
        addPanel(newPanel);
      }
    }

    setDragMode(null);
    setStartPoint(null);
    setNewBoxStart(null);
    setCurrentRect(null);
    setActivePanelId(null);

    // Auto-save after resize/move (debounced)
    if (wasResizeOrMove && panelToSave) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        setAutoSavingPanelId(panelToSave);
        await cropAndUpdatePanelImage(panelToSave);
        setAutoSavingPanelId(null);
      }, 1200);
    }
  };

  const handleWorkspaceFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsWorkspaceFocused(!isEditableTarget(e.target));
  };

  const handleWorkspaceBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsWorkspaceFocused(false);
  };

  const handleWorkspaceKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditableTarget(e.target)) return;

    if (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd') {
      e.preventDefault();
      changeZoom('in');
      return;
    }

    if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
      e.preventDefault();
      changeZoom('out');
    }
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
        accept="image/*,.zip,application/zip,.pdf,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* -- Left Sidebar -- */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0 z-10">
        <div className="p-4 border-b border-gray-700 bg-gray-800 space-y-3 flex-shrink-0">
          <label
            onClick={() => !pdfParseProgress && fileInputRef.current?.click()}
            className={`flex items-center justify-center w-full p-3 text-white rounded shadow-md font-bold text-sm transition-colors ${pdfParseProgress ? 'bg-[#BE185D] cursor-not-allowed' : 'bg-[#DB2777] hover:bg-[#BE185D] cursor-pointer'}`}
          >
            {pdfParseProgress ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                Reading PDF… {pdfParseProgress.current}/{pdfParseProgress.total}
              </>
            ) : (
              <>
                <PlusIcon className="w-5 h-5 mr-2" />
                Upload Pages
              </>
            )}
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
            onClick={analyzeScriptAll}
            disabled={!hasResults || isAnalyzingScript}
            className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded font-bold shadow transition-colors text-sm"
          >
            {isAnalyzingScript ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-2" />
                Transcribing ({scriptProgress})...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Analyze & Transcribe
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (confirm('Delete all analyzed panel/transcription data and start again? Uploaded pages will be kept.')) {
                resetAnalyzedData();
              }
            }}
            disabled={pages.length === 0 || isProcessing || isAnalyzingScript}
            className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-500 text-white py-2 rounded font-bold shadow transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset Analysis
          </button>

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

      {/* -- Main Workspace + Stats Banner -- */}
      <div className="flex-1 flex flex-col overflow-hidden">

      {/* Processing Stats */}
      {processingStats && !isProcessing && (
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex items-center text-green-700 dark:text-green-400 text-sm shrink-0">
          <Check className="w-4 h-4 mr-2 shrink-0" />
          <span>
            Processed <strong>{pages.length}</strong> pages ({processingStats.panelCount} panels) in <strong>{processingStats.duration}</strong> minutes.
          </span>
        </div>
      )}

      {/* -- Main Workspace -- */}
      <div className="flex-1 bg-gray-900 flex flex-col overflow-hidden relative select-none">
        {activePage ? (
          <div 
            ref={workspaceRef}
            tabIndex={0}
            className={`flex-1 overflow-auto flex items-start justify-center p-6 relative outline-none transition-shadow ${isWorkspaceFocused ? 'ring-2 ring-inset ring-pink-500/70' : ''}`}
            style={{ cursor: dragMode === 'draw' ? 'crosshair' : 'default' }}
            onFocus={handleWorkspaceFocus}
            onBlur={handleWorkspaceBlur}
            onKeyDown={handleWorkspaceKeyDown}
            onMouseDown={(e) => handleMouseDown(e)}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="flex min-h-full w-full items-start justify-center overflow-visible">
              <div
                className="relative pt-12"
                style={{
                  width: `${displaySize.width}px`,
                }}
              >
                <div className="absolute top-0 right-0 z-[60] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Clear all crop panels for ${activePage.fileName} and start this page again?`)) {
                        clearActivePagePanels();
                      }
                    }}
                    disabled={activePage.panels.length === 0 || isProcessing || isAnalyzingScript}
                    title="Clear all panels on this page"
                    aria-label="Clear all panels on this page"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/40 bg-amber-600/20 text-amber-100 shadow-lg backdrop-blur-sm transition-colors hover:bg-amber-600/30 disabled:cursor-not-allowed disabled:border-gray-700 disabled:bg-gray-800 disabled:text-gray-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-950/85 px-2 py-2 text-xs text-gray-200 shadow-lg backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => changeZoom('out')}
                      disabled={zoom <= MIN_ZOOM}
                      title="Zoom out"
                      aria-label="Zoom out"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:text-gray-500"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <div className="min-w-[3.5rem] text-center text-[11px] font-semibold text-gray-100">
                      {zoomPercentageLabel}
                    </div>
                    <button
                      type="button"
                      onClick={resetZoom}
                      disabled={zoom === DEFAULT_ZOOM}
                      title="Reset zoom"
                      aria-label="Reset zoom"
                      className="rounded-full border border-gray-700 px-3 py-1 text-[11px] font-semibold text-gray-200 transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:border-gray-800 disabled:text-gray-500"
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={() => changeZoom('in')}
                      disabled={zoom >= MAX_ZOOM}
                      title="Zoom in"
                      aria-label="Zoom in"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-900 disabled:text-gray-500"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={containerRef}
                  className="relative overflow-visible shadow-2xl border border-gray-700 select-none group/canvas"
                  style={{
                    width: `${displaySize.width}px`,
                    height: `${displaySize.height}px`,
                  }}
                >
                <img 
                  src={activePage.previewUrl} 
                  className={`block h-full w-full select-none pointer-events-none transition-opacity ${activePage.status === 'processing' ? 'opacity-70' : 'opacity-100'}`}
                  draggable={false}
                  alt="Work area" 
                />

                {/* Page Processing Overlay */}
                {activePage.status === 'processing' && (
                  <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="bg-gray-900/80 p-4 rounded-xl flex flex-col items-center shadow-2xl border border-[#DB2777]/50 backdrop-blur-sm">
                      <SpinnerIcon className="h-8 w-8 text-[#DB2777] mb-2" />
                      <p className="text-sm font-bold text-pink-200">Detecting Panels...</p>
                    </div>
                  </div>
                )}
              
                {/* Render Panels with Transform Handles */}
                {activePage.panels.map((panel, panelIndex) => {
                  const top = (panel.box_2d[0] / 1000) * 100;
                  const left = (panel.box_2d[1] / 1000) * 100;
                  const height = ((panel.box_2d[2] - panel.box_2d[0]) / 1000) * 100;
                  const width = ((panel.box_2d[3] - panel.box_2d[1]) / 1000) * 100;

                  const isInteracting = activePanelId === panel.id;
                  const panelNumber = panel.label || String(panelIndex + 1);
                  const showTranscription = !!panel.storyboard;

                  if (panel.storyboard) {
                  }

                  return (
                    <React.Fragment key={panel.id}>
                      <div
                        className={`absolute group border-2 z-20 ${isInteracting ? 'border-yellow-400 z-50' : 'border-green-400 hover:border-yellow-200'}`}
                        style={{
                          top: `${top}%`,
                          left: `${left}%`,
                          width: `${width}%`,
                          height: `${height}%`,
                          cursor: 'move'
                        }}
                        onMouseDown={(e) => handleMouseDown(e, panel.id, 'move')}
                      >
                        {/* Panel Body BG */}
                        <div className={`absolute inset-0 transition-colors overflow-hidden ${isInteracting ? 'bg-yellow-500/10' : 'bg-green-500/10 group-hover:bg-green-500/20'}`} />

                        {/* Label Badge - Shows panel number only */}
                        <div className="absolute -top-3 -left-3 bg-green-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow border border-white pointer-events-none z-30">
                          {panelNumber}
                        </div>

                        {/* Delete Button */}
                        <button
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deletePanel(panel.id);
                          }}
                          title={`Delete panel ${panelNumber}`}
                          className={`absolute -top-3.5 -right-3.5 bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow border-2 border-white transition-all z-30 cursor-pointer ${isInteracting ? 'opacity-100 scale-100' : 'opacity-80 group-hover:opacity-100 hover:bg-red-600 hover:scale-105'}`}
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Resize Handles */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* NW Corner */}
                          <div
                            className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-gray-500 cursor-nw-resize z-40"
                            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-nw')}
                          />
                          {/* NE Corner */}
                          <div
                            className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-500 cursor-ne-resize z-40"
                            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-ne')}
                          />
                          {/* SW Corner */}
                          <div
                            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-gray-500 cursor-sw-resize z-40"
                            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-sw')}
                          />
                          {/* SE Corner */}
                          <div
                            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-500 cursor-se-resize z-40"
                            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-se')}
                          />

                          {/* Edge Handles */}
                          <div
                            className="absolute -top-1 left-2 right-2 h-2 cursor-ns-resize z-35"
                            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-n')}
                          />
                          <div
                            className="absolute -bottom-1 left-2 right-2 h-2 cursor-ns-resize z-35"
                            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-s')}
                          />
                          <div
                            className="absolute top-2 bottom-2 -left-1 w-2 cursor-ew-resize z-35"
                            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-w')}
                          />
                          <div
                            className="absolute top-2 bottom-2 -right-1 w-2 cursor-ew-resize z-35"
                            onMouseDown={(e) => handleMouseDown(e, panel.id, 'resize-e')}
                          />
                        </div>
                      </div>

                      {/* Transcription Box - Floats to the right of panel, always visible when exists */}
                      {showTranscription && (
                        <div
                          className="absolute bg-gray-800/90 border border-gray-600 rounded shadow-xl z-40 overflow-y-auto backdrop-blur-sm"
                          style={{
                            top: `${top}%`,
                            left: `${left + width}%`,
                            width: '280px',
                            maxHeight: '300px',
                            marginLeft: '8px'
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="p-2 space-y-1">
                            <div className="flex justify-between items-center pb-1 border-b border-gray-700 mb-2">
                              <span className="text-[10px] font-bold text-gray-400">RAW SCRIPT</span>
                            </div>
                            <textarea
                              value={panel.storyboard?.text || ''}
                              onChange={(e) => updatePanelStoryboard(panel.id, e.target.value)}
                              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 h-48 resize-y text-xs font-mono leading-relaxed focus:border-[#DB2777] outline-none"
                              placeholder="VISUAL: ...&#10;DIALOGUE: ...&#10;SFX: ..."
                            />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Render New Drawing Rect */}
                {dragMode === 'draw' && currentRect && (
                  <div
                    className="absolute border-2 border-white bg-white/20 z-30 pointer-events-none"
                    style={{
                      top: `${currentRect[0]}%`,
                      left: `${currentRect[1]}%`,
                      height: `${currentRect[2]}%`,
                      width: `${currentRect[3]}%`,
                      borderStyle: 'dashed'
                    }}
                  >
                    <div className="absolute top-0 right-0 bg-white text-black text-[10px] px-1 font-bold">
                      New
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <Upload className="w-16 h-16 mb-4 text-gray-600" />
            <p className="text-lg">Select a page to start</p>
            <p className="text-sm mt-2 opacity-50">Drag background to crop • Drag boxes to move/resize</p>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}

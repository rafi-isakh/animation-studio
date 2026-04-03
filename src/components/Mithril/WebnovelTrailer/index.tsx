"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Sparkles, StopCircle, Save, Trash2, Download, Upload, FileDown, Plus } from "lucide-react";
import { getProviderConstraints, getDefaultProviderId, getProviderOptions } from "../VideoGenerator/providers";
import { compressBase64Image } from "../ImageToVideo/ImageToScriptWriter/utils/imageCompression";
import { ASPECT_RATIOS } from "../VideoGenerator/types";
import type { AspectRatio } from "../VideoGenerator/providers/types";
import {
  getWebnovelTrailerMeta,
  getWebnovelTrailerClips,
  saveWebnovelTrailerMeta,
  saveWebnovelTrailerClip,
  saveWebnovelTrailerClipsBatch,
  updateWebnovelTrailerClipStatus,
  deleteWebnovelTrailerClip,
  clearWebnovelTrailer,
  mapJobToClipUpdate,
  getActiveProjectJobs,
} from "../services/firestore";
import { useVideoOrchestrator, type ClipUpdate } from "../VideoGenerator/useVideoOrchestrator";
import type { CsvFrame, CsvColumnMapping } from "./types";
import { DEFAULT_WEBNOVEL_MAPPING } from "./types";
import { parseCSV, autoDetectMapping, applyMapping } from "./utils/csvHelpers";

// ============================================================
// Loader
// ============================================================

function Loader({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ============================================================
// TrailerClipCard
// ============================================================

interface TrailerClipCardProps {
  frame: CsvFrame;
  globalProvider: string;
  onGenerate: (id: string) => void;
  onRegenerate: (id: string) => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdatePrompt: (id: string, prompt: string) => void;
  onUpdateStartImage: (id: string, data: string | null) => void;
  onUpdateDuration: (id: string, duration: string) => void;
  onUpdateVideoApi: (id: string, videoApi: string) => void;
  onRefinePrompt: (id: string) => Promise<void>;
}

function TrailerClipCard({
  frame,
  globalProvider,
  onGenerate,
  onRegenerate,
  onCancel,
  onDelete,
  onUpdatePrompt,
  onUpdateStartImage,
  onUpdateDuration,
  onUpdateVideoApi,
  onRefinePrompt,
}: TrailerClipCardProps) {
  const { language, dictionary } = useLanguage();
  const [isRefiningClip, setIsRefiningClip] = useState(false);

  const canGenerate = !!(frame.imageData || frame.imageUrl) && !!frame.veoPrompt;
  const isProcessing =
    frame.status === 'pending' || frame.status === 'generating' || frame.status === 'retrying';
  const isDone = frame.status === 'completed' && !!frame.videoUrl;
  const isError = frame.status === 'failed';

  const currentDuration = frame.clipLength
    ? frame.clipLength.replace(/[^0-9.]/g, '')
    : '5';

  const handleStartImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      onUpdateStartImage(frame.id, evt.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startImageSrc = frame.imageData || frame.imageUrl;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex flex-col shadow-md hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="bg-gray-950 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-[#DB2777] font-bold">#{frame.frameNumber}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Delete button */}
          <button
            onClick={() => onDelete(frame.id)}
            className="p-1 text-gray-600 hover:text-red-500 transition-colors"
            title="Delete clip"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Per-frame Provider Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold">API:</span>
            <select
              className="bg-gray-800 text-xs text-gray-300 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-0"
              value={frame.videoApi || ''}
              onChange={(e) => onUpdateVideoApi(frame.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Default ({getProviderOptions().find(p => p.id === globalProvider)?.name || globalProvider})</option>
              {getProviderOptions().map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Duration Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 uppercase font-bold">Dur:</span>
            <select
              className="bg-gray-800 text-xs text-gray-300 border border-gray-700 rounded px-1 py-0.5 focus:outline-none focus:ring-0"
              value={currentDuration}
              onChange={(e) => onUpdateDuration(frame.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="5">5s</option>
              <option value="8">8s</option>
              <option value="10">10s</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-full">
        {/* Inputs Section */}
        <div className="p-4 flex-1 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-gray-800">
          {/* Images Area (Start & End) */}
          <div className="flex gap-2 h-64 shrink-0">
            {/* Start Frame — from bulk upload, replaceable per-frame */}
            <div className="flex-1 bg-gray-950 rounded-md overflow-hidden relative group border border-gray-800 flex items-center justify-center">
              <span className="absolute top-2 left-2 bg-black/70 text-[10px] text-gray-200 px-2 py-0.5 rounded backdrop-blur-sm z-10 font-bold">
                START
              </span>
              {startImageSrc ? (
                <>
                  <img
                    src={startImageSrc}
                    alt="Start"
                    className="w-full h-full object-contain"
                  />
                  {/* Hover overlay: replace or remove */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                    <label className="cursor-pointer flex items-center gap-1 bg-gray-800/90 hover:bg-[#DB2777] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleStartImageUpload}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" clipRule="evenodd" />
                      </svg>
                      Replace
                    </label>
                    <button
                      onClick={() => onUpdateStartImage(frame.id, null)}
                      className="flex items-center gap-1 bg-gray-800/90 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                /* Placeholder — image comes from bulk upload above */
                <div className="flex flex-col items-center justify-center text-gray-600 px-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs">No image</span>
                  <span className="text-[10px] text-gray-700 mt-0.5">Upload images above</span>
                  <label className="mt-2 cursor-pointer text-[10px] text-[#DB2777]/60 hover:text-[#DB2777] underline">
                    <input type="file" accept="image/*" className="hidden" onChange={handleStartImageUpload} />
                    or upload individually
                  </label>
                </div>
              )}
            </div>

          </div>

          {/* Script Context (Dialogue / SFX) */}
          {(frame.dialogue || frame.sfx) && (
            <div className="bg-gray-950/50 p-2 rounded border border-gray-800 space-y-2">
              {frame.dialogue && (
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Dialogue</span>
                  <p className="text-sm text-gray-300 font-serif italic">&ldquo;{frame.dialogue}&rdquo;</p>
                </div>
              )}
              {frame.sfx && (
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">SFX</span>
                  <p className="text-xs text-gray-400 font-mono">[{frame.sfx}]</p>
                </div>
              )}
            </div>
          )}

          {/* Prompt Input */}
          <div className="flex-1 flex flex-col min-h-[100px]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-500 uppercase font-bold">
                {phrase(dictionary, 'prompt', language) || 'Video Prompt'}
              </label>
              {(frame.imageData || frame.imageUrl) && frame.veoPrompt.trim() && (
                <button
                  onClick={async () => {
                    setIsRefiningClip(true);
                    await onRefinePrompt(frame.id);
                    setIsRefiningClip(false);
                  }}
                  disabled={isRefiningClip}
                  className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#DB2777] transition-colors disabled:opacity-50"
                  title="Refine prompt to match reference image"
                >
                  <Sparkles className="h-3 w-3" />
                  {isRefiningClip ? 'Refining...' : 'Refine'}
                </button>
              )}
            </div>
            <textarea
              className="w-full flex-1 min-h-[80px] bg-gray-950 border border-gray-700 rounded p-2 text-sm text-gray-300 focus:outline-none focus:ring-0 resize-vertical"
              value={frame.veoPrompt}
              onChange={(e) => onUpdatePrompt(frame.id, e.target.value)}
              placeholder="Enter video prompt..."
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center bg-black/20 relative min-h-[250px]">
          {isDone ? (
            <div className="relative w-full h-full group">
              <video
                src={frame.videoUrl!}
                controls
                className="w-full h-full object-contain rounded shadow-lg"
                poster={startImageSrc || undefined}
              />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={frame.s3FileName ? `/api/video/download?s3FileName=${encodeURIComponent(frame.s3FileName)}&downloadFileName=${encodeURIComponent(`clip_${frame.frameNumber}.mp4`)}` : frame.videoUrl!}
                  download
                  className="bg-gray-900/80 p-2 rounded-full text-white hover:bg-[#DB2777] block"
                  title="Download"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full">
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#DB2777] mb-2"></div>
                  <span className="text-xs text-[#DB2777] animate-pulse">
                    {frame.status === 'retrying' ? 'Retrying...' : 'Generating...'}
                  </span>
                </div>
              ) : isError ? (
                <div className="text-center px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-400 text-xs mt-1">{frame.error || 'Failed'}</p>
                  <button
                    onClick={() => onRegenerate(frame.id)}
                    className="mt-2 text-xs underline text-gray-400 hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="text-center opacity-30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs">Ready to Generate</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-gray-950 p-3 flex justify-between items-center border-t border-gray-800">
        <div className="flex items-center">
          {isDone && !isProcessing && (
            <span className="flex items-center text-green-400 text-xs font-bold mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {phrase(dictionary, 'sora_status_done', language) || 'Completed'}
            </span>
          )}
          {isProcessing && (
            <span className="text-xs text-gray-500 font-mono">
              {phrase(dictionary, 'sora_status_generating', language) || 'Processing...'}
            </span>
          )}
          {frame.status === 'pending' && (
            <span className="text-xs text-yellow-500 font-mono">
              {phrase(dictionary, 'sora_status_pending', language) || 'Pending...'}
            </span>
          )}
        </div>

        {isProcessing ? (
          <button
            onClick={() => onCancel(frame.id)}
            className="text-xs font-bold py-1.5 px-4 rounded transition-colors bg-red-700 hover:bg-red-600 text-white"
          >
            Cancel
          </button>
        ) : (
          <button
            onClick={() => (isDone ? onRegenerate(frame.id) : onGenerate(frame.id))}
            disabled={!canGenerate}
            className={`text-xs font-bold py-1.5 px-4 rounded transition-colors ${
              canGenerate
                ? 'bg-[#DB2777] hover:bg-[#BE185D] text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isDone
              ? (phrase(dictionary, 'sora_clip_regenerate', language) || 'Regenerate')
              : (phrase(dictionary, 'sora_clip_generate', language) || 'Generate')}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function WebnovelTrailer() {
  const {
    currentProjectId,
    videoApiKey,
    isLoading: isContextLoading,
  } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();

  // ── Loading ──────────────────────────────────────────────
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // ── Frame state ──────────────────────────────────────────
  const [frames, setFrames] = useState<CsvFrame[]>([]);
  const [showImageUploader, setShowImageUploader] = useState(true);

  // ── CSV import state ─────────────────────────────────────
  const [csvStep, setCsvStep] = useState<1 | 2>(1);
  const [headers, setHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>(DEFAULT_WEBNOVEL_MAPPING);

  // ── Video generation state ───────────────────────────────
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [selectedProvider, setSelectedProvider] = useState(getDefaultProviderId());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineProgress, setRefineProgress] = useState({ done: 0, total: 0 });

  const shouldStopRef             = useRef(false);
  const isMountedRef              = useRef(true);
  const activeJobsRef             = useRef<Set<string>>(new Set());
  const pendingCancellationsRef   = useRef<Set<string>>(new Set()); // frame IDs cancelled before jobId was known
  const editDebounceRef           = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Orchestrator hook ────────────────────────────────────
  const handleClipUpdate = useCallback((update: ClipUpdate) => {
    if (!isMountedRef.current) return;

    setFrames((prev) =>
      prev.map((f) => {
        if (f.rowIndex !== update.clipIndex) return f;
        if (update.sceneIndex !== 0) return f;

        const isTerminal = update.status === 'completed' || update.status === 'failed';
        if (isTerminal) activeJobsRef.current.delete(update.jobId);

        return {
          ...f,
          jobId:      update.jobId,
          status:     update.status === 'completed' ? 'completed'
                    : update.status === 'failed'    ? 'failed'
                    : update.status === 'retrying'  ? 'retrying'
                    : 'generating',
          videoUrl:   update.videoUrl ?? f.videoUrl,
          s3FileName: update.s3FileName ?? f.s3FileName,
          error:      update.error,
          providerId: update.providerId,
        };
      })
    );

    // Auto-save on completion
    if (update.status === 'completed' && update.videoUrl && currentProjectId) {
      const clipId = `0_${update.clipIndex}`;
      updateWebnovelTrailerClipStatus(currentProjectId, clipId, {
        videoRef:   update.videoUrl,
        s3FileName: update.s3FileName ?? undefined,
        jobId:      update.jobId,
        status:     'completed',
        providerId: update.providerId,
      }).catch(console.error);
    }
  }, [currentProjectId]);

  const { submitJob, cancelJob, pendingUpdates, clearPendingUpdates } =
    useVideoOrchestrator({
      projectId:    currentProjectId,
      enabled:      !!currentProjectId,
      onClipUpdate: handleClipUpdate,
    });

  // ── Apply pending updates once data is loaded ────────────
  useEffect(() => {
    if (isLoadingData || !hasLoaded || pendingUpdates.length === 0) return;
    pendingUpdates.forEach((update) => {
      const isTerminal = update.status === 'completed' || update.status === 'failed';
      if (!isTerminal) activeJobsRef.current.add(update.jobId);
      handleClipUpdate(update);
    });
    clearPendingUpdates();
  }, [isLoadingData, hasLoaded, pendingUpdates, handleClipUpdate, clearPendingUpdates]);

  // ── Load persisted state on mount ────────────────────────
  useEffect(() => {
    if (isContextLoading || !currentProjectId) return;

    let cancelled = false;
    (async () => {
      try {
        const [meta, savedClips] = await Promise.all([
          getWebnovelTrailerMeta(currentProjectId),
          getWebnovelTrailerClips(currentProjectId),
        ]);

        if (cancelled) return;

        if (meta?.aspectRatio) setAspectRatio(meta.aspectRatio);
        if (meta?.providerId)  setSelectedProvider(meta.providerId);

        if (savedClips.length > 0) {
          const restoredFrames: CsvFrame[] = savedClips.map((clip) => ({
            id:                `frame-${clip.clipIndex}-restored`,
            rowIndex:          clip.clipIndex,
            frameNumber:       clip.sceneTitle?.replace('Clip ', '') || String(clip.clipIndex + 1),
            veoPrompt:         clip.videoPrompt || '',
            referenceFilename: '',
            clipLength:        clip.length?.replace(/[^0-9]/g, '') || '5',
            videoApi:          clip.videoApi ?? undefined,
            imageData:         null,
            endFrameData:      null,
            imageUrl:          clip.imageUrl ?? null,
            videoUrl:          clip.videoRef ?? null,
            jobId:             clip.jobId ?? null,
            s3FileName:        clip.s3FileName ?? null,
            status:            (clip.status as CsvFrame['status']) || 'idle',
            error:             clip.error,
            providerId:        clip.providerId,
          }));

          // Re-track active jobs
          const activeJobs = await getActiveProjectJobs(currentProjectId);
          const frameIndexByRowIndex = new Map<number, number>();
          restoredFrames.forEach((f, idx) => frameIndexByRowIndex.set(f.rowIndex, idx));
          activeJobs.forEach((job) => {
            if (job.type && job.type !== 'video') return;
            if (job.scene_index !== 0) return;
            const frameIdx = frameIndexByRowIndex.get(job.clip_index) ?? -1;
            if (frameIdx !== -1) {
              const update = mapJobToClipUpdate(job);
              activeJobsRef.current.add(update.jobId);
              restoredFrames[frameIdx] = {
                ...restoredFrames[frameIdx],
                jobId:  update.jobId,
                status: update.status === 'completed' ? 'completed'
                       : update.status === 'failed'   ? 'failed'
                       : 'generating',
              };
            }
          });

          setFrames(restoredFrames);
          setShowImageUploader(false);
        }
      } catch (err) {
        console.error('WebnovelTrailer: failed to load persisted state', err);
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
          setHasLoaded(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [currentProjectId, isContextLoading]);

  // ── CSV Import handlers ──────────────────────────────────

  // Read a File to text
  const readFileText = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (evt) => resolve(evt.target?.result as string);
      reader.readAsText(file);
    });

  // Initial CSV upload — accepts multiple files, concatenates their data rows
  const handleCsvFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const parsed = await Promise.all(files.map(readFileText).map(async (p) => parseCSV(await p)));

    // Use the first file's header row; concatenate data rows from all files
    const firstParsed = parsed[0];
    if (!firstParsed || firstParsed.length < 2) return;

    const headerRow = firstParsed[0];
    const allData = parsed.flatMap((p) => p.slice(1));

    setHeaders(headerRow);
    setCsvData(allData);
    setMapping(autoDetectMapping(headerRow));
    setCsvStep(2);
    e.target.value = '';
  }, []);

  // Append additional CSV(s) to existing frames using the stored mapping
  const handleAppendCsvUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !mapping.veoPrompt) {
      if (!mapping.veoPrompt) {
        toast({ title: 'Import a CSV first', description: 'Set up the column mapping before appending more files.', variant: 'destructive' });
      }
      return;
    }

    const parsed = await Promise.all(files.map(readFileText).map(async (p) => parseCSV(await p)));

    // Concatenate data rows from all files (skip each file's header row)
    const allData = parsed.flatMap((p) => p.slice(1));
    // Use headers from the stored first CSV (mapping is already set)
    const appendedFrames = applyMapping(headers, allData, mapping);

    if (appendedFrames.length === 0) {
      toast({ title: 'No clips found', description: 'The selected CSV(s) produced no valid clips.', variant: 'destructive' });
      e.target.value = '';
      return;
    }

    // Offset row indices so they continue after existing frames
    const offset = frames.length;
    const now = Date.now();
    const offsetFrames = appendedFrames.map((f, i) => ({
      ...f,
      id:       `frame-${offset + i}-${now}`,
      rowIndex: offset + i,
    }));

    setFrames((prev) => [...prev, ...offsetFrames]);

    // Persist appended clips to Firestore
    if (currentProjectId) {
      try {
        await saveWebnovelTrailerClipsBatch(
          currentProjectId,
          offsetFrames.map((frame) => ({
            clipId: `0_${frame.rowIndex}`,
            input: {
              clipIndex:   frame.rowIndex,
              sceneIndex:  0,
              sceneTitle:  `Clip ${frame.frameNumber}`,
              videoPrompt: frame.veoPrompt,
              length:      `${frame.clipLength || '5'}초`,
              videoApi:    frame.videoApi ?? null,
              imageUrl:    null,
            },
          }))
        );
      } catch (err) {
        console.error('WebnovelTrailer: failed to persist appended frames', err);
      }
    }

    toast({
      title: 'Clips appended',
      description: `Added ${offsetFrames.length} clip${offsetFrames.length !== 1 ? 's' : ''} from ${files.length} file${files.length !== 1 ? 's' : ''}.`,
    });
    e.target.value = '';
  }, [frames, headers, mapping, currentProjectId, toast]);

  const handleConfirmMapping = useCallback(async () => {
    if (!mapping.veoPrompt) {
      toast({
        title: 'Missing required column',
        description: 'Please map the Video Prompt column (default: column AF).',
        variant: 'destructive',
      });
      return;
    }

    const newFrames = applyMapping(headers, csvData, mapping);
    if (newFrames.length === 0) {
      toast({
        title: 'No clips found',
        description: 'CSV produced no valid clips. Check that your prompt column has content.',
        variant: 'destructive',
      });
      return;
    }

    setFrames(newFrames);
    setShowImageUploader(true);

    // Persist all frames to Firestore
    if (currentProjectId) {
      try {
        await saveWebnovelTrailerMeta(currentProjectId, aspectRatio, selectedProvider);
        await saveWebnovelTrailerClipsBatch(
          currentProjectId,
          newFrames.map((frame) => ({
            clipId: `0_${frame.rowIndex}`,
            input: {
              clipIndex:   frame.rowIndex,
              sceneIndex:  0,
              sceneTitle:  `Clip ${frame.frameNumber}`,
              videoPrompt: frame.veoPrompt,
              length:      `${frame.clipLength || '5'}초`,
              videoApi:    frame.videoApi ?? null,
              imageUrl:    null,
            },
          }))
        );
      } catch (err) {
        console.error('WebnovelTrailer: failed to persist frames', err);
      }
    }
  }, [mapping, headers, csvData, toast, currentProjectId, aspectRatio, selectedProvider]);

  // ── Bulk image upload — sequential assignment ────────────
  const handleBulkImagesUploaded = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;

      const sorted = Array.from(e.target.files).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

      // Read all files to base64
      const dataUrls = await Promise.all(
        sorted.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (evt) => resolve(evt.target?.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      // Assign sequentially: dataUrls[i] → frames[i]
      setFrames((prev) =>
        prev.map((f, i) => ({
          ...f,
          imageData: dataUrls[i] ?? null,
          imageUrl:  dataUrls[i] ? null : f.imageUrl,  // clear old S3 url if replacing
        }))
      );

      e.target.value = '';

      if (!currentProjectId) return;

      // Upload each image to S3 in background and swap base64 for CDN URL
      const uploadable = sorted.slice(0, frames.length);
      await Promise.all(
        uploadable.map(async (_, i) => {
          const frame = frames[i];
          if (!frame) return;
          const data = dataUrls[i];
          if (!data) return;

          const clipId = `0_${frame.rowIndex}`;
          try {
            const rawBase64 = data.split(',')[1];
            const base64 = await compressBase64Image(rawBase64, 1500, 0.8);
            const response = await fetch('/api/mithril/s3/image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId:      currentProjectId,
                imageType:      'csv-frame',
                csvFrameIndex:  frame.rowIndex,
                base64,
                mimeType:       'image/jpeg',
              }),
            });
            const result: { success: boolean; url?: string } = await response.json();
            if (result.success && result.url) {
              const displayUrl = `${result.url}?t=${Date.now()}`;
              setFrames((prev) =>
                prev.map((f) => (f.id === frame.id ? { ...f, imageData: null, imageUrl: displayUrl } : f))
              );
              await updateWebnovelTrailerClipStatus(currentProjectId, clipId, { imageUrl: displayUrl });
            }
          } catch (err) {
            console.error(`WebnovelTrailer: failed to upload image for clip ${frame.rowIndex}`, err);
          }
        })
      );
    },
    [frames, currentProjectId]
  );

  // ── Frame updaters ───────────────────────────────────────
  const debounceSaveClip = useCallback((frame: CsvFrame, updates: Parameters<typeof updateWebnovelTrailerClipStatus>[2]) => {
    if (!currentProjectId) return;
    const key = frame.id;
    const existing = editDebounceRef.current.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      editDebounceRef.current.delete(key);
      updateWebnovelTrailerClipStatus(currentProjectId, `0_${frame.rowIndex}`, updates).catch(console.error);
    }, 800);
    editDebounceRef.current.set(key, timer);
  }, [currentProjectId]);

  const updatePrompt = useCallback((id: string, prompt: string) => {
    setFrames((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, veoPrompt: prompt } : f));
      const frame = updated.find((f) => f.id === id);
      if (frame) debounceSaveClip(frame, { videoPrompt: prompt });
      return updated;
    });
  }, [debounceSaveClip]);

  // ── Refine prompts (vision-based) ──────────────────────
  const handleRefinePrompts = useCallback(async () => {
    const eligible = frames.filter((f) => f.imageUrl && f.veoPrompt.trim());
    if (eligible.length === 0) {
      toast({ title: "No clips with both image and prompt to refine", variant: "destructive" });
      return;
    }

    setIsRefining(true);
    setRefineProgress({ done: 0, total: eligible.length });

    let refinedCount = 0;
    const BATCH_SIZE = 10;

    try {
      for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
        const batch = eligible.slice(i, i + BATCH_SIZE);
        const payload = batch.map((f) => ({
          clipId: f.id,
          imageUrl: f.imageUrl!,
          currentPrompt: f.veoPrompt,
        }));

        const res = await fetch("/api/webnovel-trailer/refine-prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clips: payload }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const { results } = await res.json();

        for (const result of results) {
          if (result.action === "refined") {
            updatePrompt(result.clipId, result.refinedPrompt);
            refinedCount++;
          }
        }

        setRefineProgress({ done: Math.min(i + BATCH_SIZE, eligible.length), total: eligible.length });
      }

      toast({ title: `Refined ${refinedCount} of ${eligible.length} prompts` });
    } catch (err: any) {
      console.error("[refine-prompts]", err);
      toast({ title: `Refinement error: ${err.message}`, variant: "destructive" });
    } finally {
      setIsRefining(false);
    }
  }, [frames, updatePrompt, toast]);

  const handleRefineClip = useCallback(async (id: string) => {
    const frame = frames.find((f) => f.id === id);
    if (!frame || (!frame.imageUrl && !frame.imageData) || !frame.veoPrompt.trim()) return;

    try {
      const clipPayload: Record<string, string> = {
        clipId: id,
        currentPrompt: frame.veoPrompt,
      };
      if (frame.imageUrl) {
        clipPayload.imageUrl = frame.imageUrl;
      } else {
        clipPayload.imageBase64 = frame.imageData!;
      }

      const res = await fetch("/api/webnovel-trailer/refine-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clips: [clipPayload] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const { results } = await res.json();
      const result = results?.[0];
      if (result?.action === "refined") {
        updatePrompt(id, result.refinedPrompt);
        toast({ title: "Prompt refined" });
      } else {
        toast({ title: "Prompt already matches image — no change needed" });
      }
    } catch (err: any) {
      console.error("[refine-clip]", err);
      toast({ title: `Refinement error: ${err.message}`, variant: "destructive" });
    }
  }, [frames, updatePrompt, toast]);

  const updateStartImage = useCallback(async (id: string, data: string | null) => {
    const frame = frames.find((f) => f.id === id);
    if (!frame) return;

    const clipId = `0_${frame.rowIndex}`;

    if (data === null) {
      setFrames((prev) =>
        prev.map((f) => (f.id === id ? { ...f, imageData: null, imageUrl: null } : f))
      );
      if (currentProjectId) {
        await updateWebnovelTrailerClipStatus(currentProjectId, clipId, { imageUrl: null }).catch(console.error);
      }
      return;
    }

    setFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, imageData: data, imageUrl: null } : f))
    );

    if (!currentProjectId) return;

    try {
      const mimeType = data.match(/data:(.*?);/)?.[1] || 'image/webp';
      const base64 = data.split(',')[1];

      const response = await fetch('/api/mithril/s3/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId:     currentProjectId,
          imageType:     'csv-frame',
          csvFrameIndex: frame.rowIndex,
          base64,
          mimeType,
        }),
      });
      const result: { success: boolean; url?: string } = await response.json();

      if (result.success && result.url) {
        const displayUrl = `${result.url}?t=${Date.now()}`;
        setFrames((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, imageData: null, imageUrl: displayUrl } : f
          )
        );
        await updateWebnovelTrailerClipStatus(currentProjectId, clipId, { imageUrl: displayUrl });
      }
    } catch (err) {
      console.error('WebnovelTrailer: failed to upload start image', err);
      toast({
        title: 'Upload failed',
        description: 'Could not save the start image.',
        variant: 'destructive',
      });
    }
  }, [frames, currentProjectId, toast]);

  const updateDuration = useCallback((id: string, duration: string) => {
    setFrames((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, clipLength: duration } : f));
      const frame = updated.find((f) => f.id === id);
      if (frame) debounceSaveClip(frame, { length: `${duration}초` });
      return updated;
    });
  }, [debounceSaveClip]);

  const updateVideoApi = useCallback((id: string, videoApi: string) => {
    setFrames((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, videoApi: videoApi || undefined } : f));
      const frame = updated.find((f) => f.id === id);
      if (frame) debounceSaveClip(frame, { videoApi: videoApi || null });
      return updated;
    });
  }, [debounceSaveClip]);

  // ── Video generation ─────────────────────────────────────
  const generateFrame = useCallback(
    async (frameId: string) => {
      if (!currentProjectId) return;

      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;

      setFrames((prev) =>
        prev.map((f) =>
          f.id === frameId ? { ...f, status: 'generating', error: undefined, jobId: null } : f
        )
      );

      try {
        const effectiveProvider = frame.videoApi || selectedProvider;
        const constraints = getProviderConstraints(effectiveProvider);
        const validDurations = constraints?.durations || [4, 8];
        const parsed = parseInt(frame.clipLength || '5', 10);
        const duration = validDurations.reduce((prev, curr) =>
          Math.abs(curr - parsed) < Math.abs(prev - parsed) ? curr : prev
        );

        // Ensure start image is a CDN URL
        let resolvedStartImageUrl: string | undefined = frame.imageUrl || undefined;
        if (!resolvedStartImageUrl && frame.imageData) {
          const rawBase64 = frame.imageData.split(',')[1];
          const base64 = await compressBase64Image(rawBase64, 1500, 0.8);
          const res = await fetch('/api/mithril/s3/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId:     currentProjectId,
              imageType:     'csv-frame',
              csvFrameIndex: frame.rowIndex,
              base64,
              mimeType:      'image/jpeg',
            }),
          });
          const result: { success: boolean; url?: string } = await res.json();
          if (result.success && result.url) {
            resolvedStartImageUrl = result.url;
            setFrames((prev) => prev.map((f) => (f.id === frameId ? { ...f, imageData: null, imageUrl: result.url! } : f)));
          } else {
            throw new Error('Failed to upload start image to storage');
          }
        }

        if (!resolvedStartImageUrl) {
          throw new Error('No source image available. Please upload an image before generating.');
        }

        const response = await submitJob({
          projectId:   currentProjectId,
          sceneIndex:  0,
          clipIndex:   frame.rowIndex,
          providerId:  effectiveProvider as 'sora' | 'veo3' | 'grok_i2v' | 'grok_imagine_i2v' | 'wan_i2v' | 'wan22_i2v',
          prompt:      frame.veoPrompt,
          imageUrl:    resolvedStartImageUrl,
          duration,
          aspectRatio,
          apiKey:      videoApiKey || undefined,
        });

        // If the user cancelled while submitJob was in-flight, cancel immediately and bail out
        if (pendingCancellationsRef.current.has(frameId)) {
          pendingCancellationsRef.current.delete(frameId);
          cancelJob({ jobId: response.jobId }).catch(console.error);
          return;
        }

        activeJobsRef.current.add(response.jobId);

        const resolvedImageUrl = response.resolvedImageUrl || frame.imageUrl || null;

        setFrames((prev) =>
          prev.map((f) => (f.id === frameId ? { ...f, jobId: response.jobId, imageUrl: resolvedImageUrl } : f))
        );

        const clipId = `0_${frame.rowIndex}`;
        await updateWebnovelTrailerClipStatus(currentProjectId, clipId, {
          clipIndex:   frame.rowIndex,
          sceneIndex:  0,
          sceneTitle:  `Clip ${frame.frameNumber}`,
          videoPrompt: frame.veoPrompt,
          length:      `${frame.clipLength || '5'}초`,
          videoApi:    frame.videoApi ?? null,
          imageUrl:    resolvedImageUrl,
          videoRef:    null,
          s3FileName:  null,
          error:       null,
          jobId:      response.jobId,
          status:     'generating',
          providerId: effectiveProvider,
        });
      } catch (err) {
        if (!isMountedRef.current) return;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setFrames((prev) =>
          prev.map((f) => (f.id === frameId ? { ...f, status: 'failed', error: errorMessage } : f))
        );
        if (!shouldStopRef.current) {
          toast({
            title: phrase(dictionary, 'sora_toast_error', language) || 'Error',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      }
    },
    [frames, currentProjectId, selectedProvider, aspectRatio, videoApiKey, submitJob, cancelJob, toast, dictionary, language]
  );

  const regenerateFrame = useCallback(
    async (frameId: string) => {
      setFrames((prev) =>
        prev.map((f) =>
          f.id === frameId
            ? { ...f, status: 'idle', videoUrl: null, jobId: null, s3FileName: null, error: undefined }
            : f
        )
      );
      await generateFrame(frameId);
    },
    [generateFrame]
  );

  const handleGenerateAll = useCallback(async () => {
    shouldStopRef.current = false;
    setIsGeneratingAll(true);

    for (const frame of frames) {
      if (shouldStopRef.current || !isMountedRef.current) break;
      if (frame.status === 'completed') continue;
      if (!frame.imageData && !frame.imageUrl) continue;

      await generateFrame(frame.id);
      await new Promise((res) => setTimeout(res, 200));
    }

    if (isMountedRef.current) setIsGeneratingAll(false);
  }, [frames, generateFrame]);

  const handleCancelClip = useCallback(async (id: string) => {
    const frame = frames.find((f) => f.id === id);

    // Always reset the frame immediately so the UI reflects cancellation
    setFrames((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: 'idle', jobId: null } : f))
    );

    if (frame?.jobId) {
      // Job already submitted — cancel it on the backend
      cancelJob({ jobId: frame.jobId }).catch(console.error);
      activeJobsRef.current.delete(frame.jobId);
    } else {
      // submitJob is still in-flight — mark for deferred cancellation
      // generateFrame will check this ref and cancel as soon as jobId is known
      pendingCancellationsRef.current.add(id);
    }
  }, [frames, cancelJob]);

  const deleteFrame = useCallback((id: string) => {
    setFrames((prev) => {
      const frame = prev.find((f) => f.id === id);
      if (frame?.jobId) {
        activeJobsRef.current.delete(frame.jobId);
        cancelJob({ jobId: frame.jobId }).catch(console.error);
      }
      if (currentProjectId && frame) {
        deleteWebnovelTrailerClip(currentProjectId, `0_${frame.rowIndex}`).catch(console.error);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, [cancelJob, currentProjectId]);

  const handleAddFrame = useCallback(async () => {
    if (!currentProjectId) return;
    const newRowIndex = frames.length;
    const newFrame: CsvFrame = {
      id: `frame-${newRowIndex}-${Date.now()}`,
      rowIndex: newRowIndex,
      frameNumber: String(newRowIndex + 1),
      veoPrompt: '',
      referenceFilename: '',
      dialogue: undefined,
      sfx: undefined,
      clipLength: '5',
      videoApi: undefined,
      imageData: null,
      endFrameData: null,
      imageUrl: null,
      videoUrl: null,
      jobId: null,
      s3FileName: null,
      status: 'idle',
    };
    setFrames((prev) => [...prev, newFrame]);
    toast({ title: `Clip #${newFrame.frameNumber} added`, variant: 'success' });
    try {
      await saveWebnovelTrailerClip(currentProjectId, `0_${newRowIndex}`, {
        clipIndex: newRowIndex,
        sceneIndex: 0,
        sceneTitle: `Clip ${newFrame.frameNumber}`,
        videoPrompt: '',
        length: '5초',
        videoApi: null,
        imageUrl: null,
      });
    } catch (err) {
      console.error('WebnovelTrailer: failed to persist new frame', err);
    }
  }, [currentProjectId, frames.length, toast]);

  const handleStop = useCallback(() => {
    shouldStopRef.current = true;
    setIsGeneratingAll(false);

    activeJobsRef.current.forEach((jobId) => {
      cancelJob({ jobId }).catch(console.error);
    });
    activeJobsRef.current.clear();

    setFrames((prev) =>
      prev.map((f) =>
        f.status === 'pending' || f.status === 'generating'
          ? { ...f, status: 'idle', jobId: null }
          : f
      )
    );
  }, [cancelJob]);

  const handleSave = useCallback(async () => {
    if (!currentProjectId) return;
    setIsSaving(true);
    try {
      await saveWebnovelTrailerMeta(currentProjectId, aspectRatio, selectedProvider);
      toast({
        title: phrase(dictionary, 'sora_saved', language) || 'Saved',
        variant: 'default',
      });
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentProjectId, aspectRatio, selectedProvider, toast, dictionary, language]);

  const handleClear = useCallback(async () => {
    if (!currentProjectId) return;
    if (!confirm('Clear all clips and video data?')) return;
    try {
      await clearWebnovelTrailer(currentProjectId);
    } catch {
      // ignore
    }
    setFrames([]);
    setCsvStep(1);
    setHeaders([]);
    setCsvData([]);
    setMapping(DEFAULT_WEBNOVEL_MAPPING);
    setShowImageUploader(true);
    activeJobsRef.current.clear();
  }, [currentProjectId]);

  // ── ZIP download ────────────────────────────────────────
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    const completedFrames = frames.filter((f) => f.status === 'completed' && f.s3FileName);

    if (completedFrames.length === 0) {
      toast({
        title: phrase(dictionary, 'sora_toast_error', language) || 'Error',
        description: phrase(dictionary, 'sora_toast_no_videos', language) || 'No completed videos to download.',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloadingZip(true);

    try {
      const response = await fetch('/api/video/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips: completedFrames.map((f) => ({
            s3FileName:       f.s3FileName,
            sceneIndex:       0,
            clipIndex:        f.rowIndex,
            downloadFileName: `clip_${f.frameNumber}.mp4`,
          })),
          zipFileName: `webnovel_trailer_${Date.now()}.zip`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create ZIP');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `webnovel_trailer_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: phrase(dictionary, 'sora_toast_success', language) || 'Success',
        description: phrase(dictionary, 'sora_toast_zip_downloaded', language) || 'ZIP downloaded successfully.',
      });
    } catch (error) {
      console.error('ZIP download error:', error);
      toast({
        title: phrase(dictionary, 'sora_toast_error', language) || 'Error',
        description: phrase(dictionary, 'sora_toast_zip_failed', language) || 'Failed to download ZIP.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloadingZip(false);
    }
  }, [frames, toast, dictionary, language]);

  // ── Project export/import ───────────────────────────────
  const handleExportProject = useCallback(() => {
    if (frames.length === 0) return;

    const projectData = {
      name:       `webnovel_trailer_${Date.now()}`,
      aspectRatio,
      providerId: selectedProvider,
      frames: frames.map((f) => ({
        frameNumber: f.frameNumber,
        veoPrompt:   f.veoPrompt,
        dialogue:    f.dialogue,
        sfx:         f.sfx,
        clipLength:  f.clipLength,
        videoApi:    f.videoApi,
        imageUrl:    f.imageUrl,
        videoUrl:    f.videoUrl,
        s3FileName:  f.s3FileName,
        status:      f.status,
        providerId:  f.providerId,
      })),
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webnovel_trailer_project_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: phrase(dictionary, 'sora_toast_success', language) || 'Success',
      description: 'Project exported successfully.',
    });
  }, [frames, aspectRatio, selectedProvider, toast, dictionary, language]);

  const handleImportProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (!data.frames || !Array.isArray(data.frames)) {
          toast({
            title: 'Invalid project file',
            description: 'The file does not contain valid frame data.',
            variant: 'destructive',
          });
          return;
        }

        if (data.aspectRatio) setAspectRatio(data.aspectRatio);
        if (data.providerId)  setSelectedProvider(data.providerId);

        const now = Date.now();
        const importedFrames: CsvFrame[] = data.frames.map((f: Record<string, string | undefined>, i: number) => ({
          id:                `frame-${i}-${now}`,
          rowIndex:          i,
          frameNumber:       f.frameNumber || String(i + 1),
          veoPrompt:         f.veoPrompt || '',
          referenceFilename: '',
          dialogue:          f.dialogue,
          sfx:               f.sfx,
          clipLength:        f.clipLength,
          videoApi:          f.videoApi,
          imageData:         null,
          endFrameData:      null,
          imageUrl:          f.imageUrl || null,
          videoUrl:          f.videoUrl || null,
          jobId:             null,
          s3FileName:        f.s3FileName || null,
          status:            (f.status as CsvFrame['status']) || 'idle',
          providerId:        f.providerId,
        }));

        setFrames(importedFrames);
        setShowImageUploader(true);

        toast({
          title: phrase(dictionary, 'sora_toast_success', language) || 'Success',
          description: `Imported ${importedFrames.length} clips.`,
        });
      } catch {
        toast({
          title: 'Import failed',
          description: 'Could not parse the project file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [toast, dictionary, language]);

  // ── Derived values ───────────────────────────────────────
  const imagesAssignedCount = frames.filter((f) => f.imageData || f.imageUrl).length;
  const completedCount      = frames.filter((f) => f.status === 'completed').length;

  // ── Loading state ────────────────────────────────────────
  if (isLoadingData) {
    return <Loader message="Loading..." />;
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6 pb-12">
      {/* ── Section 1: CSV Import (shown when no frames) ── */}
      {frames.length === 0 && (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
            <span className="bg-[#DB2777] text-xs px-2 py-1 rounded-full">Step 1</span>
            Import Script (CSV)
          </h2>

          {csvStep === 1 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-[#DB2777] transition-colors bg-gray-950/50">
                <input
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleCsvFileUpload}
                  className="hidden"
                  id="wt-csv-upload"
                />
                <label htmlFor="wt-csv-upload" className="cursor-pointer flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-300 font-medium">Click to upload CSV Script(s)</span>
                  <span className="text-gray-500 text-sm mt-1">Multiple files supported — rows are concatenated. Video prompts default to column AF.</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500 uppercase font-bold">or</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              <div className="text-center">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportProject}
                  className="hidden"
                  id="wt-json-import"
                />
                <label
                  htmlFor="wt-json-import"
                  className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm font-medium"
                >
                  <Upload className="h-4 w-4" />
                  Import from Project JSON
                </label>
              </div>
            </div>
          )}

          {csvStep === 2 && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Map your CSV columns. Video prompt defaults to column AF.
              </p>

              {/* Required fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                <div>
                  <label className="block text-xs font-semibold text-[#DB2777] uppercase tracking-wider mb-2">
                    Video Prompt *
                  </label>
                  <select
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-0"
                    value={mapping.veoPrompt}
                    onChange={(e) => setMapping({ ...mapping, veoPrompt: e.target.value })}
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-[10px] text-gray-500 ml-1">Default: Col AF</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Frame Number (Optional)
                  </label>
                  <select
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-0"
                    value={mapping.frameNumber}
                    onChange={(e) => setMapping({ ...mapping, frameNumber: e.target.value })}
                  >
                    <option value="">-- Auto (row index) --</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-[10px] text-gray-500 ml-1">Default: Col B</span>
                </div>
              </div>

              <div className="h-px bg-gray-700 w-full my-4"></div>

              {/* Optional fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Dialogue (Optional)
                  </label>
                  <select
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-0"
                    value={mapping.dialogue}
                    onChange={(e) => setMapping({ ...mapping, dialogue: e.target.value })}
                  >
                    <option value="">-- None --</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-[10px] text-gray-500 ml-1">Default: Col L</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Sound Effect (Optional)
                  </label>
                  <select
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-0"
                    value={mapping.sfx}
                    onChange={(e) => setMapping({ ...mapping, sfx: e.target.value })}
                  >
                    <option value="">-- None --</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-[10px] text-gray-500 ml-1">Default: Col N</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Clip Length (Optional)
                  </label>
                  <select
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-0"
                    value={mapping.clipLength}
                    onChange={(e) => setMapping({ ...mapping, clipLength: e.target.value })}
                  >
                    <option value="">-- None --</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-[10px] text-gray-500 ml-1">Default: Col C</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Video API (Optional)
                  </label>
                  <select
                    className="w-full bg-gray-950 border border-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-0"
                    value={mapping.videoApi}
                    onChange={(e) => setMapping({ ...mapping, videoApi: e.target.value })}
                  >
                    <option value="">-- None --</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setCsvStep(1)}
                  className="text-gray-400 hover:text-white text-sm underline"
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirmMapping}
                  className="bg-[#DB2777] hover:bg-[#BE185D] text-white font-bold py-2 px-6 rounded-lg shadow-lg transform transition hover:-translate-y-0.5"
                >
                  Create Storyboard
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section 2: Bulk Image Upload ── */}
      {frames.length > 0 && showImageUploader && (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="bg-[#DB2777] text-xs px-2 py-1 rounded-full">Step 2</span>
              Upload Images
            </h2>
            <span
              className={`text-sm font-medium ${
                imagesAssignedCount === frames.length ? 'text-green-400' : 'text-yellow-400'
              }`}
            >
              {imagesAssignedCount} / {frames.length} assigned
            </span>
          </div>

          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center bg-gray-950/30 hover:bg-gray-950/60 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleBulkImagesUploaded}
              className="hidden"
              id="wt-bulk-image-upload"
            />
            <label htmlFor="wt-bulk-image-upload" className="cursor-pointer flex flex-col items-center">
              <div className="bg-gray-800 p-3 rounded-full mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="text-gray-300 font-medium">Click to upload images in order</span>
              <span className="text-gray-500 text-sm mt-1">
                Images are sorted by filename and assigned sequentially — first image → first clip
              </span>
            </label>
          </div>
        </div>
      )}

      {/* ── Section 3: Storyboard Grid ── */}
      {frames.length > 0 && (
        <div>
          {/* Header row */}
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Storyboard</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-gray-400 text-sm">
                  {frames.length} clips • {imagesAssignedCount} images ready
                  {completedCount > 0 && ` • ${completedCount}/${frames.length} completed`}
                </p>
                <button
                  onClick={() => setShowImageUploader((v) => !v)}
                  className="text-xs text-[#DB2777] hover:text-[#BE185D] underline ml-2"
                >
                  {showImageUploader ? 'Hide Upload' : 'Upload More Images'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Aspect ratio toggle */}
              <div className="bg-gray-800 rounded-lg p-1 flex text-xs font-bold">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value as AspectRatio)}
                    className={`px-3 py-1 rounded ${
                      aspectRatio === ar.value
                        ? 'bg-gray-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {ar.value}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <button
                onClick={handleRefinePrompts}
                disabled={isRefining || frames.filter((f) => f.imageUrl && f.veoPrompt.trim()).length === 0}
                className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50"
                title="Refine prompts to match reference images"
              >
                <Sparkles className="h-4 w-4" />
                {isRefining
                  ? `Refining ${refineProgress.done}/${refineProgress.total}...`
                  : 'Refine Prompts'}
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <Save className="h-4 w-4" />
                {isSaving
                  ? (phrase(dictionary, 'sora_saving', language) || 'Saving...')
                  : (phrase(dictionary, 'sora_save', language) || 'Save')}
              </button>

              {completedCount > 0 && (
                <button
                  onClick={handleDownloadAll}
                  disabled={isDownloadingZip}
                  className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50"
                  title="Download all videos as ZIP"
                >
                  {isDownloadingZip ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isDownloadingZip ? 'Downloading...' : 'ZIP'}
                </button>
              )}

              <button
                onClick={handleExportProject}
                disabled={frames.length === 0}
                className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50"
                title="Export project as JSON"
              >
                <FileDown className="h-4 w-4" />
                Export
              </button>

              <button
                onClick={handleClear}
                className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium bg-gray-700 hover:bg-red-700 text-white transition-colors"
                title="Clear all clips and start over"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <button
                onClick={handleAddFrame}
                disabled={!currentProjectId}
                className="flex items-center gap-1 py-1.5 px-3 rounded-lg text-sm font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors disabled:opacity-50"
                title="Add a blank clip"
              >
                <Plus className="h-4 w-4" />
                Add Clip
              </button>

              {isGeneratingAll ? (
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 py-2 px-5 rounded-lg font-bold bg-red-600 hover:bg-red-500 text-white transition-all"
                >
                  <StopCircle className="h-5 w-5" />
                  {phrase(dictionary, 'sora_stop', language) || 'Stop'}
                </button>
              ) : (
                imagesAssignedCount > 0 && (
                  <button
                    onClick={handleGenerateAll}
                    className="flex items-center gap-2 py-2 px-5 rounded-lg font-bold bg-[#DB2777] hover:bg-[#BE185D] text-white shadow-xl transform transition hover:-translate-y-0.5"
                  >
                    <Sparkles className="h-5 w-5" />
                    {phrase(dictionary, 'sora_generate_all', language) || 'Generate All'}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Progress bar */}
          {isGeneratingAll && frames.length > 0 && (
            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div
                className="bg-[#DB2777] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / frames.length) * 100}%` }}
              />
            </div>
          )}

          {/* Append more CSV(s) */}
          <div className="bg-gray-900/60 border border-gray-700 border-dashed rounded-xl p-4 flex items-center gap-4 mb-2">
            <div className="shrink-0 bg-gray-800 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-300">Append more clips</p>
              <p className="text-xs text-gray-500">Import additional CSV file(s) — clips are added after the existing {frames.length}</p>
            </div>
            <input
              type="file"
              accept=".csv"
              multiple
              onChange={handleAppendCsvUpload}
              className="hidden"
              id="wt-append-csv"
            />
            <label
              htmlFor="wt-append-csv"
              className="shrink-0 cursor-pointer px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Import CSV
            </label>
          </div>

          {/* Clip cards */}
          <div className="grid grid-cols-1 gap-6">
            {frames.map((frame) => (
              <TrailerClipCard
                key={frame.id}
                frame={frame}
                globalProvider={selectedProvider}
                onGenerate={generateFrame}
                onRegenerate={regenerateFrame}
                onCancel={handleCancelClip}
                onDelete={deleteFrame}
                onUpdatePrompt={updatePrompt}
                onUpdateStartImage={updateStartImage}
                onUpdateDuration={updateDuration}
                onUpdateVideoApi={updateVideoApi}
                onRefinePrompt={handleRefineClip}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

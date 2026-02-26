"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Film, Loader2, Download, Sparkles, Video, Upload, X, Image as ImageIcon, RefreshCcw } from "lucide-react";
import { useMithril } from "../../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import ProviderSelector from "../../VideoGenerator/ProviderSelector";
import { getProviderConstraints, getDefaultProviderId } from "../../VideoGenerator/providers";
import { ASPECT_RATIOS } from "../../VideoGenerator/types";
import type { AspectRatio } from "../../VideoGenerator/providers/types";
import {
  getNsfwVideoMeta,
  getNsfwVideoClips,
  saveNsfwVideoMeta,
  saveNsfwVideoClip,
  updateNsfwVideoClipStatus,
  clearNsfwVideo,
  mapJobToClipUpdate,
  getActiveProjectJobs,
} from "../../services/firestore";
import { useVideoOrchestrator, type ClipUpdate } from "../../VideoGenerator/useVideoOrchestrator";

// ============================================================
// Constants
// ============================================================

const NSFW_VIDEO_STAGE = 5;
const SCENE_INDEX = 0;
const MAX_BATCH = 4;

// ============================================================
// Types
// ============================================================

type AppStatus = 'idle' | 'generating' | 'complete' | 'error';

interface VideoResult {
  clipIndex: number;
  videoUrl: string;
  jobId: string;
}

// ============================================================
// ImageUpload sub-component (mirrors reference ImageUpload.tsx)
// ============================================================

interface ImageUploadProps {
  label: string;
  imagePreview: string | null;
  onImageChange: (preview: string | null, base64: string | null) => void;
  id: string;
}

function ImageUpload({ label, imagePreview, onImageChange, id }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      onImageChange(previewUrl, evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative h-48 w-full rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
          ${imagePreview
            ? 'border-[#DB2777]/50 bg-slate-800'
            : 'border-slate-700 bg-slate-800/50 hover:border-[#DB2777]/50 hover:bg-slate-800'
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
          id={id}
        />
        {imagePreview ? (
          <>
            <img src={imagePreview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white font-medium flex items-center gap-2">
                <Upload size={16} /> Change Image
              </span>
            </div>
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors z-10"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 group-hover:text-[#DB2777] transition-colors">
            <ImageIcon size={32} className="mb-2" />
            <span className="text-sm font-medium">Click to upload</span>
            <span className="text-xs opacity-60 mt-1">PNG, JPG, WebP</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function NsfwVideoGenerator() {
  const {
    currentProjectId,
    videoApiKey,
    currentStage,
    isLoading: isContextLoading,
  } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();

  // ── Inputs ───────────────────────────────────────────────
  const [prompt, setPrompt]                     = useState('');
  const [startImagePreview, setStartImagePreview] = useState<string | null>(null);
  const [startImageBase64, setStartImageBase64]   = useState<string | null>(null);
  const [endImagePreview, setEndImagePreview]     = useState<string | null>(null);
  const [endImageBase64, setEndImageBase64]       = useState<string | null>(null);
  const [batchSize, setBatchSize]               = useState(1);

  // ── Generation state ─────────────────────────────────────
  const [appStatus, setAppStatus]   = useState<AppStatus>('idle');
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);

  // ── Provider / aspect ratio ──────────────────────────────
  const [selectedProvider, setSelectedProvider] = useState(getDefaultProviderId());
  const [aspectRatio, setAspectRatio]           = useState<AspectRatio>('16:9');

  // ── Loading / orchestrator ───────────────────────────────
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasLoaded, setHasLoaded]         = useState(false);
  const activeJobsRef   = useRef<Set<string>>(new Set());
  const isMountedRef    = useRef(true);
  const pendingJobCount = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Clip update handler ──────────────────────────────────
  const handleClipUpdate = useCallback((update: ClipUpdate) => {
    if (!isMountedRef.current) return;
    if (update.sceneIndex !== SCENE_INDEX) return;

    const isTerminal = update.status === 'completed' || update.status === 'failed';
    if (isTerminal) activeJobsRef.current.delete(update.jobId);

    if (update.status === 'completed' && update.videoUrl) {
      setVideoResults((prev) => {
        const exists = prev.some((v) => v.clipIndex === update.clipIndex);
        if (exists) {
          return prev.map((v) =>
            v.clipIndex === update.clipIndex
              ? { ...v, videoUrl: update.videoUrl!, jobId: update.jobId }
              : v
          );
        }
        return [...prev, { clipIndex: update.clipIndex, videoUrl: update.videoUrl!, jobId: update.jobId }];
      });

      // Persist to Firestore
      if (currentProjectId) {
        const clipId = `${SCENE_INDEX}_${update.clipIndex}`;
        updateNsfwVideoClipStatus(currentProjectId, clipId, {
          videoRef:   update.videoUrl,
          s3FileName: update.s3FileName ?? undefined,
          jobId:      update.jobId,
          status:     'completed',
          providerId: update.providerId,
        }).catch(console.error);
      }

      // Decrement pending and check if all done
      pendingJobCount.current = Math.max(0, pendingJobCount.current - 1);
      if (pendingJobCount.current === 0 && activeJobsRef.current.size === 0) {
        setAppStatus('complete');
      }
    } else if (update.status === 'failed') {
      pendingJobCount.current = Math.max(0, pendingJobCount.current - 1);
      if (pendingJobCount.current === 0 && activeJobsRef.current.size === 0) {
        setAppStatus('error');
        setErrorMsg('One or more videos failed to generate.');
      }
    }
  }, [currentProjectId]);

  // ── Orchestrator hook ────────────────────────────────────
  const { submitJob, cancelJob, pendingUpdates, clearPendingUpdates } =
    useVideoOrchestrator({
      projectId:    currentProjectId,
      enabled:      currentStage === NSFW_VIDEO_STAGE,
      onClipUpdate: handleClipUpdate,
    });

  // ── Apply pending updates once loaded ───────────────────
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
          getNsfwVideoMeta(currentProjectId),
          getNsfwVideoClips(currentProjectId),
        ]);

        if (cancelled) return;

        if (meta) {
          setAspectRatio(meta.aspectRatio);
          if (meta.providerId) setSelectedProvider(meta.providerId);
          if (meta.prompt) setPrompt(meta.prompt);
          if (meta.batchSize) setBatchSize(meta.batchSize);
        }

        const completedClips = savedClips.filter(
          (c) => c.status === 'completed' && c.videoRef
        );

        if (completedClips.length > 0) {
          const results: VideoResult[] = completedClips.map((c) => ({
            clipIndex: c.clipIndex,
            videoUrl:  c.videoRef!,
            jobId:     c.jobId ?? '',
          }));
          setVideoResults(results);
          setAppStatus('complete');
        }

        // Re-track active jobs
        const activeJobs = await getActiveProjectJobs(currentProjectId);
        let inFlightCount = 0;
        activeJobs.forEach((job) => {
          if (job.type && job.type !== 'video') return;
          if (job.scene_index !== SCENE_INDEX) return;
          const update = mapJobToClipUpdate(job);
          activeJobsRef.current.add(update.jobId);
          inFlightCount++;
        });
        if (inFlightCount > 0) {
          pendingJobCount.current = inFlightCount;
          setAppStatus('generating');
        }
      } catch (err) {
        console.error('NsfwVideoGenerator: failed to load state', err);
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
          setHasLoaded(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [currentProjectId, isContextLoading]);

  // ── Generate ─────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!startImageBase64 || !currentProjectId) return;

    setVideoResults([]);
    setErrorMsg(null);
    setAppStatus('generating');
    activeJobsRef.current.clear();
    pendingJobCount.current = batchSize;

    try {
      const constraints = getProviderConstraints(selectedProvider);
      const duration    = constraints?.durations?.[0] ?? 4;

      // Save meta to Firestore
      await saveNsfwVideoMeta(currentProjectId, {
        prompt,
        aspectRatio,
        providerId: selectedProvider,
        batchSize,
      });

      for (let i = 0; i < batchSize; i++) {
        const clipId = `${SCENE_INDEX}_${i}`;
        await saveNsfwVideoClip(currentProjectId, clipId, {
          clipIndex:  i,
          sceneIndex: SCENE_INDEX,
        });

        const response = await submitJob({
          projectId:   currentProjectId,
          sceneIndex:  SCENE_INDEX,
          clipIndex:   i,
          providerId:  selectedProvider as 'sora' | 'veo3' | 'grok_i2v' | 'wan_i2v' | 'wan22_i2v',
          prompt,
          imageUrl:    startImageBase64,
          imageEndUrl: endImageBase64 || undefined,
          duration,
          aspectRatio,
          apiKey:      videoApiKey || undefined,
        });

        activeJobsRef.current.add(response.jobId);
        await updateNsfwVideoClipStatus(currentProjectId, clipId, {
          jobId:     response.jobId,
          status:    'generating',
          providerId: selectedProvider,
        });
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(msg);
      setAppStatus('error');
      pendingJobCount.current = 0;
      toast({
        title: phrase(dictionary, 'sora_toast_error', language) || 'Error',
        description: msg,
        variant: 'destructive',
      });
    }
  }, [
    startImageBase64, endImageBase64, prompt, batchSize,
    currentProjectId, selectedProvider, aspectRatio, videoApiKey,
    submitJob, toast, dictionary, language,
  ]);

  const handleReset = useCallback(async () => {
    if (appStatus === 'generating') return;
    if (currentProjectId) {
      await clearNsfwVideo(currentProjectId).catch(console.error);
    }
    setVideoResults([]);
    setAppStatus('idle');
    setErrorMsg(null);
    activeJobsRef.current.clear();
    pendingJobCount.current = 0;
  }, [appStatus, currentProjectId]);

  // ── Derived ──────────────────────────────────────────────
  const isGenerating  = appStatus === 'generating';
  const canGenerate   = !!startImageBase64 && !isGenerating;

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin h-8 w-8 text-[#DB2777]" />
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="text-slate-200">

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 flex items-center justify-between">
          <span className="text-sm">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="p-1 hover:bg-red-800/30 rounded ml-4"
          >
            <RefreshCcw size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left Column: Inputs ── */}
        <div className={`lg:col-span-5 space-y-8 transition-opacity duration-300 ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}>

          {/* Keyframes */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-[#DB2777]" /> Keyframes
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <ImageUpload
                id="start-frame"
                label="Start Frame"
                imagePreview={startImagePreview}
                onImageChange={(preview, base64) => {
                  setStartImagePreview(preview);
                  setStartImageBase64(base64);
                }}
              />
              <ImageUpload
                id="end-frame"
                label="End Frame"
                imagePreview={endImagePreview}
                onImageChange={(preview, base64) => {
                  setEndImagePreview(preview);
                  setEndImageBase64(base64);
                }}
              />
            </div>
          </div>

          {/* Prompt + Settings */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" /> Prompt Details
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Describe the motion</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., The camera pans smoothly, lighting changes to sunset..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-[#DB2777] focus:border-transparent outline-none resize-none h-32 transition-all placeholder:text-slate-600"
              />
            </div>

            {/* Batch Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Batch Size</label>
              <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-lg border border-slate-700 w-fit">
                {Array.from({ length: MAX_BATCH }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setBatchSize(num)}
                    className={`
                      w-10 h-10 rounded-md font-bold transition-all
                      ${batchSize === num
                        ? 'bg-[#DB2777] text-white shadow-lg shadow-pink-900/50'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Generating multiple videos increases wait time linearly.
              </p>
            </div>

            {/* Provider + Aspect Ratio */}
            <div className="flex items-center gap-3 flex-wrap">
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
              <ProviderSelector
                value={selectedProvider}
                onChange={setSelectedProvider}
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`
              w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all
              ${!canGenerate
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-[#DB2777] hover:bg-[#BE185D] hover:shadow-lg hover:shadow-pink-900/40 text-white transform active:scale-[0.98]'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-current" />
                {phrase(dictionary, 'sora_clip_generate', language) || 'Generate Video'}
              </>
            )}
          </button>
        </div>

        {/* ── Right Column: Dynamic Content ── */}
        <div className="lg:col-span-7 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 min-h-[600px] flex flex-col relative overflow-hidden">

          {/* IDLE / ERROR: Placeholder */}
          {(appStatus === 'idle' || (appStatus === 'error' && videoResults.length === 0)) && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <Film className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Ready to Create</h3>
              <p className="text-slate-500 max-w-sm">
                Upload your starting frame on the left, set your parameters, and watch your video come to life here.
              </p>
            </div>
          )}

          {/* GENERATING: Spinner */}
          {appStatus === 'generating' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-slate-800 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-[#DB2777] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Film className="w-8 h-8 text-[#DB2777] animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Generating...</h2>
              <p className="text-slate-400 animate-pulse mb-6">
                Veo is processing your frames.
              </p>
              <div className="max-w-xs bg-slate-800/50 rounded-lg p-3 text-xs text-slate-500">
                <p>Tip: Veo creates high-quality motion interpolation. Larger batch sizes take longer.</p>
              </div>
              <button
                onClick={() => {
                  activeJobsRef.current.forEach((jobId) => {
                    cancelJob({ jobId }).catch(console.error);
                  });
                  activeJobsRef.current.clear();
                  pendingJobCount.current = 0;
                  setAppStatus('idle');
                }}
                className="mt-6 text-xs text-slate-500 hover:text-slate-300 underline"
              >
                Cancel
              </button>
            </div>
          )}

          {/* COMPLETE (or partial results): Video Grid */}
          {(appStatus === 'complete' || (appStatus === 'error' && videoResults.length > 0)) && (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-green-400 text-xs">●</span> Results
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">
                    {videoResults.length} Video{videoResults.length !== 1 ? 's' : ''} Generated
                  </span>
                  <button
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className={`grid gap-6 ${videoResults.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {videoResults
                  .sort((a, b) => a.clipIndex - b.clipIndex)
                  .map((vid, idx) => (
                    <div
                      key={vid.clipIndex}
                      className="bg-black/40 rounded-xl overflow-hidden border border-slate-700/50 shadow-lg flex flex-col group"
                    >
                      <div className="aspect-video bg-black relative flex items-center justify-center">
                        <video
                          src={vid.videoUrl}
                          controls
                          loop
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-3 bg-slate-800/50 border-t border-slate-700/50 flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#DB2777] uppercase">
                          Variation {idx + 1}
                        </p>
                        <a
                          href={vid.videoUrl}
                          download={`niji-veo-${idx + 1}.mp4`}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                          title="Download"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

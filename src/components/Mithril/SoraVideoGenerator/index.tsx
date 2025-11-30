"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Sparkles, StopCircle, Save, Check, Trash2, Download } from "lucide-react";
import ClipCard from "./ClipCard";
import type {
  SoraVideoClip,
  AspectRatio,
  SoraVideoResultMetadata,
  SoraVideoSubmitResponse,
  SoraVideoStatusResponse,
} from "./types";
import { ASPECT_RATIOS, STORAGE_KEY } from "./types";
import type { Scene } from "../StoryboardGenerator/types";

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SoraVideoGenerator() {
  const { setStageResult } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();

  // Loading state
  const [isLoadingData, setIsLoadingData] = useState(true);
  const hasLoadedRef = useRef(false);

  // Clip data
  const [clips, setClips] = useState<SoraVideoClip[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");

  // Generation state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const shouldStopRef = useRef(false);

  // Load storyboard data and NanoBanana images on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadData = async () => {
      try {
        // 1. Load storyboard result from localStorage
        const storyboardRaw = localStorage.getItem("storyboard_result");
        if (!storyboardRaw) {
          setIsLoadingData(false);
          return;
        }

        const storyboardData = JSON.parse(storyboardRaw) as { scenes: Scene[] };
        if (!storyboardData.scenes || storyboardData.scenes.length === 0) {
          setIsLoadingData(false);
          return;
        }

        // 2. Load any previously saved Sora results
        const savedResultRaw = localStorage.getItem(STORAGE_KEY);
        let savedResult: SoraVideoResultMetadata | null = null;
        if (savedResultRaw) {
          try {
            savedResult = JSON.parse(savedResultRaw);
            if (savedResult?.aspectRatio) {
              setAspectRatio(savedResult.aspectRatio);
            }
          } catch {
            // Ignore parse errors
          }
        }

        // 3. Build clips array from storyboard scenes
        // TODO: After Friend B completes NanoBanana full port, load images from IndexedDB
        // For now, imageBase64 will be null
        const allClips: SoraVideoClip[] = [];
        let globalClipIndex = 0;

        storyboardData.scenes.forEach((scene, sceneIndex) => {
          scene.clips.forEach((clip, clipIndex) => {
            // Check if we have saved status for this clip
            const savedClip = savedResult?.clips.find(
              (c) => c.sceneIndex === sceneIndex && c.clipIndex === clipIndex
            );

            allClips.push({
              clipIndex,
              sceneIndex,
              sceneTitle: scene.sceneTitle,
              videoPrompt: clip.videoPrompt,
              soraVideoPrompt: clip.soraVideoPrompt,
              length: clip.length,
              imageBase64: null, // TODO: Load from NanoBanana IndexedDB
              videoUrl: savedClip?.videoUrl || null,
              jobId: savedClip?.jobId || null,
              status: savedClip?.status || "pending",
              error: savedClip?.error,
            });
            globalClipIndex++;
          });
        });

        setClips(allClips);
        if (savedResult) {
          setIsSaved(true);
        }

        hasLoadedRef.current = true;
      } catch (err) {
        console.error("Error loading data:", err);
        toast({
          title: phrase(dictionary, "sora_toast_error", language),
          description: phrase(dictionary, "sora_toast_load_failed", language),
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [toast, dictionary, language]);

  // Auto-save helper (silent, no toast)
  const autoSave = useCallback((updatedClips: SoraVideoClip[]) => {
    try {
      const metadata: SoraVideoResultMetadata = {
        clips: updatedClips.map((c) => ({
          clipIndex: c.clipIndex,
          sceneIndex: c.sceneIndex,
          videoUrl: c.videoUrl,
          jobId: c.jobId,
          status: c.status,
          error: c.error,
        })),
        aspectRatio,
        createdAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
      setStageResult(8, metadata);
      setIsSaved(true);
    } catch (err) {
      console.error("Error auto-saving:", err);
    }
  }, [aspectRatio, setStageResult]);

  // Generate a single clip
  const generateClip = useCallback(
    async (clipIndex: number, sceneIndex: number) => {
      const clipArrayIndex = clips.findIndex(
        (c) => c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
      );
      if (clipArrayIndex === -1) return;

      const clip = clips[clipArrayIndex];

      // Update status to generating
      setClips((prev) =>
        prev.map((c, i) =>
          i === clipArrayIndex ? { ...c, status: "generating", error: undefined } : c
        )
      );

      try {
        // Parse duration from length (e.g., "1초" -> 1, "2초" -> 2)
        const durationMatch = clip.length.match(/(\d+)/);
        const parsedDuration = durationMatch ? parseInt(durationMatch[1], 10) : 4;
        // Sora only supports 4, 8, or 12 seconds - map to nearest valid value
        const validDurations = [4, 8, 12];
        const soraDuration = validDurations.reduce((prev, curr) =>
          Math.abs(curr - parsedDuration) < Math.abs(prev - parsedDuration) ? curr : prev
        );

        // 1. Submit job
        const submitResponse = await fetch("/api/sora_video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: clip.soraVideoPrompt || clip.videoPrompt,
            imageBase64: clip.imageBase64 || undefined,
            duration: soraDuration,
            aspectRatio,
          }),
        });

        const submitData: SoraVideoSubmitResponse = await submitResponse.json();

        if (!submitResponse.ok) {
          throw new Error((submitData as unknown as { error: string }).error || "Failed to submit job");
        }

        const jobId = submitData.jobId;

        // Update with job ID
        setClips((prev) =>
          prev.map((c, i) =>
            i === clipArrayIndex ? { ...c, jobId } : c
          )
        );

        // 2. Poll for completion
        let status: SoraVideoStatusResponse["status"] = "pending";
        let videoUrl: string | undefined;
        let pollError: string | undefined;

        while (status === "pending" || status === "running") {
          // Check if we should stop
          if (shouldStopRef.current) {
            throw new Error("Generation cancelled");
          }

          await sleep(5000); // Poll every 5 seconds

          const statusResponse = await fetch(`/api/sora_video/status?jobId=${jobId}`);
          const statusData: SoraVideoStatusResponse = await statusResponse.json();

          status = statusData.status;
          videoUrl = statusData.videoUrl;
          pollError = statusData.error;

          if (status === "failed") {
            throw new Error(pollError || "Video generation failed");
          }
        }

        // 3. Update with completed video and auto-save
        setClips((prev) => {
          const updatedClips = prev.map((c, i) =>
            i === clipArrayIndex
              ? { ...c, status: "completed" as const, videoUrl: videoUrl || null, error: undefined }
              : c
          );
          // Auto-save after successful generation
          autoSave(updatedClips);
          return updatedClips;
        });

        toast({
          title: phrase(dictionary, "sora_toast_success", language),
          description: `${phrase(dictionary, "sora_toast_clip_generated", language)} ${sceneIndex + 1}-${clipIndex + 1}`,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        setClips((prev) =>
          prev.map((c, i) =>
            i === clipArrayIndex ? { ...c, status: "failed", error: errorMessage } : c
          )
        );

        if (!shouldStopRef.current) {
          toast({
            title: phrase(dictionary, "sora_toast_error", language),
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    },
    [clips, aspectRatio, autoSave, toast, dictionary, language]
  );

  // Generate all clips sequentially
  const handleGenerateAll = useCallback(async () => {
    shouldStopRef.current = false;
    setIsGeneratingAll(true);

    for (let i = 0; i < clips.length; i++) {
      if (shouldStopRef.current) break;

      const clip = clips[i];
      if (clip.status === "completed") continue; // Skip already completed clips

      await generateClip(clip.clipIndex, clip.sceneIndex);
    }

    setIsGeneratingAll(false);
    shouldStopRef.current = false;
  }, [clips, generateClip]);

  // Stop generation
  const handleStop = useCallback(() => {
    shouldStopRef.current = true;
    setIsGeneratingAll(false);
    toast({
      title: phrase(dictionary, "sora_toast_stopped", language),
      description: phrase(dictionary, "sora_toast_stopped_desc", language),
    });
  }, [toast, dictionary, language]);

  // Save results to localStorage
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const metadata: SoraVideoResultMetadata = {
        clips: clips.map((c) => ({
          clipIndex: c.clipIndex,
          sceneIndex: c.sceneIndex,
          videoUrl: c.videoUrl,
          jobId: c.jobId,
          status: c.status,
          error: c.error,
        })),
        aspectRatio,
        createdAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
      setStageResult(8, metadata);
      setIsSaved(true);

      toast({
        title: phrase(dictionary, "sora_toast_saved", language),
        description: phrase(dictionary, "sora_toast_saved_desc", language),
      });
    } catch (err) {
      console.error("Error saving:", err);
      toast({
        title: phrase(dictionary, "sora_toast_error", language),
        description: phrase(dictionary, "sora_toast_save_failed", language),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [clips, aspectRatio, setStageResult, toast, dictionary, language]);

  // Clear all results
  const handleClear = useCallback(() => {
    setClips((prev) =>
      prev.map((c) => ({
        ...c,
        videoUrl: null,
        jobId: null,
        status: "pending" as const,
        error: undefined,
      }))
    );
    localStorage.removeItem(STORAGE_KEY);
    setIsSaved(false);
  }, []);

  // Download all videos as a batch
  const handleDownloadAll = useCallback(() => {
    const completedClips = clips.filter((c) => c.status === "completed" && c.videoUrl);
    if (completedClips.length === 0) {
      toast({
        title: phrase(dictionary, "sora_toast_error", language),
        description: phrase(dictionary, "sora_toast_no_videos", language),
        variant: "destructive",
      });
      return;
    }

    // Download each video (browser will handle as separate downloads)
    completedClips.forEach((clip, index) => {
      setTimeout(() => {
        const link = document.createElement("a");
        link.href = clip.videoUrl!;
        link.download = `clip_${clip.sceneIndex + 1}_${clip.clipIndex + 1}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500); // Stagger downloads
    });
  }, [clips, toast, dictionary, language]);

  // Stats
  const completedCount = clips.filter((c) => c.status === "completed").length;
  const totalCount = clips.length;

  if (isLoadingData) {
    return (
      <div className="w-full p-6">
        <Loader message={phrase(dictionary, "sora_loading", language)} />
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {phrase(dictionary, "sora_title", language)}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {phrase(dictionary, "sora_no_storyboard", language)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          {phrase(dictionary, "sora_title", language)}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {phrase(dictionary, "sora_subtitle", language)}
        </p>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {phrase(dictionary, "sora_aspect_ratio", language)}
        </label>
        <div className="flex gap-4">
          {ASPECT_RATIOS.map((ratio) => (
            <label
              key={ratio.value}
              className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all ${
                aspectRatio === ratio.value
                  ? "border-[#DB2777] bg-[#DB2777]/10 text-[#DB2777]"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
              } ${isGeneratingAll ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="aspectRatio"
                value={ratio.value}
                checked={aspectRatio === ratio.value}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                disabled={isGeneratingAll}
                className="accent-[#DB2777]"
              />
              <span className="text-sm font-medium">{ratio.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isGeneratingAll ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <StopCircle size={18} />
              <span>{phrase(dictionary, "sora_stop", language)}</span>
            </button>
          ) : (
            <button
              onClick={handleGenerateAll}
              disabled={completedCount === totalCount}
              className="flex items-center gap-2 px-4 py-2 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={18} />
              <span>{phrase(dictionary, "sora_generate_all", language)}</span>
            </button>
          )}

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {phrase(dictionary, "sora_progress", language)}: {completedCount}/{totalCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-colors text-sm ${
              isSaved
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : isSaving
                ? "bg-[#DB2777]/70 text-white cursor-wait"
                : "bg-[#DB2777] hover:bg-[#BE185D] text-white"
            }`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSaved ? (
              <Save size={16} />
            ) : (
              <Save size={16} />
            )}
            <span>
              {isSaving
                ? phrase(dictionary, "sora_saving", language)
                : isSaved
                ? phrase(dictionary, "sora_saved", language)
                : phrase(dictionary, "sora_save", language)}
            </span>
          </button>

          {completedCount > 0 && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              <Download size={16} />
              <span>{phrase(dictionary, "sora_download_all", language)}</span>
            </button>
          )}

          <button
            onClick={handleClear}
            disabled={isGeneratingAll}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isGeneratingAll && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-[#DB2777] h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Clip Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto p-1">
        {clips.map((clip) => (
          <ClipCard
            key={`${clip.sceneIndex}-${clip.clipIndex}`}
            clip={clip}
            onGenerate={generateClip}
            isGeneratingAll={isGeneratingAll}
          />
        ))}
      </div>
    </div>
  );
}

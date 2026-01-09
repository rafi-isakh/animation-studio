"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Sparkles, StopCircle, Save, Trash2, Download } from "lucide-react";
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
import { getNanoBananaImageBySceneClip } from "../services/mithrilIndexedDB";

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
  const { setStageResult, currentStage } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();

  // Loading state
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Clip data
  const [clips, setClips] = useState<SoraVideoClip[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");

  // Generation state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const shouldStopRef = useRef(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

   // Reset mounted ref on mount, cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    shouldStopRef.current = false;

    return () => {
      isMountedRef.current = false;
      shouldStopRef.current = true;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Load storyboard data and NanoBanana images when entering this stage
  // Re-loads when navigating back to this stage to pick up any edited prompts
  useEffect(() => {
    // Reset loaded state when leaving this stage so we reload on next visit
    if (currentStage !== 6) {
      setHasLoaded(false);
      return;
    }

    // Already loaded for this stage visit
    if (hasLoaded) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // 1. Load storyboard result from localStorage
        const storyboardRaw = localStorage.getItem("storyboard_result");
        if (!storyboardRaw) {
          setIsLoadingData(false);
          setHasLoaded(true);
          return;
        }

        const storyboardData = JSON.parse(storyboardRaw) as { scenes: Scene[] };
        if (!storyboardData.scenes || storyboardData.scenes.length === 0) {
          setIsLoadingData(false);
          setHasLoaded(true);
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
        const allClips: SoraVideoClip[] = [];

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
              imageBase64: null, // Will be loaded from IndexedDB below
              videoUrl: savedClip?.videoUrl || null,
              jobId: savedClip?.jobId || null,
              s3FileName: savedClip?.s3FileName || null,
              status: savedClip?.status || "pending",
              error: savedClip?.error,
            });
          });
        });

        // 4. Load NanoBanana images from IndexedDB for each clip
        for (let i = 0; i < allClips.length; i++) {
          const clip = allClips[i];
          try {
            const imageBase64 = await getNanoBananaImageBySceneClip(
              clip.sceneIndex,
              clip.clipIndex
            );
            if (imageBase64) {
              allClips[i].imageBase64 = imageBase64;
            }
          } catch (err) {
            // Silently continue if image not found - will use text-to-video
            console.warn(`No NanoBanana image found for scene ${clip.sceneIndex}, clip ${clip.clipIndex}`);
          }
        }

        setClips(allClips);
        if (savedResult) {
          setIsSaved(true);
        }

        setHasLoaded(true);
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
  }, [currentStage, hasLoaded, toast, dictionary, language]);

  // Auto-save helper (silent, no toast)
  const autoSave = useCallback((updatedClips: SoraVideoClip[]) => {
    try {
      const metadata: SoraVideoResultMetadata = {
        clips: updatedClips.map((c) => ({
          clipIndex: c.clipIndex,
          sceneIndex: c.sceneIndex,
          videoUrl: c.videoUrl,
          jobId: c.jobId,
          s3FileName: c.s3FileName,
          status: c.status,
          error: c.error,
        })),
        aspectRatio,
        createdAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
      setStageResult(7, metadata);
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

       // Create AbortController for this generation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

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
          signal: abortController.signal,
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
        let s3FileName: string | undefined;
        let pollError: string | undefined;

        while (status === "pending" || status === "running") {
          // Check if we should stop (user clicked stop or component unmounted)
          if (shouldStopRef.current || !isMountedRef.current) {
            throw new Error("Generation cancelled");
          }

          await sleep(5000); // Poll every 5 seconds

          const statusResponse = await fetch(`/api/sora_video/status?jobId=${jobId}`, {
            signal: abortController.signal,
          });
          const statusData: SoraVideoStatusResponse = await statusResponse.json();

          status = statusData.status;
          videoUrl = statusData.videoUrl;
          s3FileName = statusData.s3FileName;
          pollError = statusData.error;

          if (status === "failed") {
            throw new Error(pollError || "Video generation failed");
          }
        }

        // 3. Update with completed video and auto-save (only if still mounted)
        if (isMountedRef.current) {
          setClips((prev) => {
            const updatedClips = prev.map((c, i) =>
              i === clipArrayIndex
                ? { ...c, status: "completed" as const, videoUrl: videoUrl || null, s3FileName: s3FileName || null, error: undefined }
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
        }
      } catch (err) {
        // Don't show error for aborted requests or unmounted component
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (!isMountedRef.current) {
          return;
        }

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
      // Check if we should stop (user clicked stop or component unmounted)
      if (shouldStopRef.current || !isMountedRef.current) break;

      const clip = clips[i];
      if (clip.status === "completed") continue; // Skip already completed clips

      await generateClip(clip.clipIndex, clip.sceneIndex);
    }

    // Only update state if still mounted
    if (isMountedRef.current) {
      setIsGeneratingAll(false);
      shouldStopRef.current = false;
    }
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
          s3FileName: c.s3FileName,
          status: c.status,
          error: c.error,
        })),
        aspectRatio,
        createdAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
      setStageResult(7, metadata);
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

  // Clear all results and delete videos from S3
  const handleClear = useCallback(async () => {
    setIsClearing(true);

    // Collect S3 filenames to delete
    const s3FileNames = clips
      .filter((c) => c.s3FileName)
      .map((c) => c.s3FileName as string);

    // Delete from S3 if there are files to delete
    if (s3FileNames.length > 0) {
      try {
        await fetch("/api/sora_video/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileNames: s3FileNames }),
        });
      } catch (err) {
        console.error("Error deleting videos from S3:", err);
        // Continue with local clear even if S3 delete fails
      }
    }

    // Clear local state
    setClips((prev) =>
      prev.map((c) => ({
        ...c,
        videoUrl: null,
        jobId: null,
        s3FileName: null,
        status: "pending" as const,
        error: undefined,
      }))
    );
    localStorage.removeItem(STORAGE_KEY);
    setIsSaved(false);
    setIsClearing(false);
  }, [clips]);

  // Download all videos as a ZIP
  const handleDownloadAll = useCallback(async () => {
    const completedClips = clips.filter(
      (c) => c.status === "completed" && c.s3FileName
    );

    if (completedClips.length === 0) {
      toast({
        title: phrase(dictionary, "sora_toast_error", language),
        description: phrase(dictionary, "sora_toast_no_videos", language),
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingZip(true);

    try {
      const response = await fetch("/api/sora_video/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips: completedClips.map((c) => ({
            s3FileName: c.s3FileName,
            sceneIndex: c.sceneIndex,
            clipIndex: c.clipIndex,
          })),
          zipFileName: `sora_videos_${Date.now()}.zip`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create ZIP");
      }

      // Stream the response as a download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `sora_videos_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: phrase(dictionary, "sora_toast_success", language),
        description: phrase(dictionary, "sora_toast_zip_downloaded", language),
      });
    } catch (error) {
      console.error("ZIP download error:", error);
      toast({
        title: phrase(dictionary, "sora_toast_error", language),
        description: phrase(dictionary, "sora_toast_zip_failed", language),
        variant: "destructive",
      });
    } finally {
      setIsDownloadingZip(false);
    }
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
              disabled={isDownloadingZip}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloadingZip ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{phrase(dictionary, "sora_downloading_zip", language)}</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>{phrase(dictionary, "sora_download_all", language)}</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleClear}
            disabled={isGeneratingAll || isClearing}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {isClearing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 size={16} />
                <span>{phrase(dictionary, "storysplitter_clear", language)}</span>
              </>
            )}
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

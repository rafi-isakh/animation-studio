"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Sparkles, StopCircle, Save, Trash2, Download } from "lucide-react";
import ClipCard from "./ClipCard";
import ProviderSelector from "./ProviderSelector";
import {
  getProviderConstraints,
  getDefaultProviderId,
} from "./providers";
import type {
  VideoClip,
  VideoResultMetadata,
  VideoSubmitResponse,
  VideoStatusResponse,
} from "./types";
import { ASPECT_RATIOS } from "./types";
import type { AspectRatio } from "./providers/types";
import type { Scene } from "../StoryboardGenerator/types";
import {
  getVideoMeta,
  getVideoClips,
  saveVideoMeta,
  updateVideoClipStatus,
  clearVideo,
} from "../services/firestore";

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

export default function VideoGenerator() {
  const {
    setStageResult,
    currentStage,
    getStageResult,
    currentProjectId,
    videoApiKey,
    isLoading: isContextLoading,
  } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();

  // Loading state
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Provider state
  const [selectedProvider, setSelectedProvider] = useState(
    getDefaultProviderId()
  );

  // Clip data
  const [clips, setClips] = useState<VideoClip[]>([]);
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

  // Get provider constraints
  const providerConstraints = getProviderConstraints(selectedProvider);

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

  // Get data from context
  const storyboardData = getStageResult(4) as { scenes: Scene[] } | null;
  const imageGenData = getStageResult(7) as {
    settings: { stylePrompt: string; aspectRatio: string };
    frames: Array<{
      id: string;
      sceneIndex: number;
      clipIndex: number;
      frameLabel: string;
      imageRef: string | null;
      status: string;
    }>;
  } | null;

  // Sync clip images when ImageGen data changes
  useEffect(() => {
    if (currentStage !== 8 || !hasLoaded || clips.length === 0) return;
    if (!imageGenData?.frames) return;

    // Check if any clip images have changed
    let hasChanges = false;
    const updatedClips = clips.map((clip) => {
      // Find matching frame from ImageGen (match by sceneIndex and clipIndex)
      const matchingFrame = imageGenData.frames.find(
        (f) => f.sceneIndex === clip.sceneIndex && f.clipIndex === clip.clipIndex
      );
      const newImageUrl = matchingFrame?.imageRef || null;

      if (newImageUrl && newImageUrl !== clip.imageBase64) {
        hasChanges = true;
        return { ...clip, imageBase64: newImageUrl };
      }
      return clip;
    });

    if (hasChanges) {
      setClips(updatedClips);
    }
  }, [imageGenData, currentStage, hasLoaded, clips]);

  // Load storyboard data from context and video status from Firestore
  useEffect(() => {
    // Reset loaded state when leaving this stage so we reload on next visit
    if (currentStage !== 8) {
      setHasLoaded(false);
      return;
    }

    // Wait for MithrilContext to finish loading from Firestore
    if (isContextLoading) return;

    // Already loaded for this stage visit
    if (hasLoaded) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // 1. Load ImageGen result from context (stage 7)
        const imageGenResult = getStageResult(7) as {
          settings: { stylePrompt: string; aspectRatio: string };
          frames: Array<{
            id: string;
            sceneIndex: number;
            clipIndex: number;
            frameLabel: string;
            imageRef: string | null;
            status: string;
          }>;
        } | null;

        // 2. Load storyboard result from context (stage 4) for video prompts
        const storyboardResult = getStageResult(4) as {
          scenes: Scene[];
        } | null;

        // 3. Load any previously saved video metadata and clips from Firestore
        let savedVideoMeta: {
          aspectRatio?: AspectRatio;
          providerId?: string;
        } | null = null;
        let savedVideoClips: Array<{
          sceneIndex: number;
          clipIndex: number;
          videoRef?: string | null;
          jobId?: string | null;
          s3FileName?: string | null;
          status?: string;
          error?: string;
          providerId?: string;
        }> = [];

        if (currentProjectId) {
          try {
            savedVideoMeta = await getVideoMeta(currentProjectId);
            savedVideoClips = await getVideoClips(currentProjectId);
            if (savedVideoMeta?.aspectRatio) {
              setAspectRatio(savedVideoMeta.aspectRatio);
            }
            if (savedVideoMeta?.providerId) {
              setSelectedProvider(savedVideoMeta.providerId);
            }
          } catch {
            // Ignore errors, start fresh
          }
        }

        // 4. Build clips array from STORYBOARD (Stage 5) as primary source
        // Then match with images from ImageGen (Stage 6) and saved video data
        const allClips: VideoClip[] = [];

        // Build a lookup map for ImageGen frames by sceneIndex-clipIndex
        const framesByClip = new Map<string, string | null>();
        if (imageGenResult?.frames) {
          imageGenResult.frames.forEach((frame) => {
            const key = `${frame.sceneIndex}-${frame.clipIndex}`;
            // Use the first frame's image (usually frame A) - don't overwrite if already set
            if (!framesByClip.has(key) && frame.imageRef) {
              framesByClip.set(key, frame.imageRef);
            }
          });
        }

        // Build clips from storyboard scenes
        if (storyboardResult?.scenes) {
          storyboardResult.scenes.forEach((scene, sceneIndex) => {
            if (scene.clips) {
              scene.clips.forEach((storyboardClip, clipIndex) => {
                // Check if we have an image from ImageGen
                const key = `${sceneIndex}-${clipIndex}`;
                const imageUrl = framesByClip.get(key) || null;

                // Check if we have saved status for this clip
                const savedClip = savedVideoClips.find(
                  (c) => c.sceneIndex === sceneIndex && c.clipIndex === clipIndex
                );

                allClips.push({
                  clipIndex,
                  sceneIndex,
                  sceneTitle: scene.sceneTitle || `Scene ${sceneIndex + 1}`,
                  videoPrompt: storyboardClip.videoPrompt || "",
                  soraVideoPrompt: storyboardClip.soraVideoPrompt || "",
                  length: storyboardClip.length || "4초",
                  imageBase64: imageUrl, // May be null if image not generated yet
                  videoUrl: savedClip?.videoRef || null,
                  jobId: savedClip?.jobId || null,
                  s3FileName: savedClip?.s3FileName || null,
                  status: (savedClip?.status as VideoClip["status"]) || "pending",
                  error: savedClip?.error,
                  providerId: savedClip?.providerId,
                });
              });
            }
          });
        }

        // Sort by sceneIndex, then clipIndex
        allClips.sort((a, b) => {
          if (a.sceneIndex !== b.sceneIndex) return a.sceneIndex - b.sceneIndex;
          return a.clipIndex - b.clipIndex;
        });

        setClips(allClips);
        if (savedVideoClips.length > 0) {
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
  }, [
    currentStage,
    hasLoaded,
    currentProjectId,
    getStageResult,
    isContextLoading,
    toast,
    dictionary,
    language,
  ]);

  // Auto-save helper - saves to Firestore (silent, no toast)
  const autoSave = useCallback(
    async (updatedClips: VideoClip[]) => {
      if (!currentProjectId) return;

      try {
        // First, ensure video metadata exists
        await saveVideoMeta(currentProjectId, aspectRatio, selectedProvider);

        // Update each clip status in Firestore
        for (const clip of updatedClips) {
          if (clip.status === "completed" && clip.videoUrl) {
            const clipId = `${clip.sceneIndex}_${clip.clipIndex}`;
            await updateVideoClipStatus(currentProjectId, clipId, {
              sceneIndex: clip.sceneIndex,
              clipIndex: clip.clipIndex,
              videoRef: clip.videoUrl,
              s3FileName: clip.s3FileName,
              status: clip.status,
              providerId: clip.providerId,
              error: null,
            });
          }
        }

        // Update context
        const metadata: VideoResultMetadata = {
          clips: updatedClips.map((c) => ({
            clipIndex: c.clipIndex,
            sceneIndex: c.sceneIndex,
            videoUrl: c.videoUrl,
            jobId: c.jobId,
            s3FileName: c.s3FileName,
            status: c.status,
            error: c.error,
            providerId: c.providerId,
          })),
          aspectRatio,
          providerId: selectedProvider,
          createdAt: Date.now(),
        };
        setStageResult(8, metadata);
        setIsSaved(true);
      } catch (err) {
        console.error("Error auto-saving video:", err);
      }
    },
    [currentProjectId, aspectRatio, selectedProvider, setStageResult]
  );

  // Update custom prompt for a clip
  const updateClipPrompt = useCallback(
    (clipIndex: number, sceneIndex: number, prompt: string) => {
      setClips((prev) =>
        prev.map((c) =>
          c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
            ? { ...c, customPrompt: prompt }
            : c
        )
      );
      setIsSaved(false);
    },
    []
  );

  // Generate a single clip
  const generateClip = useCallback(
    async (clipIndex: number, sceneIndex: number, customPrompt?: string) => {
      // Find clip data (but don't rely on array index for later updates)
      const clip = clips.find(
        (c) => c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
      );
      if (!clip) return;

      // Create AbortController for this generation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Update status to generating (find by sceneIndex/clipIndex, not array index)
      setClips((prev) =>
        prev.map((c) =>
          c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
            ? { ...c, status: "generating", error: undefined }
            : c
        )
      );

      try {
        // Parse duration from length (e.g., "1초" -> 1, "2초" -> 2)
        const durationMatch = clip.length.match(/(\d+)/);
        const parsedDuration = durationMatch
          ? parseInt(durationMatch[1], 10)
          : 4;

        // Map to valid provider duration
        const constraints = getProviderConstraints(selectedProvider);
        const validDurations = constraints?.durations || [4, 8, 12];
        const mappedDuration = validDurations.reduce((prev, curr) =>
          Math.abs(curr - parsedDuration) < Math.abs(prev - parsedDuration)
            ? curr
            : prev
        );

        // 1. Submit job - use custom prompt if provided, otherwise fall back
        const promptToUse = customPrompt || clip.customPrompt || clip.soraVideoPrompt || clip.videoPrompt;

        const submitResponse = await fetch("/api/video/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerId: selectedProvider,
            prompt: promptToUse,
            imageBase64: clip.imageBase64 || undefined,
            duration: mappedDuration,
            aspectRatio,
            customApiKey: videoApiKey || undefined,
          }),
          signal: abortController.signal,
        });

        const submitData: VideoSubmitResponse = await submitResponse.json();

        if (!submitResponse.ok) {
          throw new Error(
            (submitData as unknown as { error: string }).error ||
              "Failed to submit job"
          );
        }

        const jobId = submitData.jobId;

        // Update with job ID
        setClips((prev) =>
          prev.map((c) =>
            c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
              ? { ...c, jobId }
              : c
          )
        );

        // 2. Poll for completion
        let status: VideoStatusResponse["status"] = "pending";
        let videoUrl: string | undefined;
        let s3FileName: string | undefined;
        let pollError: string | undefined;

        const pollingInterval = constraints?.polling.intervalMs || 5000;

        while (status === "pending" || status === "running") {
          // Check if we should stop (user clicked stop or component unmounted)
          if (shouldStopRef.current || !isMountedRef.current) {
            throw new Error("Generation cancelled");
          }

          await sleep(pollingInterval);

          const statusUrl = new URL("/api/video/status", window.location.origin);
          statusUrl.searchParams.set("jobId", jobId);
          statusUrl.searchParams.set("providerId", selectedProvider);
          if (videoApiKey) {
            statusUrl.searchParams.set("customApiKey", videoApiKey);
          }

          const statusResponse = await fetch(statusUrl.toString(), {
            signal: abortController.signal,
          });
          const statusData: VideoStatusResponse = await statusResponse.json();

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
            const updatedClips = prev.map((c) =>
              c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
                ? {
                    ...c,
                    status: "completed" as const,
                    videoUrl: videoUrl || null,
                    s3FileName: s3FileName || null,
                    error: undefined,
                    providerId: selectedProvider,
                  }
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

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        setClips((prev) =>
          prev.map((c) =>
            c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
              ? { ...c, status: "failed", error: errorMessage }
              : c
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
    [
      clips,
      aspectRatio,
      selectedProvider,
      videoApiKey,
      autoSave,
      toast,
      dictionary,
      language,
    ]
  );

  // Regenerate a single clip (reset and generate)
  const regenerateClip = useCallback(
    async (clipIndex: number, sceneIndex: number, customPrompt?: string) => {
      // Reset the clip status first (find by sceneIndex/clipIndex, not array index)
      setClips((prev) =>
        prev.map((c) =>
          c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
            ? {
                ...c,
                status: "pending" as const,
                videoUrl: null,
                jobId: null,
                s3FileName: null,
                error: undefined,
              }
            : c
        )
      );

      // Then generate with custom prompt if provided
      await generateClip(clipIndex, sceneIndex, customPrompt);
    },
    [generateClip]
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

  // Save results to Firestore
  const handleSave = useCallback(async () => {
    if (!currentProjectId) return;

    setIsSaving(true);

    try {
      // Save video metadata (aspect ratio and provider)
      await saveVideoMeta(currentProjectId, aspectRatio, selectedProvider);

      // Save each clip status to Firestore
      for (const clip of clips) {
        const clipId = `${clip.sceneIndex}_${clip.clipIndex}`;
        await updateVideoClipStatus(currentProjectId, clipId, {
          sceneIndex: clip.sceneIndex,
          clipIndex: clip.clipIndex,
          videoRef: clip.videoUrl,
          jobId: clip.jobId,
          s3FileName: clip.s3FileName,
          status: clip.status,
          error: clip.error,
          providerId: clip.providerId,
        });
      }

      // Update context
      const metadata: VideoResultMetadata = {
        clips: clips.map((c) => ({
          clipIndex: c.clipIndex,
          sceneIndex: c.sceneIndex,
          videoUrl: c.videoUrl,
          jobId: c.jobId,
          s3FileName: c.s3FileName,
          status: c.status,
          error: c.error,
          providerId: c.providerId,
        })),
        aspectRatio,
        providerId: selectedProvider,
        createdAt: Date.now(),
      };
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
  }, [
    currentProjectId,
    clips,
    aspectRatio,
    selectedProvider,
    setStageResult,
    toast,
    dictionary,
    language,
  ]);

  // Clear all results and delete videos from S3 and Firestore
  const handleClear = useCallback(async () => {
    setIsClearing(true);

    // Collect S3 filenames to delete
    const s3FileNames = clips
      .filter((c) => c.s3FileName)
      .map((c) => c.s3FileName as string);

    // Delete from S3 if there are files to delete
    if (s3FileNames.length > 0) {
      try {
        await fetch("/api/video/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileNames: s3FileNames }),
        });
      } catch (err) {
        console.error("Error deleting videos from S3:", err);
        // Continue with local clear even if S3 delete fails
      }
    }

    // Clear from Firestore
    if (currentProjectId) {
      try {
        await clearVideo(currentProjectId);
      } catch (err) {
        console.error("Error clearing video data from Firestore:", err);
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
        providerId: undefined,
      }))
    );
    setIsSaved(false);
    setIsClearing(false);
  }, [clips, currentProjectId]);

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
      const response = await fetch("/api/video/zip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips: completedClips.map((c) => ({
            s3FileName: c.s3FileName,
            sceneIndex: c.sceneIndex,
            clipIndex: c.clipIndex,
          })),
          zipFileName: `videos_${Date.now()}.zip`,
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
      link.download = `videos_${Date.now()}.zip`;
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

  // Get aspect ratio options from provider or fallback to defaults
  const aspectRatioOptions =
    providerConstraints?.aspectRatios || ASPECT_RATIOS;

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
            No clips found. Please generate and save storyboard in Stage 5
            (Storyboard Generator) first.
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

      {/* Settings Panel */}
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4">
        {/* Provider Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {phrase(dictionary, "video_api", language)}
          </label>
          <div className="max-w-xs">
            <ProviderSelector
              value={selectedProvider}
              onChange={setSelectedProvider}
              disabled={isGeneratingAll}
            />
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {phrase(dictionary, "sora_aspect_ratio", language)}
          </label>
          <div className="flex gap-4">
            {aspectRatioOptions.map((ratio) => (
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
                  onChange={(e) =>
                    setAspectRatio(e.target.value as AspectRatio)
                  }
                  disabled={isGeneratingAll}
                  className="accent-[#DB2777]"
                />
                <span className="text-sm font-medium">{ratio.label}</span>
              </label>
            ))}
          </div>
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
            {phrase(dictionary, "sora_progress", language)}: {completedCount}/
            {totalCount}
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
                  <span>
                    {phrase(dictionary, "sora_downloading_zip", language)}
                  </span>
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto p-1 scrollbar-hide">
        {clips.map((clip) => (
          <ClipCard
            key={`${clip.sceneIndex}-${clip.clipIndex}`}
            clip={clip}
            onGenerate={generateClip}
            onRegenerate={regenerateClip}
            onUpdatePrompt={updateClipPrompt}
            isGeneratingAll={isGeneratingAll}
          />
        ))}
      </div>
    </div>
  );
}
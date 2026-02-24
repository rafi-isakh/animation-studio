"use client";

/**
 * VideoGeneratorOrchestrator - Orchestrator-based video generation component
 *
 * This component uses the mithril-backend job orchestrator instead of
 * direct provider API calls. Benefits:
 * - Server-side job queue with retry logic
 * - Real-time status updates via Firestore
 * - Better error handling and recovery
 * - No frontend polling required
 *
 * Enable by setting NEXT_PUBLIC_USE_VIDEO_ORCHESTRATOR=true
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Sparkles, StopCircle, Save, Trash2, Download } from "lucide-react";
import ClipCard from "./ClipCard";
import ProviderSelector from "./ProviderSelector";
import { getProviderConstraints, getDefaultProviderId } from "./providers";
import type { VideoClip, VideoResultMetadata } from "./types";
import { ASPECT_RATIOS } from "./types";
import type { AspectRatio } from "./providers/types";
import type { Scene } from "../StoryboardGenerator/types";
import {
  getVideoMeta,
  getVideoClips,
  saveVideoMeta,
  updateVideoClipStatus,
  clearVideo,
  mapJobToClipUpdate,
  getActiveProjectJobs,
} from "../services/firestore";
import { getScenes, getClips } from "../services/firestore/storyboard";
import { useVideoOrchestrator, type ClipUpdate } from "./useVideoOrchestrator";

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

export default function VideoGeneratorOrchestrator() {
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
  const activeJobsRef = useRef<Set<string>>(new Set());

  // Get provider constraints
  const providerConstraints = getProviderConstraints(selectedProvider);

  // Handle clip update from orchestrator (real-time Firestore updates)
  const handleClipUpdate = useCallback(
    (update: ClipUpdate) => {
      if (!isMountedRef.current) return;

      // Only process updates for jobs we're actively tracking
      if (!update.jobId || !activeJobsRef.current.has(update.jobId)) {
        return;
      }

      setClips((prev) => {
        const clipArrayIndex = prev.findIndex(
          (c) =>
            c.sceneIndex === update.sceneIndex &&
            c.clipIndex === update.clipIndex
        );

        if (clipArrayIndex === -1) {
          return prev;
        }

        const updatedClips = [...prev];
        const clip = updatedClips[clipArrayIndex];

        // Double-check: only update if this clip's jobId matches or clip has no jobId yet
        if (clip.jobId && clip.jobId !== update.jobId) {
          return prev;
        }

        updatedClips[clipArrayIndex] = {
          ...clip,
          status: update.status,
          videoUrl: update.videoUrl,
          s3FileName: update.s3FileName,
          error: update.error,
          providerId: update.providerId,
          jobId: update.jobId,
        };

        // Auto-save on completion
        if (update.status === "completed" && update.videoUrl) {
          activeJobsRef.current.delete(update.jobId);
          // Trigger auto-save (will be batched)
          setTimeout(() => {
            if (isMountedRef.current) {
              autoSave(updatedClips);
            }
          }, 100);
        }

        // Remove from tracking on final failure (not retrying)
        if (update.status === "failed") {
          activeJobsRef.current.delete(update.jobId);
        }

        // Retrying jobs stay in tracking for continued updates

        return updatedClips;
      });

      // Show toast for completion/failure (only for tracked jobs)
      if (update.status === "completed" && activeJobsRef.current.has(update.jobId)) {
        toast({
          title: phrase(dictionary, "sora_toast_success", language),
          description: `${phrase(dictionary, "sora_toast_clip_generated", language)} ${update.sceneIndex + 1}-${update.clipIndex + 1}`,
        });
      } else if (update.status === "failed" && !shouldStopRef.current && activeJobsRef.current.has(update.jobId)) {
        toast({
          title: phrase(dictionary, "sora_toast_error", language),
          description: update.error || "Video generation failed",
          variant: "destructive",
        });
      }
    },
    [toast, dictionary, language]
  );

  // Orchestrator hook
  const { submitJob, cancelJob, pendingUpdates, clearPendingUpdates } = useVideoOrchestrator({
    projectId: currentProjectId,
    enabled: currentStage === 8,
    onClipUpdate: handleClipUpdate,
  });

  // Reset mounted ref on mount, cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    shouldStopRef.current = false;

    return () => {
      isMountedRef.current = false;
      shouldStopRef.current = true;
      activeJobsRef.current.clear();
    };
  }, []);

  // Auto-save helper
  const autoSave = useCallback(
    async (updatedClips: VideoClip[]) => {
      if (!currentProjectId) return;

      try {
        await saveVideoMeta(currentProjectId, aspectRatio, selectedProvider);

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
            });
          }
        }

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

  // Load data effect (same as original)
  useEffect(() => {
    if (currentStage !== 8) {
      setHasLoaded(false);
      return;
    }

    if (isContextLoading) return;
    if (hasLoaded) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
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

        const storyboardResult = getStageResult(4) as {
          scenes: Scene[];
        } | null;

        let savedVideoMeta: {
          aspectRatio?: AspectRatio;
          providerId?: string;
        } | null = null;
        let savedVideoClips: Array<{
          sceneIndex: number;
          clipIndex: number;
          sceneTitle?: string;
          videoPrompt?: string;
          length?: string;
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

        const allClips: VideoClip[] = [];
        const framesByClip = new Map<string, string | null>();
        if (imageGenResult?.frames) {
          imageGenResult.frames.forEach((frame) => {
            const key = `${frame.sceneIndex}-${frame.clipIndex}`;
            if (!framesByClip.has(key) && frame.imageRef) {
              framesByClip.set(key, frame.imageRef);
            }
          });
        }

        if (storyboardResult?.scenes) {
          storyboardResult.scenes.forEach((scene, sceneIndex) => {
            if (scene.clips) {
              scene.clips.forEach((storyboardClip, clipIndex) => {
                const key = `${sceneIndex}-${clipIndex}`;
                const imageUrl = framesByClip.get(key) || null;
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
                  imageBase64: imageUrl,
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
        } else if (currentProjectId) {
          // Storyboard context not available — load directly from Firestore
          const firestoreScenes = await getScenes(currentProjectId);
          const scenesWithClips = await Promise.all(
            firestoreScenes.map(async (scene) => {
              const clips = await getClips(currentProjectId, scene.sceneIndex);
              return {
                sceneTitle: scene.sceneTitle,
                clips: clips.map((clip) => ({
                  videoPrompt: clip.videoPrompt,
                  soraVideoPrompt: clip.soraVideoPrompt,
                  length: clip.length,
                  imageRef: clip.imageRef,
                })),
              };
            })
          );

          if (scenesWithClips.length > 0) {
            scenesWithClips.forEach((scene, sceneIndex) => {
              scene.clips.forEach((clip, clipIndex) => {
                const key = `${sceneIndex}-${clipIndex}`;
                const imageUrl = framesByClip.get(key) || null;
                const savedClip = savedVideoClips.find(
                  (c) => c.sceneIndex === sceneIndex && c.clipIndex === clipIndex
                );

                allClips.push({
                  clipIndex,
                  sceneIndex,
                  sceneTitle: scene.sceneTitle || `Scene ${sceneIndex + 1}`,
                  videoPrompt: clip.videoPrompt || "",
                  soraVideoPrompt: clip.soraVideoPrompt || "",
                  length: clip.length || "4초",
                  imageBase64: imageUrl,
                  videoUrl: savedClip?.videoRef || null,
                  jobId: savedClip?.jobId || null,
                  s3FileName: savedClip?.s3FileName || null,
                  status: (savedClip?.status as VideoClip["status"]) || "pending",
                  error: savedClip?.error,
                  providerId: savedClip?.providerId,
                });
              });
            });
          } else if (savedVideoClips.length > 0) {
            savedVideoClips.forEach((savedClip) => {
              const key = `${savedClip.sceneIndex}-${savedClip.clipIndex}`;
              const imageUrl = framesByClip.get(key) || null;

              allClips.push({
                clipIndex: savedClip.clipIndex,
                sceneIndex: savedClip.sceneIndex,
                sceneTitle: savedClip.sceneTitle || `Scene ${savedClip.sceneIndex + 1}`,
                videoPrompt: savedClip.videoPrompt || "",
                soraVideoPrompt: "",
                length: savedClip.length || "4초",
                imageBase64: imageUrl,
                videoUrl: savedClip.videoRef || null,
                jobId: savedClip.jobId || null,
                s3FileName: savedClip.s3FileName || null,
                status: (savedClip.status as VideoClip["status"]) || "pending",
                error: savedClip.error,
                providerId: savedClip.providerId,
              });
            });
          }
        }

        allClips.sort((a, b) => {
          if (a.sceneIndex !== b.sceneIndex) return a.sceneIndex - b.sceneIndex;
          return a.clipIndex - b.clipIndex;
        });

        // Fetch only ACTIVE (non-terminal) jobs from job_queue
        // - Completed jobs are already loaded from video_clips collection
        // - Active jobs need real-time tracking for status updates
        // - This handles regeneration: new job will be active, old completed one is in video_clips
        if (currentProjectId) {
          try {
            const activeJobs = await getActiveProjectJobs(currentProjectId);

            activeJobs.forEach((job) => {
              const clipIdx = allClips.findIndex(
                (c) => c.sceneIndex === job.scene_index && c.clipIndex === job.clip_index
              );
              if (clipIdx !== -1) {
                const update = mapJobToClipUpdate(job);

                // Update clip with active job status (overrides saved completed state for regeneration)
                allClips[clipIdx] = {
                  ...allClips[clipIdx],
                  status: update.status,
                  videoUrl: update.videoUrl,
                  s3FileName: update.s3FileName,
                  error: update.error,
                  providerId: update.providerId,
                  jobId: update.jobId,
                };

                // Add to tracking for real-time updates
                activeJobsRef.current.add(job.id);
              }
            });
          } catch (err) {
            console.error("Error fetching active jobs:", err);
            // Continue without job tracking
          }
        }

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

  // Apply pending updates from initial Firestore snapshot once data is loaded
  useEffect(() => {
    if (isLoadingData || !hasLoaded || pendingUpdates.length === 0) return;

    pendingUpdates.forEach((update) => {
      const isTerminal = update.status === 'completed' || update.status === 'failed';
      if (!isTerminal) {
        // Re-track in-flight jobs for real-time updates
        activeJobsRef.current.add(update.jobId);
      }
      // Forward all updates to the clip update handler
      handleClipUpdate(update);
    });
    clearPendingUpdates();
  }, [isLoadingData, hasLoaded, pendingUpdates, handleClipUpdate, clearPendingUpdates]);

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

  // Generate a single clip using orchestrator
  const generateClip = useCallback(
    async (clipIndex: number, sceneIndex: number, customPrompt?: string) => {
      if (!currentProjectId) return;

      // Find clip data (but don't rely on array index for later updates)
      const clip = clips.find(
        (c) => c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
      );
      if (!clip) return;

      // Update status to generating and clear old jobId (find by sceneIndex/clipIndex, not array index)
      setClips((prev) =>
        prev.map((c) =>
          c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
            ? { ...c, status: "generating", error: undefined, jobId: null }
            : c
        )
      );

      try {
        // Use user-selected duration if set, otherwise parse from clip length
        const constraints = getProviderConstraints(selectedProvider);
        const validDurations = constraints?.durations || [4, 8, 12];
        const parsedDuration = clip.customDuration ?? (() => {
          const durationMatch = clip.length.match(/(\d+)/);
          return durationMatch ? parseInt(durationMatch[1], 10) : 4;
        })();
        const mappedDuration = validDurations.reduce((prev, curr) =>
          Math.abs(curr - parsedDuration) < Math.abs(prev - parsedDuration)
            ? curr
            : prev
        );

        const promptToUse =
          customPrompt ||
          clip.customPrompt ||
          clip.soraVideoPrompt ||
          clip.videoPrompt;

        // Submit to orchestrator
        const response = await submitJob({
          projectId: currentProjectId,
          sceneIndex,
          clipIndex,
          providerId: selectedProvider as "sora" | "veo3",
          prompt: promptToUse,
          imageUrl: clip.imageBase64 || undefined,
          duration: mappedDuration,
          aspectRatio,
          apiKey: videoApiKey || undefined,
        });

        // Track this job for updates
        activeJobsRef.current.add(response.jobId);

        // Update with job ID (find by sceneIndex/clipIndex, not array index)
        setClips((prev) =>
          prev.map((c) =>
            c.clipIndex === clipIndex && c.sceneIndex === sceneIndex
              ? { ...c, jobId: response.jobId }
              : c
          )
        );

        // Status updates will come via Firestore subscription
      } catch (err) {
        if (!isMountedRef.current) return;

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
      currentProjectId,
      aspectRatio,
      selectedProvider,
      videoApiKey,
      submitJob,
      toast,
      dictionary,
      language,
    ]
  );

  // Regenerate a single clip
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

      await generateClip(clipIndex, sceneIndex, customPrompt);
    },
    [generateClip]
  );

  // Generate all clips
  const handleGenerateAll = useCallback(async () => {
    shouldStopRef.current = false;
    setIsGeneratingAll(true);

    for (let i = 0; i < clips.length; i++) {
      if (shouldStopRef.current || !isMountedRef.current) break;

      const clip = clips[i];
      if (clip.status === "completed") continue;

      await generateClip(clip.clipIndex, clip.sceneIndex);

      // Small delay between submissions to avoid overwhelming the backend
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (isMountedRef.current) {
      setIsGeneratingAll(false);
      shouldStopRef.current = false;
    }
  }, [clips, generateClip]);

  // Stop generation
  const handleStop = useCallback(async () => {
    shouldStopRef.current = true;
    setIsGeneratingAll(false);

    // Cancel all active jobs
    for (const jobId of activeJobsRef.current) {
      try {
        await cancelJob({ jobId });
      } catch {
        // Ignore cancel errors
      }
    }
    activeJobsRef.current.clear();

    toast({
      title: phrase(dictionary, "sora_toast_stopped", language),
      description: phrase(dictionary, "sora_toast_stopped_desc", language),
    });
  }, [cancelJob, toast, dictionary, language]);

  // Save results
  const handleSave = useCallback(async () => {
    if (!currentProjectId) return;

    setIsSaving(true);

    try {
      await saveVideoMeta(currentProjectId, aspectRatio, selectedProvider);

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

  // Clear all results
  const handleClear = useCallback(async () => {
    setIsClearing(true);

    const s3FileNames = clips
      .filter((c) => c.s3FileName)
      .map((c) => c.s3FileName as string);

    if (s3FileNames.length > 0) {
      try {
        await fetch("/api/video/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileNames: s3FileNames }),
        });
      } catch (err) {
        console.error("Error deleting videos from S3:", err);
      }
    }

    if (currentProjectId) {
      try {
        await clearVideo(currentProjectId);
      } catch (err) {
        console.error("Error clearing video data from Firestore:", err);
      }
    }

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

  // Download all videos as ZIP
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
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
          Using orchestrator mode (real-time updates)
        </p>
      </div>

      {/* Settings Panel */}
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4">
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
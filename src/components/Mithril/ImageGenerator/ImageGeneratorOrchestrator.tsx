"use client";

/**
 * ImageGeneratorOrchestrator - Orchestrator-based image generation component
 *
 * This component uses the mithril-backend job orchestrator instead of
 * direct API calls. Benefits:
 * - Server-side job queue with retry logic
 * - Real-time status updates via Firestore
 * - Better error handling and recovery
 * - Job resumption on page refresh
 *
 * Enable by setting NEXT_PUBLIC_USE_IMAGE_ORCHESTRATOR=true
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Image as ImageIcon, ChevronDown, Trash2, Sparkles } from "lucide-react";
import { useMithril } from "../MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Continuity } from "../StoryboardGenerator/types";
import type { BgSheetResultMetadata } from "../BgSheetGenerator/types";
import type {
  ImageGenFrame,
  ImageGenSettings,
  ImageGenAspectRatio,
  CharacterAssetRef,
  BackgroundAssetRef,
  LocalAssetRef,
} from "./types";
import {
  getImageGenMeta,
  getImageGenFrames,
  saveImageGenMeta,
  saveImageGenFrames,
  saveImageGenFrame,
  clearImageGen,
} from "../services/firestore/imageGen";
import {
  uploadImageGenReplacementAsset,
  deleteImageGenReplacementAsset,
} from "../services/s3/images";
import FrameCard from "./FrameCard";
import ImageModal from "./ImageModal";
import { parseCsvData, parseCellReference, colLetterToIndex } from "@/utils/csvHelper";
import { fileToBase64, sanitizeFilename } from "@/utils/fileHelper";
import { useCostTracker } from "../CostContext";
import { compressImage } from "../StoryboardGenerator/utils/imageUtils";
import { useImageOrchestrator, FrameUpdate } from "./useImageOrchestrator";
import {
  getActiveProjectImageJobs,
  mapImageJobToFrameUpdate,
} from "../services/firestore/jobQueue";

// Shot group color utility for alternating group colors
const getShotColor = (index: number) => {
  const colors = [
    "border-l-cyan-500/50 bg-cyan-500/5",
    "border-l-purple-500/50 bg-purple-500/5",
    "border-l-amber-500/50 bg-amber-500/5",
    "border-l-emerald-500/50 bg-emerald-500/5",
    "border-l-indigo-500/50 bg-indigo-500/5",
  ];
  return colors[index % colors.length];
};

const aspectRatios = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "1:1", label: "Square (1:1)" },
];

export default function ImageGeneratorOrchestrator() {
  const {
    currentStage,
    currentProjectId,
    getStageResult,
    setStageResult,
    customApiKey,
    isLoading: isContextLoading,
    propDesignerGenerator,
  } = useMithril();
  const { language, dictionary } = useLanguage();
  const { toast } = useToast();
  const { trackImageGeneration, isClockedIn } = useCostTracker();

  // Local state
  const [frames, setFrames] = useState<ImageGenFrame[]>([]);
  const [settings, setSettings] = useState<ImageGenSettings>({
    stylePrompt: "2D Anime, High Quality, Cinematic Lighting",
    aspectRatio: "16:9",
  });
  const [characterAssets, setCharacterAssets] = useState<CharacterAssetRef[]>([]);
  const [backgroundAssets, setBackgroundAssets] = useState<BackgroundAssetRef[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchRange, setBatchRange] = useState("");
  const [bulkBackgroundId, setBulkBackgroundId] = useState("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // CSV Import state
  const [isCsvPanelOpen, setIsCsvPanelOpen] = useState(false);
  const [parsedCsvData, setParsedCsvData] = useState<Record<string, string>[] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPromptStart, setCsvPromptStart] = useState("H2");
  const [csvPromptEnd, setCsvPromptEnd] = useState("H50");
  const [csvEndFrameCol, setCsvEndFrameCol] = useState("I");
  const [csvBgIdCol, setCsvBgIdCol] = useState("E");

  // Local uploaded assets state
  const [localAssets, setLocalAssets] = useState<LocalAssetRef[]>([]);

  // Refs for stable references in async operations
  const framesRef = useRef<ImageGenFrame[]>([]);
  const isBatchRunningRef = useRef(false);
  const isMountedRef = useRef(true);
  const activeJobsRef = useRef<Set<string>>(new Set());
  const frameToJobMap = useRef<Map<string, string>>(new Map()); // frameId -> jobId mapping
  const shouldStopRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    isBatchRunningRef.current = isBatchRunning;
  }, [isBatchRunning]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    shouldStopRef.current = false;
    return () => {
      isMountedRef.current = false;
      shouldStopRef.current = true;
      isBatchRunningRef.current = false;
      activeJobsRef.current.clear();
      frameToJobMap.current.clear();
    };
  }, []);

  // Auto-save helper
  const autoSave = useCallback(
    async (updatedFrames: ImageGenFrame[]) => {
      if (!currentProjectId) return;

      try {
        await saveImageGenMeta(currentProjectId, settings.stylePrompt, settings.aspectRatio, []);

        for (const frame of updatedFrames) {
          if (frame.status === "completed" && frame.imageUrl) {
            await saveImageGenFrame(currentProjectId, frame.id, {
              sceneIndex: frame.sceneIndex,
              clipIndex: frame.clipIndex,
              frameLabel: frame.frameLabel,
              frameNumber: frame.frameNumber,
              shotGroup: frame.shotGroup,
              prompt: frame.prompt,
              backgroundId: frame.backgroundId,
              refFrame: frame.refFrame,
              imageRef: frame.imageUrl,
              status: frame.status,
              remixPrompt: frame.remixPrompt || "",
              remixImageRef: frame.remixImageUrl || null,
              editedImageRef: frame.editedImageUrl || null,
            });
          }
        }

        setStageResult(7, {
          settings,
          frames: updatedFrames.map((f) => ({
            id: f.id,
            sceneIndex: f.sceneIndex,
            clipIndex: f.clipIndex,
            frameLabel: f.frameLabel,
            imageRef: f.imageUrl,
            status: f.status,
          })),
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error("Error auto-saving image frame:", err);
      }
    },
    [currentProjectId, settings, setStageResult]
  );

  // Orchestrator hook with real-time Firestore updates
  const { submitJob, cancelJob } = useImageOrchestrator({
    projectId: currentProjectId,
    enabled: currentStage === 7,
    onFrameUpdate: useCallback(
      (update: FrameUpdate) => {
        if (!isMountedRef.current) return;

        // Only process updates for jobs we're actively tracking
        if (!update.jobId || !activeJobsRef.current.has(update.jobId)) {
          return;
        }

        // Check if job was in tracking BEFORE we modify it (for toast logic)
        const wasTracked = activeJobsRef.current.has(update.jobId);

        setFrames((prev) => {
          const frameIndex = prev.findIndex((f) => f.id === update.frameId);

          if (frameIndex === -1) {
            // Try matching by sceneIndex/clipIndex
            const altIdx = prev.findIndex(
              (f) => f.sceneIndex === update.sceneIndex && f.clipIndex === update.clipIndex
            );
            if (altIdx === -1) return prev;
          }

          const targetIndex = frameIndex !== -1 ? frameIndex : prev.findIndex(
            (f) => f.sceneIndex === update.sceneIndex && f.clipIndex === update.clipIndex
          );

          if (targetIndex === -1) return prev;

          const updatedFrames = [...prev];
          const frame = updatedFrames[targetIndex];

          // Preserve old imageUrl during generation/failure - only update if new imageUrl is valid
          const newImageUrl = update.imageUrl && update.imageUrl.trim() !== ""
            ? update.imageUrl
            : frame.imageUrl;

          // Debug log if imageUrl is being preserved (not updated)
          if (frame.imageUrl && !update.imageUrl && update.status !== "pending") {
            console.log(`[ImageGenOrchestrator] Preserving old imageUrl for frame ${update.frameId} (status: ${update.status}, had: ${!!frame.imageUrl}, new: ${!!update.imageUrl})`);
          }

          updatedFrames[targetIndex] = {
            ...frame,
            status: update.status === "completed" ? "completed" :
                    update.status === "failed" ? "failed" :
                    update.status === "retrying" ? "retrying" :
                    update.status === "preparing" || update.status === "generating" || update.status === "uploading" ? "generating" :
                    "pending",
            imageUrl: newImageUrl,
            imageUpdatedAt: update.imageUrl && update.imageUrl.trim() !== "" ? Date.now() : frame.imageUpdatedAt,
            isLoading: update.status === "preparing" || update.status === "generating" || update.status === "uploading" || update.status === "retrying",
            error: update.error,
          };

          // Auto-save on completion
          if (update.status === "completed" && update.imageUrl) {
            trackImageGeneration(1);
            setTimeout(() => {
              if (isMountedRef.current) {
                autoSave(updatedFrames);
              }
            }, 100);
          }

          return updatedFrames;
        });

        // Show toast for completion/failure (check BEFORE cleanup)
        if (update.status === "completed" && wasTracked) {
          toast({
            title: "Image Generated",
            description: `Frame ${update.frameLabel} completed successfully`,
          });
          // Clean up tracking
          activeJobsRef.current.delete(update.jobId);
          frameToJobMap.current.delete(update.frameId);
        } else if (update.status === "failed" && wasTracked && !shouldStopRef.current) {
          toast({
            title: "Generation Failed",
            description: update.error || "Image generation failed",
            variant: "destructive",
          });
          // Clean up tracking
          activeJobsRef.current.delete(update.jobId);
          frameToJobMap.current.delete(update.frameId);
        }
      },
      [toast, trackImageGeneration, autoSave]
    ),
  });

  // Load character and background assets from previous stages
  const loadAssets = useCallback(() => {
    // Load characters AND objects from PropDesigner (Stage 5)
    const propResult = propDesignerGenerator.result;
    if (propResult?.props) {
      const characterAndObjectProps = propResult.props.filter(p => p.category === 'character' || p.category === 'object');
      setCharacterAssets(
        characterAndObjectProps.map((prop) => {
          let imageUrl = prop.designSheetImageRef || prop.referenceImageRef || "";
          if (!imageUrl && prop.referenceImageRefs && prop.referenceImageRefs.length > 0) {
            imageUrl = prop.referenceImageRefs[0];
          }
          return {
            id: prop.id,
            name: prop.name,
            imageUrl,
          };
        })
      );
    }

    // Load backgrounds from Stage 6
    const bgResult = getStageResult(6) as BgSheetResultMetadata | null;
    if (bgResult?.backgrounds) {
      setBackgroundAssets(
        bgResult.backgrounds.map((bg) => ({
          id: bg.id,
          name: bg.name,
          angles: bg.images.map((img) => ({
            angle: img.angle,
            imageRef: img.imageId || "",
          })),
        }))
      );
    }
  }, [propDesignerGenerator.result, getStageResult]);

  // Reload assets whenever PropDesigner or Stage 6 data changes
  useEffect(() => {
    if (currentStage === 7 && hasLoaded) {
      loadAssets();
    }
  }, [currentStage, hasLoaded, loadAssets]);

  // Load frames from Stage 4 storyboard
  const loadFramesFromStoryboard = useCallback(() => {
    const storyboardData = getStageResult(4) as { scenes: Scene[] } | null;
    if (!storyboardData?.scenes || storyboardData.scenes.length === 0) {
      setError("No storyboard data found. Please complete Stage 4 first.");
      return [];
    }

    const newFrames: ImageGenFrame[] = [];
    let shotGroup = 1;

    storyboardData.scenes.forEach((scene, sceneIndex) => {
      scene.clips.forEach((clip: Continuity, clipIndex) => {
        const frameNumber = `${String(sceneIndex + 1).padStart(2, "0")}${String(clipIndex + 1).padStart(2, "0")}`;

        // Create frame A from imagePrompt
        if (clip.imagePrompt) {
          newFrames.push({
            id: uuidv4(),
            sceneIndex,
            clipIndex,
            frameLabel: clip.imagePromptEnd ? `${shotGroup}A` : `${shotGroup}`,
            frameNumber: clip.imagePromptEnd ? `${frameNumber}A` : frameNumber,
            shotGroup,
            prompt: clip.imagePrompt,
            backgroundId: clip.backgroundId || "",
            refFrame: "",
            imageUrl: clip.imageRef || null,
            imageBase64: null,
            status: clip.imageRef ? "completed" : "pending",
            isLoading: false,
            remixPrompt: "",
            remixImageUrl: null,
            remixImageBase64: null,
            hasDrawingEdits: false,
            editedImageUrl: null,
          });
        }

        // Create frame B from imagePromptEnd if exists
        if (clip.imagePromptEnd) {
          newFrames.push({
            id: uuidv4(),
            sceneIndex,
            clipIndex,
            frameLabel: `${shotGroup}B`,
            frameNumber: `${frameNumber}B`,
            shotGroup,
            prompt: clip.imagePromptEnd,
            backgroundId: clip.backgroundId || "",
            refFrame: "",
            imageUrl: null,
            imageBase64: null,
            status: "pending",
            isLoading: false,
            remixPrompt: "",
            remixImageUrl: null,
            remixImageBase64: null,
            hasDrawingEdits: false,
            editedImageUrl: null,
          });
        }

        shotGroup++;
      });
    });

    return newFrames;
  }, [getStageResult]);

  // Load data from Firestore or initialize from storyboard
  useEffect(() => {
    if (currentStage !== 7) {
      setHasLoaded(false);
      return;
    }

    if (isContextLoading) return;
    if (hasLoaded) return;

    const loadData = async () => {
      setIsLoadingData(true);
      setError(null);

      try {
        loadAssets();

        if (!currentProjectId) {
          const storyboardFrames = loadFramesFromStoryboard();
          setFrames(storyboardFrames);
          setHasLoaded(true);
          setIsLoadingData(false);
          return;
        }

        // Try to load existing data from Firestore
        const savedMeta = await getImageGenMeta(currentProjectId);
        const savedFrames = await getImageGenFrames(currentProjectId);

        // Load settings if they exist
        if (savedMeta) {
          setSettings({
            stylePrompt: savedMeta.stylePrompt || "",
            aspectRatio: savedMeta.aspectRatio || "16:9",
          });
          if (savedMeta.localAssets && savedMeta.localAssets.length > 0) {
            const assetMetadata: LocalAssetRef[] = savedMeta.localAssets.map((asset) => ({
              id: asset.id,
              name: asset.name,
              mimeType: 'image/webp',
              category: asset.category,
              imageUrl: asset.imageUrl,
            }));
            setLocalAssets(assetMetadata);
          }
        }

        if (savedFrames.length > 0) {
          const storyboardFrames = loadFramesFromStoryboard();
          const savedFrameMap = new Map<string, typeof savedFrames[0]>();
          savedFrames.forEach((f) => {
            savedFrameMap.set(f.frameLabel, f);
          });

          const mergedFrames = storyboardFrames.map((sbFrame) => {
            const savedFrame = savedFrameMap.get(sbFrame.frameLabel);
            if (savedFrame) {
              return {
                ...sbFrame,
                id: savedFrame.id || sbFrame.id,
                prompt: savedFrame.prompt || sbFrame.prompt,
                backgroundId: savedFrame.backgroundId || sbFrame.backgroundId,
                refFrame: savedFrame.refFrame || sbFrame.refFrame,
                imageUrl: savedFrame.imageRef || null,
                imageUpdatedAt: savedFrame.imageUpdatedAt || (savedFrame.imageRef ? Date.now() : undefined),
                status: savedFrame.status ?? sbFrame.status,
                remixPrompt: savedFrame.remixPrompt || "",
                remixImageUrl: savedFrame.remixImageRef || null,
                hasDrawingEdits: !!savedFrame.editedImageRef,
                editedImageUrl: savedFrame.editedImageRef || null,
              };
            }
            return sbFrame;
          });

          // Fetch active jobs from job_queue
          try {
            const activeJobs = await getActiveProjectImageJobs(currentProjectId);

            activeJobs.forEach((job) => {
              const frameIdx = mergedFrames.findIndex(
                (f) => f.id === job.frame_id || (f.sceneIndex === job.scene_index && f.clipIndex === job.clip_index)
              );
              if (frameIdx !== -1) {
                const update = mapImageJobToFrameUpdate(job);

                mergedFrames[frameIdx] = {
                  ...mergedFrames[frameIdx],
                  status: update.status === "completed" ? "completed" :
                          update.status === "failed" ? "failed" : "generating",
                  imageUrl: update.imageUrl || mergedFrames[frameIdx].imageUrl,
                  isLoading: update.status === "preparing" || update.status === "generating" || update.status === "uploading",
                  error: update.error,
                };

                // Add to tracking for real-time updates
                activeJobsRef.current.add(job.id);
                frameToJobMap.current.set(mergedFrames[frameIdx].id, job.id);
              }
            });
          } catch (err) {
            console.error("Error fetching active image jobs:", err);
          }

          setFrames(mergedFrames);

          setStageResult(7, {
            settings,
            frames: mergedFrames.map((f) => ({
              id: f.id,
              sceneIndex: f.sceneIndex,
              clipIndex: f.clipIndex,
              frameLabel: f.frameLabel,
              imageRef: f.imageUrl,
              status: f.status,
            })),
            createdAt: Date.now(),
          });
        } else {
          const storyboardFrames = loadFramesFromStoryboard();
          setFrames(storyboardFrames);
        }

        setHasLoaded(true);
      } catch (err) {
        console.error("Error loading ImageGen data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [currentStage, currentProjectId, isContextLoading, hasLoaded, loadAssets, loadFramesFromStoryboard, setStageResult, settings]);

  // Group frames by shotGroup for display
  const groupedFrames = useMemo(() => {
    const groups: Record<number, ImageGenFrame[]> = {};
    frames.forEach((frame) => {
      const group = frame.shotGroup || 0;
      if (!groups[group]) groups[group] = [];
      groups[group].push(frame);
    });
    return Object.entries(groups).sort((a, b) => Number(a[0]) - Number(b[0]));
  }, [frames]);

  // Collect reference URLs for a frame (backgrounds + characters)
  const collectReferenceUrls = useCallback(
    async (frame: ImageGenFrame): Promise<string[]> => {
      const referenceUrls: string[] = [];

      // 1. Add background reference if specified
      if (frame.backgroundId) {
        // Check local uploaded backgrounds
        const localBg = localAssets.find(
          (a) => a.category === "background" && a.id === frame.backgroundId
        );
        if (localBg?.imageUrl) {
          referenceUrls.push(localBg.imageUrl);
        } else {
          // Check Stage 6 backgrounds
          for (const bg of backgroundAssets) {
            const angle = bg.angles.find((a) => a.angle === frame.backgroundId);
            if (angle?.imageRef) {
              referenceUrls.push(angle.imageRef);
              break;
            }
          }
        }
      }

      // 2. Auto-detect characters in prompt and add their images
      const promptText = frame.prompt;
      const matchedCharacterIds = new Set<string>();

      // Check local replacement assets first
      for (const asset of localAssets.filter((a) => a.category === "character")) {
        const escapedId = asset.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedName = asset.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexId = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedId}(?![a-zA-Z0-9가-힣])`, "i");
        const regexName = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedName}(?![a-zA-Z0-9가-힣])`, "i");

        if ((regexId.test(promptText) || regexName.test(promptText)) && asset.imageUrl) {
          referenceUrls.push(asset.imageUrl);
          matchedCharacterIds.add(asset.id);
        }
      }

      // Check PropDesigner assets (skip if already matched from local)
      for (const char of characterAssets) {
        if (matchedCharacterIds.has(char.id)) continue;

        const escapedId = char.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexId = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedId}(?![a-zA-Z0-9가-힣])`, "i");
        const regexName = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedName}(?![a-zA-Z0-9가-힣])`, "i");

        if ((regexId.test(promptText) || regexName.test(promptText)) && char.imageUrl) {
          referenceUrls.push(char.imageUrl);
        }
      }

      // 3. Add reference frame if specified
      if (frame.refFrame) {
        const refFrame = framesRef.current.find((f) => f.frameLabel === frame.refFrame.trim());
        if (refFrame?.imageUrl) {
          referenceUrls.push(refFrame.imageUrl);
        }
      }

      return referenceUrls;
    },
    [localAssets, backgroundAssets, characterAssets]
  );

  // Generate image for a single frame using orchestrator
  const generateFrame = useCallback(
    async (frameId: string) => {
      if (!isClockedIn) {
        toast({
          title: "Clock In Required",
          description: "Please clock in to start generating images.",
          variant: "destructive",
        });
        return;
      }

      if (!currentProjectId) {
        toast({
          title: "Project Required",
          description: "Please save your project first.",
          variant: "destructive",
        });
        return;
      }

      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;

      // Clean up old job for this frame if regenerating
      const oldJobId = frameToJobMap.current.get(frameId);
      if (oldJobId) {
        activeJobsRef.current.delete(oldJobId);
        frameToJobMap.current.delete(frameId);
        console.log(`[ImageGenOrchestrator] Cleaned up old job ${oldJobId} for frame ${frameId}`);
      }

      // Update status to generating
      setFrames((prev) =>
        prev.map((f) => (f.id === frameId ? { ...f, isLoading: true, error: undefined, status: "generating" } : f))
      );

      try {
        // Collect reference URLs
        const referenceUrls = await collectReferenceUrls(frame);

        // Submit to orchestrator
        const response = await submitJob({
          projectId: currentProjectId,
          frameId: frame.id,
          sceneIndex: frame.sceneIndex,
          clipIndex: frame.clipIndex,
          frameLabel: frame.frameLabel,
          prompt: frame.prompt,
          stylePrompt: settings.stylePrompt,
          referenceUrls,
          aspectRatio: settings.aspectRatio,
          apiKey: customApiKey || undefined,
        });

        // Track this job for updates
        activeJobsRef.current.add(response.jobId);
        frameToJobMap.current.set(frameId, response.jobId);

        // Status updates will come via Firestore subscription
      } catch (err: any) {
        if (!isMountedRef.current) return;

        console.error("Error submitting image job:", err);
        setFrames((prev) =>
          prev.map((f) =>
            f.id === frameId
              ? { ...f, isLoading: false, status: "failed", error: err.message }
              : f
          )
        );

        if (!shouldStopRef.current) {
          toast({
            title: "Generation Failed",
            description: err.message,
            variant: "destructive",
          });
        }
      }
    },
    [frames, currentProjectId, settings, customApiKey, collectReferenceUrls, submitJob, toast, isClockedIn]
  );

  // Parse batch range string
  const parseRangeString = (rangeStr: string): [number, number][] => {
    if (!rangeStr.trim()) return [];
    return rangeStr
      .split(",")
      .map((part) => {
        const bits = part.trim().split("-");
        if (bits.length === 2) {
          return [parseInt(bits[0], 10), parseInt(bits[1], 10)] as [number, number];
        }
        const val = parseInt(bits[0], 10);
        return [val, val] as [number, number];
      })
      .filter((r) => !isNaN(r[0]));
  };

  // Check if frame number is in ranges
  const isFrameInRanges = (frameNumber: string, ranges: [number, number][]): boolean => {
    if (ranges.length === 0) return true;
    const numPart = parseInt(frameNumber.replace(/\D/g, ""), 10);
    return ranges.some(([start, end]) => numPart >= start && numPart <= end);
  };

  // Batch generate frames
  const handleBatchGenerate = useCallback(async () => {
    const ranges = parseRangeString(batchRange);
    const framesToProcess = frames.filter(
      (f) => !f.imageUrl && isFrameInRanges(f.frameNumber, ranges)
    );

    if (framesToProcess.length === 0) {
      toast({
        title: "No Frames to Process",
        description: "All frames in the specified range already have images.",
        variant: "default",
      });
      return;
    }

    shouldStopRef.current = false;
    isBatchRunningRef.current = true;
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: framesToProcess.length });

    for (let i = 0; i < framesToProcess.length; i++) {
      if (!isBatchRunningRef.current || !isMountedRef.current || shouldStopRef.current) break;

      setBatchProgress({ current: i + 1, total: framesToProcess.length });
      await generateFrame(framesToProcess[i].id);

      // Small delay between submissions
      if (i < framesToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (isMountedRef.current) {
      setIsBatchRunning(false);
      setBatchProgress(null);
      shouldStopRef.current = false;
    }

    toast({
      title: "Batch Submission Complete",
      description: `Submitted ${framesToProcess.length} image generation jobs.`,
      variant: "default",
    });
  }, [frames, batchRange, generateFrame, toast]);

  // Stop batch generation
  const handleStopBatch = useCallback(async () => {
    shouldStopRef.current = true;
    isBatchRunningRef.current = false;
    setIsBatchRunning(false);
    setBatchProgress(null);

    // Cancel all active jobs
    for (const jobId of activeJobsRef.current) {
      try {
        await cancelJob({ jobId });
      } catch {
        // Ignore cancel errors
      }
    }
    activeJobsRef.current.clear();
    frameToJobMap.current.clear();

    toast({
      title: "Batch Stopped",
      description: "All pending jobs have been cancelled.",
    });
  }, [cancelJob, toast]);

  // Save settings to Firestore
  const handleSaveSettings = useCallback(async () => {
    if (!currentProjectId) return;

    try {
      const localAssetsForFirestore = await Promise.all(
        localAssets.map(async (asset) => {
          try {
            if (asset.imageUrl) {
              return {
                id: asset.id,
                name: asset.name,
                imageUrl: asset.imageUrl,
                category: asset.category,
              };
            }

            if (!asset.base64) {
              return null;
            }

            const imageUrl = await uploadImageGenReplacementAsset(
              currentProjectId,
              asset.id,
              asset.category,
              asset.base64,
              asset.mimeType
            );
            return {
              id: asset.id,
              name: asset.name,
              imageUrl,
              category: asset.category,
            };
          } catch (err) {
            console.error(`Failed to upload replacement asset ${asset.id}:`, err);
            return null;
          }
        })
      );

      const successfulAssets = localAssetsForFirestore.filter((a) => a !== null) as Array<{
        id: string;
        name: string;
        imageUrl: string;
        category: 'character' | 'background';
      }>;

      await saveImageGenMeta(currentProjectId, settings.stylePrompt, settings.aspectRatio, successfulAssets);

      const frameInputs = frames.map((f) => ({
        id: f.id,
        input: {
          sceneIndex: f.sceneIndex,
          clipIndex: f.clipIndex,
          frameLabel: f.frameLabel,
          frameNumber: f.frameNumber,
          shotGroup: f.shotGroup,
          prompt: f.prompt,
          backgroundId: f.backgroundId,
          refFrame: f.refFrame,
          status: f.status,
          ...(f.imageUrl && { imageRef: f.imageUrl }),
          ...(f.remixPrompt && { remixPrompt: f.remixPrompt }),
          ...(f.remixImageUrl !== null && { remixImageRef: f.remixImageUrl }),
          ...(f.editedImageUrl !== null && { editedImageRef: f.editedImageUrl }),
        },
      }));
      await saveImageGenFrames(currentProjectId, frameInputs);

      setStageResult(7, {
        settings,
        frames: frames.map((f) => ({
          id: f.id,
          sceneIndex: f.sceneIndex,
          clipIndex: f.clipIndex,
          frameLabel: f.frameLabel,
          imageRef: f.imageUrl,
          status: f.status,
        })),
        createdAt: Date.now(),
      });

      toast({
        title: "Saved",
        description: "Settings and frames saved successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error("Error saving:", err);
      toast({
        title: "Save Failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  }, [currentProjectId, settings, frames, localAssets, setStageResult, toast]);

  // Clear all data
  const handleClear = useCallback(async () => {
    if (!confirm("Are you sure you want to clear all generated images?")) return;

    if (currentProjectId) {
      try {
        await clearImageGen(currentProjectId);
      } catch (err) {
        console.error("Error clearing:", err);
      }
    }

    const storyboardFrames = loadFramesFromStoryboard();
    setFrames(storyboardFrames);
    setStageResult(7, null);

    toast({
      title: "Cleared",
      description: "All generated images have been cleared.",
      variant: "default",
    });
  }, [currentProjectId, loadFramesFromStoryboard, setStageResult, toast]);

  // Apply from storyboard
  const handleApplyFromStoryboard = useCallback(async () => {
    const storyboardFrames = loadFramesFromStoryboard();
    if (storyboardFrames.length === 0) {
      return;
    }

    const freshFrames = storyboardFrames.map((f) => ({
      ...f,
      imageUrl: null,
      imageBase64: null,
      status: "pending" as const,
      remixImageUrl: null,
      remixImageBase64: null,
      hasDrawingEdits: false,
      editedImageUrl: null,
    }));

    setFrames(freshFrames);
    setError(null);

    if (currentProjectId) {
      try {
        await clearImageGen(currentProjectId);

        const frameInputs = freshFrames.map((f) => ({
          id: f.id,
          input: {
            sceneIndex: f.sceneIndex,
            clipIndex: f.clipIndex,
            frameLabel: f.frameLabel,
            frameNumber: f.frameNumber,
            shotGroup: f.shotGroup,
            prompt: f.prompt,
            backgroundId: f.backgroundId,
            refFrame: f.refFrame,
            imageRef: "",
            status: f.status,
            remixPrompt: "",
            remixImageRef: null,
            editedImageRef: null,
          },
        }));
        await saveImageGenFrames(currentProjectId, frameInputs);

        setStageResult(7, {
          settings,
          frames: freshFrames.map((f) => ({
            id: f.id,
            sceneIndex: f.sceneIndex,
            clipIndex: f.clipIndex,
            frameLabel: f.frameLabel,
            imageRef: null,
            status: f.status,
          })),
          createdAt: Date.now(),
        });
      } catch (err) {
        console.error("Failed to save imported frames to Firestore:", err);
      }
    }

    toast({
      title: "Storyboard Applied",
      description: `Loaded ${freshFrames.length} frames from storyboard.`,
      variant: "default",
    });
  }, [currentProjectId, loadFramesFromStoryboard, settings, setStageResult, toast]);

  // Frame handlers
  const handlePromptChange = useCallback((id: string, value: string) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, prompt: value } : f)));
  }, []);

  const handleRemixPromptChange = useCallback((id: string, value: string) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, remixPrompt: value } : f)));
  }, []);

  const handleBgChange = useCallback((id: string, value: string) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, backgroundId: value } : f)));
  }, []);

  const handleRefChange = useCallback((id: string, value: string) => {
    setFrames((prev) => prev.map((f) => (f.id === id ? { ...f, refFrame: value } : f)));
  }, []);

  const handleDownload = useCallback((id: string, isRemix?: boolean) => {
    const frame = frames.find((f) => f.id === id);
    if (!frame) return;

    const url = isRemix ? frame.remixImageUrl : frame.imageUrl;
    if (!url) return;

    const a = document.createElement("a");
    a.href = url;
    a.download = `frame_${frame.frameLabel}${isRemix ? "_remix" : ""}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [frames]);

  // Apply bulk background to all frames
  const handleApplyBulkBg = useCallback(() => {
    if (!bulkBackgroundId.trim()) return;
    setFrames((prev) =>
      prev.map((f) => ({ ...f, backgroundId: bulkBackgroundId }))
    );
    toast({
      title: "Applied",
      description: `Background ID "${bulkBackgroundId}" applied to all frames.`,
      variant: "default",
    });
  }, [bulkBackgroundId, toast]);

  // Handle CSV file upload
  const handleCsvFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const { headers, data } = parseCsvData(evt.target?.result as string);
        setCsvHeaders(headers);
        setParsedCsvData(data);
        toast({
          title: "CSV Loaded",
          description: `Found ${data.length} rows with ${headers.length} columns.`,
          variant: "default",
        });
      } catch (err: any) {
        toast({
          title: "CSV Parse Error",
          description: err.message || "Failed to parse CSV file.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  }, [toast]);

  // Load storyboard frames from CSV (same as original)
  const handleLoadCsvStoryboard = useCallback(() => {
    if (!parsedCsvData || !csvPromptStart.trim()) {
      toast({
        title: "Missing Data",
        description: "Please upload a CSV file and specify the start cell.",
        variant: "destructive",
      });
      return;
    }

    const start = parseCellReference(csvPromptStart);
    if (!start) {
      toast({
        title: "Invalid Cell Reference",
        description: "Start cell format is invalid (e.g., H2).",
        variant: "destructive",
      });
      return;
    }

    const end = csvPromptEnd.trim() ? parseCellReference(csvPromptEnd) : null;
    const mainColIdx = start.colIndex;
    const endColIdx = csvEndFrameCol.trim() ? colLetterToIndex(csvEndFrameCol.trim().toUpperCase()) : -1;
    const bgColIdx = csvBgIdCol.trim() ? colLetterToIndex(csvBgIdCol.trim().toUpperCase()) : -1;

    const startRowIndex = start.row - 2;
    const endRowIndex = end ? end.row - 2 : parsedCsvData.length - 1;
    const rows = parsedCsvData.slice(Math.max(0, startRowIndex), endRowIndex + 1);

    const mainHeader = csvHeaders[mainColIdx];
    const endHeader = endColIdx !== -1 && csvHeaders[endColIdx] ? csvHeaders[endColIdx] : null;
    const bgHeader = bgColIdx !== -1 && csvHeaders[bgColIdx] ? csvHeaders[bgColIdx] : null;

    if (!mainHeader) {
      toast({
        title: "Invalid Column",
        description: "Main prompt column not found in CSV headers.",
        variant: "destructive",
      });
      return;
    }

    const newFrames: ImageGenFrame[] = [];
    let seq = 1;

    rows.forEach((row, index) => {
      const spreadsheetRow = startRowIndex + index + 2;
      const frameNumBase = String(spreadsheetRow - 1).padStart(3, "0");

      const startPrompt = row[mainHeader]?.trim() || "";
      const endPrompt = endHeader ? row[endHeader]?.trim() || "" : "";
      const bgId = bgHeader ? row[bgHeader]?.trim() || "" : "";

      const baseFrame = {
        sceneIndex: 0,
        clipIndex: index,
        backgroundId: bgId,
        refFrame: "",
        imageUrl: null,
        imageBase64: null,
        status: "pending" as const,
        isLoading: false,
        remixPrompt: "",
        remixImageUrl: null,
        remixImageBase64: null,
        hasDrawingEdits: false,
        editedImageUrl: null,
      };

      if (startPrompt && endPrompt) {
        newFrames.push({
          ...baseFrame,
          id: uuidv4(),
          prompt: startPrompt,
          frameLabel: `${seq}A`,
          frameNumber: `${frameNumBase}A`,
          shotGroup: seq,
        });
        newFrames.push({
          ...baseFrame,
          id: uuidv4(),
          prompt: endPrompt,
          frameLabel: `${seq}B`,
          frameNumber: `${frameNumBase}B`,
          shotGroup: seq,
        });
        seq++;
      } else if (startPrompt || endPrompt) {
        newFrames.push({
          ...baseFrame,
          id: uuidv4(),
          prompt: startPrompt || endPrompt,
          frameLabel: `${seq}`,
          frameNumber: frameNumBase,
          shotGroup: seq,
        });
        seq++;
      }
    });

    if (newFrames.length === 0) {
      toast({
        title: "No Frames Created",
        description: "No valid prompts found in the specified range.",
        variant: "destructive",
      });
      return;
    }

    setFrames(newFrames);
    setIsCsvPanelOpen(false);
    setError(null);

    toast({
      title: "Storyboard Loaded",
      description: `Created ${newFrames.length} frames from CSV.`,
      variant: "default",
    });
  }, [parsedCsvData, csvHeaders, csvPromptStart, csvPromptEnd, csvEndFrameCol, csvBgIdCol, toast]);

  // Handle asset file upload
  const handleAssetUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, category: "character" | "background") => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newAssets: LocalAssetRef[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const base64 = await fileToBase64(file);
          const id = sanitizeFilename(file.name.split(".")[0]);
          newAssets.push({
            id,
            name: file.name.split(".")[0],
            base64,
            mimeType: file.type || "image/png",
            category,
          });
        } catch (err) {
          console.error(`Error processing file ${file.name}:`, err);
        }
      }

      if (newAssets.length > 0) {
        setLocalAssets((prev) => [...prev, ...newAssets]);
        toast({
          title: "Assets Uploaded",
          description: `Added ${newAssets.length} ${category} asset(s).`,
          variant: "default",
        });
      }

      if (e.target) e.target.value = "";
    },
    [toast]
  );

  // Remove a local asset
  const handleRemoveAsset = useCallback(async (assetId: string) => {
    const asset = localAssets.find((a) => a.id === assetId);
    if (!asset) return;

    if (currentProjectId) {
      try {
        await deleteImageGenReplacementAsset(currentProjectId, assetId, asset.category);
      } catch (err) {
        console.warn(`Failed to delete replacement asset from S3:`, err);
      }

      try {
        const remainingAssets = localAssets
          .filter((a) => a.id !== assetId)
          .map((a) => ({
            id: a.id,
            name: a.name,
            imageUrl: a.imageUrl || "",
            category: a.category,
          }))
          .filter((a) => a.imageUrl);

        await saveImageGenMeta(currentProjectId, settings.stylePrompt, settings.aspectRatio, remainingAssets);
      } catch (err) {
        console.warn(`Failed to update Firestore after removing asset:`, err);
      }
    }

    setLocalAssets((prev) => prev.filter((a) => a.id !== assetId));
  }, [localAssets, currentProjectId, settings.stylePrompt, settings.aspectRatio]);

  // Replace a Prop Designer/BgSheet asset with uploaded file
  const handleReplaceAsset = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, assetId: string, assetName: string, category: "character" | "background") => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const base64 = await fileToBase64(file);
        setLocalAssets((prev) => prev.filter((a) => a.id !== assetId));
        setLocalAssets((prev) => [
          ...prev,
          {
            id: assetId,
            name: assetName,
            base64,
            mimeType: file.type || "image/png",
            category,
          },
        ]);
        toast({
          title: "Asset Replaced",
          description: `"${assetName}" has been replaced with your uploaded image.`,
          variant: "default",
        });
      } catch (err) {
        console.error("Error replacing asset:", err);
        toast({
          title: "Replace Failed",
          description: "Failed to replace asset. Please try again.",
          variant: "destructive",
        });
      }

      if (e.target) e.target.value = "";
    },
    [toast]
  );

  // Check if an asset has been replaced
  const isAssetReplaced = useCallback(
    (assetId: string) => localAssets.some((a) => a.id === assetId),
    [localAssets]
  );

  // Filter local assets by category
  const localCharacterAssets = useMemo(
    () => {
      const propDesignerIds = new Set(characterAssets.map((c) => c.id));
      return localAssets.filter((a) => a.category === "character" && !propDesignerIds.has(a.id));
    },
    [localAssets, characterAssets]
  );
  const localBackgroundAssets = useMemo(
    () => {
      const bgSheetIds = new Set(backgroundAssets.flatMap((bg) => bg.angles?.map((angle) => angle.angle) || []));
      return localAssets.filter((a) => a.category === "background" && !bgSheetIds.has(a.id));
    },
    [localAssets, backgroundAssets]
  );

  // Loading state
  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
        <p className="text-sm text-slate-400">{phrase(dictionary, "mithril_loading", language)}</p>
      </div>
    );
  }

  // Error state
  if (error && frames.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => {
            setHasLoaded(false);
            setError(null);
          }}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Left Sidebar - Settings Panel */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-4 h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">
        {/* Orchestrator Mode Indicator */}
        <div className="bg-green-900/30 rounded-xl p-3 border border-green-500/30">
          <p className="text-xs text-green-400 font-bold uppercase tracking-wide text-center">
            Orchestrator Mode (Real-time Updates)
          </p>
        </div>

        {/* Style Section */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <label className="text-[10px] font-bold text-yellow-500 uppercase block mb-2">
            Style Prompt
          </label>
          <textarea
            value={settings.stylePrompt}
            onChange={(e) => setSettings((prev) => ({ ...prev, stylePrompt: e.target.value }))}
            placeholder="2D Anime, High Quality, Cinematic Lighting..."
            className="w-full h-20 bg-slate-900/80 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 focus:border-cyan-500 outline-none resize-none"
          />
        </div>

        {/* Aspect Ratio */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <label className="text-[10px] font-bold text-yellow-500 uppercase block mb-2">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-2">
            {aspectRatios.map((r) => (
              <button
                key={r.value}
                onClick={() => setSettings((prev) => ({ ...prev, aspectRatio: r.value as ImageGenAspectRatio }))}
                className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                  settings.aspectRatio === r.value
                    ? "bg-yellow-500 text-slate-900 border-yellow-500"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* CSV Import Panel */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/30">
          <button
            onClick={() => setIsCsvPanelOpen(!isCsvPanelOpen)}
            className="w-full flex justify-between items-center text-[10px] font-bold text-emerald-400 uppercase"
          >
            <span>CSV Storyboard Import</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isCsvPanelOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isCsvPanelOpen && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileUpload}
                  className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                />
                {parsedCsvData && (
                  <p className="text-[9px] text-emerald-400 mt-1">
                    Loaded: {parsedCsvData.length} rows, {csvHeaders.length} columns
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                    Start Cell (e.g., H2)
                  </label>
                  <input
                    type="text"
                    value={csvPromptStart}
                    onChange={(e) => setCsvPromptStart(e.target.value)}
                    placeholder="H2"
                    className="w-full p-2 bg-slate-900/80 border border-slate-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                    End Cell (e.g., H50)
                  </label>
                  <input
                    type="text"
                    value={csvPromptEnd}
                    onChange={(e) => setCsvPromptEnd(e.target.value)}
                    placeholder="H50"
                    className="w-full p-2 bg-slate-900/80 border border-slate-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                    End Frame Col (e.g., I)
                  </label>
                  <input
                    type="text"
                    value={csvEndFrameCol}
                    onChange={(e) => setCsvEndFrameCol(e.target.value)}
                    placeholder="I"
                    className="w-full p-2 bg-slate-900/80 border border-slate-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                    BG ID Col (e.g., E)
                  </label>
                  <input
                    type="text"
                    value={csvBgIdCol}
                    onChange={(e) => setCsvBgIdCol(e.target.value)}
                    placeholder="E"
                    className="w-full p-2 bg-slate-900/80 border border-slate-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={handleLoadCsvStoryboard}
                disabled={!parsedCsvData}
                className="w-full py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Load Storyboard from CSV
              </button>

              <p className="text-[9px] text-slate-500 italic">
                CSV should have headers in row 1. Specify prompt column start/end cells (e.g., H2:H50).
              </p>
            </div>
          )}
        </div>

        {/* Character & Prop Assets */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-yellow-500/30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-black text-yellow-500 uppercase">
              Characters & Props ({characterAssets.length + localCharacterAssets.length})
            </h3>
            <label className="cursor-pointer bg-yellow-500 text-slate-900 text-[9px] font-black px-3 py-1 rounded-full hover:bg-yellow-400 transition-colors">
              UPLOAD
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, "character")}
                className="hidden"
              />
            </label>
          </div>
          {characterAssets.length === 0 && localCharacterAssets.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic text-center py-2">
              No assets - upload or use Prop Designer
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto no-scrollbar">
              {characterAssets.map((char) => {
                const replaced = isAssetReplaced(char.id);
                const replacementAsset = localAssets.find((a) => a.id === char.id);
                const replacementSrc = replacementAsset?.base64
                  ? `data:${replacementAsset.mimeType};base64,${replacementAsset.base64}`
                  : replacementAsset?.imageUrl || "";
                const hasImage = replaced ? (!!replacementAsset?.base64 || !!replacementAsset?.imageUrl) : !!char.imageUrl;
                return (
                  <div
                    key={char.id}
                    className={`bg-slate-900 rounded-lg overflow-hidden border group relative ${
                      replaced ? "border-green-500" : "border-slate-700"
                    }`}
                    title={char.name}
                  >
                    <div className="aspect-square bg-black/40 relative">
                      {hasImage ? (
                        <img
                          src={replaced && replacementAsset ? replacementSrc : char.imageUrl || ""}
                          alt={char.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-800">
                          <span className="text-[10px] text-slate-500">No img</span>
                        </div>
                      )}
                      {replaced ? (
                        <button
                          onClick={() => handleRemoveAsset(char.id)}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          title="Remove replacement"
                        >
                          x
                        </button>
                      ) : (
                        <label
                          className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          title="Replace with your image"
                        >
                          ^
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleReplaceAsset(e, char.id, char.name, "character")}
                            className="hidden"
                          />
                        </label>
                      )}
                      {replaced && (
                        <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 py-0.5 text-center">
                          <span className="text-[7px] font-black text-white uppercase">Replaced</span>
                        </div>
                      )}
                    </div>
                    <div className={`px-1 py-0.5 bg-slate-900 border-t ${replaced ? "border-green-500" : "border-slate-700"}`}>
                      <span className="text-[8px] text-yellow-200 font-bold truncate block">
                        {char.name}
                      </span>
                    </div>
                  </div>
                );
              })}
              {localCharacterAssets.map((asset) => {
                const imgSrc = asset.base64
                  ? `data:${asset.mimeType};base64,${asset.base64}`
                  : asset.imageUrl || "";
                return (
                  <div
                    key={asset.id}
                    className="bg-slate-900 rounded-lg overflow-hidden border border-yellow-500/50 group relative"
                    title={asset.name}
                  >
                    <div className="aspect-square bg-black/40 relative">
                      <img
                        src={imgSrc}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Remove"
                      >
                        x
                      </button>
                    </div>
                    <div className="px-1 py-0.5 bg-slate-900 border-t border-yellow-500/50">
                      <span className="text-[8px] text-yellow-200 font-bold truncate block">
                        {asset.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Background Assets */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-black text-cyan-400 uppercase">
              Backgrounds ({backgroundAssets.reduce((acc, bg) => acc + (bg.angles?.length || 0), 0) + localBackgroundAssets.length})
            </h3>
            <label className="cursor-pointer bg-cyan-500 text-slate-900 text-[9px] font-black px-3 py-1 rounded-full hover:bg-cyan-400 transition-colors">
              UPLOAD
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleAssetUpload(e, "background")}
                className="hidden"
              />
            </label>
          </div>
          {backgroundAssets.length === 0 && localBackgroundAssets.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic text-center py-2">
              No backgrounds - upload or complete Stage 4
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar">
              {backgroundAssets.map((bg) =>
                bg.angles?.map((angle, angleIndex) => {
                  const angleId = angle.angle;
                  const replaced = isAssetReplaced(angleId);
                  const replacementAsset = localAssets.find((a) => a.id === angleId);
                  const replacementSrc = replacementAsset?.base64
                    ? `data:${replacementAsset.mimeType};base64,${replacementAsset.base64}`
                    : replacementAsset?.imageUrl || "";
                  const hasImage = replaced ? (!!replacementAsset?.base64 || !!replacementAsset?.imageUrl) : !!angle.imageRef;
                  return (
                    <div
                      key={`${bg.id}-${angleIndex}`}
                      className={`bg-slate-900 rounded-lg overflow-hidden border group relative ${
                        replaced ? "border-green-500" : "border-slate-700"
                      }`}
                      title={`${bg.name} - ${angle.angle}`}
                    >
                      <div className="aspect-video bg-black/40 relative">
                        {hasImage ? (
                          <img
                            src={replaced && replacementAsset ? replacementSrc : angle.imageRef || ""}
                            alt={`${bg.id}-${angleIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-800">
                            <span className="text-[8px] text-slate-500">No img</span>
                          </div>
                        )}
                        {replaced ? (
                          <button
                            onClick={() => handleRemoveAsset(angleId)}
                            className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            title="Remove replacement"
                          >
                            x
                          </button>
                        ) : (
                          <label
                            className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            title="Replace with your image"
                          >
                            ^
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleReplaceAsset(e, angleId, `${bg.name} - ${angle.angle}`, "background")}
                              className="hidden"
                            />
                          </label>
                        )}
                        {replaced && (
                          <div className="absolute bottom-0 left-0 right-0 bg-green-600/80 py-0.5 text-center">
                            <span className="text-[7px] font-black text-white uppercase">Replaced</span>
                          </div>
                        )}
                      </div>
                      <div className={`px-1 py-0.5 bg-slate-900 border-t ${replaced ? "border-green-500" : "border-slate-700"}`}>
                        <span className="text-[8px] text-cyan-200 font-bold truncate block">
                          {angle.angle}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {localBackgroundAssets.map((asset) => {
                const imgSrc = asset.base64
                  ? `data:${asset.mimeType};base64,${asset.base64}`
                  : asset.imageUrl || "";
                return (
                  <div
                    key={asset.id}
                    className="bg-slate-900 rounded-lg overflow-hidden border border-cyan-500/50 group relative"
                    title={asset.name}
                  >
                    <div className="aspect-video bg-black/40 relative">
                      <img
                        src={imgSrc}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        title="Remove"
                      >
                        x
                      </button>
                    </div>
                    <div className="px-1 py-0.5 bg-slate-900 border-t border-cyan-500/50">
                      <span className="text-[8px] text-cyan-200 font-bold truncate block">
                        {asset.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Batch Controls */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/30 space-y-3">
          <label className="text-[10px] font-bold text-cyan-400 uppercase block">
            Batch Range (e.g., 1-10, 15)
          </label>
          <input
            type="text"
            value={batchRange}
            onChange={(e) => setBatchRange(e.target.value)}
            placeholder="Leave empty for all pending"
            className="w-full p-2 bg-slate-900/80 border border-slate-700 rounded-lg text-[11px] text-cyan-100 outline-none placeholder-slate-500 focus:border-cyan-500"
          />
          <button
            onClick={isBatchRunning ? handleStopBatch : handleBatchGenerate}
            className={`w-full py-3 font-black rounded-xl shadow-lg transition-all ${
              isBatchRunning
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-cyan-600 hover:bg-cyan-500 text-white"
            }`}
          >
            {isBatchRunning ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                STOP ({batchProgress?.current}/{batchProgress?.total})
              </span>
            ) : (
              "BATCH START"
            )}
          </button>
        </div>

        {/* Progress Bar */}
        {batchProgress && (
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-2 transition-all duration-300"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>
        )}

        {/* Save Action */}
        <button
          onClick={handleSaveSettings}
          className="w-full py-2 bg-green-700 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-colors"
        >
          Save All
        </button>

        {/* Error Display */}
        {error && (
          <div className="text-rose-400 text-[10px] text-center font-bold p-2 bg-rose-950/30 rounded-lg border border-rose-500/20">
            {error}
          </div>
        )}
      </div>

      {/* Right Side - Storyboard */}
      <div className="flex-1 min-w-0 bg-slate-900/40 rounded-2xl border border-slate-700/50 shadow-inner h-[calc(100vh-6rem)] flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-cyan-400 uppercase tracking-widest">
              Storyboard
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                <input
                  type="text"
                  placeholder="Bulk BG ID"
                  value={bulkBackgroundId}
                  onChange={(e) => setBulkBackgroundId(e.target.value)}
                  className="p-1.5 text-[10px] bg-slate-900 border border-slate-700 rounded-lg w-24 outline-none text-slate-300 placeholder-slate-500"
                />
                <button
                  onClick={handleApplyBulkBg}
                  className="px-3 py-1.5 text-[10px] bg-purple-600 text-white rounded-lg font-black hover:bg-purple-500 transition-all"
                >
                  APPLY ALL
                </button>
              </div>
              <button
                onClick={() => {
                  setFrames([]);
                  setStageResult(7, null);
                }}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="Clear all frames"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Frames Content */}
        <div className="p-6 space-y-10 overflow-y-auto flex-1 no-scrollbar">
          {groupedFrames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="opacity-30">
                <ImageIcon className="w-20 h-20 text-slate-600 mx-auto" />
                <h2 className="text-xl font-black text-slate-500 uppercase tracking-widest mt-4">
                  No Frames
                </h2>
                <p className="text-sm text-slate-600 mt-2 text-center">
                  Please complete Stage 5 (Storyboard) first
                </p>
              </div>
              <button
                onClick={handleApplyFromStoryboard}
                disabled={!getStageResult(4)}
                className="mt-6 px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Apply From Storyboard
              </button>
              {!getStageResult(4) && (
                <p className="text-xs text-gray-400 mt-2">
                  Complete Stage 5 (Storyboard) to enable this option
                </p>
              )}
            </div>
          ) : (
            groupedFrames.map(([groupId, groupFrames], shotIdx) => (
              <div
                key={groupId}
                className={`p-5 rounded-2xl border-l-4 ${getShotColor(shotIdx)} shadow-xl relative`}
              >
                {/* Sequence Badge */}
                <div className="absolute -top-3 left-6 px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black rounded-full border border-slate-700 shadow-xl tracking-widest uppercase">
                  Sequence {groupId}
                </div>

                {/* Frames Grid */}
                <div className="grid grid-cols-2 gap-4 mt-3">
                  {groupFrames.map((frame) => (
                    <FrameCard
                      key={frame.id}
                      frame={frame}
                      onPromptChange={handlePromptChange}
                      onRemixPromptChange={handleRemixPromptChange}
                      onBgChange={handleBgChange}
                      onRefChange={handleRefChange}
                      onGenerate={generateFrame}
                      onRemix={() => {}}
                      onEdit={() => {}}
                      onDownload={handleDownload}
                      onOpenModal={setSelectedImageUrl}
                      isBatchRunning={isBatchRunning}
                      globalIdx={frames.indexOf(frame)}
                      characterAssets={characterAssets}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImageUrl && (
        <ImageModal
          isOpen={!!selectedImageUrl}
          imageUrl={selectedImageUrl}
          onClose={() => setSelectedImageUrl(null)}
        />
      )}
    </div>
  );
}

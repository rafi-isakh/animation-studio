"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Image as ImageIcon, ChevronDown } from "lucide-react";
import { useMithril } from "../MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Continuity } from "../StoryboardGenerator/types";
import type { CharacterSheetResultMetadata } from "../CharacterSheetGenerator/types";
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
  uploadImageGenFrameImage,
  uploadImageGenRemixImage,
} from "../services/s3/images";
import FrameCard from "./FrameCard";
import ImageModal from "./ImageModal";
import { parseCsvData, parseCellReference, colLetterToIndex } from "@/utils/csvHelper";
import { fileToBase64, sanitizeFilename } from "@/utils/fileHelper";
import { useCostTracker } from "../CostContext";

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

export default function ImageGenerator() {
  const {
    currentStage,
    currentProjectId,
    getStageResult,
    setStageResult,
    customApiKey,
    isLoading: isContextLoading,
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
    return () => {
      isMountedRef.current = false;
      isBatchRunningRef.current = false;
    };
  }, []);

  // Load character and background assets from previous stages
  const loadAssets = useCallback(() => {
    // Load characters from Stage 3
    const charResult = getStageResult(3) as CharacterSheetResultMetadata | null;
    if (charResult?.characters) {
      setCharacterAssets(
        charResult.characters.map((char) => ({
          id: char.id,
          name: char.name,
          imageUrl: char.masterSheetImageId || char.profileImageId || char.imageId || "",
        }))
      );
    }

    // Load backgrounds from Stage 4
    const bgResult = getStageResult(4) as BgSheetResultMetadata | null;
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
  }, [getStageResult]);

  // Load frames from Stage 5 storyboard
  const loadFramesFromStoryboard = useCallback(() => {
    const storyboardData = getStageResult(5) as { scenes: Scene[] } | null;
    if (!storyboardData?.scenes || storyboardData.scenes.length === 0) {
      setError("No storyboard data found. Please complete Stage 5 first.");
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
    if (currentStage !== 6) {
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
          // No project - just load from storyboard
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
        }

        if (savedFrames.length > 0) {
          // Use saved frames - merge with storyboard data for any missing fields
          const storyboardFrames = loadFramesFromStoryboard();

          // Create a map of saved frames by their unique key (sceneIndex-clipIndex-frameLabel)
          const savedFrameMap = new Map<string, typeof savedFrames[0]>();
          savedFrames.forEach((f) => {
            // Use frameLabel as key since it's unique per frame
            savedFrameMap.set(f.frameLabel, f);
          });

          // Merge saved frame data with storyboard frames
          const mergedFrames = storyboardFrames.map((sbFrame) => {
            const savedFrame = savedFrameMap.get(sbFrame.frameLabel);
            if (savedFrame) {
              return {
                ...sbFrame,
                id: savedFrame.id || sbFrame.id,
                prompt: savedFrame.prompt || sbFrame.prompt,
                backgroundId: savedFrame.backgroundId || sbFrame.backgroundId,
                refFrame: savedFrame.refFrame || sbFrame.refFrame,
                imageUrl: savedFrame.imageRef || sbFrame.imageUrl,
                status: savedFrame.status || sbFrame.status,
                remixPrompt: savedFrame.remixPrompt || "",
                remixImageUrl: savedFrame.remixImageRef || null,
                hasDrawingEdits: !!savedFrame.editedImageRef,
                editedImageUrl: savedFrame.editedImageRef || null,
              };
            }
            return sbFrame;
          });

          setFrames(mergedFrames);

          // Also set stage result so Stage 7 can access it
          setStageResult(6, {
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
          // Initialize from storyboard
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

  // Generate image for a single frame
  const generateFrame = useCallback(
    async (frameId: string) => {
      // Require clock-in to generate images
      if (!isClockedIn) {
        toast({
          title: "Clock In Required",
          description: "Please clock in to start generating images.",
          variant: "destructive",
        });
        return;
      }

      const frame = frames.find((f) => f.id === frameId);
      if (!frame) return;

      setFrames((prev) =>
        prev.map((f) => (f.id === frameId ? { ...f, isLoading: true, error: undefined } : f))
      );

      try {
        // Build references
        const references: { backgrounds: any[]; characters: any[] } = {
          backgrounds: [],
          characters: [],
        };

        let bgIdForPrompt = "";

        // 1. Add background reference if specified
        if (frame.backgroundId) {
          // First check local uploaded backgrounds
          const localBg = localAssets.find(
            (a) => a.category === "background" && a.id === frame.backgroundId
          );
          if (localBg) {
            // Use local uploaded background directly
            references.backgrounds.push({
              base64: localBg.base64,
              mimeType: localBg.mimeType,
            });
            bgIdForPrompt = localBg.id;
          } else {
            // Check Stage 4 backgrounds (storyboard format: "1-3", "4-1-1", etc.)
            // Find background by matching angle string directly
            let matchedAngle: { angle: string; imageRef: string } | undefined;
            let matchedBgName = "";

            for (const bg of backgroundAssets) {
              const angle = bg.angles.find((a) => a.angle === frame.backgroundId);
              if (angle?.imageRef) {
                matchedAngle = angle;
                matchedBgName = bg.name;
                break;
              }
            }

            if (matchedAngle?.imageRef) {
              // Fetch the image and convert to base64
              try {
                const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(matchedAngle.imageRef)}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.base64) {
                    references.backgrounds.push({
                      base64: data.base64,
                      mimeType: "image/webp",
                    });
                    bgIdForPrompt = matchedBgName || frame.backgroundId;
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch background image for ${frame.backgroundId}:`, err);
              }
            }
          }
        }

        // 2. Auto-detect characters in prompt and add their images
        const promptText = frame.prompt;

        // Check Stage 3 character assets
        for (const char of characterAssets) {
          // Escape special regex characters in character ID/name
          const escapedId = char.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Regex to find character ID or name as a whole word in prompt
          const regexId = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedId}(?![a-zA-Z0-9가-힣])`, "i");
          const regexName = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedName}(?![a-zA-Z0-9가-힣])`, "i");

          if (regexId.test(promptText) || regexName.test(promptText)) {
            // Character found in prompt, add their image
            if (char.imageUrl) {
              try {
                const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(char.imageUrl)}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.base64) {
                    references.characters.push({
                      base64: data.base64,
                      mimeType: "image/webp",
                    });
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch character image for ${char.id}:`, err);
              }
            }
          }
        }

        // Check local uploaded character assets
        for (const asset of localAssets.filter((a) => a.category === "character")) {
          const escapedId = asset.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const escapedName = asset.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regexId = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedId}(?![a-zA-Z0-9가-힣])`, "i");
          const regexName = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedName}(?![a-zA-Z0-9가-힣])`, "i");

          if (regexId.test(promptText) || regexName.test(promptText)) {
            // Local character found in prompt, add their image directly
            references.characters.push({
              base64: asset.base64,
              mimeType: asset.mimeType,
            });
          }
        }

        // 3. Add reference frame if specified
        if (frame.refFrame) {
          const refFrame = framesRef.current.find((f) => f.frameLabel === frame.refFrame.trim());
          if (refFrame?.imageUrl) {
            try {
              // Check if it's a base64 URL or remote URL
              if (refFrame.imageUrl.startsWith("data:")) {
                const base64 = refFrame.imageUrl.split(",")[1];
                references.characters.push({
                  base64,
                  mimeType: "image/png",
                });
              } else {
                const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(refFrame.imageUrl)}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.base64) {
                    references.characters.push({
                      base64: data.base64,
                      mimeType: "image/webp",
                    });
                  }
                }
              }
            } catch (err) {
              console.warn(`Failed to fetch reference frame image for ${frame.refFrame}:`, err);
            }
          }
        }

        // Build full prompt (matching reference app format)
        let fullPrompt = "";
        if (settings.stylePrompt) {
          fullPrompt += `STYLE: ${settings.stylePrompt.trim()}\n`;
        }
        fullPrompt += `SCENE: ${frame.prompt.trim()}`;
        if (bgIdForPrompt) {
          fullPrompt += `\nBG: ${bgIdForPrompt}`;
        }
        fullPrompt = fullPrompt.trim();

        console.log("[ImageGen] Full prompt:", fullPrompt);
        console.log("[ImageGen] References:", {
          backgrounds: references.backgrounds.length,
          characters: references.characters.length,
        });

        // Call API
        const response = await fetch("/api/nano_banana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: fullPrompt,
            references: references.backgrounds.length > 0 || references.characters.length > 0 ? references : undefined,
            aspectRatio: settings.aspectRatio,
            customApiKey,
          }),
        });

        const data = await response.json();
        console.log("[ImageGen] API response received:", { hasImageBase64: !!data.imageBase64, responseOk: response.ok });

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate image");
        }

        // Upload to S3
        let imageUrl = `data:image/png;base64,${data.imageBase64}`;
        console.log("[ImageGen] Initial imageUrl (base64):", imageUrl.substring(0, 50) + "...");
        if (currentProjectId) {
          try {
            imageUrl = await uploadImageGenFrameImage(currentProjectId, frameId, data.imageBase64);
            console.log("[ImageGen] S3 upload successful, URL:", imageUrl);
            // Save full frame data to Firestore
            await saveImageGenFrame(currentProjectId, frameId, {
              sceneIndex: frame.sceneIndex,
              clipIndex: frame.clipIndex,
              frameLabel: frame.frameLabel,
              frameNumber: frame.frameNumber,
              shotGroup: frame.shotGroup,
              prompt: frame.prompt,
              backgroundId: frame.backgroundId,
              refFrame: frame.refFrame,
              imageRef: imageUrl,
              status: "completed",
              remixPrompt: frame.remixPrompt || "",
              remixImageRef: frame.remixImageUrl || null,
              editedImageRef: frame.editedImageUrl || null,
            });
          } catch (uploadErr) {
            console.error("[ImageGen] Error uploading to S3:", uploadErr);
            // Keep the base64 URL as fallback
          }
        }

        console.log("[ImageGen] Setting frame state with imageUrl:", imageUrl.substring(0, 80) + "...");

        // Track image generation cost
        trackImageGeneration(1);

        setFrames((prev) => {
          const updatedFrames = prev.map((f) =>
            f.id === frameId
              ? { ...f, imageUrl, imageBase64: data.imageBase64, imageUpdatedAt: Date.now(), isLoading: false, status: "completed" as const }
              : f
          );

          // Auto-save to stage result so Stage 7 can access it
          setStageResult(6, {
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

          return updatedFrames;
        });
      } catch (err: any) {
        console.error("Error generating frame:", err);
        setFrames((prev) =>
          prev.map((f) =>
            f.id === frameId
              ? { ...f, isLoading: false, status: "failed", error: err.message }
              : f
          )
        );
        toast({
          title: "Generation Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    },
    [frames, backgroundAssets, characterAssets, localAssets, settings, customApiKey, currentProjectId, toast, setStageResult, trackImageGeneration, isClockedIn]
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

    isBatchRunningRef.current = true;
    setIsBatchRunning(true);
    setBatchProgress({ current: 0, total: framesToProcess.length });

    for (let i = 0; i < framesToProcess.length; i++) {
      if (!isBatchRunningRef.current || !isMountedRef.current) break;

      setBatchProgress({ current: i + 1, total: framesToProcess.length });
      await generateFrame(framesToProcess[i].id);

      // Rate limiting delay
      if (i < framesToProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsBatchRunning(false);
    setBatchProgress(null);

    toast({
      title: "Batch Generation Complete",
      description: `Generated ${framesToProcess.length} images.`,
      variant: "default",
    });
  }, [frames, batchRange, customApiKey, generateFrame, toast]);

  // Stop batch generation
  const handleStopBatch = useCallback(() => {
    isBatchRunningRef.current = false;
    setIsBatchRunning(false);
    setBatchProgress(null);
  }, []);

  // Save settings to Firestore
  const handleSaveSettings = useCallback(async () => {
    if (!currentProjectId) return;

    try {
      await saveImageGenMeta(currentProjectId, settings.stylePrompt, settings.aspectRatio);

      // Save all frames
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
          imageRef: f.imageUrl || "",
          status: f.status,
          remixPrompt: f.remixPrompt,
          remixImageRef: f.remixImageUrl,
          editedImageRef: f.editedImageUrl,
        },
      }));
      await saveImageGenFrames(currentProjectId, frameInputs);

      // Update stage result for Stage 7
      setStageResult(6, {
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
  }, [currentProjectId, settings, frames, setStageResult, toast]);

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

    // Reload frames from storyboard
    const storyboardFrames = loadFramesFromStoryboard();
    setFrames(storyboardFrames);
    setStageResult(6, null);

    toast({
      title: "Cleared",
      description: "All generated images have been cleared.",
      variant: "default",
    });
  }, [currentProjectId, loadFramesFromStoryboard, setStageResult, toast]);

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
    // Reset input so same file can be re-uploaded
    if (e.target) e.target.value = "";
  }, [toast]);

  // Load storyboard frames from CSV
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

    // Calculate row range (CSV data is 0-indexed, but cell refs are 1-indexed with header at row 1)
    const startRowIndex = start.row - 2; // -2 because row 1 is header, and array is 0-indexed
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
      const spreadsheetRow = startRowIndex + index + 2; // Convert back to spreadsheet row number
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

      // If both start and end prompts exist, create A/B frames
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
        // Single frame
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

  // Handle asset file upload (characters or backgrounds)
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

      // Reset input so same files can be re-uploaded
      if (e.target) e.target.value = "";
    },
    [toast]
  );

  // Remove a local asset
  const handleRemoveAsset = useCallback((assetId: string) => {
    setLocalAssets((prev) => prev.filter((a) => a.id !== assetId));
  }, []);

  // Filter local assets by category
  const localCharacterAssets = useMemo(
    () => localAssets.filter((a) => a.category === "character"),
    [localAssets]
  );
  const localBackgroundAssets = useMemo(
    () => localAssets.filter((a) => a.category === "background"),
    [localAssets]
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
              {/* File Upload */}
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

              {/* Column Mapping */}
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

              {/* Load Button */}
              <button
                onClick={handleLoadCsvStoryboard}
                disabled={!parsedCsvData}
                className="w-full py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Load Storyboard from CSV
              </button>

              {/* Help Text */}
              <p className="text-[9px] text-slate-500 italic">
                CSV should have headers in row 1. Specify prompt column start/end cells (e.g., H2:H50).
                End Frame column creates A/B frames. BG ID column sets background reference.
              </p>
            </div>
          )}
        </div>

        {/* Character Assets */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-yellow-500/30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-black text-yellow-500 uppercase">
              Characters ({characterAssets.length + localCharacterAssets.length})
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
              No characters - upload or complete Stage 3
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto no-scrollbar">
              {/* Stage 3 characters */}
              {characterAssets.map((char) => (
                <div
                  key={char.id}
                  className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700 group"
                  title={char.name}
                >
                  {char.imageUrl ? (
                    <div className="aspect-square bg-black/40 relative">
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-slate-800 flex items-center justify-center">
                      <span className="text-[10px] text-slate-500">No img</span>
                    </div>
                  )}
                  <div className="px-1 py-0.5 bg-slate-900 border-t border-slate-700">
                    <span className="text-[8px] text-yellow-200 font-bold truncate block">
                      {char.name}
                    </span>
                  </div>
                </div>
              ))}
              {/* Locally uploaded characters */}
              {localCharacterAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-slate-900 rounded-lg overflow-hidden border border-yellow-500/50 group relative"
                  title={asset.name}
                >
                  <div className="aspect-square bg-black/40 relative">
                    <img
                      src={`data:${asset.mimeType};base64,${asset.base64}`}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                  <div className="px-1 py-0.5 bg-slate-900 border-t border-yellow-500/50">
                    <span className="text-[8px] text-yellow-200 font-bold truncate block">
                      {asset.name}
                    </span>
                  </div>
                </div>
              ))}
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
              {/* Stage 4 backgrounds */}
              {backgroundAssets.map((bg) =>
                bg.angles?.map((angle, angleIndex) => (
                  <div
                    key={`${bg.id}-${angleIndex}`}
                    className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700 group"
                    title={`${bg.name} - ${angle.angle}`}
                  >
                    {angle.imageRef ? (
                      <div className="aspect-video bg-black/40 relative">
                        <img
                          src={angle.imageRef}
                          alt={`${bg.id}-${angleIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-slate-800 flex items-center justify-center">
                        <span className="text-[8px] text-slate-500">No img</span>
                      </div>
                    )}
                    <div className="px-1 py-0.5 bg-slate-900 border-t border-slate-700">
                      <span className="text-[8px] text-cyan-200 font-bold truncate block">
                        {angle.angle}
                      </span>
                    </div>
                  </div>
                ))
              )}
              {/* Locally uploaded backgrounds */}
              {localBackgroundAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-slate-900 rounded-lg overflow-hidden border border-cyan-500/50 group relative"
                  title={asset.name}
                >
                  <div className="aspect-video bg-black/40 relative">
                    <img
                      src={`data:${asset.mimeType};base64,${asset.base64}`}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveAsset(asset.id)}
                      className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                  <div className="px-1 py-0.5 bg-slate-900 border-t border-cyan-500/50">
                    <span className="text-[8px] text-cyan-200 font-bold truncate block">
                      {asset.id}
                    </span>
                  </div>
                </div>
              ))}
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
            onClick={handleBatchGenerate}
            disabled={isBatchRunning}
            className="w-full py-3 bg-cyan-600 text-white font-black rounded-xl hover:bg-cyan-500 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBatchRunning ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating ({batchProgress?.current}/{batchProgress?.total})
              </span>
            ) : (
              "BATCH START"
            )}
          </button>
          {isBatchRunning && (
            <button
              onClick={handleStopBatch}
              className="w-full py-1.5 text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
            >
              STOP BATCH
            </button>
          )}
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

        {/* Save/Clear Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSaveSettings}
            className="py-2 bg-green-700 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-colors"
          >
            Save All
          </button>
          <button
            onClick={handleClear}
            className="py-2 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg hover:bg-slate-600 transition-colors"
          >
            Clear All
          </button>
        </div>

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
          </div>
        </div>

        {/* Frames Content */}
        <div className="p-6 space-y-10 overflow-y-auto flex-1 no-scrollbar">
          {groupedFrames.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <ImageIcon className="w-20 h-20 text-slate-600" />
              <h2 className="text-xl font-black text-slate-500 uppercase tracking-widest mt-4">
                No Frames
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Please complete Stage 5 (Storyboard) first
              </p>
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
                  {groupFrames.map((frame, idx) => (
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

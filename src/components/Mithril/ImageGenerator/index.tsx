"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Image as ImageIcon } from "lucide-react";
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

        // Add background reference if specified (format: "bgId-angleIndex")
        if (frame.backgroundId) {
          const lastDashIndex = frame.backgroundId.lastIndexOf("-");
          if (lastDashIndex > 0) {
            const bgId = frame.backgroundId.substring(0, lastDashIndex);
            const angleIndex = parseInt(frame.backgroundId.substring(lastDashIndex + 1), 10);
            const bg = backgroundAssets.find((b) => b.id === bgId);
            if (bg && bg.angles && !isNaN(angleIndex) && angleIndex < bg.angles.length) {
              const selectedAngle = bg.angles[angleIndex];
              if (selectedAngle?.imageRef) {
                // Fetch the image and convert to base64
                const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(selectedAngle.imageRef)}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.base64) {
                    references.backgrounds.push({
                      base64: data.base64,
                      mimeType: "image/webp",
                    });
                  }
                }
              }
            }
          }
        }

        // Add reference frame if specified
        if (frame.refFrame) {
          const refFrame = framesRef.current.find((f) => f.frameLabel === frame.refFrame.trim());
          if (refFrame?.imageUrl) {
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
        }

        // Build full prompt
        const fullPrompt = settings.stylePrompt
          ? `STYLE: ${settings.stylePrompt}\nSCENE: ${frame.prompt}`
          : frame.prompt;

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
        setFrames((prev) => {
          const updatedFrames = prev.map((f) =>
            f.id === frameId
              ? { ...f, imageUrl, imageBase64: data.imageBase64, isLoading: false, status: "completed" as const }
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
    [frames, backgroundAssets, settings, customApiKey, currentProjectId, toast, setStageResult]
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
    if (!customApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key to generate images.",
        variant: "destructive",
      });
      return;
    }

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

        {/* Character Assets */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-yellow-500/30">
          <h3 className="text-[10px] font-black text-yellow-500 uppercase mb-3">
            Characters ({characterAssets.length})
          </h3>
          {characterAssets.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic text-center py-2">
              No characters from Stage 3
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
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
            </div>
          )}
        </div>

        {/* Background Assets */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-cyan-500/30">
          <h3 className="text-[10px] font-black text-cyan-400 uppercase mb-3">
            Backgrounds ({backgroundAssets.reduce((acc, bg) => acc + (bg.angles?.length || 0), 0)})
          </h3>
          {backgroundAssets.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic text-center py-2">
              No backgrounds from Stage 5
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
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
            disabled={isBatchRunning || !customApiKey}
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
                      backgroundAssets={backgroundAssets}
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

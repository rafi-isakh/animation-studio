"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2, Image as ImageIcon, ChevronDown, Trash2, Sparkles } from "lucide-react";
import { useMithril } from "../MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useToast } from "@/hooks/use-toast";
import type { Scene, Continuity } from "../StoryboardGenerator/types";
import type { PropDesignerResultMetadata } from "../PropDesigner/types";
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
import { getScenes, getClips } from "../services/firestore/storyboard";
import {
  uploadImageGenFrameImage,
  uploadImageGenRemixImage,
  deleteImageGenFrameImage,
  deleteImageGenRemixImage,
  uploadImageGenReplacementAsset,
  deleteImageGenReplacementAsset,
} from "../services/s3/images";
import FrameCard from "./FrameCard";
import ImageModal from "./ImageModal";
import { parseCsvData, colLetterToIndex } from "@/utils/csvHelper";
import { fileToBase64, sanitizeFilename } from "@/utils/fileHelper";
import { useCostTracker } from "../CostContext";
import { compressImage } from "../StoryboardGenerator/utils/imageUtils";

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

export default function NsfwImageGenerator() {
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
  const [csvStartRow, setCsvStartRow] = useState("2");
  const [csvPromptACol, setCsvPromptACol] = useState("I");
  const [csvPromptBCol, setCsvPromptBCol] = useState("J");
  const [csvPromptCCol, setCsvPromptCCol] = useState("K");
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
    // Load characters AND objects from PropDesigner (Stage 5)
    const propResult = propDesignerGenerator.result;
    if (propResult?.props) {
      // Include both characters and objects as selectable assets
      const characterAndObjectProps = propResult.props.filter(p => p.category === 'character' || p.category === 'object');
      setCharacterAssets(
        characterAndObjectProps.map((prop) => {
          // Use designSheetImageRef, referenceImageRef, or first item from referenceImageRefs
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
    } else {
      setCharacterAssets([]);
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
    } else {
      setBackgroundAssets([]);
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

    if (isContextLoading) {
      return;
    }
    if (hasLoaded) {
      return;
    }

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
          // Load local assets metadata (lazy loading - base64 loaded on-demand during generation)
          if (savedMeta.localAssets && savedMeta.localAssets.length > 0) {
            // Deduplicate by id (keep last entry) to prevent stale duplicates
            const seen = new Map<string, LocalAssetRef>();
            savedMeta.localAssets.forEach((asset) => {
              seen.set(asset.id, {
                id: asset.id,
                name: asset.name,
                mimeType: 'image/webp',
                category: asset.category,
                imageUrl: asset.imageUrl || undefined,
                isRemoved: !!asset.isRemoved,
              });
            });
            setLocalAssets(Array.from(seen.values()));
          }
        }

        if (savedFrames.length > 0) {
          // Use saved frames - merge with storyboard data for any missing fields
          const storyboardFrames = loadFramesFromStoryboard();

          let mergedFrames: ImageGenFrame[] = [];

          if (storyboardFrames.length > 0) {
            // Create a map of saved frames by their unique key (sceneIndex-clipIndex-frameLabel)
            const savedFrameMap = new Map<string, typeof savedFrames[0]>();
            savedFrames.forEach((f) => {
              // Use frameLabel as key since it's unique per frame
              savedFrameMap.set(f.frameLabel, f);
            });

            // Merge saved frame data with storyboard frames
            // IMPORTANT: Use saved frame's imageRef directly (even if empty) - don't fall back to storyboard
            // This ensures that when user clicks "Apply From Storyboard" to clear images, they stay cleared
            mergedFrames = storyboardFrames.map((sbFrame) => {
              const savedFrame = savedFrameMap.get(sbFrame.frameLabel);
              if (savedFrame) {
                return {
                  ...sbFrame,
                  id: savedFrame.id || sbFrame.id,
                  prompt: savedFrame.prompt || sbFrame.prompt,
                  backgroundId: savedFrame.backgroundId || sbFrame.backgroundId,
                  refFrame: savedFrame.refFrame || sbFrame.refFrame,
                  imageUrl: savedFrame.imageRef || null, // Don't fall back to sbFrame.imageUrl
                  imageUpdatedAt: savedFrame.imageUpdatedAt || (savedFrame.imageRef ? Date.now() : undefined), // For cache busting
                  status: savedFrame.status ?? sbFrame.status,
                  remixPrompt: savedFrame.remixPrompt || "",
                  remixImageUrl: savedFrame.remixImageRef || null,
                  hasDrawingEdits: !!savedFrame.editedImageRef,
                  editedImageUrl: savedFrame.editedImageRef || null,
                };
              }
              return sbFrame;
            });
          } else if (currentProjectId) {
            // Storyboard context not available — load directly from Firestore
            // to get the full frame structure including ungenerated placeholders
            const firestoreScenes = await getScenes(currentProjectId);
            const scenesWithClips: Scene[] = await Promise.all(
              firestoreScenes.map(async (scene) => {
                const clips = await getClips(currentProjectId, scene.sceneIndex);
                return {
                  sceneTitle: scene.sceneTitle,
                  clips: clips.map((clip) => ({
                    story: clip.story,
                    imagePrompt: clip.imagePrompt,
                    imagePromptEnd: clip.imagePromptEnd,
                    videoPrompt: clip.videoPrompt,
                    soraVideoPrompt: clip.soraVideoPrompt,
                    backgroundPrompt: clip.backgroundPrompt,
                    backgroundId: clip.backgroundId,
                    characterInfo: clip.characterInfo,
                    dialogue: clip.dialogue,
                    dialogueEn: clip.dialogueEn,
                    narration: clip.narration || "",
                    narrationEn: clip.narrationEn || "",
                    sfx: clip.sfx,
                    sfxEn: clip.sfxEn,
                    bgm: clip.bgm,
                    bgmEn: clip.bgmEn,
                    length: clip.length,
                    accumulatedTime: clip.accumulatedTime,
                    imageRef: clip.imageRef,
                  })) as Continuity[],
                };
              })
            );

            if (scenesWithClips.length > 0) {
              // Build frames from Firestore storyboard
              const fbFrames: ImageGenFrame[] = [];
              let shotGroup = 1;
              scenesWithClips.forEach((scene, sceneIndex) => {
                scene.clips.forEach((clip, clipIndex) => {
                  const frameNumber = `${String(sceneIndex + 1).padStart(2, "0")}${String(clipIndex + 1).padStart(2, "0")}`;
                  if (clip.imagePrompt) {
                    fbFrames.push({
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
                  if (clip.imagePromptEnd) {
                    fbFrames.push({
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

              // Merge saved data onto the Firestore-built frames
              const savedFrameMap = new Map<string, typeof savedFrames[0]>();
              savedFrames.forEach((f) => savedFrameMap.set(f.frameLabel, f));

              mergedFrames = fbFrames.map((fbFrame) => {
                const savedFrame = savedFrameMap.get(fbFrame.frameLabel);
                if (savedFrame) {
                  return {
                    ...fbFrame,
                    id: savedFrame.id || fbFrame.id,
                    prompt: savedFrame.prompt || fbFrame.prompt,
                    backgroundId: savedFrame.backgroundId || fbFrame.backgroundId,
                    refFrame: savedFrame.refFrame || fbFrame.refFrame,
                    imageUrl: savedFrame.imageRef || null,
                    imageUpdatedAt: savedFrame.imageUpdatedAt || (savedFrame.imageRef ? Date.now() : undefined),
                    status: savedFrame.status ?? fbFrame.status,
                    remixPrompt: savedFrame.remixPrompt || "",
                    remixImageUrl: savedFrame.remixImageRef || null,
                    hasDrawingEdits: !!savedFrame.editedImageRef,
                    editedImageUrl: savedFrame.editedImageRef || null,
                  };
                }
                return fbFrame;
              });

              // Also populate stageResult so other components can use it
              setStageResult(4, { scenes: scenesWithClips });
            } else {
              // No storyboard in Firestore either — use saved frames as-is
              mergedFrames = savedFrames.map((sf) => ({
                id: sf.id,
                sceneIndex: sf.sceneIndex,
                clipIndex: sf.clipIndex,
                frameLabel: sf.frameLabel,
                frameNumber: sf.frameNumber,
                shotGroup: sf.shotGroup,
                prompt: sf.prompt,
                backgroundId: sf.backgroundId,
                refFrame: sf.refFrame,
                imageUrl: sf.imageRef || null,
                imageBase64: null,
                imageUpdatedAt: sf.imageUpdatedAt || (sf.imageRef ? Date.now() : undefined),
                status: sf.status || ("pending" as const),
                isLoading: false,
                remixPrompt: sf.remixPrompt || "",
                remixImageUrl: sf.remixImageRef || null,
                remixImageBase64: null,
                hasDrawingEdits: !!sf.editedImageRef,
                editedImageUrl: sf.editedImageRef || null,
                promptVariant: sf.promptVariant,
                clipNumber: sf.clipNumber,
                isFinalized: sf.isFinalized ?? false,
              }));
            }
          }

          setFrames(mergedFrames);

          // Also set stage result so Stage 7 can access it
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
        // Delete old frame image from S3 before generating new one
        if (currentProjectId) {
          try {
            await deleteImageGenFrameImage(currentProjectId, frameId);
          } catch (error) {
            console.warn(`[ImageGen] Failed to delete old frame image (may not exist):`, error);
          }
        }

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
            // Lazy load base64 if not already loaded
            let bgBase64 = localBg.base64;
            if (!bgBase64 && localBg.imageUrl) {
              try {
                const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(localBg.imageUrl)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) {
                  const data = await response.json();
                  bgBase64 = data.base64;
                  // Cache the loaded base64 in state for future use
                  setLocalAssets((prev) =>
                    prev.map((a) =>
                      a.id === localBg.id ? { ...a, base64: data.base64, mimeType: data.contentType || 'image/webp' } : a
                    )
                  );
                }
              } catch (err) {
                console.error(`[ImageGen] ✗ Failed to lazy load background ${localBg.id}:`, err);
              }
            }

            if (bgBase64) {
              // Compress local uploaded background before adding
              try {
                const compressed = await compressImage(bgBase64, localBg.mimeType, 768, 768, 0.7);
                references.backgrounds.push({
                  base64: compressed.base64,
                  mimeType: compressed.mimeType,
                });
              } catch {
                // Fall back to original if compression fails
                references.backgrounds.push({
                  base64: bgBase64,
                  mimeType: localBg.mimeType,
                });
              }
              bgIdForPrompt = localBg.id;
            }
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
              // Fetch, compress, and add the background image
              try {
                const compressed = await compressImage(matchedAngle.imageRef, "image/webp", 768, 768, 0.7);
                references.backgrounds.push({
                  base64: compressed.base64,
                  mimeType: compressed.mimeType,
                });
                bgIdForPrompt = matchedBgName || frame.backgroundId;
              } catch (err) {
                console.warn(`Failed to fetch/compress background image for ${frame.backgroundId}:`, err);
              }
            }
          }
        }

        // 2. Auto-detect characters in prompt and add their images
        const promptText = frame.prompt;

        // Track which character IDs have been matched to avoid duplicates
        const matchedCharacterIds = new Set<string>();

        // Check local uploaded/replacement character assets FIRST (priority over Prop Designer)
        const localCharacters = localAssets.filter((a) => a.category === "character");
        
        for (const asset of localCharacters) {
          const escapedId = asset.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const escapedName = asset.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regexId = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedId}(?![a-zA-Z0-9가-힣])`, "i");
          const regexName = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedName}(?![a-zA-Z0-9가-힣])`, "i");

          const idMatch = regexId.test(promptText);
          const nameMatch = regexName.test(promptText);
          
          if (idMatch || nameMatch) {
            // Explicitly removed original asset: match it to block PropDesigner fallback.
            if (asset.isRemoved) {
              matchedCharacterIds.add(asset.id);
              continue;
            }
            
            // Lazy load base64 if not already loaded
            let assetBase64 = asset.base64;
            if (!assetBase64 && asset.imageUrl) {
              try {
                const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(asset.imageUrl)}`;
                const response = await fetch(proxyUrl);
                if (response.ok) {
                  const data = await response.json();
                  assetBase64 = data.base64;
                  // Cache the loaded base64 in state for future use
                  setLocalAssets((prev) =>
                    prev.map((a) =>
                      a.id === asset.id ? { ...a, base64: data.base64, mimeType: data.contentType || 'image/webp' } : a
                    )
                  );
                }
              } catch (err) {
                console.error(`[ImageGen] ✗ Failed to lazy load asset ${asset.id}:`, err);
              }
            }
            
            // Validate base64 data exists
            if (!assetBase64 || assetBase64.length < 100) {
              console.error(`[ImageGen] ⚠ Replacement asset "${asset.id}" has invalid/empty base64 data! Skipping.`);
              continue;
            }
            
            // Compress local character image before adding
            try {
              const compressed = await compressImage(assetBase64, asset.mimeType, 768, 768, 0.7);
              references.characters.push({
                base64: compressed.base64,
                mimeType: compressed.mimeType,
              });
            } catch (err) {
              console.warn(`[ImageGen] Compression failed for ${asset.id}, using original:`, err);
              // Fall back to original if compression fails
              references.characters.push({
                base64: assetBase64,
                mimeType: asset.mimeType,
              });
            }
            // Mark this ID as matched so Prop Designer won't add it again
            matchedCharacterIds.add(asset.id);
          } else {
          }
        }

        // Check Prop Designer character & object assets (skip if already matched from local assets)
        
        for (const char of characterAssets) {
          // Skip if this character was already matched from local assets (replacement)
          if (matchedCharacterIds.has(char.id)) {
            continue;
          }

          // Escape special regex characters in character ID/name
          const escapedId = char.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const escapedName = char.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          // Regex to find character ID or name as a whole word in prompt
          const regexId = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedId}(?![a-zA-Z0-9가-힣])`, "i");
          const regexName = new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapedName}(?![a-zA-Z0-9가-힣])`, "i");

          if (regexId.test(promptText) || regexName.test(promptText)) {
            // Character found in prompt, fetch and compress their image
            if (char.imageUrl) {
              try {
                const compressed = await compressImage(char.imageUrl, "image/webp", 768, 768, 0.7);
                references.characters.push({
                  base64: compressed.base64,
                  mimeType: compressed.mimeType,
                });
              } catch (err) {
                console.warn(`Failed to fetch/compress character image for ${char.id}:`, err);
              }
            }
          }
        }

        // 3. Add reference frame if specified
        if (frame.refFrame) {
          const refFrame = framesRef.current.find((f) => f.frameLabel === frame.refFrame.trim());
          if (refFrame?.imageUrl) {
            try {
              // Compress reference frame image
              if (refFrame.imageUrl.startsWith("data:")) {
                const base64 = refFrame.imageUrl.split(",")[1];
                const compressed = await compressImage(base64, "image/png", 768, 768, 0.7);
                references.characters.push({
                  base64: compressed.base64,
                  mimeType: compressed.mimeType,
                });
              } else {
                const compressed = await compressImage(refFrame.imageUrl, "image/webp", 768, 768, 0.7);
                references.characters.push({
                  base64: compressed.base64,
                  mimeType: compressed.mimeType,
                });
              }
            } catch (err) {
              console.warn(`Failed to fetch/compress reference frame image for ${frame.refFrame}:`, err);
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

        // Handle non-JSON responses (e.g., Vercel body size limit errors)
        const responseText = await response.text();
        let data: { imageBase64?: string; error?: string };
        try {
          data = JSON.parse(responseText);
        } catch {
          // Response is not JSON - likely a Vercel error like "Request Entity Too Large"
          console.error("[ImageGen] Non-JSON response:", responseText.substring(0, 100));
          throw new Error(responseText || `HTTP ${response.status}`);
        }


        if (!response.ok) {
          throw new Error(data.error || "Failed to generate image");
        }

        if (!data.imageBase64) {
          throw new Error("No image data received from API");
        }

        // Upload to S3
        const imageBase64 = data.imageBase64;
        let imageUrl = `data:image/png;base64,${imageBase64}`;
        
        let savedToFirestore = false;
        if (currentProjectId) {
          try {
            imageUrl = await uploadImageGenFrameImage(currentProjectId, frameId, imageBase64);
            
            // Save full frame data to Firestore
            const imageUpdatedAt = Date.now();
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
              imageUpdatedAt,
              status: "completed",
              remixPrompt: frame.remixPrompt || "",
              remixImageRef: frame.remixImageUrl || null,
              editedImageRef: frame.editedImageUrl || null,
            });
            savedToFirestore = true;
          } catch (uploadErr) {
            console.error("[ImageGen] Error uploading to S3 or saving to Firestore:", uploadErr);
            // Keep the base64 URL as fallback but warn user
            toast({
              title: "Save Warning",
              description: "Image generated but failed to save. Click 'Save All' to retry.",
              variant: "destructive",
            });
          }
        }

        // Track image generation cost
        trackImageGeneration(1);

        setFrames((prev) => {
          const updatedFrames = prev.map((f) =>
            f.id === frameId
              ? { ...f, imageUrl, imageBase64, imageUpdatedAt: Date.now(), isLoading: false, status: "completed" as const }
              : f
          );

          // Auto-save to stage result so Stage 7 can access it
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
      // Upload local assets to S3 first and get URLs
      // For assets that already have an imageUrl (loaded from Firestore), reuse it
      // Only upload assets that have base64 data and no imageUrl
      const localAssetsForFirestore = await Promise.all(
        localAssets.map(async (asset) => {
          try {
            // Keep explicit "removed original" markers as-is (no upload needed)
            if (asset.isRemoved) {
              return {
                id: asset.id,
                name: asset.name,
                imageUrl: "",
                category: asset.category,
                isRemoved: true,
              };
            }

            // If asset already has an imageUrl, reuse it (no need to re-upload)
            if (asset.imageUrl) {
              return {
                id: asset.id,
                name: asset.name,
                imageUrl: asset.imageUrl,
                category: asset.category,
                isRemoved: false,
              };
            }
            
            // Only upload if we have base64 data
            if (!asset.base64) {
              console.warn(`[ImageGen] Skipping asset ${asset.id} - no base64 data to upload`);
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
              isRemoved: false,
            };
          } catch (err) {
            console.error(`Failed to upload replacement asset ${asset.id}:`, err);
            return null;
          }
        })
      );

      // Filter out failed uploads
      const successfulAssets = localAssetsForFirestore.filter((a) => a !== null) as Array<{
        id: string;
        name: string;
        imageUrl: string;
        category: 'character' | 'background';
        isRemoved?: boolean;
      }>;

      await saveImageGenMeta(currentProjectId, settings.stylePrompt, settings.aspectRatio, successfulAssets);

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
          imageUpdatedAt: f.imageUpdatedAt,
          status: f.status,
          remixPrompt: f.remixPrompt,
          remixImageRef: f.remixImageUrl,
          editedImageRef: f.editedImageUrl,
          promptVariant: f.promptVariant,
          clipNumber: f.clipNumber,
          isFinalized: f.isFinalized,
        },
      }));
      await saveImageGenFrames(currentProjectId, frameInputs);

      // Update stage result for Stage 7
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

    // Reload frames from storyboard
    const storyboardFrames = loadFramesFromStoryboard();
    setFrames(storyboardFrames);
    setStageResult(7, null);

    toast({
      title: "Cleared",
      description: "All generated images have been cleared.",
      variant: "default",
    });
  }, [currentProjectId, loadFramesFromStoryboard, setStageResult, toast]);

  // Apply from storyboard - creates fresh frames and saves to Firestore
  const handleApplyFromStoryboard = useCallback(async () => {
    const storyboardFrames = loadFramesFromStoryboard();
    if (storyboardFrames.length === 0) {
      return;
    }

    // Create fresh frames WITHOUT images (like BgSheetGenerator)
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

    // Persist to Firestore immediately so frames survive refresh
    if (currentProjectId) {
      try {
        // Clear existing frames first (like BgSheetGenerator does)
        await clearImageGen(currentProjectId);

        // Save each frame to Firestore
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

        // Update stage result so it hydrates on refresh
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

  // Toggle finalization for a frame variant (only one finalized per clipNumber)
  const handleFinalizeFrame = useCallback((frameId: string) => {
    setFrames((prev) => {
      const frame = prev.find((f) => f.id === frameId);
      if (!frame) return prev;
      const clipNum = frame.clipNumber;
      const wasFinalized = frame.isFinalized;
      return prev.map((f) => {
        if (f.clipNumber !== clipNum) return f;
        // Toggle: un-finalize all if clicking the already-finalized frame, else finalize only this one
        return { ...f, isFinalized: wasFinalized ? false : f.id === frameId };
      });
    });
  }, []);

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

  // Load storyboard frames from CSV (A/B/C variants per clip)
  const handleLoadCsvStoryboard = useCallback(() => {
    if (!parsedCsvData) {
      toast({
        title: "Missing Data",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const startRowNum = parseInt(csvStartRow, 10) || 2;
    // Row 1 is header (index 0), data starts at row 2 (index 0 after slicing)
    const startRowIndex = startRowNum - 2; // e.g., row 2 → index 0

    const aColIdx = colLetterToIndex(csvPromptACol.trim().toUpperCase());
    const bColIdx = csvPromptBCol.trim() ? colLetterToIndex(csvPromptBCol.trim().toUpperCase()) : -1;
    const cColIdx = csvPromptCCol.trim() ? colLetterToIndex(csvPromptCCol.trim().toUpperCase()) : -1;
    const bgColIdx = csvBgIdCol.trim() ? colLetterToIndex(csvBgIdCol.trim().toUpperCase()) : -1;

    const aHeader = csvHeaders[aColIdx];
    const bHeader = bColIdx !== -1 ? csvHeaders[bColIdx] || null : null;
    const cHeader = cColIdx !== -1 ? csvHeaders[cColIdx] || null : null;
    const bgHeader = bgColIdx !== -1 ? csvHeaders[bgColIdx] || null : null;

    if (!aHeader) {
      toast({
        title: "Invalid Column",
        description: "Prompt A column not found in CSV headers.",
        variant: "destructive",
      });
      return;
    }

    const rows = parsedCsvData.slice(Math.max(0, startRowIndex));
    const newFrames: ImageGenFrame[] = [];

    rows.forEach((row, index) => {
      const clipNumber = index + 1;
      const frameNumBase = String(clipNumber).padStart(3, "0");
      const bgId = bgHeader ? row[bgHeader]?.trim() || "" : "";

      const promptA = row[aHeader]?.trim() || "";
      const promptB = bHeader ? row[bHeader]?.trim() || "" : "";
      const promptC = cHeader ? row[cHeader]?.trim() || "" : "";

      if (!promptA && !promptB && !promptC) return;

      const baseFrame = {
        sceneIndex: 0,
        clipIndex: index,
        shotGroup: clipNumber,
        clipNumber,
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
        isFinalized: false,
      };

      if (promptA) {
        newFrames.push({
          ...baseFrame,
          id: uuidv4(),
          prompt: promptA,
          frameLabel: `${clipNumber}A`,
          frameNumber: `${frameNumBase}A`,
          promptVariant: 'A',
        });
      }
      if (promptB) {
        newFrames.push({
          ...baseFrame,
          id: uuidv4(),
          prompt: promptB,
          frameLabel: `${clipNumber}B`,
          frameNumber: `${frameNumBase}B`,
          promptVariant: 'B',
        });
      }
      if (promptC) {
        newFrames.push({
          ...baseFrame,
          id: uuidv4(),
          prompt: promptC,
          frameLabel: `${clipNumber}C`,
          frameNumber: `${frameNumBase}C`,
          promptVariant: 'C',
        });
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
      description: `Created ${newFrames.length} frames from CSV (${Math.max(...newFrames.map(f => f.clipNumber || 0))} clips).`,
      variant: "default",
    });
  }, [parsedCsvData, csvHeaders, csvStartRow, csvPromptACol, csvPromptBCol, csvPromptCCol, csvBgIdCol, toast]);

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
        // Deduplicate: remove existing assets with same IDs, latest upload wins
        const newIds = new Set(newAssets.map((a) => a.id));
        setLocalAssets((prev) => [...prev.filter((a) => !newIds.has(a.id)), ...newAssets]);
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
  const handleRemoveAsset = useCallback(async (assetId: string) => {
    const asset = localAssets.find((a) => a.id === assetId);
    if (!asset) return;

    // Delete replacement from S3 if project exists (skip for removal markers)
    if (currentProjectId && !asset.isRemoved) {
      try {
        await deleteImageGenReplacementAsset(currentProjectId, assetId, asset.category);
      } catch (err) {
        console.warn(`Failed to delete replacement asset from S3:`, err);
      }
    }

    // Update Firestore to remove the asset from localAssets
    if (currentProjectId) {
      try {
        const remainingAssets = localAssets
          .filter((a) => a.id !== assetId)
          .map((a) => ({
            id: a.id,
            name: a.name,
            imageUrl: a.imageUrl || "",
            category: a.category,
            isRemoved: !!a.isRemoved,
          }))
          .filter((a) => a.isRemoved || !!a.imageUrl);
        
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
        // Remove existing replacement if any
        setLocalAssets((prev) => prev.filter((a) => a.id !== assetId));
        // Add new replacement with same ID
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

      // Reset input
      if (e.target) e.target.value = "";
    },
    [toast]
  );

  // Remove original PropDesigner character/prop image (can be restored later)
  const handleRemoveOriginalCharacterAsset = useCallback(async (assetId: string, assetName: string) => {
    const updatedAssets: LocalAssetRef[] = [
      ...localAssets.filter((a) => a.id !== assetId),
      {
        id: assetId,
        name: assetName,
        mimeType: "image/webp",
        category: "character",
        isRemoved: true,
      },
    ];

    setLocalAssets(updatedAssets);

    if (currentProjectId) {
      try {
        const localAssetsForFirestore = updatedAssets
          .map((a) => ({
            id: a.id,
            name: a.name,
            imageUrl: a.imageUrl || "",
            category: a.category,
            isRemoved: !!a.isRemoved,
          }))
          .filter((a) => a.isRemoved || !!a.imageUrl);
        await saveImageGenMeta(currentProjectId, settings.stylePrompt, settings.aspectRatio, localAssetsForFirestore);
      } catch (err) {
        console.warn(`Failed to persist removed original asset ${assetId}:`, err);
      }
    }

    toast({
      title: "Original Hidden",
      description: `"${assetName}" will no longer be used as a reference image.`,
      variant: "default",
    });
  }, [localAssets, currentProjectId, settings.stylePrompt, settings.aspectRatio, toast]);

  // Check if an asset has been replaced
  const isAssetReplaced = useCallback(
    (assetId: string) => localAssets.some((a) => a.id === assetId),
    [localAssets]
  );
  const isAssetRemoved = useCallback(
    (assetId: string) => !!localAssets.find((a) => a.id === assetId)?.isRemoved,
    [localAssets]
  );

  // Filter local assets by category
  // Exclude replacement assets (those with IDs matching PropDesigner/BgSheet assets)
  const localCharacterAssets = useMemo(
    () => {
      const propDesignerIds = new Set(characterAssets.map((c) => c.id));
      return localAssets.filter((a) => a.category === "character" && !a.isRemoved && !propDesignerIds.has(a.id));
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
  const visibleCharacterAssets = useMemo(
    () => characterAssets.filter((c) => !isAssetRemoved(c.id)),
    [characterAssets, isAssetRemoved]
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
                    Start Row
                  </label>
                  <input
                    type="number"
                    value={csvStartRow}
                    onChange={(e) => setCsvStartRow(e.target.value)}
                    placeholder="2"
                    className="w-full p-2 bg-slate-900/80 border border-slate-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                    BG ID Col
                  </label>
                  <input
                    type="text"
                    value={csvBgIdCol}
                    onChange={(e) => setCsvBgIdCol(e.target.value)}
                    placeholder="E"
                    className="w-full p-2 bg-slate-900/80 border border-slate-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-emerald-500 uppercase block mb-1">
                    Prompt A Col
                  </label>
                  <input
                    type="text"
                    value={csvPromptACol}
                    onChange={(e) => setCsvPromptACol(e.target.value)}
                    placeholder="I"
                    className="w-full p-2 bg-slate-900/80 border border-emerald-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-emerald-500 uppercase block mb-1">
                    Prompt B Col
                  </label>
                  <input
                    type="text"
                    value={csvPromptBCol}
                    onChange={(e) => setCsvPromptBCol(e.target.value)}
                    placeholder="J"
                    className="w-full p-2 bg-slate-900/80 border border-emerald-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[9px] font-bold text-emerald-500 uppercase block mb-1">
                    Prompt C Col
                  </label>
                  <input
                    type="text"
                    value={csvPromptCCol}
                    onChange={(e) => setCsvPromptCCol(e.target.value)}
                    placeholder="K"
                    className="w-full p-2 bg-slate-900/80 border border-emerald-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
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
                CSV should have headers in row 1. Each data row creates up to 3 frames (A/B/C) from the specified columns.
                BG ID column sets the background reference.
              </p>
            </div>
          )}
        </div>

        {/* Character & Prop Assets */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-yellow-500/30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[10px] font-black text-yellow-500 uppercase">
              Characters & Props ({visibleCharacterAssets.length + localCharacterAssets.length})
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
          {visibleCharacterAssets.length === 0 && localCharacterAssets.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic text-center py-2">
              No assets - upload or use Prop Designer
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto no-scrollbar">
              {/* Prop Designer characters & objects */}
              {visibleCharacterAssets.map((char) => {
                const replaced = isAssetReplaced(char.id);
                const removed = isAssetRemoved(char.id);
                const replacementAsset = localAssets.find((a) => a.id === char.id);
                // For display: use base64 if loaded, otherwise use imageUrl
                const replacementSrc = replacementAsset?.base64 
                  ? `data:${replacementAsset.mimeType};base64,${replacementAsset.base64}` 
                  : replacementAsset?.imageUrl || "";
                const hasImage = removed
                  ? false
                  : replaced
                  ? (!!replacementAsset?.base64 || !!replacementAsset?.imageUrl)
                  : !!char.imageUrl;
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
                          title={removed ? "Restore original image" : "Remove replacement"}
                        >
                          ×
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRemoveOriginalCharacterAsset(char.id, char.name)}
                            className="absolute top-1 left-1 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            title="Remove original image"
                          >
                            x
                          </button>
                          <label className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          title="Replace with your image"
                        >
                          ↑
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleReplaceAsset(e, char.id, char.name, "character")}
                            className="hidden"
                          />
                        </label>
                        </>
                      )}
                      {replaced && (
                        <div className={`absolute bottom-0 left-0 right-0 py-0.5 text-center ${removed ? "bg-red-600/80" : "bg-green-600/80"}`}>
                          <span className="text-[7px] font-black text-white uppercase">{removed ? "Removed" : "Replaced"}</span>
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
              {/* Locally uploaded characters */}
              {localCharacterAssets.map((asset) => {
                // Use base64 if available, otherwise fall back to imageUrl
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
                        ×
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
              {/* Stage 4 backgrounds */}
              {backgroundAssets.map((bg) =>
                bg.angles?.map((angle, angleIndex) => {
                  const angleId = angle.angle;
                  const replaced = isAssetReplaced(angleId);
                  const replacementAsset = localAssets.find((a) => a.id === angleId);
                  // For display: use base64 if loaded, otherwise use imageUrl
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
                            ×
                          </button>
                        ) : (
                          <label className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            title="Replace with your image"
                          >
                            ↑
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
              {/* Locally uploaded backgrounds */}
              {localBackgroundAssets.map((asset) => {
                // Use base64 if available, otherwise fall back to imageUrl
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
                        ×
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
                {/* Clip Badge */}
                <div className="absolute -top-3 left-6 flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black rounded-full border border-slate-700 shadow-xl tracking-widest uppercase">
                    Clip {groupId}
                  </span>
                  {groupFrames.some((f) => f.isFinalized) && (
                    <span className="px-2 py-1 bg-green-700 text-white text-[9px] font-black rounded-full border border-green-500 shadow-xl uppercase">
                      ✓ {groupFrames.find((f) => f.isFinalized)?.promptVariant} Selected
                    </span>
                  )}
                </div>

                {/* Frames Grid — 3 columns for A/B/C variants */}
                <div className="grid grid-cols-3 gap-4 mt-3">
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
                      onFinalize={handleFinalizeFrame}
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

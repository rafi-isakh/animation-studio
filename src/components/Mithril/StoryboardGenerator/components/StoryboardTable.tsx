"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Image as ImageIcon,
  ChevronDown,
  Sparkles,
  Loader2,
  X,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import {
  getAllBgImages,
  getAllCharacterImages,
  saveStoryboardSceneImage,
  getAllStoryboardSceneImages,
} from "../../services/mithrilIndexedDB";
import type { Scene, VoicePrompt, ClipImageState, StoryboardSceneImagesMetadata } from "../types";
import type { CharacterSheetResultMetadata } from "../../CharacterSheetGenerator/types";

const STORAGE_KEY = "storyboard_scene_images_metadata";

interface ReferenceImage {
  id: string;
  bgId: string;
  bgName: string;
  angle: string;
  base64: string;
  mimeType: string;
}

interface CharacterReferenceImage {
  id: string;
  characterId: string;
  characterName: string;
  base64: string;
  mimeType: string;
}

interface StoryboardTableProps {
  data: Scene[];
  voicePrompts: VoicePrompt[];
}

export default function StoryboardTable({
  data,
  voicePrompts,
}: StoryboardTableProps) {
  const { language, dictionary } = useLanguage();

  // Style prompt (moved here from parent)
  const [stylePrompt, setStylePrompt] = useState(
    "2D anime style, clean linework, soft cel shading, vibrant colors"
  );

  // Aspect ratio for generated images
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  // Available background references from BgSheetGenerator
  const [availableReferences, setAvailableReferences] = useState<ReferenceImage[]>([]);

  // Available character references from CharacterSheetGenerator
  const [availableCharacters, setAvailableCharacters] = useState<CharacterReferenceImage[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());

  // Full character metadata for smart matching
  const [characterMetadata, setCharacterMetadata] = useState<CharacterSheetResultMetadata | null>(null);

  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  // Clip image states: Map<"sceneIdx-clipIdx", ClipImageState>
  const [clipImageStates, setClipImageStates] = useState<Map<string, ClipImageState>>(new Map());

  // Dropdown state for background selection
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);

  // Generate all state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Saved scene images from IndexedDB (loaded on mount)
  const [savedSceneImages, setSavedSceneImages] = useState<Map<string, ClipImageState>>(new Map());

  // Lightbox modal state for viewing images in full size
  const [lightboxImage, setLightboxImage] = useState<{ base64: string; clipName: string } | null>(null);

  // Load background references, character images, and saved scene images on mount
  useEffect(() => {
    const loadReferences = async () => {
      try {
        // Load background images
        const allBgImages = await getAllBgImages();

        // Get background names from localStorage
        const bgSheetResult = localStorage.getItem("bg_sheet_result");
        let bgNameMap: Record<string, string> = {};

        if (bgSheetResult) {
          try {
            const parsed = JSON.parse(bgSheetResult);
            parsed.backgrounds?.forEach((bg: { id: string; name: string }) => {
              bgNameMap[bg.id] = bg.name;
            });
          } catch {
            // Ignore parse errors
          }
        }

        const references: ReferenceImage[] = allBgImages.map((img) => ({
          id: img.id,
          bgId: img.bgId,
          bgName: bgNameMap[img.bgId] || `Background ${img.bgId.slice(0, 6)}`,
          angle: img.angle,
          base64: img.base64,
          mimeType: img.mimeType,
        }));

        setAvailableReferences(references);

        // Load character images
        const allCharImages = await getAllCharacterImages();

        // Get character names from localStorage and store full metadata
        const charSheetResult = localStorage.getItem("character_sheet_result");
        let charNameMap: Record<string, string> = {};

        if (charSheetResult) {
          try {
            const parsed = JSON.parse(charSheetResult) as CharacterSheetResultMetadata;
            parsed.characters?.forEach((char) => {
              charNameMap[char.id] = char.name;
            });
            // Store full metadata for smart character matching
            setCharacterMetadata(parsed);
          } catch {
            // Ignore parse errors
          }
        }

        const characters: CharacterReferenceImage[] = allCharImages.map((img) => ({
          id: img.id,
          characterId: img.characterId,
          characterName: charNameMap[img.characterId] || `Character ${img.characterId.slice(0, 6)}`,
          base64: img.base64,
          mimeType: img.mimeType,
        }));

        setAvailableCharacters(characters);

        // Auto-select all characters by default
        if (characters.length > 0) {
          setSelectedCharacterIds(new Set(characters.map(c => c.id)));
        }

        // Load metadata from localStorage
        const savedMetadataJson = localStorage.getItem(STORAGE_KEY);
        let metadataMap = new Map<string, { selectedBgId: string | null; hasGeneratedImage: boolean }>();

        if (savedMetadataJson) {
          try {
            const metadata: StoryboardSceneImagesMetadata = JSON.parse(savedMetadataJson);
            metadata.clips.forEach((clip) => {
              metadataMap.set(clip.clipKey, {
                selectedBgId: clip.selectedBgId,
                hasGeneratedImage: clip.hasGeneratedImage,
              });
            });
          } catch {
            // Ignore parse errors
          }
        }

        // Load images from IndexedDB
        const savedSceneImages = await getAllStoryboardSceneImages();
        const imagesMap = new Map<string, string>();
        savedSceneImages.forEach((img) => {
          const key = `${img.sceneIndex}-${img.clipIndex}`;
          imagesMap.set(key, img.base64);
        });

        // Combine metadata and images
        const savedStatesMap = new Map<string, ClipImageState>();
        metadataMap.forEach((meta, key) => {
          savedStatesMap.set(key, {
            selectedBgId: meta.selectedBgId,
            generatedImageBase64: meta.hasGeneratedImage ? (imagesMap.get(key) || null) : null,
            isGenerating: false,
            error: null,
          });
        });

        if (savedStatesMap.size > 0) {
          setSavedSceneImages(savedStatesMap);
        }
      } catch (err) {
        console.error("Error loading reference images:", err);
      } finally {
        setIsLoadingRefs(false);
      }
    };

    loadReferences();
  }, []);

  // Initialize clip image states when data changes or saved images are loaded
  useEffect(() => {
    // Don't initialize until we've finished loading refs (which includes saved images)
    if (isLoadingRefs) return;

    setClipImageStates(prevStates => {
      const newStates = new Map<string, ClipImageState>();
      data.forEach((scene, sceneIdx) => {
        scene.clips.forEach((_, clipIdx) => {
          const key = `${sceneIdx}-${clipIdx}`;
          // Priority: existing state (if has image) > saved from IndexedDB > existing state > empty state
          const existingState = prevStates.get(key);
          const savedState = savedSceneImages.get(key);

          // If existing state has a generated image, keep it
          if (existingState?.generatedImageBase64) {
            newStates.set(key, existingState);
          }
          // Otherwise, use saved state if available
          else if (savedState) {
            newStates.set(key, savedState);
          }
          // Otherwise, keep existing state (for bg selection without image)
          else if (existingState) {
            newStates.set(key, existingState);
          }
          // Finally, use empty state
          else {
            newStates.set(key, {
              selectedBgId: null,
              generatedImageBase64: null,
              isGenerating: false,
              error: null,
            });
          }
        });
      });
      return newStates;
    });
  }, [data, savedSceneImages, isLoadingRefs]);

  // Get clip key
  const getClipKey = (sceneIdx: number, clipIdx: number) => `${sceneIdx}-${clipIdx}`;

  // Save metadata to localStorage whenever clipImageStates changes
  const saveMetadataToLocalStorage = useCallback((states: Map<string, ClipImageState>) => {
    const clips = Array.from(states.entries()).map(([key, state]) => {
      const [sceneIdx, clipIdx] = key.split("-").map(Number);
      return {
        clipKey: key,
        clipName: `${sceneIdx + 1}.${clipIdx + 1}`,
        selectedBgId: state.selectedBgId,
        hasGeneratedImage: !!state.generatedImageBase64,
      };
    });

    const metadata: StoryboardSceneImagesMetadata = {
      clips,
      updatedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
  }, []);

  // Handle background selection for a clip
  const handleBgSelect = useCallback((sceneIdx: number, clipIdx: number, refId: string | null) => {
    const key = getClipKey(sceneIdx, clipIdx);
    setClipImageStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(key) || {
        selectedBgId: null,
        generatedImageBase64: null,
        isGenerating: false,
        error: null,
      };
      newMap.set(key, { ...current, selectedBgId: refId, error: null });

      // Save to localStorage
      saveMetadataToLocalStorage(newMap);

      return newMap;
    });
    setOpenDropdownKey(null);
  }, [saveMetadataToLocalStorage]);

  // Generate image for a single clip
  const generateClipImage = useCallback(async (
    sceneIdx: number,
    clipIdx: number,
    clip: Scene["clips"][0]
  ) => {
    const key = getClipKey(sceneIdx, clipIdx);
    const state = clipImageStates.get(key);

    if (!state?.selectedBgId) {
      return;
    }

    // Find the selected reference
    const selectedRef = availableReferences.find(ref => ref.id === state.selectedBgId);
    if (!selectedRef) {
      return;
    }

    // Set generating state
    setClipImageStates(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(key)!;
      newMap.set(key, { ...current, isGenerating: true, error: null });
      return newMap;
    });

    try {
      // Build prompt combining style, aspect ratio, and clip's imagePrompt
      // Include aspect ratio in prompt text for more reliable enforcement
      const aspectRatioText = aspectRatio === "9:16"
        ? "vertical portrait orientation (9:16 aspect ratio)"
        : "horizontal landscape orientation (16:9 aspect ratio)";

      // Smart character matching: find characters mentioned in the imagePrompt
      const imagePromptLower = clip.imagePrompt.toLowerCase();
      const matchedCharacters = characterMetadata?.characters.filter(
        char => imagePromptLower.includes(char.name.toLowerCase())
      ) ?? [];

      // Build prompt parts
      const promptParts: string[] = [];
      if (stylePrompt?.trim()) promptParts.push(stylePrompt.trim());
      promptParts.push(`${aspectRatioText}. ${clip.imagePrompt}`);

      // Add character identification and details if matched
      if (matchedCharacters.length > 0) {
        const charNames = matchedCharacters.map(c => c.name).join(', ');
        promptParts.push(`The scene must feature the character(s) known as: ${charNames}.`);

        const characterDetails = matchedCharacters.map(char => {
          const details = [
            char.appearance && `Appearance: ${char.appearance}`,
            char.clothing && `Clothing: ${char.clothing}`,
          ].filter(Boolean).join('. ');
          return details ? `Details for character ${char.name}: "${details}"` : '';
        }).filter(Boolean).join('. ');

        if (characterDetails) promptParts.push(characterDetails);
      }

      const fullPrompt = promptParts.join('. ');

      // Only get character refs for matched characters (empty if no match)
      const matchedCharacterRefs = matchedCharacters
        .map(char => availableCharacters.find(ac => ac.characterId === char.id))
        .filter((ref): ref is CharacterReferenceImage => ref !== undefined);

      const response = await fetch("/api/nano_banana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: fullPrompt,
          aspectRatio,
          references: {
            backgrounds: [{
              base64: selectedRef.base64,
              mimeType: selectedRef.mimeType,
            }],
            characters: matchedCharacterRefs.map(char => ({
              base64: char.base64,
              mimeType: char.mimeType,
            })),
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate image");
      }

      // Update state with generated image
      setClipImageStates(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(key)!;
        newMap.set(key, {
          ...current,
          generatedImageBase64: result.imageBase64,
          isGenerating: false,
          error: null,
        });

        // Save metadata to localStorage
        saveMetadataToLocalStorage(newMap);

        return newMap;
      });

      // Auto-save to IndexedDB with clip name (e.g., "1.1", "2.3")
      const clipName = `${sceneIdx + 1}.${clipIdx + 1}`;
      await saveStoryboardSceneImage({
        id: `scene_${clipName}`,
        type: "storyboard_scene_image",
        base64: result.imageBase64,
        mimeType: "image/jpeg",
        sceneIndex: sceneIdx,
        clipIndex: clipIdx,
        clipName,
        imagePrompt: fullPrompt,
        selectedBgId: state.selectedBgId,
        createdAt: Date.now(),
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setClipImageStates(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(key)!;
        newMap.set(key, {
          ...current,
          isGenerating: false,
          error: errorMessage,
        });
        return newMap;
      });
    }
  }, [clipImageStates, availableReferences, availableCharacters, characterMetadata, stylePrompt, aspectRatio, saveMetadataToLocalStorage]);

  // Check if all clips have backgrounds selected
  const allBgSelected = useMemo(() => {
    if (data.length === 0) return false;

    let totalClips = 0;
    let selectedCount = 0;

    data.forEach((scene, sceneIdx) => {
      scene.clips.forEach((_, clipIdx) => {
        totalClips++;
        const key = getClipKey(sceneIdx, clipIdx);
        const state = clipImageStates.get(key);
        if (state?.selectedBgId) {
          selectedCount++;
        }
      });
    });

    return totalClips > 0 && selectedCount === totalClips;
  }, [data, clipImageStates]);

  // Generate all images
  const handleGenerateAll = useCallback(async () => {
    if (!allBgSelected || isGeneratingAll) return;

    setIsGeneratingAll(true);

    // Collect all clips to generate
    const clipsToGenerate: { sceneIdx: number; clipIdx: number; clip: Scene["clips"][0] }[] = [];

    data.forEach((scene, sceneIdx) => {
      scene.clips.forEach((clip, clipIdx) => {
        const key = getClipKey(sceneIdx, clipIdx);
        const state = clipImageStates.get(key);
        if (state?.selectedBgId) {
          clipsToGenerate.push({ sceneIdx, clipIdx, clip });
        }
      });
    });

    // Generate images sequentially to avoid overwhelming the API
    for (const { sceneIdx, clipIdx, clip } of clipsToGenerate) {
      await generateClipImage(sceneIdx, clipIdx, clip);
    }

    setIsGeneratingAll(false);
  }, [allBgSelected, isGeneratingAll, data, clipImageStates, generateClipImage]);

  // Count stats
  const { totalClips, selectedCount, generatedCount } = useMemo(() => {
    let total = 0;
    let selected = 0;
    let generated = 0;

    data.forEach((scene, sceneIdx) => {
      scene.clips.forEach((_, clipIdx) => {
        total++;
        const key = getClipKey(sceneIdx, clipIdx);
        const state = clipImageStates.get(key);
        if (state?.selectedBgId) selected++;
        if (state?.generatedImageBase64) generated++;
      });
    });

    return { totalClips: total, selectedCount: selected, generatedCount: generated };
  }, [data, clipImageStates]);

  // Toggle character selection
  const toggleCharacterSelection = useCallback((charId: string) => {
    setSelectedCharacterIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(charId)) {
        newSet.delete(charId);
      } else {
        newSet.add(charId);
      }
      return newSet;
    });
  }, []);

  const clipHeaders = [
    phrase(dictionary, "table_clip", language),
    phrase(dictionary, "table_length", language),
    phrase(dictionary, "table_accumulated_time", language),
    phrase(dictionary, "table_background_id", language),
    phrase(dictionary, "storyboard_bg_selection", language) || "Background",
    phrase(dictionary, "storyboard_generated_image", language) || "Generated Image",
    phrase(dictionary, "table_story", language),
    phrase(dictionary, "table_image_prompt", language),
    phrase(dictionary, "table_video_prompt", language),
    phrase(dictionary, "table_sora_video_prompt", language),
    phrase(dictionary, "table_dialogue_ko", language),
    phrase(dictionary, "table_dialogue_en", language),
    phrase(dictionary, "table_sfx_ko", language),
    phrase(dictionary, "table_sfx_en", language),
    phrase(dictionary, "table_bgm_ko", language),
    phrase(dictionary, "table_bgm_en", language),
  ];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-semibold">
            {phrase(dictionary, "table_empty_title", language)}
          </h3>
          <p className="mt-1 text-sm">
            {phrase(dictionary, "table_empty_desc", language)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scene Image Style Prompt */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {phrase(dictionary, "storyboard_scene_style", language) || "Scene Image Style Prompt"}
        </label>
        <textarea
          rows={2}
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          placeholder={phrase(dictionary, "storyboard_scene_style_placeholder", language) || "e.g., 2D anime style, clean linework..."}
          className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {phrase(dictionary, "storyboard_scene_style_hint", language) || "This style will be combined with each clip's image prompt when generating scene images"}
        </p>
      </div>

      {/* Reference Images from Character Sheet Generator */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {phrase(dictionary, "storyboard_char_reference", language) || "Reference Images from Character Sheet Generator"}
        </label>
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          {phrase(dictionary, "storyboard_char_reference_hint", language) || "Select character references to use for all scene image generations"}
        </p>

        {isLoadingRefs ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading characters...</span>
          </div>
        ) : availableCharacters.length === 0 ? (
          <p className="text-sm text-gray-400">
            {phrase(dictionary, "storyboard_no_char_available", language) || "No character images available. Generate character sheets first."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableCharacters.map((char) => {
              const isSelected = selectedCharacterIds.has(char.id);
              return (
                <button
                  key={char.id}
                  onClick={() => toggleCharacterSelection(char.id)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected
                      ? "border-[#DB2777] ring-2 ring-[#DB2777]/30"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="aspect-square relative">
                    <Image
                      src={`data:${char.mimeType};base64,${char.base64}`}
                      alt={char.characterName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-[#DB2777] rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-1.5 bg-white dark:bg-gray-700 text-center">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block">
                      {char.characterName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedCharacterIds.size > 0 && (
          <p className="mt-2 text-xs text-[#DB2777]">
            {selectedCharacterIds.size} {phrase(dictionary, "storyboard_chars_selected", language) || "character(s) selected"}
          </p>
        )}
      </div>

      {/* Aspect Ratio Selection */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {phrase(dictionary, "storyboard_aspect_ratio", language) || "Aspect Ratio"}
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setAspectRatio("16:9")}
            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
              aspectRatio === "16:9"
                ? "border-[#DB2777] bg-[#DB2777]/10 text-[#DB2777]"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-[18px] border-2 border-current rounded-sm" />
              <span className="text-sm font-medium">16:9</span>
            </div>
            <span className="text-xs mt-1 block">{phrase(dictionary, "storyboard_landscape", language) || "Landscape"}</span>
          </button>
          <button
            onClick={() => setAspectRatio("9:16")}
            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
              aspectRatio === "9:16"
                ? "border-[#DB2777] bg-[#DB2777]/10 text-[#DB2777]"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-[18px] h-8 border-2 border-current rounded-sm" />
              <span className="text-sm font-medium">9:16</span>
            </div>
            <span className="text-xs mt-1 block">{phrase(dictionary, "storyboard_portrait", language) || "Portrait"}</span>
          </button>
        </div>
      </div>

      {/* Generate All Button & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={handleGenerateAll}
            disabled={!allBgSelected || isGeneratingAll}
            className="flex items-center gap-2 px-6 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {phrase(dictionary, "storyboard_generating_all", language) || "Generating..."}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {phrase(dictionary, "storyboard_generate_all", language) || "Generate All Images"}
              </>
            )}
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{selectedCount}/{totalClips}</span>{" "}
            {phrase(dictionary, "storyboard_bg_selected", language) || "backgrounds selected"}
            {generatedCount > 0 && (
              <span className="ml-3">
                <span className="font-medium text-green-600">{generatedCount}</span>{" "}
                {phrase(dictionary, "storyboard_images_generated", language) || "generated"}
              </span>
            )}
          </div>
        </div>

        {!allBgSelected && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {phrase(dictionary, "storyboard_select_all_bg", language) || "Please select a background for all clips to enable Generate All"}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[60vh] rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        {voicePrompts.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">
              {phrase(dictionary, "table_voice_prompts", language)}
            </h3>
            <dl className="space-y-2">
              {voicePrompts.map((vp, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-400 border-l-2 border-[#DB2777] pl-3"
                >
                  <dt className="font-semibold text-gray-700 dark:text-gray-300">
                    {phrase(dictionary, "table_prompt", language)} {index + 1}
                  </dt>
                  <dd className="mt-1">
                    <span className="font-medium text-gray-500 dark:text-gray-400">
                      {phrase(dictionary, "table_korean", language)}
                    </span>{" "}
                    {vp.promptKo}
                  </dd>
                  <dd>
                    <span className="font-medium text-gray-500 dark:text-gray-400">
                      [EN]:
                    </span>{" "}
                    {vp.promptEn}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {clipHeaders.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {data.map((scene, sceneIndex) => (
              <React.Fragment key={`scene-${sceneIndex}`}>
                {/* Scene Header Row */}
                <tr className="bg-gray-200 dark:bg-gray-700 sticky top-[53px] z-10">
                  <td
                    colSpan={clipHeaders.length}
                    className="px-4 py-3 text-lg font-bold text-gray-900 dark:text-gray-100"
                  >
                    {phrase(dictionary, "table_scene", language)} {sceneIndex + 1}: {scene.sceneTitle}
                  </td>
                </tr>
                {scene.clips.map((row, clipIndex) => {
                  const isNewBackground =
                    clipIndex === 0 ||
                    row.backgroundPrompt !==
                      scene.clips[clipIndex - 1].backgroundPrompt;

                  const clipKey = getClipKey(sceneIndex, clipIndex);
                  const clipState = clipImageStates.get(clipKey);
                  const selectedRef = clipState?.selectedBgId
                    ? availableReferences.find(r => r.id === clipState.selectedBgId)
                    : null;

                  return (
                    <React.Fragment key={`scene-${sceneIndex}-clip-${clipIndex}`}>
                      {isNewBackground && (
                        <tr className="bg-gray-100 dark:bg-gray-800/70">
                          <td
                            colSpan={clipHeaders.length}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 italic pl-8"
                          >
                            {phrase(dictionary, "table_background", language)} {row.backgroundPrompt}
                          </td>
                        </tr>
                      )}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-center">{`${sceneIndex + 1}.${clipIndex + 1}`}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300 w-20 text-center">
                          {row.length}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300 w-24 text-center">
                          {row.accumulatedTime}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-[#DB2777] w-24 text-center font-mono">
                          {row.backgroundId}
                        </td>

                        {/* Background Selection Column */}
                        <td className="px-4 py-4 w-[140px] max-w-[140px]">
                          {isLoadingRefs ? (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-xs">Loading...</span>
                            </div>
                          ) : availableReferences.length === 0 ? (
                            <span className="text-xs text-gray-400">
                              {phrase(dictionary, "storyboard_no_bg_available", language) || "No backgrounds"}
                            </span>
                          ) : (
                            <div className="relative">
                              <button
                                onClick={() => setOpenDropdownKey(openDropdownKey === clipKey ? null : clipKey)}
                                className="flex flex-col items-start gap-1 w-full px-2 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#DB2777] transition-colors"
                              >
                                {selectedRef ? (
                                  <>
                                    <div className="w-full h-12 relative rounded overflow-hidden">
                                      <Image
                                        src={`data:${selectedRef.mimeType};base64,${selectedRef.base64}`}
                                        alt=""
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                    <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 text-left w-full">
                                      {selectedRef.bgName}
                                    </span>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-gray-400 text-xs">
                                      {phrase(dictionary, "storyboard_select_bg", language) || "Select BG..."}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  </div>
                                )}
                              </button>

                              {/* Dropdown */}
                              {openDropdownKey === clipKey && (
                                <div className="absolute z-50 mt-1 w-64 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                  {/* Clear option */}
                                  <button
                                    onClick={() => handleBgSelect(sceneIndex, clipIndex, null)}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                                  >
                                    <X className="w-4 h-4" />
                                    {phrase(dictionary, "storyboard_clear_selection", language) || "Clear selection"}
                                  </button>

                                  {/* Background options */}
                                  {availableReferences.map((ref) => (
                                    <button
                                      key={ref.id}
                                      onClick={() => handleBgSelect(sceneIndex, clipIndex, ref.id)}
                                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                        clipState?.selectedBgId === ref.id ? "bg-pink-50 dark:bg-pink-900/20" : ""
                                      }`}
                                    >
                                      <div className="w-10 h-7 relative rounded overflow-hidden flex-shrink-0">
                                        <Image
                                          src={`data:${ref.mimeType};base64,${ref.base64}`}
                                          alt=""
                                          fill
                                          className="object-cover"
                                          unoptimized
                                        />
                                      </div>
                                      <div className="flex-1 text-left min-w-0">
                                        <div className="font-medium text-gray-700 dark:text-gray-300 truncate">
                                          {ref.bgName}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">
                                          {ref.angle}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Generated Image Column */}
                        <td className="px-4 py-4 min-w-[200px]">
                          <div className="flex flex-col items-center gap-2">
                            {clipState?.isGenerating ? (
                              <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${aspectRatio === "9:16" ? "w-20 h-32" : "w-32 h-20"}`}>
                                <Loader2 className="w-6 h-6 animate-spin text-[#DB2777]" />
                              </div>
                            ) : clipState?.generatedImageBase64 ? (
                              <div className="relative group">
                                <button
                                  onClick={() => setLightboxImage({
                                    base64: clipState.generatedImageBase64!,
                                    clipName: `${sceneIndex + 1}.${clipIndex + 1}`
                                  })}
                                  className={`relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#DB2777] transition-all ${aspectRatio === "9:16" ? "w-20 h-32" : "w-32 h-20"}`}
                                >
                                  <Image
                                    src={`data:image/jpeg;base64,${clipState.generatedImageBase64}`}
                                    alt="Generated"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </button>
                                {/* Regenerate button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    generateClipImage(sceneIndex, clipIndex, row);
                                  }}
                                  disabled={!clipState?.selectedBgId || isGeneratingAll}
                                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                  title={phrase(dictionary, "storyboard_regenerate", language) || "Regenerate"}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              </div>
                            ) : clipState?.selectedBgId ? (
                              <button
                                onClick={() => generateClipImage(sceneIndex, clipIndex, row)}
                                disabled={isGeneratingAll}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#DB2777] hover:bg-[#BE185D] text-white rounded-lg transition-colors disabled:opacity-50"
                              >
                                <Sparkles className="w-3 h-3" />
                                {phrase(dictionary, "storyboard_generate_single", language) || "Generate"}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">
                                {phrase(dictionary, "storyboard_select_bg_first", language) || "Select BG first"}
                              </span>
                            )}

                            {clipState?.error && (
                              <span className="text-xs text-red-500 max-w-[180px] truncate" title={clipState.error}>
                                {clipState.error}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                          {row.story}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                          {row.imagePrompt}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                          {row.videoPrompt}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-blue-600 dark:text-blue-300 min-w-[200px]">
                          {row.soraVideoPrompt}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
                          {row.dialogue}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
                          {row.dialogueEn}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                          {row.sfx}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                          {row.sfxEn}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                          {row.bgm}
                        </td>
                        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                          {row.bgmEn}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lightbox Modal for full-size image view */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with clip name and close button */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {phrase(dictionary, "table_clip", language)} {lightboxImage.clipName}
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Image container */}
            <div className="p-4">
              <div
                className={`relative ${aspectRatio === "9:16" ? "w-[50vh] max-w-[80vw]" : "w-[80vw] max-w-[1200px]"}`}
                style={{ aspectRatio: aspectRatio.replace(":", "/") }}
              >
                <Image
                  src={`data:image/jpeg;base64,${lightboxImage.base64}`}
                  alt={`Clip ${lightboxImage.clipName}`}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

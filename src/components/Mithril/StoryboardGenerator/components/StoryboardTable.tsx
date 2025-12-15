"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Image as ImageIcon,
  ChevronDown,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { saveStoryboardSceneImage } from "../../services/mithrilIndexedDB";
import { useMithril } from "../../MithrilContext";
import type { Scene, VoicePrompt, ClipImageState, StoryboardSceneImagesMetadata, CharacterReferenceImage } from "../types";
import { useReferenceImages } from "../hooks/useReferenceImages";
import LightboxModal from "./LightboxModal";
import ClipTableRow from "./ClipTableRow";

const STORAGE_KEY = "storyboard_scene_images_metadata";

// Memoized background dropdown item to prevent re-renders
// Uses native img with lazy loading for better performance
const BackgroundDropdownItem = React.memo(function BackgroundDropdownItem({
  refId,
  bgName,
  angle,
  objectUrl,
  isSelected,
  onSelect,
}: {
  refId: string;
  bgName: string;
  angle: string;
  objectUrl: string;
  isSelected: boolean;
  onSelect: (refId: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(refId)}
      className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isSelected ? "bg-pink-50 dark:bg-pink-900/20" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={objectUrl}
        alt=""
        loading="lazy"
        className="w-10 h-7 object-cover rounded flex-shrink-0"
      />
      <div className="flex-1 text-left min-w-0">
        <div className="font-medium text-gray-700 dark:text-gray-300 truncate">
          {bgName}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {angle}
        </div>
      </div>
    </button>
  );
});

// Memoized background selector with its own dropdown state
export const BackgroundSelector = React.memo(function BackgroundSelector({
  selectedRef,
  selectedObjectUrl,
  references,
  referenceObjectUrls,
  selectedBgId,
  onSelect,
  selectBgLabel,
  clearSelectionLabel,
}: {
  selectedRef: { id: string; bgName: string } | null;
  selectedObjectUrl: string;
  references: { id: string; bgName: string; angle: string }[];
  referenceObjectUrls: Map<string, string>;
  selectedBgId: string | null;
  onSelect: (refId: string | null) => void;
  selectBgLabel: string;
  clearSelectionLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback((refId: string | null) => {
    onSelect(refId);
    setIsOpen(false);
  }, [onSelect]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col items-start gap-1 w-full px-2 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#DB2777] transition-colors"
      >
        {selectedRef ? (
          <>
            <div className="w-full h-12 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedObjectUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 text-left w-full">
              {selectedRef.bgName}
            </span>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <span className="text-gray-400 text-xs">
              {selectBgLabel}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <button
            onClick={() => handleSelect(null)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
          >
            <X className="w-4 h-4" />
            {clearSelectionLabel}
          </button>

          {references.map((ref) => (
            <BackgroundDropdownItem
              key={ref.id}
              refId={ref.id}
              bgName={ref.bgName}
              angle={ref.angle}
              objectUrl={referenceObjectUrls.get(ref.id) || ""}
              isSelected={selectedBgId === ref.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// Memoized character selection item
// Uses native img with lazy loading for better performance
const CharacterSelectionItem = React.memo(function CharacterSelectionItem({
  charId,
  characterName,
  objectUrl,
  isSelected,
  onToggle,
}: {
  charId: string;
  characterName: string;
  objectUrl: string;
  isSelected: boolean;
  onToggle: (charId: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(charId)}
      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
        isSelected
          ? "border-[#DB2777] ring-2 ring-[#DB2777]/30"
          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
      }`}
    >
      <div className="aspect-square relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={objectUrl}
          alt={characterName}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
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
          {characterName}
        </span>
      </div>
    </button>
  );
});

interface StoryboardTableProps {
  data: Scene[];
  voicePrompts: VoicePrompt[];
}

export default function StoryboardTable({
  data,
  voicePrompts,
}: StoryboardTableProps) {
  const { language, dictionary } = useLanguage();
  const { customApiKey, updateClipPrompt, getOriginalClipPrompt } = useMithril();

  // Load references from hook
  const {
    availableReferences,
    availableCharacters,
    characterMetadata,
    savedSceneImages,
    isLoadingRefs,
  } = useReferenceImages();

  // Style prompt (moved here from parent)
  const [stylePrompt, setStylePrompt] = useState(
    "2D anime style, clean linework, soft cel shading, vibrant colors"
  );

  // Aspect ratio for generated images
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  // Selected character IDs for generation
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());

  // Clip image states: Map<"sceneIdx-clipIdx", ClipImageState>
  const [clipImageStates, setClipImageStates] = useState<Map<string, ClipImageState>>(new Map());

  // Generate all state
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  // Lightbox modal state for viewing images in full size
  const [lightboxImage, setLightboxImage] = useState<{ base64: string; clipName: string } | null>(null);

  // Auto-select all characters by default when they load
  useEffect(() => {
    if (availableCharacters.length > 0 && selectedCharacterIds.size === 0) {
      setSelectedCharacterIds(new Set(availableCharacters.map(c => c.id)));
    }
  }, [availableCharacters, selectedCharacterIds.size]);

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
  // Links all clips with the same non-empty backgroundId - selecting BG for one updates all
  // Clips with empty backgroundId are treated independently
  const handleBgSelect = useCallback((sceneIdx: number, clipIdx: number, refId: string | null) => {
    // Get the backgroundId of the selected clip
    const selectedClip = data[sceneIdx]?.clips[clipIdx];
    const backgroundId = selectedClip?.backgroundId?.trim();

    setClipImageStates(prev => {
      const newMap = new Map(prev);

      // If backgroundId is empty, only update this specific clip
      if (!backgroundId) {
        const key = getClipKey(sceneIdx, clipIdx);
        const current = newMap.get(key) || {
          selectedBgId: null,
          generatedImageBase64: null,
          isGenerating: false,
          error: null,
        };
        newMap.set(key, { ...current, selectedBgId: refId, error: null });
      } else {
        // Find all clips with the same non-empty backgroundId and update them
        data.forEach((scene, sIdx) => {
          scene.clips.forEach((clip, cIdx) => {
            if (clip.backgroundId?.trim() === backgroundId) {
              const key = getClipKey(sIdx, cIdx);
              const current = newMap.get(key) || {
                selectedBgId: null,
                generatedImageBase64: null,
                isGenerating: false,
                error: null,
              };
              newMap.set(key, { ...current, selectedBgId: refId, error: null });
            }
          });
        });
      }

      // Save to localStorage
      saveMetadataToLocalStorage(newMap);

      return newMap;
    });
  }, [data, saveMetadataToLocalStorage]);

  // Generate image for a single clip
  const generateClipImage = useCallback(async (
    sceneIdx: number,
    clipIdx: number,
    clip: Scene["clips"][0]
  ) => {
    const key = getClipKey(sceneIdx, clipIdx);
    const state = clipImageStates.get(key);

    // Check if clip has a backgroundId - only require BG selection if it does
    const hasBackgroundId = !!clip.backgroundId?.trim();

    if (hasBackgroundId && !state?.selectedBgId) {
      return;
    }

    // Find the selected reference (may be null if no backgroundId)
    const selectedRef = state?.selectedBgId
      ? availableReferences.find(ref => ref.id === state.selectedBgId)
      : null;

    // Only fail if we needed a ref but couldn't find it
    if (hasBackgroundId && !selectedRef) {
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
            backgrounds: selectedRef ? [{
              base64: selectedRef.base64,
              mimeType: selectedRef.mimeType,
            }] : [],
            characters: matchedCharacterRefs.map(char => ({
              base64: char.base64,
              mimeType: char.mimeType,
            })),
          },
          customApiKey: customApiKey || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorJson = JSON.parse(text);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          // Response is not JSON, use the text directly if available
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

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
        selectedBgId: state?.selectedBgId || "",
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

  // Check if all clips have backgrounds selected (or don't need one)
  const allBgSelected = useMemo(() => {
    if (data.length === 0) return false;

    let totalClips = 0;
    let readyCount = 0;

    data.forEach((scene, sceneIdx) => {
      scene.clips.forEach((clip, clipIdx) => {
        totalClips++;
        const key = getClipKey(sceneIdx, clipIdx);
        const state = clipImageStates.get(key);
        const hasBackgroundId = !!clip.backgroundId?.trim();
        // Clip is ready if: no backgroundId needed OR has one selected
        if (!hasBackgroundId || state?.selectedBgId) {
          readyCount++;
        }
      });
    });

    return totalClips > 0 && readyCount === totalClips;
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

  // Convert base64 to Object URL (much faster than data URIs for rendering)
  const base64ToObjectUrl = useCallback((base64: string, mimeType: string): string => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return URL.createObjectURL(blob);
  }, []);

  // Pre-compute Object URLs for background references (one-time decode cost)
  const referenceObjectUrls = useMemo(() => {
    return new Map(availableReferences.map(ref => [
      ref.id,
      base64ToObjectUrl(ref.base64, ref.mimeType)
    ]));
  }, [availableReferences, base64ToObjectUrl]);

  // Pre-compute Object URLs for character references
  const characterObjectUrls = useMemo(() => {
    return new Map(availableCharacters.map(char => [
      char.id,
      base64ToObjectUrl(char.base64, char.mimeType)
    ]));
  }, [availableCharacters, base64ToObjectUrl]);

  // Cleanup Object URLs on unmount or when references change
  useEffect(() => {
    return () => {
      referenceObjectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [referenceObjectUrls]);

  useEffect(() => {
    return () => {
      characterObjectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [characterObjectUrls]);

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

  // Show loading screen while references are being loaded
  const isLoading = isLoadingRefs;

  return (
    <div className="space-y-4">
      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#DB2777]"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {phrase(dictionary, "storyboard_loading_refs", language) || "Loading references..."}
          </p>
        </div>
      )}

      {/* Main Content - only show when loading is complete */}
      {!isLoading && (
        <>
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

        {availableCharacters.length === 0 ? (
          <p className="text-sm text-gray-400">
            {phrase(dictionary, "storyboard_no_char_available", language) || "No character images available. Generate character sheets first."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableCharacters.map((char) => (
              <CharacterSelectionItem
                key={char.id}
                charId={char.id}
                characterName={char.characterName}
                objectUrl={characterObjectUrls.get(char.id) || ""}
                isSelected={selectedCharacterIds.has(char.id)}
                onToggle={toggleCharacterSelection}
              />
            ))}
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
                    ? availableReferences.find(r => r.id === clipState.selectedBgId) ?? null
                    : null;

                  return (
                    <ClipTableRow
                      key={`scene-${sceneIndex}-clip-${clipIndex}`}
                      row={row}
                      sceneIndex={sceneIndex}
                      clipIndex={clipIndex}
                      clipKey={clipKey}
                      clipState={clipState}
                      selectedRef={selectedRef}
                      isNewBackground={isNewBackground}
                      isLoadingRefs={isLoadingRefs}
                      isGeneratingAll={isGeneratingAll}
                      aspectRatio={aspectRatio}
                      availableReferences={availableReferences}
                      referenceObjectUrls={referenceObjectUrls}
                      clipHeadersLength={clipHeaders.length}
                      onBgSelect={(refId) => handleBgSelect(sceneIndex, clipIndex, refId)}
                      onGenerateClip={() => generateClipImage(sceneIndex, clipIndex, row)}
                      onOpenLightbox={(base64, clipName) => setLightboxImage({ base64, clipName })}
                      onUpdatePrompt={(field, value) => updateClipPrompt(sceneIndex, clipIndex, field, value)}
                      getOriginalPrompt={(field) => getOriginalClipPrompt(sceneIndex, clipIndex, field)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lightbox Modal for full-size image view */}
      {lightboxImage && (
        <LightboxModal
          image={lightboxImage}
          aspectRatio={aspectRatio}
          onClose={() => setLightboxImage(null)}
        />
      )}
        </>
      )}
    </div>
  );
}

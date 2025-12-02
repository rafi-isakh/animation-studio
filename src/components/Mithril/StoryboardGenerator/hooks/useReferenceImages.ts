"use client";

import { useState, useEffect } from "react";
import {
  getAllBgImages,
  getAllCharacterImages,
  getAllStoryboardSceneImages,
} from "../../services/mithrilIndexedDB";
import type { ReferenceImage, CharacterReferenceImage, ClipImageState, StoryboardSceneImagesMetadata } from "../types";
import type { CharacterSheetResultMetadata } from "../../CharacterSheetGenerator/types";

const STORAGE_KEY = "storyboard_scene_images_metadata";

interface UseReferenceImagesResult {
  availableReferences: ReferenceImage[];
  availableCharacters: CharacterReferenceImage[];
  characterMetadata: CharacterSheetResultMetadata | null;
  savedSceneImages: Map<string, ClipImageState>;
  isLoadingRefs: boolean;
}

export function useReferenceImages(): UseReferenceImagesResult {
  const [availableReferences, setAvailableReferences] = useState<ReferenceImage[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<CharacterReferenceImage[]>([]);
  const [characterMetadata, setCharacterMetadata] = useState<CharacterSheetResultMetadata | null>(null);
  const [savedSceneImages, setSavedSceneImages] = useState<Map<string, ClipImageState>>(new Map());
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

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
        const savedSceneImagesFromDB = await getAllStoryboardSceneImages();
        const imagesMap = new Map<string, string>();
        savedSceneImagesFromDB.forEach((img) => {
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

  return {
    availableReferences,
    availableCharacters,
    characterMetadata,
    savedSceneImages,
    isLoadingRefs,
  };
}

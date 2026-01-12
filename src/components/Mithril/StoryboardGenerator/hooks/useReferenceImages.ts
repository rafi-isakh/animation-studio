"use client";

import { useState, useEffect } from "react";
import { useMithril } from "../../MithrilContext";
import type { ReferenceImage, CharacterReferenceImage, ClipImageState } from "../types";
import type { CharacterSheetResultMetadata } from "../../CharacterSheetGenerator/types";
import type { BgSheetResultMetadata } from "../../BgSheetGenerator/types";

interface UseReferenceImagesResult {
  availableReferences: ReferenceImage[];
  availableCharacters: CharacterReferenceImage[];
  characterMetadata: CharacterSheetResultMetadata | null;
  savedSceneImages: Map<string, ClipImageState>;
  isLoadingRefs: boolean;
}

export function useReferenceImages(): UseReferenceImagesResult {
  const { getStageResult } = useMithril();
  const [availableReferences, setAvailableReferences] = useState<ReferenceImage[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<CharacterReferenceImage[]>([]);
  const [characterMetadata, setCharacterMetadata] = useState<CharacterSheetResultMetadata | null>(null);
  const [savedSceneImages, setSavedSceneImages] = useState<Map<string, ClipImageState>>(new Map());
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        // Load background images from context (S3 URLs)
        const bgSheetResult = getStageResult(4) as BgSheetResultMetadata | null;

        if (bgSheetResult?.backgrounds) {
          const references: ReferenceImage[] = [];

          bgSheetResult.backgrounds.forEach((bg) => {
            bg.images?.forEach((img) => {
              // imageId contains S3 URL
              if (img.imageId) {
                const refId = `${bg.id}_${img.angle.replace(/ /g, "_").replace(/[()]/g, "")}`;
                references.push({
                  id: refId,
                  bgId: bg.id,
                  bgName: bg.name,
                  angle: img.angle,
                  // For S3 URLs, we store the URL instead of base64
                  // The URL will be used directly for display
                  // For API calls, we'll fetch and convert on-demand
                  base64: img.imageId,  // S3 URL (used for display)
                  mimeType: "image/webp",  // Default for S3 images
                  isS3Url: true,  // Flag to indicate this is an S3 URL, not base64
                });
              }
            });
          });

          setAvailableReferences(references);
        }

        // Load character images from context (S3 URLs)
        const charSheetResult = getStageResult(3) as CharacterSheetResultMetadata | null;

        if (charSheetResult?.characters) {
          setCharacterMetadata(charSheetResult);

          const characters: CharacterReferenceImage[] = charSheetResult.characters
            .filter((char) => char.imageId)  // Only characters with images
            .map((char) => ({
              id: `char_${char.id}`,
              characterId: char.id,
              characterName: char.name,
              // imageId contains S3 URL
              base64: char.imageId || "",  // S3 URL (used for display)
              mimeType: "image/webp",  // Default for S3 images
              isS3Url: true,  // Flag to indicate this is an S3 URL, not base64
            }));

          setAvailableCharacters(characters);
        }

        // Load saved scene images from context (storyboard stage)
        // Note: Scene images are saved to clips with imageRef field
        // This will be populated when storyboard data is loaded
        // For now, we'll start with empty state - the StoryboardTable will handle loading from Firestore
        setSavedSceneImages(new Map());

      } catch (err) {
        console.error("Error loading reference images:", err);
      } finally {
        setIsLoadingRefs(false);
      }
    };

    loadReferences();
  }, [getStageResult]);

  return {
    availableReferences,
    availableCharacters,
    characterMetadata,
    savedSceneImages,
    isLoadingRefs,
  };
}

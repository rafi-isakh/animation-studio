"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProject } from "@/contexts/ProjectContext";
import { phrase } from "@/utils/phrases";
import {
  getChapter,
  updateCharacterImage,
  saveCharacterSheetSettings,
  saveCharacter,
  updateCharacter,
  updateCharacterProfileImage,
  updateCharacterMasterSheetImage,
  saveMode,
  updateModeImage,
  deleteMode as deleteFirestoreMode,
  saveStyleSlots as saveFirestoreStyleSlots,
} from "../services/firestore";
import {
  uploadCharacterImage,
  uploadCharacterProfileImage,
  uploadCharacterMasterSheetImage,
  uploadCharacterModeImage,
  uploadStyleSlotImage,
} from "../services/s3";
import type { Dictionary, Language } from "@/components/Types";
import type { Character, CharacterSheetResultMetadata, Mode, StyleSlot } from "./types";
import { migrateCharacter } from "./types";
import {
  Sparkles,
  FileDown,
  FileUp,
  Trash2,
  Save,
  LayoutGrid,
  User,
  UserPlus,
} from "lucide-react";
import { StyleSlots, createEmptyStyleSlots } from "./StyleSlots";
import { CharacterGrid } from "./CharacterGrid";
import { CharacterDetail } from "./CharacterDetail";

interface LoaderProps {
  dictionary: Dictionary;
  language: Language;
}

const Loader: React.FC<LoaderProps> = ({ dictionary, language }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {phrase(dictionary, "charsheet_ai_analyzing", language)}
    </p>
  </div>
);

// JSON Export/Import types
interface CharacterSheetExport {
  version: string;
  exportedAt: string;
  genre: string;
  styleKeyword: string;
  characterBasePrompt: string;
  styleSlots: StyleSlot[];
  activeStyleIndex: number | null;
  characters: Character[];
}

// JSON Export function
const exportToJSON = (
  characters: Character[],
  genre: string,
  styleKeyword: string,
  characterBasePrompt: string,
  styleSlots: StyleSlot[],
  activeStyleIndex: number | null
): void => {
  const exportData: CharacterSheetExport = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    genre,
    styleKeyword,
    characterBasePrompt,
    styleSlots,
    activeStyleIndex,
    characters,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `character-sheet-${new Date().getTime()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// JSON Import function
const importFromJSON = (
  file: File,
  onSuccess: (data: CharacterSheetExport) => void,
  onError: (error: string) => void
): void => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string) as CharacterSheetExport;

      // Validate basic structure
      if (!parsed.characters || !Array.isArray(parsed.characters)) {
        throw new Error("Invalid JSON: missing characters array");
      }

      // Ensure backwards compatibility with defaults
      const safeData: CharacterSheetExport = {
        version: parsed.version || "1.0",
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        genre: parsed.genre || "fantasy",
        styleKeyword: parsed.styleKeyword || "2020 Japanese Anime Style, Pastel Color",
        characterBasePrompt: parsed.characterBasePrompt || "An anime-style full-body illustration",
        styleSlots: parsed.styleSlots || createEmptyStyleSlots(),
        activeStyleIndex: parsed.activeStyleIndex ?? null,
        characters: parsed.characters.map(migrateCharacter),
      };

      onSuccess(safeData);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Invalid JSON file");
    }
  };
  reader.onerror = () => onError("Failed to read file");
  reader.readAsText(file);
};

// Genre options for the selector
const GENRE_OPTIONS = [
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "romance", label: "Romance" },
  { value: "action", label: "Action" },
  { value: "slice-of-life", label: "Slice of Life" },
  { value: "horror", label: "Horror" },
  { value: "mystery", label: "Mystery" },
  { value: "isekai", label: "Isekai" },
];

/**
 * Helper to get base64 from an image source (URL or base64)
 * If it's already base64, returns it. If it's a URL, uses server proxy to fetch.
 */
const getBase64FromImageSrc = async (src: string | undefined): Promise<string | undefined> => {
  if (!src) return undefined;

  // If it's already base64 (not a URL), return as-is
  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    // Remove data:image prefix if present
    if (src.startsWith("data:")) {
      return src.split(",")[1];
    }
    return src;
  }

  // It's a URL - use server-side proxy to avoid CORS issues
  try {
    // Remove cache-busting query params for the proxy request
    const cleanUrl = src.split("?")[0];
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(cleanUrl)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to fetch image via proxy");
    }

    const data = await response.json();
    return data.base64;
  } catch (error) {
    console.error("Failed to fetch image for base64 conversion:", error);
    return undefined;
  }
};

export default function CharacterSheetGenerator() {
  const { setStageResult, characterSheetGenerator, startCharacterSheetAnalysis, clearCharacterSheetAnalysis, setCharacterSheetResult, customApiKey } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();
  const { currentProjectId } = useProject();
  const { isAnalyzing, error: analysisError, result: contextResult } = characterSheetGenerator;

  // State from Stage 1
  const [originalText, setOriginalText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  // Main state
  const [characters, setCharacters] = useState<Character[]>([]);
  const [error, setError] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // View mode state
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  // Use ref to track hydration to avoid triggering re-renders
  const hasHydratedRef = useRef<boolean>(false);

  // Global settings
  const [genre, setGenre] = useState<string>("fantasy");
  const [styleKeyword, setStyleKeyword] = useState<string>(
    "2020 Japanese Anime Style, Pastel Color"
  );
  const [characterBasePrompt, setCharacterBasePrompt] = useState<string>(
    "An anime-style full-body illustration, Masterpiece, Best quality, Ultra-detailed, High resolution, 8k, Sharp focus, Clean lines"
  );

  // Style slots state
  const [styleSlots, setStyleSlots] = useState<StyleSlot[]>(createEmptyStyleSlots());
  const [activeStyleIndex, setActiveStyleIndex] = useState<number | null>(null);

  // Mode detection state
  const [isDetectingModes, setIsDetectingModes] = useState<Record<string, boolean>>({});

  // AbortController for canceling in-flight requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  // File input ref for JSON import
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);

  // Get the selected character
  const selectedCharacter = selectedCharacterId
    ? characters.find((c) => c.id === selectedCharacterId)
    : null;

  // Get protagonist character (for cross-reference)
  const protagonistCharacter = characters.find((c) => c.isProtagonist);

  // Get active style reference image
  const activeStyleImage = activeStyleIndex !== null
    ? styleSlots[activeStyleIndex]?.imageBase64 || styleSlots[activeStyleIndex]?.imageUrl
    : null;

  // Cleanup: abort any pending requests when component unmounts
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- We intentionally want the latest ref value at cleanup time
      abortControllerRef.current?.abort();
    };
  }, []);

  // Load chapter from Firestore (from Stage 1)
  useEffect(() => {
    const loadChapter = async () => {
      if (!currentProjectId) return;

      try {
        const chapter = await getChapter(currentProjectId);
        if (chapter) {
          setOriginalText(chapter.content);
          setFileName(chapter.filename);
        }
      } catch (err) {
        console.error("Error loading chapter from Firestore:", err);
      }
    };

    loadChapter();
  }, [currentProjectId]);

  // Hydrate from context result on mount only (run once)
  useEffect(() => {
    // Skip if already hydrated
    if (hasHydratedRef.current) {
      setIsLoadingData(false);
      return;
    }

    if (!contextResult) {
      setIsLoadingData(false);
      return;
    }

    // Reconstruct characters with S3 image URLs from context
    // Use migration helper to ensure all new fields are present
    const charactersWithImages: Character[] = contextResult.characters.map((charMeta) =>
      migrateCharacter({
        id: charMeta.id,
        name: charMeta.name,
        role: (charMeta as unknown as Record<string, unknown>).role as string || "unknown",
        isProtagonist: (charMeta as unknown as Record<string, unknown>).isProtagonist as boolean || false,
        age: (charMeta as unknown as Record<string, unknown>).age as string || "",
        gender: (charMeta as unknown as Record<string, unknown>).gender as string || "",
        traits: (charMeta as unknown as Record<string, unknown>).traits as string || "",
        appearance: charMeta.appearance,
        clothing: charMeta.clothing,
        personality: charMeta.personality,
        backgroundStory: charMeta.backgroundStory,
        imagePrompt: charMeta.imagePrompt,
        imageBase64: "",
        imageUrl: charMeta.imageId || undefined,
        isGenerating: false,
        // Map new image fields from context
        profileImageUrl: charMeta.profileImageId || undefined,
        profilePrompt: charMeta.profileImagePrompt || "",
        profileImageBase64: "",
        profileIsGenerating: false,
        masterSheetImageUrl: charMeta.masterSheetImageId || undefined,
        masterSheetPrompt: charMeta.masterSheetImagePrompt || "",
        masterSheetImageBase64: "",
        masterSheetIsGenerating: false,
      })
    );

    // Mark as hydrated BEFORE setting state to prevent re-runs
    hasHydratedRef.current = true;

    setCharacters(charactersWithImages);
    setStyleKeyword(contextResult.styleKeyword);
    setCharacterBasePrompt(contextResult.characterBasePrompt);

    // Load genre if available
    if (contextResult.genre) {
      setGenre(contextResult.genre);
    }

    // Load style slots if available
    if (contextResult.styleSlots && contextResult.styleSlots.length > 0) {
      setStyleSlots(contextResult.styleSlots);
    }

    // Load active style index if available
    if (contextResult.activeStyleIndex !== undefined && contextResult.activeStyleIndex !== null) {
      setActiveStyleIndex(contextResult.activeStyleIndex);
    }

    setIsSaved(true);
    setIsLoadingData(false);
  }, [contextResult]);

  // Auto-save a single image to S3 and update Firestore + context
  const autoSaveImage = useCallback(async (
    characterId: string,
    imageBase64: string,
    prompt: string
  ) => {
    if (!currentProjectId) {
      console.error("No project ID available for auto-save");
      return;
    }

    try {
      // 1. Upload image to S3
      const imageUrl = await uploadCharacterImage(currentProjectId, characterId, imageBase64);

      // 2. Update Firestore with S3 URL
      await updateCharacterImage(currentProjectId, characterId, imageUrl, prompt);

      // 3. Update local state with S3 URL and sync to context - use functional update to get latest state
      const imageUrlWithCacheBust = `${imageUrl}?t=${Date.now()}`;
      setCharacters((prev) => {
        const updatedCharacters = prev.map((c) =>
          c.id === characterId ? { ...c, imageUrl: imageUrlWithCacheBust, imageBase64: "" } : c
        );

        // 4. Update context state so navigation works without manual save
        const updatedMeta: CharacterSheetResultMetadata = {
          characters: updatedCharacters.map((char) => ({
            id: char.id,
            name: char.name,
            role: char.role,
            isProtagonist: char.isProtagonist,
            age: char.age,
            gender: char.gender,
            traits: char.traits,
            appearance: char.appearance,
            clothing: char.clothing,
            personality: char.personality,
            backgroundStory: char.backgroundStory,
            profileImageId: char.profileImageUrl || "",
            profileImagePrompt: char.profilePrompt || "",
            masterSheetImageId: char.masterSheetImageUrl || char.imageUrl || "",
            masterSheetImagePrompt: char.masterSheetPrompt || char.imagePrompt || "",
            imageId: char.id === characterId ? imageUrl : (char.imageUrl || ""),
            imagePrompt: char.id === characterId ? prompt : char.imagePrompt,
          })),
          styleKeyword,
          characterBasePrompt,
          genre,
          styleSlots,
          activeStyleIndex,
        };
        setCharacterSheetResult(updatedMeta);

        return updatedCharacters;
      });
    } catch (error) {
      console.error("Auto-save failed for image:", error);
      toast({
        variant: "destructive",
        title: phrase(dictionary, "charsheet_toast_save_failed", language),
        description: error instanceof Error ? error.message : "Failed to save image",
      });
    }
  }, [currentProjectId, styleKeyword, characterBasePrompt, genre, styleSlots, activeStyleIndex, setCharacterSheetResult, toast, dictionary, language]);

  // Helper to sync current state to context (for navigation persistence)
  const syncContextResult = useCallback((updatedCharacters: Character[]) => {
    const metadata: CharacterSheetResultMetadata = {
      characters: updatedCharacters.map((char) => ({
        id: char.id,
        name: char.name,
        role: char.role,
        isProtagonist: char.isProtagonist,
        age: char.age,
        gender: char.gender,
        traits: char.traits,
        appearance: char.appearance,
        clothing: char.clothing,
        personality: char.personality,
        backgroundStory: char.backgroundStory,
        profileImageId: char.profileImageUrl || "",
        profileImagePrompt: char.profilePrompt || "",
        masterSheetImageId: char.masterSheetImageUrl || char.imageUrl || "",
        masterSheetImagePrompt: char.masterSheetPrompt || char.imagePrompt || "",
        imageId: char.masterSheetImageUrl || char.imageUrl || "",
        imagePrompt: char.masterSheetPrompt || char.imagePrompt || "",
      })),
      styleKeyword,
      characterBasePrompt,
      genre,
      styleSlots,
      activeStyleIndex,
    };
    setCharacterSheetResult(metadata);
  }, [styleKeyword, characterBasePrompt, genre, styleSlots, activeStyleIndex, setCharacterSheetResult]);

  const handleAnalyze = useCallback(async () => {
    setError("");
    setIsSaved(false);

    const result = await startCharacterSheetAnalysis(originalText, styleKeyword, characterBasePrompt);

    if (result.length > 0) {
      // Migrate all characters to ensure new fields are present
      const migratedCharacters = result.map(migrateCharacter);
      setCharacters(migratedCharacters);
      setStageResult(3, { characters: migratedCharacters, styleKeyword, characterBasePrompt });
      setIsSaved(true);
    } else if (analysisError) {
      setError(analysisError);
    }
  }, [originalText, styleKeyword, characterBasePrompt, startCharacterSheetAnalysis, setStageResult, analysisError]);

  const updateCharacterField = (
    id: string,
    field: keyof Character,
    value: string | boolean
  ) => {
    setCharacters((chars) =>
      chars.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    setIsSaved(false);
  };

  // Handle selecting a character from grid
  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setViewMode("detail");
  };

  // Handle going back to grid view
  const handleBackToGrid = () => {
    setSelectedCharacterId(null);
    setViewMode("grid");
  };

  // Generate profile image (1:1 headshot)
  const handleGenerateProfile = async (characterId: string) => {
    const character = characters.find((c) => c.id === characterId);
    if (!character) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCharacters((prev) =>
      prev.map((c) => (c.id === characterId ? { ...c, profileIsGenerating: true } : c))
    );

    // Build profile prompt
    const prompt = `2d ${genre} anime screenshot white background. Headshot portrait of ${character.age ? character.age + " year old" : ""} ${character.gender || ""} ${character.name}.
${character.traits ? `Features: ${character.traits}` : ""}
${character.appearance ? `Appearance: ${character.appearance}` : ""}
${character.personality ? `Expression reflecting: ${character.personality}` : ""}
${character.clothing ? `Wearing: ${character.clothing}` : ""}
Style: ${styleKeyword}`;

    try {
      // Check if this character references protagonist and protagonist has profile
      let protagonistRefBase64: string | undefined;
      let protagonistName: string | undefined;
      if (
        protagonistCharacter &&
        protagonistCharacter.id !== characterId &&
        (protagonistCharacter.profileImageBase64 || protagonistCharacter.profileImageUrl) &&
        character.backgroundStory?.toLowerCase().includes(protagonistCharacter.name.toLowerCase())
      ) {
        const protagonistSrc = protagonistCharacter.profileImageBase64 || protagonistCharacter.profileImageUrl;
        protagonistRefBase64 = await getBase64FromImageSrc(protagonistSrc);
        protagonistName = protagonistCharacter.name;
      }

      // Convert style reference to base64 if it's a URL
      const styleRefBase64 = await getBase64FromImageSrc(activeStyleImage || undefined);

      const response = await fetch("/api/generate_character_sheet/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          styleReferenceBase64: styleRefBase64,
          protagonistReferenceBase64: protagonistRefBase64,
          protagonistName,
          customApiKey: customApiKey || undefined,
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const newImageBase64 = data.imageBase64;

      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? { ...c, profileImageBase64: newImageBase64, profileIsGenerating: false, profilePrompt: prompt }
            : c
        )
      );

      // Auto-save profile image
      if (currentProjectId) {
        const imageUrl = await uploadCharacterProfileImage(currentProjectId, characterId, newImageBase64);
        await updateCharacterProfileImage(currentProjectId, characterId, imageUrl, prompt);
        const urlWithCacheBust = `${imageUrl}?t=${Date.now()}`;

        // Build updated characters for context sync - use functional update to get latest state
        setCharacters((prev) => {
          const updatedCharacters = prev.map((c) =>
            c.id === characterId
              ? { ...c, profileImageUrl: urlWithCacheBust, profileImageBase64: "", profilePrompt: prompt }
              : c
          );
          // Sync to context for navigation persistence
          syncContextResult(updatedCharacters);
          return updatedCharacters;
        });
      }

      setIsSaved(false);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      console.error(`Failed to generate profile for ${character.name}:`, e);
      toast({
        variant: "destructive",
        title: phrase(dictionary, "charsheet_toast_image_failed", language),
        description: `${character.name}: ${e instanceof Error ? e.message : "Unknown error"}`,
      });
      setCharacters((prev) =>
        prev.map((c) => (c.id === characterId ? { ...c, profileIsGenerating: false } : c))
      );
    }
  };

  // Generate master sheet (16:9 with 4 views)
  const handleGenerateMasterSheet = async (characterId: string) => {
    const character = characters.find((c) => c.id === characterId);
    if (!character) return;

    // Require profile image first
    const profileSrc = character.profileImageBase64 || character.profileImageUrl;
    if (!profileSrc) {
      toast({
        variant: "destructive",
        title: "Profile Required",
        description: "Please generate a profile image first for character consistency.",
      });
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCharacters((prev) =>
      prev.map((c) => (c.id === characterId ? { ...c, masterSheetIsGenerating: true } : c))
    );

    const prompt = `${characterBasePrompt}

COMPOSITION: Character reference sheet with four distinct full-body views side-by-side:
1. Front View (standing straight)
2. Back View (standing straight)
3. Side View (profile)
4. Close Up Face

CHARACTER DETAILS:
Name: ${character.name}
${character.age ? `Age: ${character.age}` : ""}
${character.gender ? `Gender: ${character.gender}` : ""}
${character.traits ? `Features: ${character.traits}` : ""}
Appearance: ${character.appearance}
Clothing: ${character.clothing}
Personality: ${character.personality}

Genre: ${genre}
Style: ${styleKeyword}`;

    try {
      // Convert images to base64 if they're URLs
      const profileRefBase64 = await getBase64FromImageSrc(profileSrc);
      const styleRefBase64 = await getBase64FromImageSrc(activeStyleImage || undefined);

      // Validate profile image was converted successfully
      if (!profileRefBase64) {
        throw new Error("Failed to load profile image. Please try regenerating the profile.");
      }

      const response = await fetch("/api/generate_character_sheet/generate-master-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          profileImageBase64: profileRefBase64,
          styleReferenceBase64: styleRefBase64,
          customApiKey: customApiKey || undefined,
        }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const newImageBase64 = data.imageBase64;

      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? {
                ...c,
                masterSheetImageBase64: newImageBase64,
                masterSheetIsGenerating: false,
                masterSheetPrompt: prompt,
                // Also update legacy fields for backward compatibility
                imageBase64: newImageBase64,
                imagePrompt: prompt,
              }
            : c
        )
      );

      // Auto-save master sheet image
      if (currentProjectId) {
        const imageUrl = await uploadCharacterMasterSheetImage(currentProjectId, characterId, newImageBase64);
        await updateCharacterMasterSheetImage(currentProjectId, characterId, imageUrl, prompt);
        const urlWithCacheBust = `${imageUrl}?t=${Date.now()}`;

        // Build updated characters for context sync - use functional update to get latest state
        setCharacters((prev) => {
          const updatedCharacters = prev.map((c) =>
            c.id === characterId
              ? {
                  ...c,
                  masterSheetImageUrl: urlWithCacheBust,
                  masterSheetImageBase64: "",
                  masterSheetPrompt: prompt,
                  imageUrl: urlWithCacheBust,
                  imageBase64: "",
                  imagePrompt: prompt,
                }
              : c
          );
          // Sync to context for navigation persistence
          syncContextResult(updatedCharacters);
          return updatedCharacters;
        });
      }

      setIsSaved(false);
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      console.error(`Failed to generate master sheet for ${character.name}:`, e);
      toast({
        variant: "destructive",
        title: phrase(dictionary, "charsheet_toast_image_failed", language),
        description: `${character.name}: ${e instanceof Error ? e.message : "Unknown error"}`,
      });
      setCharacters((prev) =>
        prev.map((c) => (c.id === characterId ? { ...c, masterSheetIsGenerating: false } : c))
      );
    }
  };

  // Generate mode variation
  const handleGenerateMode = async (characterId: string, modeId: string) => {
    const character = characters.find((c) => c.id === characterId);
    if (!character) return;

    const mode = character.modes.find((m) => m.id === modeId);
    if (!mode) return;

    const masterSheetSrc = character.masterSheetImageBase64 || character.masterSheetImageUrl || character.imageBase64 || character.imageUrl;
    if (!masterSheetSrc) {
      toast({
        variant: "destructive",
        title: "Master Sheet Required",
        description: "Please generate a master sheet first for character consistency.",
      });
      return;
    }

    // Update mode generating state
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId
          ? {
              ...c,
              modes: c.modes.map((m) =>
                m.id === modeId ? { ...m, isGenerating: true } : m
              ),
            }
          : c
      )
    );

    try {
      // Convert images to base64 if they're URLs
      const masterSheetRefBase64 = await getBase64FromImageSrc(masterSheetSrc);
      const styleRefBase64 = await getBase64FromImageSrc(activeStyleImage || undefined);

      // Validate master sheet was converted successfully
      if (!masterSheetRefBase64) {
        throw new Error("Failed to load master sheet image. Please try regenerating the master sheet.");
      }

      const response = await fetch("/api/generate_character_sheet/generate-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: mode.prompt,
          masterSheetImageBase64: masterSheetRefBase64,
          modeName: mode.name,
          modeDescription: mode.description,
          styleReferenceBase64: styleRefBase64,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const newImageBase64 = data.imageBase64;

      // Update local state
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? {
                ...c,
                modes: c.modes.map((m) =>
                  m.id === modeId
                    ? { ...m, imageBase64: newImageBase64, isGenerating: false }
                    : m
                ),
              }
            : c
        )
      );

      // Auto-save mode image
      if (currentProjectId) {
        const imageUrl = await uploadCharacterModeImage(currentProjectId, characterId, modeId, newImageBase64);
        await updateModeImage(currentProjectId, characterId, modeId, imageUrl);
        const urlWithCacheBust = `${imageUrl}?t=${Date.now()}`;

        // Build updated characters for context sync - use functional update to get latest state
        setCharacters((prev) => {
          const updatedCharacters = prev.map((c) =>
            c.id === characterId
              ? {
                  ...c,
                  modes: c.modes.map((m) =>
                    m.id === modeId
                      ? { ...m, imageUrl: urlWithCacheBust, imageBase64: "" }
                      : m
                  ),
                }
              : c
          );
          // Sync to context for navigation persistence
          syncContextResult(updatedCharacters);
          return updatedCharacters;
        });
      }

      setIsSaved(false);
    } catch (e: unknown) {
      console.error(`Failed to generate mode ${mode.name}:`, e);
      toast({
        variant: "destructive",
        title: phrase(dictionary, "charsheet_toast_image_failed", language),
        description: `${mode.name}: ${e instanceof Error ? e.message : "Unknown error"}`,
      });
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? {
                ...c,
                modes: c.modes.map((m) =>
                  m.id === modeId ? { ...m, isGenerating: false } : m
                ),
              }
            : c
        )
      );
    }
  };

  // Add a new mode to character
  const handleAddMode = async (
    characterId: string,
    mode: Omit<Mode, "id" | "imageBase64" | "imageUrl" | "isGenerating">
  ) => {
    const newMode: Mode = {
      id: `mode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...mode,
      imageBase64: "",
      imageUrl: undefined,
      isGenerating: false,
    };

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId
          ? { ...c, modes: [...c.modes, newMode] }
          : c
      )
    );

    // Save to Firestore with the same ID
    if (currentProjectId) {
      await saveMode(currentProjectId, {
        id: newMode.id,
        characterId,
        name: newMode.name,
        description: newMode.description,
        prompt: newMode.prompt,
        imageRef: newMode.imageUrl,
      });
    }

    setIsSaved(false);
  };

  // Delete a mode from character
  const handleDeleteMode = async (characterId: string, modeId: string) => {
    setCharacters((prev) =>
      prev.map((c) =>
        c.id === characterId
          ? { ...c, modes: c.modes.filter((m) => m.id !== modeId) }
          : c
      )
    );

    // Delete from Firestore
    if (currentProjectId) {
      await deleteFirestoreMode(currentProjectId, characterId, modeId);
    }

    setIsSaved(false);
  };

  // Add a new empty character slot
  const handleAddCharacter = async () => {
    const newCharacterData = {
      name: `New Character ${characters.length + 1}`,
      role: "unknown" as const,
      isProtagonist: false,
      age: "",
      gender: "",
      traits: "",
      appearance: "",
      clothing: "",
      personality: "",
      backgroundStory: "",
    };

    // Save to Firestore first to get the proper ID
    if (currentProjectId) {
      try {
        const firestoreId = await saveCharacter(currentProjectId, {
          ...newCharacterData,
          imageRef: "",
          imagePrompt: "",
        });

        const newCharacter: Character = migrateCharacter({
          id: firestoreId,
          ...newCharacterData,
          imagePrompt: "",
          imageBase64: "",
          imageUrl: undefined,
          isGenerating: false,
          profilePrompt: "",
          profileImageBase64: "",
          profileImageUrl: undefined,
          profileIsGenerating: false,
          masterSheetPrompt: "",
          masterSheetImageBase64: "",
          masterSheetImageUrl: undefined,
          masterSheetIsGenerating: false,
        });

        setCharacters((prev) => [...prev, newCharacter]);
        setSelectedCharacterId(firestoreId);
        setViewMode("detail");
        setIsSaved(false);

        toast({
          variant: "success",
          title: "Character Added",
          description: "New character slot created. Fill in the details below.",
        });
      } catch (error) {
        console.error("Failed to add character:", error);
        toast({
          variant: "destructive",
          title: "Failed to Add Character",
          description: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    } else {
      // Fallback for no project (shouldn't happen in normal use)
      const tempId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newCharacter: Character = migrateCharacter({
        id: tempId,
        ...newCharacterData,
        imagePrompt: "",
        imageBase64: "",
        imageUrl: undefined,
        isGenerating: false,
        profilePrompt: "",
        profileImageBase64: "",
        profileImageUrl: undefined,
        profileIsGenerating: false,
        masterSheetPrompt: "",
        masterSheetImageBase64: "",
        masterSheetImageUrl: undefined,
        masterSheetIsGenerating: false,
      });

      setCharacters((prev) => [...prev, newCharacter]);
      setSelectedCharacterId(tempId);
      setViewMode("detail");
      setIsSaved(false);
    }
  };

  // Detect modes from text
  const handleDetectModes = async (characterId: string) => {
    const character = characters.find((c) => c.id === characterId);
    if (!character || !originalText) return;

    setIsDetectingModes((prev) => ({ ...prev, [characterId]: true }));

    try {
      const response = await fetch("/api/generate_character_sheet/detect-modes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: originalText,
          characterName: character.name,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Add detected modes
      const detectedModes: Mode[] = (data.modes || []).map((m: { name: string; description: string; prompt: string }) => ({
        id: `mode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: m.name,
        description: m.description,
        prompt: m.prompt,
        imageBase64: "",
        imageUrl: undefined,
        isGenerating: false,
      }));

      if (detectedModes.length > 0) {
        setCharacters((prev) =>
          prev.map((c) =>
            c.id === characterId
              ? { ...c, modes: [...c.modes, ...detectedModes] }
              : c
          )
        );

        // Save modes to Firestore with matching IDs
        if (currentProjectId) {
          for (const mode of detectedModes) {
            await saveMode(currentProjectId, {
              id: mode.id,
              characterId,
              name: mode.name,
              description: mode.description,
              prompt: mode.prompt,
              imageRef: mode.imageUrl,
            });
          }
        }

        toast({
          variant: "success",
          title: "Modes Detected",
          description: `Found ${detectedModes.length} mode(s) for ${character.name}.`,
        });
      } else {
        toast({
          title: "No Modes Found",
          description: `No specific modes/variations found for ${character.name} in the text.`,
        });
      }
    } catch (e: unknown) {
      console.error("Failed to detect modes:", e);
      toast({
        variant: "destructive",
        title: "Detection Failed",
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsDetectingModes((prev) => ({ ...prev, [characterId]: false }));
    }
  };

  // Handle style slot upload
  const handleStyleSlotUpload = async (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string)?.split(",")[1];
      if (!base64) return;

      setStyleSlots((prev) =>
        prev.map((slot, i) =>
          i === index ? { ...slot, imageBase64: base64 } : slot
        )
      );

      // Auto-select this slot if no active slot
      if (activeStyleIndex === null) {
        setActiveStyleIndex(index);
      }

      // Upload to S3
      if (currentProjectId) {
        try {
          const imageUrl = await uploadStyleSlotImage(currentProjectId, index, base64);
          setStyleSlots((prev) =>
            prev.map((slot, i) =>
              i === index ? { ...slot, imageUrl, imageBase64: "" } : slot
            )
          );
          // Convert StyleSlot to StyleSlotDocument format (imageUrl -> imageRef)
          await saveFirestoreStyleSlots(currentProjectId, styleSlots.map((slot, i) => ({
            id: slot.id,
            name: slot.name,
            imageRef: i === index ? imageUrl : (slot.imageUrl || slot.imageBase64 || ""),
          })), activeStyleIndex === null ? index : activeStyleIndex);
        } catch (err) {
          console.error("Failed to upload style slot image:", err);
        }
      }

      setIsSaved(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle style slot selection
  const handleStyleSlotSelect = (index: number) => {
    setActiveStyleIndex(index);
    setIsSaved(false);
  };

  // Handle style slot deletion
  const handleStyleSlotDelete = (index: number) => {
    setStyleSlots((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, imageBase64: "", imageUrl: undefined } : slot
      )
    );
    if (activeStyleIndex === index) {
      setActiveStyleIndex(null);
    }
    setIsSaved(false);
  };

  const handleSave = useCallback(async () => {
    if (!currentProjectId) {
      toast({
        variant: "destructive",
        title: phrase(dictionary, "charsheet_toast_save_failed", language),
        description: "No project selected",
      });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload any remaining base64 images to S3
      for (const char of characters) {
        if (char.imageBase64 && !char.imageUrl) {
          const imageUrl = await uploadCharacterImage(currentProjectId, char.id, char.imageBase64);
          await updateCharacterImage(currentProjectId, char.id, imageUrl, char.imagePrompt);
          setCharacters((prev) =>
            prev.map((c) => (c.id === char.id ? { ...c, imageUrl, imageBase64: "" } : c))
          );
        }
      }

      // 2. Save settings to Firestore (including genre and style slots)
      // Convert StyleSlot to StyleSlotDocument format (imageUrl -> imageRef)
      const styleSlotsForFirestore = styleSlots.map((slot) => ({
        id: slot.id,
        name: slot.name,
        imageRef: slot.imageUrl || slot.imageBase64 || "",
      }));
      await saveCharacterSheetSettings(currentProjectId, {
        styleKeyword,
        characterBasePrompt,
        genre,
        styleSlots: styleSlotsForFirestore,
        activeStyleIndex,
      });

      // 3. Save character text fields to Firestore
      for (const char of characters) {
        await updateCharacter(currentProjectId, char.id, {
          name: char.name,
          role: char.role,
          isProtagonist: char.isProtagonist,
          age: char.age,
          gender: char.gender,
          traits: char.traits,
          appearance: char.appearance,
          clothing: char.clothing,
          personality: char.personality,
          backgroundStory: char.backgroundStory,
        });
      }

      // 4. Create metadata for context
      const metadata: CharacterSheetResultMetadata = {
        characters: characters.map((char) => ({
          id: char.id,
          name: char.name,
          role: char.role,
          isProtagonist: char.isProtagonist,
          age: char.age,
          gender: char.gender,
          traits: char.traits,
          appearance: char.appearance,
          clothing: char.clothing,
          personality: char.personality,
          backgroundStory: char.backgroundStory,
          profileImageId: char.profileImageUrl || "",
          profileImagePrompt: char.profilePrompt || "",
          masterSheetImageId: char.masterSheetImageUrl || char.imageUrl || "",
          masterSheetImagePrompt: char.masterSheetPrompt || char.imagePrompt || "",
          imageId: char.imageUrl || "",
          imagePrompt: char.imagePrompt,
        })),
        styleKeyword,
        characterBasePrompt,
        genre,
        styleSlots,
        activeStyleIndex,
      };

      setStageResult(3, metadata);
      setCharacterSheetResult(metadata);
      setIsSaved(true);
      toast({
        variant: "success",
        title: phrase(dictionary, "charsheet_toast_saved", language),
        description: phrase(dictionary, "charsheet_toast_saved_desc", language),
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        variant: "destructive",
        title: phrase(dictionary, "charsheet_toast_save_failed", language),
        description: error instanceof Error ? error.message : phrase(dictionary, "charsheet_toast_save_failed_desc", language),
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentProjectId, characters, styleKeyword, characterBasePrompt, genre, styleSlots, activeStyleIndex, setStageResult, setCharacterSheetResult, toast, dictionary, language]);

  // Generate all profiles that don't have images
  const handleGenerateAll = async () => {
    for (const char of characters) {
      if (!char.profileImageBase64 && !char.profileImageUrl) {
        await handleGenerateProfile(char.id);
      }
    }
  };

  // Handle JSON import
  const handleJSONImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    importFromJSON(
      file,
      (data) => {
        // Apply imported data
        setGenre(data.genre);
        setStyleKeyword(data.styleKeyword);
        setCharacterBasePrompt(data.characterBasePrompt);
        setStyleSlots(data.styleSlots);
        setActiveStyleIndex(data.activeStyleIndex);
        setCharacters(data.characters);
        setIsSaved(false);

        toast({
          variant: "success",
          title: "Import Successful",
          description: `Imported ${data.characters.length} character(s).`,
        });
      },
      (errorMessage) => {
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: errorMessage,
        });
      }
    );

    // Reset file input
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold mb-2">{phrase(dictionary, "charsheet_title", language)}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {phrase(dictionary, "charsheet_subtitle", language)}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingData && (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#DB2777]"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {phrase(dictionary, "charsheet_loading", language)}
          </p>
        </div>
      )}

      {/* Global Configuration */}
      {!isLoadingData && (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#DB2777] rounded-full"></span>
            {phrase(dictionary, "charsheet_global_config", language)}
          </h3>

          {/* Genre Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value);
                setIsSaved(false);
              }}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm"
            >
              {GENRE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {phrase(dictionary, "charsheet_base_prompt", language)}
            </label>
            <textarea
              value={characterBasePrompt}
              onChange={(e) => {
                setCharacterBasePrompt(e.target.value);
                setIsSaved(false);
              }}
              rows={2}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm resize-none"
              placeholder={phrase(dictionary, "charsheet_base_prompt_placeholder", language)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {phrase(dictionary, "charsheet_style_keywords", language)}
            </label>
            <input
              type="text"
              value={styleKeyword}
              onChange={(e) => {
                setStyleKeyword(e.target.value);
                setIsSaved(false);
              }}
              placeholder={phrase(dictionary, "charsheet_style_placeholder", language)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm"
            />
          </div>

          {/* Style Reference Slots */}
          <StyleSlots
            slots={styleSlots}
            activeIndex={activeStyleIndex}
            onUpload={handleStyleSlotUpload}
            onSelect={handleStyleSlotSelect}
            onDelete={handleStyleSlotDelete}
            disabled={false}
          />
        </div>
      )}

      {/* Text Preview from Stage 1 */}
      {!isLoadingData && (originalText ? (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fileName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {originalText.length.toLocaleString()} {phrase(dictionary, "chars", language)}
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto scrollbar-hide">
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
              {originalText.slice(0, 300)}
              {originalText.length > 300 && "..."}
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            {phrase(dictionary, "storysplitter_upload_file_first", language)}
          </p>
        </div>
      ))}

      {/* Analyze Button - only show when no results */}
      {!isLoadingData && originalText && !isAnalyzing && characters.length === 0 && (
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {phrase(dictionary, "charsheet_analyze_text", language)}
          </button>
          <button
            onClick={handleAddCharacter}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-3 rounded-lg transition-colors"
            title="Add character manually"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Character</span>
          </button>
          <button
            onClick={() => exportToJSON(characters, genre, styleKeyword, characterBasePrompt, styleSlots, activeStyleIndex)}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-lg transition-colors"
            title="Export to JSON"
          >
            <FileDown className="w-5 h-5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => jsonImportInputRef.current?.click()}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-lg transition-colors"
            title="Import from JSON"
          >
            <FileUp className="w-5 h-5" />
            <span>Import</span>
          </button>
        </div>
      )}

      {/* Error Display */}
      {!isLoadingData && error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
          role="alert"
        >
          <strong className="font-bold">{phrase(dictionary, "storysplitter_error", language)} </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Loader */}
      {!isLoadingData && isAnalyzing && <Loader dictionary={dictionary} language={language} />}

      {/* Results */}
      {!isLoadingData && characters.length > 0 && !isAnalyzing && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#DB2777] rounded-full"></span>
                {phrase(dictionary, "charsheet_characters", language)} ({characters.length})
              </h3>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-200 dark:bg-gray-600 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode("grid");
                    setSelectedCharacterId(null);
                  }}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("detail")}
                  disabled={!selectedCharacterId}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors ${
                    viewMode === "detail"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <User className="w-4 h-4" />
                  Detail
                </button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleAddCharacter}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm"
                title="Add new character"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaved || isSaving}
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
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? phrase(dictionary, "charsheet_saving", language) : isSaved ? phrase(dictionary, "charsheet_saved", language) : phrase(dictionary, "charsheet_save", language)}</span>
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{phrase(dictionary, "charsheet_generate_all", language)}</span>
              </button>
              <button
                onClick={() => exportToJSON(characters, genre, styleKeyword, characterBasePrompt, styleSlots, activeStyleIndex)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
                title="Export to JSON"
              >
                <FileDown className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => jsonImportInputRef.current?.click()}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
                title="Import from JSON"
              >
                <FileUp className="w-4 h-4" />
                <span>Import</span>
              </button>
              <button
                onClick={() => {
                  setCharacters([]);
                  clearCharacterSheetAnalysis();
                  setSelectedCharacterId(null);
                  setViewMode("grid");
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <CharacterGrid
              characters={characters}
              onSelectCharacter={handleSelectCharacter}
              onGenerateProfile={handleGenerateProfile}
              disabled={false}
            />
          )}

          {/* Detail View */}
          {viewMode === "detail" && selectedCharacter && (
            <CharacterDetail
              character={selectedCharacter}
              onBack={handleBackToGrid}
              onUpdateField={(field, value) => updateCharacterField(selectedCharacter.id, field, value)}
              onGenerateProfile={() => handleGenerateProfile(selectedCharacter.id)}
              onGenerateMasterSheet={() => handleGenerateMasterSheet(selectedCharacter.id)}
              onAddMode={(mode) => handleAddMode(selectedCharacter.id, mode)}
              onDeleteMode={(modeId) => handleDeleteMode(selectedCharacter.id, modeId)}
              onGenerateMode={(modeId) => handleGenerateMode(selectedCharacter.id, modeId)}
              onDetectModes={() => handleDetectModes(selectedCharacter.id)}
              isDetectingModes={isDetectingModes[selectedCharacter.id] || false}
              disabled={false}
            />
          )}
        </div>
      )}

      {/* Hidden file input for JSON import - always rendered */}
      <input
        ref={jsonImportInputRef}
        type="file"
        accept=".json"
        onChange={handleJSONImport}
        className="hidden"
      />
    </div>
  );
}
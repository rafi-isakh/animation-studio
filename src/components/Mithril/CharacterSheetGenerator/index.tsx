"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import type { Dictionary, Language } from "@/components/Types";
import {
  Sparkles,
  Download,
  Image as ImageIcon,
  Pencil,
  Save,
  FileDown,
  Trash2,
} from "lucide-react";
import CharacterSheetImageEditor from "./CharacterSheetImageEditor";
import type { Character, CharacterSheetResultMetadata } from "./types";
import { saveCharacterImage, getCharacterImage, clearCharacterImagesOnly, getAllCharacterImages } from "../services/mithrilIndexedDB";

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

const EditableField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (newValue: string) => void;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none transition duration-150 text-sm resize-none"
      rows={value.split("\n").length > 1 ? 3 : 2}
    />
  </div>
);

// CSV Export utility
const escapeCsvField = (field: string | null | undefined): string => {
  if (field === null || field === undefined) {
    return '""';
  }
  const stringField = String(field);
  if (/[",\n]/.test(stringField)) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

const exportToCSV = (characters: Character[]): void => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Type,Name,Appearance,Clothing,Personality,Background Story,Image Prompt\n";
  characters.forEach((char) => {
    const row = [
      "Character",
      escapeCsvField(char.name),
      escapeCsvField(char.appearance),
      escapeCsvField(char.clothing),
      escapeCsvField(char.personality),
      escapeCsvField(char.backgroundStory),
      escapeCsvField(char.imagePrompt),
    ].join(",");
    csvContent += row + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "character_sheet_data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadImage = (base64: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = `data:image/jpeg;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function CharacterSheetGenerator() {
  const { setStageResult, characterSheetGenerator, startCharacterSheetAnalysis, clearCharacterSheetAnalysis, setCharacterSheetResult, customApiKey } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();
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

  // Use ref to track hydration to avoid triggering re-renders
  const hasHydratedRef = useRef<boolean>(false);

  // Global settings
  const [styleKeyword, setStyleKeyword] = useState<string>(
    "2020 Japanese Anime Style, Pastel Color"
  );
  const [characterBasePrompt, setCharacterBasePrompt] = useState<string>(
    "An anime-style full-body illustration, Masterpiece, Best quality, Ultra-detailed, High resolution, 8k, Sharp focus, Clean lines"
  );
  const [referenceImageName, setReferenceImageName] = useState<string>("");

  // Editor state
  const [editingTarget, setEditingTarget] = useState<{
    characterId: string;
    currentImage: string;
    initialPrompt: string;
  } | null>(null);

  // AbortController for canceling in-flight requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any pending requests when component unmounts
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- We intentionally want the latest ref value at cleanup time
      abortControllerRef.current?.abort();
    };
  }, []);

  // Load text from localStorage (from Stage 1)
  useEffect(() => {
    const savedContent = localStorage.getItem("chapter");
    const savedFileName = localStorage.getItem("chapter_filename");
    if (savedContent) {
      setOriginalText(savedContent);
      setFileName(savedFileName || "uploaded_file.txt");
    }
  }, []);

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

    const hydrateFromContext = async () => {
      setIsLoadingData(true);
      try {
        // Reconstruct characters with images from IndexedDB
        const charactersWithImages: Character[] = await Promise.all(
          contextResult.characters.map(async (charMeta) => {
            let imageBase64 = "";
            if (charMeta.imageId) {
              const dbImage = await getCharacterImage(charMeta.imageId);
              imageBase64 = dbImage?.base64 || "";
            }
            return {
              id: charMeta.id,
              name: charMeta.name,
              appearance: charMeta.appearance,
              clothing: charMeta.clothing,
              personality: charMeta.personality,
              backgroundStory: charMeta.backgroundStory,
              imagePrompt: charMeta.imagePrompt,
              imageBase64,
              isGenerating: false,
            };
          })
        );

        // Mark as hydrated BEFORE setting state to prevent re-runs
        hasHydratedRef.current = true;

        setCharacters(charactersWithImages);
        setStyleKeyword(contextResult.styleKeyword);
        setCharacterBasePrompt(contextResult.characterBasePrompt);
        setIsSaved(true);
      } catch {
        // Ignore errors
        hasHydratedRef.current = true;
      }
      setIsLoadingData(false);
    };

    hydrateFromContext();
  }, [contextResult]);

  const handleReferenceImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setReferenceImageName(file.name);
    }
  };

  // Auto-save a single image to IndexedDB and update localStorage metadata + context
  const autoSaveImage = useCallback(async (
    characterId: string,
    imageBase64: string,
    prompt: string
  ) => {
    try {
      // 1. Save image to IndexedDB
      const imageId = `char_${characterId}`;
      await saveCharacterImage({
        id: imageId,
        type: "character_image",
        base64: imageBase64,
        mimeType: "image/jpeg",
        characterId: characterId,
        createdAt: Date.now(),
      });

      // 2. Update localStorage metadata
      const existingMeta = localStorage.getItem("character_sheet_result");
      if (existingMeta) {
        const meta = JSON.parse(existingMeta) as CharacterSheetResultMetadata;
        const charIndex = meta.characters.findIndex((c) => c.id === characterId);
        if (charIndex !== -1) {
          meta.characters[charIndex].imageId = imageId;
          meta.characters[charIndex].imagePrompt = prompt;
        }
        localStorage.setItem("character_sheet_result", JSON.stringify(meta));

        // 3. Update context state so navigation works without manual save
        setCharacterSheetResult(meta);
      }
    } catch (error) {
      console.error("Auto-save failed for image:", error);
    }
  }, [setCharacterSheetResult]);

  const handleAnalyze = useCallback(async () => {
    setError("");
    setIsSaved(false);

    const result = await startCharacterSheetAnalysis(originalText, styleKeyword, characterBasePrompt);

    if (result.length > 0) {
      setCharacters(result);
      setStageResult(3, { characters: result, styleKeyword, characterBasePrompt });
      setIsSaved(true);
    } else if (analysisError) {
      setError(analysisError);
    }
  }, [originalText, styleKeyword, characterBasePrompt, startCharacterSheetAnalysis, setStageResult, analysisError]);

  const updateCharacter = (
    id: string,
    field: keyof Character,
    value: string | boolean
  ) => {
    setCharacters((chars) =>
      chars.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
    setIsSaved(false);
  };

  const handleGenerateCharacterSheet = async (id: string) => {
    const character = characters.find((c) => c.id === id);
    if (!character) return;

    // Create new AbortController for this generation session
    abortControllerRef.current?.abort(); // Cancel any previous generation
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    updateCharacter(id, "isGenerating", true);

    const prompt = `${characterBasePrompt}

      COMPOSITION: The sheet MUST display four distinct full-body views of the character side-by-side:
      1. Front View (standing straight)
      2. Back View (standing straight)
      3. Side View (profile)
      4. Close Up Face

      CHARACTER DETAILS:
      Name: ${character.name}
      Appearance: ${character.appearance}
      Clothing: ${character.clothing}
      Personality: ${character.personality}

      Additional Style: ${styleKeyword}`;

    updateCharacter(id, "imagePrompt", prompt);

    try {
      const response = await fetch("/api/generate_character_sheet/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: "16:9", customApiKey: customApiKey || undefined }),
        signal,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const newImageBase64 = data.imageBase64;

      setCharacters((chars) =>
        chars.map((c) =>
          c.id === id ? { ...c, imageBase64: newImageBase64, isGenerating: false } : c
        )
      );

      // Auto-save image immediately
      await autoSaveImage(character.id, newImageBase64, prompt);
    } catch (e: unknown) {
      // Don't log abort errors - they're expected when navigating away
      if (e instanceof Error && e.name === "AbortError") return;
      console.error(`Failed to generate image for ${character.name}:`, e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: phrase(dictionary, "charsheet_toast_image_failed", language),
        description: `${character.name}: ${errorMessage}`,
      });
      updateCharacter(id, "isGenerating", false);
    }

    setIsSaved(false);
  };

  const handleGenerateAll = async () => {
    for (const char of characters) {
      if (!char.imageBase64) {
        await handleGenerateCharacterSheet(char.id);
      }
    }
  };

  const handleEditImage = (
    characterId: string,
    currentImage: string
  ) => {
    if (!currentImage) return;

    const char = characters.find((c) => c.id === characterId);
    let promptText = "";
    if (char) {
      promptText = `${characterBasePrompt}\n\nCharacter: ${char.name}\nAppearance: ${char.appearance}\nClothing: ${char.clothing}`;
    }

    if (!promptText.includes(styleKeyword)) {
      promptText += `\n\nStyle: ${styleKeyword}`;
    }

    setEditingTarget({
      characterId,
      currentImage,
      initialPrompt: promptText,
    });
  };

  const handleSaveEditedImage = async (
    sketchBase64: string,
    finalPrompt: string,
    styleRef?: string
  ) => {
    if (!editingTarget) return;

    // Create new AbortController for this edit session
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setCharacters((prev) =>
      prev.map((c) =>
        c.id === editingTarget.characterId
          ? { ...c, isGenerating: true }
          : c
      )
    );

    try {
      const response = await fetch(
        "/api/generate_character_sheet/generate-from-sketch",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sketchBase64,
            prompt: finalPrompt,
            styleReferenceBase64: styleRef,
          }),
          signal: controller.signal,
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setCharacters((prev) =>
        prev.map((c) =>
          c.id === editingTarget.characterId
            ? { ...c, isGenerating: false, imageBase64: data.imageBase64 }
            : c
        )
      );

      // Auto-save edited image immediately
      await autoSaveImage(editingTarget.characterId, data.imageBase64, finalPrompt);

      setEditingTarget(null);
      setIsSaved(false);
    } catch (e) {
      // Don't log abort errors - they're expected when navigating away
      if (e instanceof Error && e.name === "AbortError") return;
      console.error("Edit failed", e);
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === editingTarget.characterId
            ? { ...c, isGenerating: false }
            : c
        )
      );
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: phrase(dictionary, "charsheet_toast_edit_failed", language),
        description: errorMessage,
      });
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // 1. Save all images to IndexedDB
      for (const char of characters) {
        if (char.imageBase64) {
          const imageId = `char_${char.id}`;
          await saveCharacterImage({
            id: imageId,
            type: "character_image",
            base64: char.imageBase64,
            mimeType: "image/jpeg",
            characterId: char.id,
            createdAt: Date.now(),
          });
        }
      }

      // 2. Create metadata (without base64)
      const metadata: CharacterSheetResultMetadata = {
        characters: characters.map((char) => ({
          id: char.id,
          name: char.name,
          appearance: char.appearance,
          clothing: char.clothing,
          personality: char.personality,
          backgroundStory: char.backgroundStory,
          imageId: char.imageBase64 ? `char_${char.id}` : "",
          imagePrompt: char.imagePrompt,
        })),
        styleKeyword,
        characterBasePrompt,
      };

      // 3. Save metadata to localStorage (small, won't exceed limit)
      localStorage.setItem("character_sheet_result", JSON.stringify(metadata));
      setStageResult(3, metadata);
      setCharacterSheetResult(metadata); // Update context so navigation uses new values
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
        description: phrase(dictionary, "charsheet_toast_save_failed_desc", language),
      });
    } finally {
      setIsSaving(false);
    }
  }, [characters, styleKeyword, characterBasePrompt, setStageResult, setCharacterSheetResult, toast, dictionary, language]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{phrase(dictionary, "charsheet_title", language)}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {phrase(dictionary, "charsheet_subtitle", language)}
        </p>
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

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {phrase(dictionary, "charsheet_reference_image", language)}
          </label>
          <label className="w-full cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 flex items-center justify-center transition duration-200 group">
            <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            <span className="ml-2 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 truncate text-sm">
              {referenceImageName || phrase(dictionary, "charsheet_upload_optional", language)}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleReferenceImageChange}
              className="hidden"
            />
          </label>
        </div>
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
          <div className="max-h-24 overflow-y-auto">
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
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {phrase(dictionary, "charsheet_analyze_text", language)}
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
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#DB2777] rounded-full"></span>
              {phrase(dictionary, "charsheet_characters", language)} ({characters.length})
            </h3>
            <div className="flex gap-2 flex-wrap">
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
                onClick={() => exportToCSV(characters)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>{phrase(dictionary, "charsheet_export_csv", language)}</span>
              </button>
              <button
                onClick={async () => {
                  setCharacters([]);
                  clearCharacterSheetAnalysis();
                  await clearCharacterImagesOnly();
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Character Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-1">
            {characters.map((char) => (
              <div
                key={char.id}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
              >
                {/* Image Section */}
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 group">
                  {char.imageBase64 ? (
                    <>
                      <img
                        src={`data:image/jpeg;base64,${char.imageBase64}`}
                        alt={char.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                        <button
                          onClick={() =>
                            downloadImage(
                              char.imageBase64,
                              `${char.name}_sheet.jpg`
                            )
                          }
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                          title={phrase(dictionary, "download", language)}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleEditImage(char.id, char.imageBase64)
                          }
                          className="p-1.5 bg-[#DB2777] hover:bg-[#BE185D] rounded-full text-white shadow-lg"
                          title={phrase(dictionary, "edit", language)}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  ) : char.isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#DB2777]"></div>
                      <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {phrase(dictionary, "charsheet_generating", language)}
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                      <ImageIcon className="w-8 h-8" />
                      <span className="mt-2 text-sm">{phrase(dictionary, "charsheet_no_image", language)}</span>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="p-4 space-y-3">
                  <EditableField
                    label={phrase(dictionary, "charsheet_character_name", language)}
                    value={char.name}
                    onChange={(v) => updateCharacter(char.id, "name", v)}
                  />
                  <EditableField
                    label={phrase(dictionary, "charsheet_appearance", language)}
                    value={char.appearance}
                    onChange={(v) => updateCharacter(char.id, "appearance", v)}
                  />
                  <EditableField
                    label={phrase(dictionary, "charsheet_clothing", language)}
                    value={char.clothing}
                    onChange={(v) => updateCharacter(char.id, "clothing", v)}
                  />
                  <EditableField
                    label={phrase(dictionary, "charsheet_personality", language)}
                    value={char.personality}
                    onChange={(v) => updateCharacter(char.id, "personality", v)}
                  />
                  <EditableField
                    label={phrase(dictionary, "charsheet_background_story", language)}
                    value={char.backgroundStory}
                    onChange={(v) => updateCharacter(char.id, "backgroundStory", v)}
                  />

                  <button
                    onClick={() => handleGenerateCharacterSheet(char.id)}
                    disabled={char.isGenerating}
                    className="w-full mt-2 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {char.imageBase64
                      ? phrase(dictionary, "charsheet_regenerate_sheet", language)
                      : phrase(dictionary, "charsheet_generate_sheet", language)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      <CharacterSheetImageEditor
        isOpen={!!editingTarget}
        initialImage={editingTarget?.currentImage || null}
        initialPrompt={editingTarget?.initialPrompt || ""}
        onClose={() => setEditingTarget(null)}
        onSave={handleSaveEditedImage}
      />
    </div>
  );
}

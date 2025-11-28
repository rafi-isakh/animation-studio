"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Image as ImageIcon,
  Check,
  Download,
  Save,
} from "lucide-react";
import {
  getAllBgImages,
  saveNanoBananaImage,
  getNanoBananaImage,
} from "../services/mithrilIndexedDB";
import type { ReferenceImage, NanoBananaResultMetadata } from "./types";
import { ASPECT_RATIOS } from "./types";
import Image from "next/image";

const STORAGE_KEY = "nano_banana_result";

const Loader: React.FC<{ message?: string }> = ({
  message = "Generating image...",
}) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

const downloadImage = (base64: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = `data:image/jpeg;base64,${base64}`;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function NanoBananaGenerator() {
  const { setStageResult } = useMithril();
  const { toast } = useToast();

  // Loading state
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Reference images from BgSheetGenerator (IndexedDB)
  const [availableReferences, setAvailableReferences] = useState<
    ReferenceImage[]
  >([]);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<Set<string>>(
    new Set()
  );

  // Form inputs
  const [stylePrompt, setStylePrompt] = useState<string>(
    "2D anime style, clean linework, soft cel shading, vibrant colors"
  );
  const [scenePrompt, setScenePrompt] = useState<string>("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load reference images from IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all background images from IndexedDB
        const allImages = await getAllBgImages();

        // Group by bgId to get background names from localStorage
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

        // Convert to ReferenceImage format
        const references: ReferenceImage[] = allImages.map((img) => ({
          id: img.id,
          bgId: img.bgId,
          bgName: bgNameMap[img.bgId] || `Background ${img.bgId.slice(0, 6)}`,
          angle: img.angle,
          base64: img.base64,
          mimeType: img.mimeType,
          selected: false,
        }));

        setAvailableReferences(references);

        // Load previously saved result
        const savedResult = localStorage.getItem(STORAGE_KEY);
        if (savedResult) {
          try {
            const metadata: NanoBananaResultMetadata = JSON.parse(savedResult);
            setStylePrompt(metadata.stylePrompt);
            setScenePrompt(metadata.scenePrompt);
            setAspectRatio(metadata.aspectRatio);
            setSelectedReferenceIds(new Set(metadata.referenceImageIds));

            // Load generated image from IndexedDB
            if (metadata.generatedImageId) {
              const savedImage = await getNanoBananaImage(
                metadata.generatedImageId
              );
              if (savedImage) {
                setGeneratedImage(savedImage.base64);
                setIsSaved(true);
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      } catch (err) {
        console.error("Error loading reference images:", err);
        toast({
          title: "Error",
          description: "Failed to load reference images from database.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [toast]);

  // Toggle reference image selection
  const toggleReferenceSelection = (id: string) => {
    setSelectedReferenceIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    setIsSaved(false);
  };

  // Combined prompt preview
  const combinedPrompt = useMemo(() => {
    const parts: string[] = [];

    if (stylePrompt.trim()) {
      parts.push(stylePrompt.trim());
    }

    if (scenePrompt.trim()) {
      parts.push(scenePrompt.trim());
    }

    if (selectedReferenceIds.size > 0) {
      const selectedRefs = availableReferences.filter((ref) =>
        selectedReferenceIds.has(ref.id)
      );
      const refDescriptions = selectedRefs
        .map((ref) => `${ref.bgName} (${ref.angle})`)
        .join(", ");
      parts.push(`Reference backgrounds: ${refDescriptions}`);
    }

    return parts.join(". ") || "Enter prompts above to preview...";
  }, [stylePrompt, scenePrompt, selectedReferenceIds, availableReferences]);

  // Generate image
  const handleGenerate = useCallback(async () => {
    // At least one of style prompt, scene prompt, or reference images is needed
    if (
      !stylePrompt.trim() &&
      !scenePrompt.trim() &&
      selectedReferenceIds.size === 0
    ) {
      setError("Please enter a prompt or select reference images.");
      return;
    }

    setIsGenerating(true);
    setError("");
    setIsSaved(false);

    try {
      // Build prompt with style and scene
      const promptParts: string[] = [];
      if (stylePrompt.trim()) {
        promptParts.push(stylePrompt.trim());
      }
      if (scenePrompt.trim()) {
        promptParts.push(scenePrompt.trim());
      }
      const fullPrompt = promptParts.join(". ");

      // Get selected reference images
      const selectedRefs = availableReferences.filter((ref) =>
        selectedReferenceIds.has(ref.id)
      );

      // Prepare request body for NanoBanana API
      const requestBody: {
        prompt: string;
        aspectRatio: string;
        references?: {
          backgrounds: { base64: string; mimeType: string }[];
          characters: { base64: string; mimeType: string }[];
        };
      } = {
        prompt: fullPrompt,
        aspectRatio: aspectRatio,
      };

      // Add reference images as backgrounds
      if (selectedRefs.length > 0) {
        requestBody.references = {
          backgrounds: selectedRefs.map((ref) => ({
            base64: ref.base64,
            mimeType: ref.mimeType,
          })),
          characters: [],
        };
      }

      const response = await fetch("/api/nano_banana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setGeneratedImage(data.imageBase64);

      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    stylePrompt,
    scenePrompt,
    aspectRatio,
    selectedReferenceIds,
    availableReferences,
    toast,
  ]);

  // Save result to IndexedDB and localStorage
  const handleSave = useCallback(async () => {
    if (!generatedImage) {
      toast({
        title: "Nothing to save",
        description: "Generate an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const resultId = crypto.randomUUID();
      const imageId = `nano_banana_${resultId}`;

      // Save image to IndexedDB
      await saveNanoBananaImage({
        id: imageId,
        type: "nano_banana_image",
        base64: generatedImage,
        mimeType: "image/jpeg",
        resultId: resultId,
        createdAt: Date.now(),
      });

      // Save metadata to localStorage
      const metadata: NanoBananaResultMetadata = {
        id: resultId,
        stylePrompt,
        scenePrompt,
        aspectRatio,
        referenceImageIds: Array.from(selectedReferenceIds),
        combinedPrompt,
        generatedImageId: imageId,
        createdAt: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));

      // Update stage result for Mithril context
      setStageResult(5, metadata);

      setIsSaved(true);
      toast({
        title: "Saved",
        description: "Result saved successfully!",
      });
    } catch (err) {
      console.error("Error saving result:", err);
      toast({
        title: "Error",
        description: "Failed to save result.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    generatedImage,
    stylePrompt,
    scenePrompt,
    aspectRatio,
    selectedReferenceIds,
    combinedPrompt,
    setStageResult,
    toast,
  ]);

  // Download generated image
  const handleDownload = () => {
    if (generatedImage) {
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      downloadImage(generatedImage, `nano_banana_${timestamp}.jpg`);
    }
  };

  if (isLoadingData) {
    return (
      <div className="w-full p-6">
        <Loader message="Loading data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Nano Banana Generator
        </h2>
        {isSaved && (
          <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <Check size={16} /> Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          {/* Style Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Style Prompt
            </label>
            <textarea
              value={stylePrompt}
              onChange={(e) => {
                setStylePrompt(e.target.value);
                setIsSaved(false);
              }}
              placeholder="Enter style keywords (e.g., 2D anime, watercolor, etc.)"
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none transition resize-none"
              rows={2}
              disabled={isGenerating}
            />
          </div>

          {/* Reference Image Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reference Images from Bg Sheet Generator
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                ({selectedReferenceIds.size} selected)
              </span>
            </label>
            {availableReferences.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
                <p>No reference images available.</p>
                <p className="text-xs mt-1">
                  Generate backgrounds in Bg Sheet Generator first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {availableReferences.map((ref) => (
                  <div
                    key={ref.id}
                    onClick={() =>
                      !isGenerating && toggleReferenceSelection(ref.id)
                    }
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-3 transition-all ${
                      selectedReferenceIds.has(ref.id)
                        ? "border-[#DB2777] ring-2 ring-[#DB2777]/50"
                        : "border-transparent hover:border-gray-400"
                    } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="relative w-full aspect-video">
                      <Image
                        src={`data:${ref.mimeType};base64,${ref.base64}`}
                        alt={`${ref.bgName} - ${ref.angle}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    {selectedReferenceIds.has(ref.id) && (
                      <div className="absolute top-2 right-2 bg-[#DB2777] text-white rounded-full p-1">
                        <Check size={16} />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                      {ref.bgName} - {ref.angle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scene Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scene Prompt
            </label>
            <textarea
              value={scenePrompt}
              onChange={(e) => {
                setScenePrompt(e.target.value);
                setIsSaved(false);
              }}
              placeholder="Describe the scene you want to generate..."
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none transition resize-none"
              rows={4}
              disabled={isGenerating}
            />
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => {
                    setAspectRatio(ratio.value);
                    setIsSaved(false);
                  }}
                  disabled={isGenerating}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    aspectRatio === ratio.value
                      ? "bg-[#DB2777] text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {ratio.value}
                </button>
              ))}
            </div>
          </div>

          {/* Combined Prompt Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Combined Prompt Preview
            </label>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
              {combinedPrompt}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              (!stylePrompt.trim() &&
                !scenePrompt.trim() &&
                selectedReferenceIds.size === 0)
            }
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#DB2777] hover:bg-[#BE185D] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate Image
              </>
            )}
          </button>
        </div>

        {/* Right Column - Output */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Generated Result
          </label>

          <div
            className="bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{
              aspectRatio: aspectRatio.replace(":", "/"),
            }}
          >
            {isGenerating ? (
              <Loader message="AI is generating your image..." />
            ) : generatedImage ? (
              <div className="relative w-full h-full">
                <Image
                  src={`data:image/jpeg;base64,${generatedImage}`}
                  alt="Generated result"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <ImageIcon size={48} className="mb-2 opacity-50" />
                <p className="text-sm">Generated image will appear here</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {generatedImage && !isGenerating && (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : isSaved ? (
                  <>
                    <Check size={18} />
                    Saved
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Result
                  </>
                )}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Download size={18} />
                Download
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

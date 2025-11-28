"use client";

import { useState, useEffect, useCallback } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Download,
  Image as ImageIcon,
  Pencil,
  Save,
  FileDown,
  Trash2,
} from "lucide-react";
import BgSheetImageEditor from "./BgSheetImageEditor";
import type {
  Background,
  BgSheetResultMetadata,
} from "./types";
import { saveBgImage, getBgImage, clearAllData } from "../services/mithrilIndexedDB";

const BACKGROUND_ANGLES = [
  "Front View",
  "Side View (Left)",
  "Side View (Right)",
  "Rear View",
  "Low Angle",
  "High Angle",
  "Wide Shot",
  "Close-up Detail",
];

const angleToDetailedPrompt: Record<string, string> = {
  "Front View":
    "A direct, symmetrical view of the room. The composition is balanced.",
  "Side View (Left)":
    "A view of the same room from the left wall, looking across to the right.",
  "Side View (Right)":
    "A view of the same room from the right wall, looking across to the left.",
  "Rear View":
    "A view from the back of the room looking towards the entrance/front, showing the reverse perspective.",
  "Low Angle":
    "A view from near the floor looking slightly upward, making the ceiling and tall objects prominent.",
  "High Angle":
    "A view from the ceiling looking down, showing the floor plan layout.",
  "Wide Shot": "A wide-angle view capturing the entire room in one frame.",
  "Close-up Detail":
    "A close focus on a specific architectural detail or furniture piece in this room.",
};

const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      AI is analyzing the story...
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

const exportToCSV = (backgrounds: Background[]): void => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Type,Name,Description,Image Angle,Image Prompt\n";
  backgrounds.forEach((bg) => {
    if (bg.images.length > 0) {
      bg.images.forEach((img) => {
        const row = [
          "Background",
          escapeCsvField(bg.name),
          escapeCsvField(bg.description),
          escapeCsvField(img.angle),
          escapeCsvField(img.prompt),
        ].join(",");
        csvContent += row + "\n";
      });
    } else {
      const row = [
        "Background",
        escapeCsvField(bg.name),
        escapeCsvField(bg.description),
        "",
        "",
      ].join(",");
      csvContent += row + "\n";
    }
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "bg_sheet_data.csv");
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

export default function BgSheetGenerator() {
  const { setStageResult, bgSheetGenerator, startBgSheetAnalysis, clearBgSheetAnalysis } = useMithril();
  const { toast } = useToast();
  const { isAnalyzing, error: analysisError } = bgSheetGenerator;

  // State from Stage 1
  const [originalText, setOriginalText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  // Main state
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [error, setError] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Global settings
  const [styleKeyword, setStyleKeyword] = useState<string>(
    "2020 Japanese Anime Style, Pastel Color"
  );
  const [backgroundBasePrompt, setBackgroundBasePrompt] = useState<string>(
    "2D anime background art, clean linework, soft cel shading with gradients, bright and vibrant colors, clean anime aesthetic."
  );
  const [referenceImageName, setReferenceImageName] = useState<string>("");

  // Editor state
  const [editingTarget, setEditingTarget] = useState<{
    bgId: string;
    imageIndex: number;
    currentImage: string;
    initialPrompt: string;
  } | null>(null);

  // Load text from localStorage (from Stage 1) and saved results
  useEffect(() => {
    const savedContent = localStorage.getItem("chapter");
    const savedFileName = localStorage.getItem("chapter_filename");
    if (savedContent) {
      setOriginalText(savedContent);
      setFileName(savedFileName || "uploaded_file.txt");
    }

    // Load previously saved result if exists
    const loadSavedData = async () => {
      const savedResult = localStorage.getItem("bg_sheet_result");
      if (savedResult) {
        try {
          const metadata: BgSheetResultMetadata = JSON.parse(savedResult);

          // Reconstruct backgrounds with images from IndexedDB
          const backgroundsWithImages: Background[] = await Promise.all(
            metadata.backgrounds.map(async (bgMeta) => {
              const images = await Promise.all(
                bgMeta.images.map(async (imgMeta) => {
                  let imageBase64 = "";
                  if (imgMeta.imageId) {
                    const dbImage = await getBgImage(imgMeta.imageId);
                    imageBase64 = dbImage?.base64 || "";
                  }
                  return {
                    angle: imgMeta.angle,
                    prompt: imgMeta.prompt,
                    imageBase64,
                    isGenerating: false,
                  };
                })
              );
              return {
                id: bgMeta.id,
                name: bgMeta.name,
                description: bgMeta.description,
                images,
              };
            })
          );

          setBackgrounds(backgroundsWithImages);
          setStyleKeyword(metadata.styleKeyword);
          setBackgroundBasePrompt(metadata.backgroundBasePrompt);
          setIsSaved(true);
        } catch {
          // Ignore parse errors
        }
      }
      setIsLoadingData(false);
    };

    loadSavedData();
  }, []);

  const handleReferenceImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setReferenceImageName(file.name);
    }
  };

  const handleAnalyze = useCallback(async () => {
    setError("");
    setIsSaved(false);

    const result = await startBgSheetAnalysis(originalText, styleKeyword, backgroundBasePrompt);

    if (result.length > 0) {
      setBackgrounds(result);
      setStageResult(4, { backgrounds: result, styleKeyword, backgroundBasePrompt });
      setIsSaved(true);
    } else if (analysisError) {
      setError(analysisError);
    }
  }, [originalText, styleKeyword, backgroundBasePrompt, startBgSheetAnalysis, setStageResult, analysisError]);

  const updateBackground = (
    id: string,
    field: keyof Background,
    value: string
  ) => {
    setBackgrounds((bgs) =>
      bgs.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
    setIsSaved(false);
  };

  const handleGenerateBackgroundSheet = async (id: string) => {
    const background = backgrounds.find((b) => b.id === id);
    if (!background) return;

    let referenceDescription = background.description;

    // Generate first image if not exists
    if (!background.images[0].imageBase64) {
      const firstImageIdx = 0;
      const imageInfo = background.images[firstImageIdx];

      setBackgrounds((prevBgs) =>
        prevBgs.map((bg) =>
          bg.id === id
            ? {
                ...bg,
                images: bg.images.map((img, idx) =>
                  idx === firstImageIdx ? { ...img, isGenerating: true } : img
                ),
              }
            : bg
        )
      );

      const detailedAngleInstruction =
        angleToDetailedPrompt[imageInfo.angle] || imageInfo.angle;
      const prompt = `${backgroundBasePrompt} ${detailedAngleInstruction} of a ${background.name}. Description: ${background.description}. Additional Style: ${styleKeyword}. EMPTY SCENE, NO CHARACTERS, NO PEOPLE.`;

      setBackgrounds((prevBgs) =>
        prevBgs.map((bg) =>
          bg.id === id
            ? {
                ...bg,
                images: bg.images.map((img, idx) =>
                  idx === firstImageIdx ? { ...img, prompt } : img
                ),
              }
            : bg
        )
      );

      try {
        const response = await fetch("/api/generate_bg_sheet/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, aspectRatio: "16:9" }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        const newImageBase64 = data.imageBase64;

        setBackgrounds((prevBgs) =>
          prevBgs.map((bg) =>
            bg.id === id
              ? {
                  ...bg,
                  images: bg.images.map((img, idx) =>
                    idx === firstImageIdx
                      ? { ...img, imageBase64: newImageBase64 }
                      : img
                  ),
                }
              : bg
          )
        );

        // Analyze for consistency
        const consistencyResponse = await fetch(
          "/api/generate_bg_sheet/analyze-consistency",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: newImageBase64 }),
          }
        );

        const consistencyData = await consistencyResponse.json();
        if (consistencyData.analysis) {
          referenceDescription = consistencyData.analysis;
        }
      } catch (e: unknown) {
        console.error(`Failed to generate base image for ${background.name}:`, e);
        setBackgrounds((prevBgs) =>
          prevBgs.map((bg) =>
            bg.id === id
              ? {
                  ...bg,
                  images: bg.images.map((img, idx) =>
                    idx === firstImageIdx ? { ...img, isGenerating: false } : img
                  ),
                }
              : bg
          )
        );
        return;
      } finally {
        setBackgrounds((prevBgs) =>
          prevBgs.map((bg) =>
            bg.id === id
              ? {
                  ...bg,
                  images: bg.images.map((img, idx) =>
                    idx === firstImageIdx ? { ...img, isGenerating: false } : img
                  ),
                }
              : bg
          )
        );
      }
    } else {
      // Analyze existing first image for consistency
      const consistencyResponse = await fetch(
        "/api/generate_bg_sheet/analyze-consistency",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: background.images[0].imageBase64 }),
        }
      );

      const consistencyData = await consistencyResponse.json();
      if (consistencyData.analysis) {
        referenceDescription = consistencyData.analysis;
      }
    }

    // Generate remaining images
    const remainingIndices = background.images
      .map((img, idx) => ({ img, idx }))
      .filter((item) => !item.img.imageBase64 && item.idx !== 0);

    for (const { img, idx } of remainingIndices) {
      setBackgrounds((prevBgs) =>
        prevBgs.map((bg) =>
          bg.id === id
            ? {
                ...bg,
                images: bg.images.map((i, iIdx) =>
                  iIdx === idx ? { ...i, isGenerating: true } : i
                ),
              }
            : bg
        )
      );

      const detailedAngleInstruction =
        angleToDetailedPrompt[img.angle] || img.angle;

      const prompt = `${backgroundBasePrompt} ${detailedAngleInstruction} of ${background.name}.

        PHYSICAL CONSISTENCY RULES (MUST MATCH):
        ${referenceDescription}

        Additional Style: ${styleKeyword}.
        EMPTY SCENE, NO CHARACTERS, NO PEOPLE.`;

      setBackgrounds((prevBgs) =>
        prevBgs.map((bg) =>
          bg.id === id
            ? {
                ...bg,
                images: bg.images.map((i, iIdx) =>
                  iIdx === idx ? { ...i, prompt } : i
                ),
              }
            : bg
        )
      );

      try {
        const response = await fetch("/api/generate_bg_sheet/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, aspectRatio: "16:9" }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        setBackgrounds((prevBgs) =>
          prevBgs.map((bg) =>
            bg.id === id
              ? {
                  ...bg,
                  images: bg.images.map((i, iIdx) =>
                    iIdx === idx ? { ...i, imageBase64: data.imageBase64 } : i
                  ),
                }
              : bg
          )
        );
      } catch (e) {
        console.error(`Failed to generate ${img.angle} for ${background.name}`, e);
      } finally {
        setBackgrounds((prevBgs) =>
          prevBgs.map((bg) =>
            bg.id === id
              ? {
                  ...bg,
                  images: bg.images.map((i, iIdx) =>
                    iIdx === idx ? { ...i, isGenerating: false } : i
                  ),
                }
              : bg
          )
        );
      }
    }

    setIsSaved(false);
  };

  const handleGenerateAll = async () => {
    for (const bg of backgrounds) {
      const needsGeneration = bg.images.some((img) => !img.imageBase64);
      if (needsGeneration) {
        await handleGenerateBackgroundSheet(bg.id);
      }
    }
  };

  const handleEditImage = (
    bgId: string,
    imageIndex: number,
    currentImage: string
  ) => {
    if (!currentImage) return;

    const bg = backgrounds.find((b) => b.id === bgId);
    let promptText = "";
    if (bg) {
      promptText = `${backgroundBasePrompt}\n\nBackground: ${bg.name}\nDescription: ${bg.description}`;
    }

    if (!promptText.includes(styleKeyword)) {
      promptText += `\n\nStyle: ${styleKeyword}`;
    }

    setEditingTarget({
      bgId,
      imageIndex,
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

    setBackgrounds((prev) =>
      prev.map((b) =>
        b.id === editingTarget.bgId
          ? {
              ...b,
              images: b.images.map((img, i) =>
                i === editingTarget.imageIndex
                  ? { ...img, isGenerating: true }
                  : img
              ),
            }
          : b
      )
    );

    try {
      const response = await fetch(
        "/api/generate_bg_sheet/generate-from-sketch",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sketchBase64,
            prompt: finalPrompt,
            styleReferenceBase64: styleRef,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setBackgrounds((prev) =>
        prev.map((b) =>
          b.id === editingTarget.bgId
            ? {
                ...b,
                images: b.images.map((img, i) =>
                  i === editingTarget.imageIndex
                    ? { ...img, isGenerating: false, imageBase64: data.imageBase64 }
                    : img
                ),
              }
            : b
        )
      );
      setEditingTarget(null);
      setIsSaved(false);
    } catch (e) {
      console.error("Edit failed", e);
      setBackgrounds((prev) =>
        prev.map((b) =>
          b.id === editingTarget.bgId
            ? {
                ...b,
                images: b.images.map((img, i) =>
                  i === editingTarget.imageIndex
                    ? { ...img, isGenerating: false }
                    : img
                ),
              }
            : b
        )
      );
      alert("Failed to edit image. Please try again.");
    }
  };

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // 1. Save all images to IndexedDB
      for (const bg of backgrounds) {
        for (const img of bg.images) {
          if (img.imageBase64) {
            const imageId = `bg_${bg.id}_${img.angle.replace(/ /g, "_").replace(/[()]/g, "")}`;
            await saveBgImage({
              id: imageId,
              type: "bg_image",
              base64: img.imageBase64,
              mimeType: "image/jpeg",
              bgId: bg.id,
              angle: img.angle,
              createdAt: Date.now(),
            });
          }
        }
      }

      // 2. Create metadata (without base64)
      const metadata: BgSheetResultMetadata = {
        backgrounds: backgrounds.map((bg) => ({
          id: bg.id,
          name: bg.name,
          description: bg.description,
          images: bg.images.map((img) => ({
            angle: img.angle,
            prompt: img.prompt,
            imageId: img.imageBase64
              ? `bg_${bg.id}_${img.angle.replace(/ /g, "_").replace(/[()]/g, "")}`
              : "",
          })),
        })),
        styleKeyword,
        backgroundBasePrompt,
      };

      // 3. Save metadata to localStorage (small, won't exceed limit)
      localStorage.setItem("bg_sheet_result", JSON.stringify(metadata));
      setStageResult(4, metadata);
      setIsSaved(true);
      toast({
        variant: "success",
        title: "Saved",
        description: "Background sheet results saved successfully.",
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save results.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [backgrounds, styleKeyword, backgroundBasePrompt, setStageResult, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Background Sheet Generator</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          AI extracts backgrounds from your story and generates multi-angle views
        </p>
      </div>

      {/* Loading State */}
      {isLoadingData && (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#DB2777]"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading saved backgrounds...
          </p>
        </div>
      )}

      {/* Global Configuration */}
      {!isLoadingData && (
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="w-1 h-4 bg-[#DB2777] rounded-full"></span>
          Global Configuration
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Background Base Prompt
          </label>
          <textarea
            value={backgroundBasePrompt}
            onChange={(e) => {
              setBackgroundBasePrompt(e.target.value);
              setIsSaved(false);
            }}
            rows={2}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm resize-none"
            placeholder="Base prompt for backgrounds..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Style Keywords (Applied to all)
          </label>
          <input
            type="text"
            value={styleKeyword}
            onChange={(e) => {
              setStyleKeyword(e.target.value);
              setIsSaved(false);
            }}
            placeholder="e.g., anime style, photorealistic, watercolor"
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            Reference Image (for Aspect Ratio)
          </label>
          <label className="w-full cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 flex items-center justify-center transition duration-200 group">
            <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            <span className="ml-2 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 truncate text-sm">
              {referenceImageName || "Upload Image (Optional)"}
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
              {originalText.length.toLocaleString()} characters
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
            Please upload a text file in Stage 1 first.
          </p>
        </div>
      ))}

      {/* Analyze Button */}
      {!isLoadingData && originalText && !isAnalyzing && backgrounds.length === 0 && (
        <div className="text-center">
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mx-auto"
          >
            <Sparkles className="w-5 h-5" />
            Analyze Text
          </button>
        </div>
      )}

      {/* Error Display */}
      {!isLoadingData && error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Loader */}
      {!isLoadingData && isAnalyzing && <Loader />}

      {/* Results */}
      {!isLoadingData && backgrounds.length > 0 && !isAnalyzing && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#DB2777] rounded-full"></span>
              Backgrounds ({backgrounds.length})
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
                <span>{isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}</span>
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate All</span>
              </button>
              <button
                onClick={() => exportToCSV(backgrounds)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={async () => {
                  setBackgrounds([]);
                  clearBgSheetAnalysis();
                  await clearAllData();
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                {/* <span>Clear</span> */}
              </button>
            </div>
          </div>

          {/* Background Cards */}
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {backgrounds.map((bg) => (
              <div
                key={bg.id}
                className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-4"
              >
                {/* Editable Fields */}
                <div className="grid grid-cols-1 gap-3">
                  <EditableField
                    label="Location Name"
                    value={bg.name}
                    onChange={(v) => updateBackground(bg.id, "name", v)}
                  />
                  <EditableField
                    label="Visual Description"
                    value={bg.description}
                    onChange={(v) => updateBackground(bg.id, "description", v)}
                  />
                </div>

                {/* Generate Button */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference Views
                  </h4>
                  <button
                    onClick={() => handleGenerateBackgroundSheet(bg.id)}
                    className="text-xs bg-[#DB2777]/10 text-[#DB2777] px-3 py-1 rounded-full hover:bg-[#DB2777]/20 border border-[#DB2777]/20 transition-colors"
                  >
                    Generate All Views
                  </button>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {bg.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 aspect-video"
                    >
                      {img.imageBase64 ? (
                        <>
                          <img
                            src={`data:image/jpeg;base64,${img.imageBase64}`}
                            alt={img.angle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                            <button
                              onClick={() =>
                                downloadImage(
                                  img.imageBase64,
                                  `${bg.name}_${img.angle}.jpg`
                                )
                              }
                              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleEditImage(bg.id, idx, img.imageBase64)
                              }
                              className="p-1.5 bg-[#DB2777] hover:bg-[#BE185D] rounded-full text-white shadow-lg"
                              title="Edit"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      ) : img.isGenerating ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#DB2777]"></div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs p-2 text-center">
                          {img.angle}
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pointer-events-none">
                        <span className="text-[10px] font-medium text-white">
                          {img.angle}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Editor Modal */}
      <BgSheetImageEditor
        isOpen={!!editingTarget}
        initialImage={editingTarget?.currentImage || null}
        initialPrompt={editingTarget?.initialPrompt || ""}
        onClose={() => setEditingTarget(null)}
        onSave={handleSaveEditedImage}
      />
    </div>
  );
}

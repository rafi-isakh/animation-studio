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
  CloudUpload,
  CloudDownload,
} from "lucide-react";
import BgSheetImageEditor from "./BgSheetImageEditor";
import type { Background, BgSheetResultMetadata } from "./types";
import { saveBgImage, getBgImage, clearBgImagesOnly, getAllBgImages } from "../services/mithrilIndexedDB";

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

interface LoaderProps {
  dictionary: Dictionary;
  language: Language;
}

const Loader: React.FC<LoaderProps> = ({ dictionary, language }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {phrase(dictionary, "bgsheet_ai_analyzing", language)}
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
  const { setStageResult, bgSheetGenerator, startBgSheetAnalysis, clearBgSheetAnalysis, setBgSheetResult, customApiKey } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();
  const { isAnalyzing, error: analysisError, result: contextResult } = bgSheetGenerator;

  // State from Stage 1
  const [originalText, setOriginalText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  // Main state
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [error, setError] = useState<string>("");
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // S3 states
  const [isSavingToS3, setIsSavingToS3] = useState(false);
  const [isLoadingFromS3, setIsLoadingFromS3] = useState(false);

  // Use ref to track hydration to avoid triggering re-renders
  const hasHydratedRef = useRef<boolean>(false);

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
        // Reconstruct backgrounds with images from IndexedDB
        const backgroundsWithImages: Background[] = await Promise.all(
          contextResult.backgrounds.map(async (bgMeta) => {
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

        // Mark as hydrated BEFORE setting state to prevent re-runs
        hasHydratedRef.current = true;

        setBackgrounds(backgroundsWithImages);
        setStyleKeyword(contextResult.styleKeyword);
        setBackgroundBasePrompt(contextResult.backgroundBasePrompt);
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
    bgId: string,
    angle: string,
    imageBase64: string,
    prompt: string
  ) => {
    try {
      // 1. Save image to IndexedDB
      const imageId = `bg_${bgId}_${angle.replace(/ /g, "_").replace(/[()]/g, "")}`;
      await saveBgImage({
        id: imageId,
        type: "bg_image",
        base64: imageBase64,
        mimeType: "image/jpeg",
        bgId: bgId,
        angle: angle,
        createdAt: Date.now(),
      });

      // 2. Update localStorage metadata
      const existingMeta = localStorage.getItem("bg_sheet_result");
      if (existingMeta) {
        const meta = JSON.parse(existingMeta) as BgSheetResultMetadata;
        const bgIndex = meta.backgrounds.findIndex((bg) => bg.id === bgId);
        if (bgIndex !== -1) {
          const imgIndex = meta.backgrounds[bgIndex].images.findIndex(
            (img) => img.angle === angle
          );
          if (imgIndex !== -1) {
            meta.backgrounds[bgIndex].images[imgIndex].imageId = imageId;
            meta.backgrounds[bgIndex].images[imgIndex].prompt = prompt;
          }
        }
        localStorage.setItem("bg_sheet_result", JSON.stringify(meta));

        // 3. Update context state so navigation works without manual save
        setBgSheetResult(meta);
      }
    } catch (error) {
      console.error("Auto-save failed for image:", error);
    }
  }, [setBgSheetResult]);

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

    // Create new AbortController for this generation session
    abortControllerRef.current?.abort(); // Cancel any previous generation
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

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
          body: JSON.stringify({ prompt, aspectRatio: "16:9", customApiKey: customApiKey || undefined }),
          signal,
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

        // Auto-save first image immediately
        await autoSaveImage(background.id, imageInfo.angle, newImageBase64, prompt);

        // Analyze for consistency
        const consistencyResponse = await fetch(
          "/api/generate_bg_sheet/analyze-consistency",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: newImageBase64 }),
            signal,
          }
        );

        const consistencyData = await consistencyResponse.json();
        if (consistencyData.analysis) {
          referenceDescription = consistencyData.analysis;
        }
      } catch (e: unknown) {
        // Don't log abort errors - they're expected when navigating away
        if (e instanceof Error && e.name === "AbortError") return;
        console.error(`Failed to generate base image for ${background.name}:`, e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
        toast({
          variant: "destructive",
          title: phrase(dictionary, "bgsheet_toast_image_failed", language),
          description: `${background.name}: ${errorMessage}`,
        });
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
      try {
        const consistencyResponse = await fetch(
          "/api/generate_bg_sheet/analyze-consistency",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: background.images[0].imageBase64 }),
            signal,
          }
        );

        const consistencyData = await consistencyResponse.json();
        if (consistencyData.analysis) {
          referenceDescription = consistencyData.analysis;
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        console.error("Failed to analyze consistency:", e);
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
          body: JSON.stringify({ prompt, aspectRatio: "16:9", customApiKey: customApiKey || undefined }),
          signal,
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

        // Auto-save each remaining image immediately after generation
        await autoSaveImage(background.id, img.angle, data.imageBase64, prompt);
      } catch (e) {
        // Don't log abort errors - they're expected when navigating away
        if (e instanceof Error && e.name === "AbortError") return;
        console.error(`Failed to generate ${img.angle} for ${background.name}`, e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
        toast({
          variant: "destructive",
          title: phrase(dictionary, "bgsheet_toast_image_failed", language),
          description: `${background.name} (${img.angle}): ${errorMessage}`,
        });
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

    // Create new AbortController for this edit session
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
            customApiKey: customApiKey || undefined,
          }),
          signal: controller.signal,
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

      // Auto-save edited image immediately
      const editedBg = backgrounds.find((b) => b.id === editingTarget.bgId);
      if (editedBg) {
        const editedAngle = editedBg.images[editingTarget.imageIndex]?.angle;
        if (editedAngle) {
          await autoSaveImage(editingTarget.bgId, editedAngle, data.imageBase64, finalPrompt);
        }
      }

      setEditingTarget(null);
      setIsSaved(false);
    } catch (e) {
      // Don't log abort errors - they're expected when navigating away
      if (e instanceof Error && e.name === "AbortError") return;
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
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: phrase(dictionary, "bgsheet_toast_edit_failed", language),
        description: errorMessage,
      });
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
      setBgSheetResult(metadata); // Update context so navigation uses new values
      setIsSaved(true);
      toast({
        variant: "success",
        title: phrase(dictionary, "bgsheet_toast_saved", language),
        description: phrase(dictionary, "bgsheet_toast_saved_desc", language),
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        variant: "destructive",
        title: phrase(dictionary, "bgsheet_toast_save_failed", language),
        description: phrase(dictionary, "bgsheet_toast_save_failed_desc", language),
      });
    } finally {
      setIsSaving(false);
    }
  }, [backgrounds, styleKeyword, backgroundBasePrompt, setStageResult, setBgSheetResult, toast, dictionary, language]);

  // Save session to S3
  const handleSaveToS3 = useCallback(async () => {
    setIsSavingToS3(true);

    try {
      // Collect data from localStorage
      const bgSheetResult = localStorage.getItem("bg_sheet_result");

      // Collect images from IndexedDB
      const bgImages = await getAllBgImages();

      const sessionData = {
        version: "1.0",
        savedAt: Date.now(),
        bgSheetResult: bgSheetResult ? JSON.parse(bgSheetResult) : null,
        bgImages,
        styleKeyword,
        backgroundBasePrompt,
      };

      const response = await fetch("/api/mithril_session/bgsheet/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save to S3");
      }

      toast({
        title: phrase(dictionary, "sora_toast_success", language),
        description: phrase(dictionary, "bgsheet_toast_s3_saved", language),
      });
    } catch (error) {
      console.error("Error saving to S3:", error);
      toast({
        title: phrase(dictionary, "sora_toast_error", language),
        description: error instanceof Error ? error.message : phrase(dictionary, "bgsheet_toast_s3_error", language),
        variant: "destructive",
      });
    } finally {
      setIsSavingToS3(false);
    }
  }, [toast, dictionary, language, styleKeyword, backgroundBasePrompt]);

  // Load session from S3
  const handleLoadFromS3 = useCallback(async () => {
    setIsLoadingFromS3(true);

    try {
      const response = await fetch("/api/mithril_session/bgsheet/load");

      if (response.status === 404) {
        toast({
          title: phrase(dictionary, "sora_toast_error", language),
          description: phrase(dictionary, "bgsheet_toast_s3_no_session", language),
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load from S3");
      }

      const { sessionData } = await response.json();

      // Restore localStorage data
      if (sessionData.bgSheetResult) {
        localStorage.setItem("bg_sheet_result", JSON.stringify(sessionData.bgSheetResult));
      }

      // Clear existing IndexedDB images before restoring
      await clearBgImagesOnly();

      // Restore IndexedDB images
      if (sessionData.bgImages && Array.isArray(sessionData.bgImages)) {
        for (const img of sessionData.bgImages) {
          if (img.base64) {
            await saveBgImage(img);
          }
        }
      }

      toast({
        title: phrase(dictionary, "sora_toast_success", language),
        description: phrase(dictionary, "bgsheet_toast_s3_loaded", language),
      });

      // Save current stage to sessionStorage before reload
      sessionStorage.setItem("mithril_restore_stage", "4");
      window.location.reload();
    } catch (error) {
      console.error("Error loading from S3:", error);
      toast({
        title: phrase(dictionary, "sora_toast_error", language),
        description: error instanceof Error ? error.message : phrase(dictionary, "bgsheet_toast_s3_no_session", language),
        variant: "destructive",
      });
    } finally {
      setIsLoadingFromS3(false);
    }
  }, [toast, dictionary, language]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{phrase(dictionary, "bgsheet_title", language)}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {phrase(dictionary, "bgsheet_subtitle", language)}
        </p>
      </div>

      {/* Loading State */}
      {isLoadingData && (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-[#DB2777]"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {phrase(dictionary, "bgsheet_loading", language)}
          </p>
        </div>
      )}

      {/* Global Configuration */}
      {!isLoadingData && (
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <span className="w-1 h-4 bg-[#DB2777] rounded-full"></span>
          {phrase(dictionary, "bgsheet_global_config", language)}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {phrase(dictionary, "bgsheet_base_prompt", language)}
          </label>
          <textarea
            value={backgroundBasePrompt}
            onChange={(e) => {
              setBackgroundBasePrompt(e.target.value);
              setIsSaved(false);
            }}
            rows={2}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm resize-none"
            placeholder={phrase(dictionary, "bgsheet_base_prompt_placeholder", language)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {phrase(dictionary, "bgsheet_style_keywords", language)}
          </label>
          <input
            type="text"
            value={styleKeyword}
            onChange={(e) => {
              setStyleKeyword(e.target.value);
              setIsSaved(false);
            }}
            placeholder={phrase(dictionary, "bgsheet_style_placeholder", language)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {phrase(dictionary, "bgsheet_reference_image", language)}
          </label>
          <label className="w-full cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-2 flex items-center justify-center transition duration-200 group">
            <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            <span className="ml-2 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 truncate text-sm">
              {referenceImageName || phrase(dictionary, "bgsheet_upload_optional", language)}
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
      {!isLoadingData && originalText && !isAnalyzing && backgrounds.length === 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {phrase(dictionary, "bgsheet_analyze_text", language)}
          </button>
        </div>
      )}

      {/* S3 Buttons - always show when not loading data */}
      {!isLoadingData && (
        <div className="flex justify-center gap-2">
          <button
            onClick={handleSaveToS3}
            disabled={isSavingToS3 || isAnalyzing}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isSavingToS3 ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CloudUpload className="w-5 h-5" />
            )}
            {isSavingToS3 ? phrase(dictionary, "bgsheet_saving_to_s3", language) : phrase(dictionary, "bgsheet_save_to_s3", language)}
          </button>

          <button
            onClick={handleLoadFromS3}
            disabled={isLoadingFromS3}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoadingFromS3 ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CloudDownload className="w-5 h-5" />
            )}
            {isLoadingFromS3 ? phrase(dictionary, "bgsheet_loading_from_s3", language) : phrase(dictionary, "bgsheet_load_from_s3", language)}
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
      {!isLoadingData && backgrounds.length > 0 && !isAnalyzing && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 bg-[#DB2777] rounded-full"></span>
              {phrase(dictionary, "bgsheet_backgrounds", language)} ({backgrounds.length})
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
                <span>{isSaving ? phrase(dictionary, "bgsheet_saving", language) : isSaved ? phrase(dictionary, "bgsheet_saved", language) : phrase(dictionary, "bgsheet_save", language)}</span>
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{phrase(dictionary, "bgsheet_generate_all", language)}</span>
              </button>
              <button
                onClick={() => exportToCSV(backgrounds)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <FileDown className="w-4 h-4" />
                <span>{phrase(dictionary, "bgsheet_export_csv", language)}</span>
              </button>
              <button
                onClick={async () => {
                  setBackgrounds([]);
                  clearBgSheetAnalysis();
                  await clearBgImagesOnly();
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
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
                    label={phrase(dictionary, "bgsheet_location_name", language)}
                    value={bg.name}
                    onChange={(v) => updateBackground(bg.id, "name", v)}
                  />
                  <EditableField
                    label={phrase(dictionary, "bgsheet_visual_description", language)}
                    value={bg.description}
                    onChange={(v) => updateBackground(bg.id, "description", v)}
                  />
                </div>

                {/* Generate Button */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {phrase(dictionary, "bgsheet_reference_views", language)}
                  </h4>
                  <button
                    onClick={() => handleGenerateBackgroundSheet(bg.id)}
                    className="text-xs bg-[#DB2777]/10 text-[#DB2777] px-3 py-1 rounded-full hover:bg-[#DB2777]/20 border border-[#DB2777]/20 transition-colors"
                  >
                    {phrase(dictionary, "bgsheet_generate_all_views", language)}
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
                              title={phrase(dictionary, "download", language)}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleEditImage(bg.id, idx, img.imageBase64)
                              }
                              className="p-1.5 bg-[#DB2777] hover:bg-[#BE185D] rounded-full text-white shadow-lg"
                              title={phrase(dictionary, "edit", language)}
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

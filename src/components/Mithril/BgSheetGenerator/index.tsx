"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProject } from "@/contexts/ProjectContext";
import { phrase } from "@/utils/phrases";
import { getChapter, saveBgSheetSettings, updateBackgroundAngleImage, saveBackground } from "../services/firestore";
import { uploadBackgroundImage } from "../services/s3";
import type { Dictionary, Language } from "@/components/Types";
import {
  Sparkles,
  Download,
  Image as ImageIcon,
  Pencil,
  Save,
  FileDown,
  Trash2,
  Upload,
  X,
  Check,
  Clock,
  RefreshCw,
  FileUp,
  Package,
  FileJson,
  FileText,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import BgSheetImageEditor from "./BgSheetImageEditor";
import type { Background, BgSheetResultMetadata, ReferenceAnalysis } from "./types";

// 9 specialized camera angles matching storyboard production workflow
const BACKGROUND_ANGLES = [
  "Front View",
  "Worm View",
  "Character A View",
  "Character B View",
  "Rear View",
  "Bird's Eye View",
  "Over-Shoulder A",
  "Over-Shoulder B",
  "Floor Close-up",
];

// Helper to get angle suffix (1-9) from angle string
const getAngleSuffix = (angle: string): string => {
  const index = BACKGROUND_ANGLES.findIndex(a => angle.includes(a.split(" ")[0]));
  return index >= 0 ? String(index + 1) : "";
};

const angleToDetailedPrompt: Record<string, string> = {
  "Front View":
    "A slight closeup of the background. Direct frontal composition.",
  "Worm View":
    "A worm's eye view low angle version of the background. Camera near floor looking up.",
  "Character A View":
    "Detect a large noticeable object at eye level where a character would stand and make a closeup. No characters.",
  "Character B View":
    "Detect a different large noticeable object at eye level where a character would stand and make a closeup. No characters.",
  "Rear View":
    "Detect corner of the background and make a close up. Part of the ceiling/sky should be visible.",
  "Bird's Eye View":
    "A high angle almost bird's eye view of the background, showing the layout from above.",
  "Over-Shoulder A":
    "Detect a large object at eye level and make a closeup. Part of the ceiling/sky should be visible. No characters.",
  "Over-Shoulder B":
    "Detect a different large object at eye level and make a closeup. Part of the ceiling/sky should be visible. No characters.",
  "Floor Close-up":
    "Detect the floor/ground surface and do a macro shot of it showing texture and detail.",
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

// === Phase 7: Import/Export Utilities ===

// CSV Import data structure - one view per CSV row (storyboard style)
interface CsvViewData {
  angle: string;      // Background ID from CSV (e.g., "1-1", "1-3-1")
  csvContext: string; // Storyboard context (Image Prompt from CSV)
}

interface CsvBackgroundData {
  name: string;
  description: string;
  views: CsvViewData[]; // Array of views, one per CSV row
}

// Parse CSV content into rows, handling multi-line quoted fields
const parseCsvRows = (csvContent: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote within quoted field
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator (only when not in quotes)
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !inQuotes) {
      // Row separator (only when not in quotes)
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field)) { // Only add non-empty rows
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      if (char === "\r") i++; // Skip \n after \r
    } else if (char === "\r" && !inQuotes) {
      // Handle standalone \r as row separator
      currentRow.push(currentField.trim());
      if (currentRow.some(field => field)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      // Regular character (including newlines inside quotes)
      currentField += char;
    }
  }

  // Handle last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

// CSV Import parser - parses storyboard CSV to extract backgrounds
// Expected format: Scene,Clip,Length,Accumulated Time,Background ID,Background Prompt,Story,Image Prompt (Start),...
// Each CSV row becomes a separate storyboard view (not fixed 9 angles)
const parseCsvForImport = (csvContent: string): Map<string, CsvBackgroundData> => {
  // Map: background name -> { name, description, views: CsvViewData[] }
  const result = new Map<string, CsvBackgroundData>();
  const bgOrder: string[] = []; // Track order of backgrounds as they appear

  const rows = parseCsvRows(csvContent);
  if (rows.length <= 1) return result; // Only header or empty

  let lastBgPrefix: string | null = null; // Track last valid BG prefix for implicit rows

  // Skip header row, parse data rows
  for (let i = 1; i < rows.length; i++) {
    const fields = rows[i];
    if (fields.length < 6) continue;

    const bgIdRaw = fields[4]?.trim() || ""; // Background ID (e.g., "1-3", "2-1")
    const bgPrompt = fields[5]?.trim() || ""; // Background Prompt (description)
    const storyboardContext = fields[7]?.trim() || ""; // Image Prompt (Start) - storyboard context

    let bgPrefix = "";
    let fullId = "";

    // Match pattern like "1-1", "1-3", "2-5-1"
    const match = bgIdRaw.match(/^(\d+)-(.+)$/);

    if (match) {
      bgPrefix = match[1];
      fullId = bgIdRaw; // Use the exact imported ID
      lastBgPrefix = bgPrefix;
    } else if (!bgIdRaw && lastBgPrefix && (bgPrompt || storyboardContext)) {
      // Implicit row for previous BG (row with empty ID but has data)
      bgPrefix = lastBgPrefix;
      fullId = `${bgPrefix}-?`;
    } else {
      continue; // Skip rows without valid Background ID
    }

    const bgName = `Background ${bgPrefix}`;

    if (!result.has(bgName)) {
      result.set(bgName, {
        name: bgName,
        description: "",
        views: [],
      });
      bgOrder.push(bgName);
    }

    const existingData = result.get(bgName)!;

    // Update description if we have a better one (longer)
    if (bgPrompt && bgPrompt.length > existingData.description.length) {
      existingData.description = bgPrompt;
    }

    // Add view for this CSV row (one row = one storyboard frame)
    if (storyboardContext || bgIdRaw) {
      existingData.views.push({
        angle: fullId,
        csvContext: storyboardContext,
      });
    }
  }

  return result;
};

// JSON Project Export interface
interface BgSheetProjectExport {
  version: string;
  exportDate: string;
  styleKeyword: string;
  backgroundBasePrompt: string;
  backgrounds: Array<{
    id: string;
    name: string;
    description: string;
    plannedPrompts?: string[];
    referenceAnalysis?: {
      floorType: string;
      rightObject: string;
      leftObject: string;
      rearObject: string;
      ceilingObject: string;
      topLeftObject: string;
      topRightObject: string;
    };
    images: Array<{
      angle: string;
      prompt: string;
      isActive: boolean;
      isFinalized: boolean;
      characterPrompt?: string;
      csvContext?: string;
      hasImage: boolean;
    }>;
  }>;
}

export default function BgSheetGenerator() {
  const { setStageResult, bgSheetGenerator, startBgSheetAnalysis, clearBgSheetAnalysis, setBgSheetResult, customApiKey } = useMithril();
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();
  const { currentProjectId } = useProject();
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

  // Refs to avoid stale closures in async callbacks
  const styleKeywordRef = useRef(styleKeyword);
  const backgroundBasePromptRef = useRef(backgroundBasePrompt);

  // Editor state
  const [editingTarget, setEditingTarget] = useState<{
    bgId: string;
    imageIndex: number;
    currentImage: string;
    initialPrompt: string;
  } | null>(null);

  // Master reference generation state (per background)
  const [isGeneratingMaster, setIsGeneratingMaster] = useState<Record<string, boolean>>({});

  // Batch prompt planning state (per background)
  const [isPlanningPrompts, setIsPlanningPrompts] = useState<Record<string, boolean>>({});

  // Sequential generation stop control (per background)
  const stopGenerationRef = useRef<Record<string, boolean>>({});

  // AbortController for canceling in-flight requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  // === Cost Tracking (Phase 6) ===
  // Cost rates per API usage
  const COST_RATES = useMemo(() => ({
    inputToken: 0.0000001,
    outputToken: 0.0000004,
    image: 0.04,
  }), []);

  // Cost session state
  interface CostSession {
    active: boolean;
    sessionStarted: boolean;
    startTime: number | null;
    endTime: number | null;
    textUsage: { input: number; output: number; requestCount: number };
    imageUsage: { count: number };
  }

  const [costSession, setCostSession] = useState<CostSession>({
    active: false,
    sessionStarted: false,
    startTime: null,
    endTime: null,
    textUsage: { input: 0, output: 0, requestCount: 0 },
    imageUsage: { count: 0 },
  });

  // Cost tracking handlers
  const handleClockIn = useCallback(() => {
    setCostSession({
      active: true,
      sessionStarted: true,
      startTime: Date.now(),
      endTime: null,
      textUsage: { input: 0, output: 0, requestCount: 0 },
      imageUsage: { count: 0 },
    });
  }, []);

  const handleClockOut = useCallback(() => {
    setCostSession(prev => ({
      ...prev,
      active: false,
      endTime: Date.now(),
    }));
  }, []);

  const handleRestartClockIn = useCallback(() => {
    handleClockIn();
  }, [handleClockIn]);

  // Track API usage costs
  const trackCost = useCallback((type: 'text' | 'image', usage?: { inputTokens?: number; outputTokens?: number; images?: number }) => {
    setCostSession(prev => {
      if (!prev.active) return prev;

      const inputTokens = usage?.inputTokens || 0;
      const outputTokens = usage?.outputTokens || 0;
      const images = usage?.images || (type === 'image' ? 1 : 0);

      return {
        ...prev,
        textUsage: {
          input: prev.textUsage.input + inputTokens,
          output: prev.textUsage.output + outputTokens,
          requestCount: type === 'text' ? prev.textUsage.requestCount + 1 : prev.textUsage.requestCount,
        },
        imageUsage: {
          count: prev.imageUsage.count + images,
        },
      };
    });
  }, []);

  // Computed costs
  const currentTextCost = useMemo(() => {
    return (costSession.textUsage.input * COST_RATES.inputToken) +
           (costSession.textUsage.output * COST_RATES.outputToken);
  }, [costSession.textUsage, COST_RATES]);

  const currentImageCost = useMemo(() => {
    return costSession.imageUsage.count * COST_RATES.image;
  }, [costSession.imageUsage.count, COST_RATES]);

  const totalCost = useMemo(() => {
    return currentTextCost + currentImageCost;
  }, [currentTextCost, currentImageCost]);

  // Download invoice
  const downloadInvoice = useCallback(() => {
    const sessionDuration = costSession.startTime && costSession.endTime
      ? Math.round((costSession.endTime - costSession.startTime) / 1000 / 60)
      : 0;

    const invoiceContent = `=== API Usage Invoice ===
Generated Date: ${new Date().toLocaleString()}
Session Duration: ${sessionDuration} minutes

--- Text API Usage ---
Input Tokens: ${costSession.textUsage.input.toLocaleString()}
Output Tokens: ${costSession.textUsage.output.toLocaleString()}
Text Requests: ${costSession.textUsage.requestCount}
Text Cost: $${currentTextCost.toFixed(4)}

--- Image API Usage ---
Images Generated: ${costSession.imageUsage.count}
Image Cost: $${currentImageCost.toFixed(4)}

=== TOTAL COST: $${totalCost.toFixed(4)} ===
`;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bgsheet_invoice_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [costSession, currentTextCost, currentImageCost, totalCost]);

  // Cleanup: abort any pending requests when component unmounts
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- We intentionally want the latest ref value at cleanup time
      abortControllerRef.current?.abort();
    };
  }, []);

  // Keep refs in sync with state for use in async callbacks
  useEffect(() => {
    styleKeywordRef.current = styleKeyword;
  }, [styleKeyword]);

  useEffect(() => {
    backgroundBasePromptRef.current = backgroundBasePrompt;
  }, [backgroundBasePrompt]);

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

    const hydrateFromContext = () => {
      setIsLoadingData(true);
      try {
        // Reconstruct backgrounds with S3 URLs from context
        const backgroundsWithImages: Background[] = contextResult.backgrounds.map((bgMeta) => ({
          id: bgMeta.id,
          name: bgMeta.name,
          description: bgMeta.description,
          // Ensure images array is always populated with all angles
          images: bgMeta.images && bgMeta.images.length > 0
            ? bgMeta.images.map((imgMeta) => ({
                angle: imgMeta.angle,
                prompt: imgMeta.prompt,
                imageBase64: "",  // No base64 when loading from S3
                imageUrl: imgMeta.imageId || undefined,  // imageId contains S3 URL
                isGenerating: false,
                isActive: true,
                isPromptOpen: false,
              }))
            : BACKGROUND_ANGLES.map((angle) => ({
                angle,
                prompt: "",
                imageBase64: "",
                imageUrl: undefined,
                isGenerating: false,
                isActive: true,
                isPromptOpen: false,
              })),
        }));

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

  // Auto-save a single image to S3 and update Firestore + context
  const autoSaveImage = useCallback(async (
    bgId: string,
    angle: string,
    imageBase64: string,
    prompt: string
  ) => {
    if (!currentProjectId) return;

    // Find background info for Firestore upsert
    const background = backgrounds.find(b => b.id === bgId);

    try {
      // 1. Upload image to S3
      const imageUrl = await uploadBackgroundImage(currentProjectId, bgId, angle, imageBase64);

      // 2. Update Firestore (will create document if it doesn't exist)
      await updateBackgroundAngleImage(
        currentProjectId,
        bgId,
        angle,
        imageUrl,
        prompt,
        background?.name,
        background?.description
      );

      // 3. Update local state with S3 URL (with cache-busting)
      const imageUrlWithCacheBust = `${imageUrl}?t=${Date.now()}`;
      setBackgrounds((prev) =>
        prev.map((bg) =>
          bg.id === bgId
            ? {
                ...bg,
                images: bg.images.map((img) =>
                  img.angle === angle
                    ? { ...img, imageUrl: imageUrlWithCacheBust, imageBase64: "" }
                    : img
                ),
              }
            : bg
        )
      );

      // 4. Update context state so navigation works (using refs to avoid stale closures)
      setBackgrounds((currentBgs) => {
        const metadata: BgSheetResultMetadata = {
          backgrounds: currentBgs.map((bg) => ({
            id: bg.id,
            name: bg.name,
            description: bg.description,
            images: bg.images.map((img) => ({
              angle: img.angle,
              prompt: img.prompt,
              imageId: img.imageUrl || "",  // S3 URL stored as imageId
            })),
          })),
          styleKeyword: styleKeywordRef.current,
          backgroundBasePrompt: backgroundBasePromptRef.current,
        };
        setBgSheetResult(metadata);
        // Also update stageResults so useReferenceImages can access the data
        setStageResult(4, metadata);
        return currentBgs;
      });
    } catch (error) {
      console.error("Auto-save failed for image:", error);
    }
  }, [currentProjectId, setBgSheetResult, setStageResult, backgrounds]);

  const handleAnalyze = useCallback(async () => {
    setError("");
    setIsSaved(false);

    const result = await startBgSheetAnalysis(originalText, styleKeyword, backgroundBasePrompt);

    if (result.length > 0) {
      setBackgrounds(result);
      // Convert to BgSheetResultMetadata format for stageResult
      const metadata: BgSheetResultMetadata = {
        backgrounds: result.map((bg) => ({
          id: bg.id,
          name: bg.name,
          description: bg.description,
          images: bg.images.map((img) => ({
            angle: img.angle,
            prompt: img.prompt,
            imageId: img.imageUrl || "",  // Use imageUrl as imageId
          })),
        })),
        styleKeyword,
        backgroundBasePrompt,
      };
      setStageResult(4, metadata);
      setBgSheetResult(metadata);
      setIsSaved(true);
    } else if (analysisError) {
      setError(analysisError);
    }
  }, [originalText, styleKeyword, backgroundBasePrompt, startBgSheetAnalysis, setStageResult, setBgSheetResult, analysisError]);

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

    // Ensure images array exists and has all angles
    if (!background.images || background.images.length === 0) {
      // Initialize images array with all angles if missing
      setBackgrounds((prev) =>
        prev.map((bg) =>
          bg.id === id
            ? {
                ...bg,
                images: BACKGROUND_ANGLES.map((angle) => ({
                  angle,
                  prompt: "",
                  imageBase64: "",
                  imageUrl: undefined,
                  isGenerating: false,
                  isActive: true,
                  isPromptOpen: false,
                })),
              }
            : bg
        )
      );
      // Re-fetch the background after updating
      const updatedBackground = backgrounds.find((b) => b.id === id);
      if (!updatedBackground?.images?.length) {
        // Wait for state update and retry
        setTimeout(() => handleGenerateBackgroundSheet(id), 100);
        return;
      }
    }

    // Create new AbortController for this generation session
    abortControllerRef.current?.abort(); // Cancel any previous generation
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    let referenceDescription = background.description;
    const firstImage = background.images?.[0];
    const hasFirstImage = firstImage?.imageBase64 || firstImage?.imageUrl;

    // Generate first image if not exists
    if (!hasFirstImage) {
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
      // Analyze existing first image for consistency (only if we have base64)
      const firstImageBase64 = background.images[0]?.imageBase64;
      if (firstImageBase64) {
        try {
          const consistencyResponse = await fetch(
            "/api/generate_bg_sheet/analyze-consistency",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: firstImageBase64 }),
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
      // If no base64 (S3 URL only), we'll use the background description for consistency
    }

    // Generate remaining images (skip those with base64 or S3 URL)
    const remainingIndices = background.images
      .map((img, idx) => ({ img, idx }))
      .filter((item) => !item.img.imageBase64 && !item.img.imageUrl && item.idx !== 0);

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
      // Check if images array exists and if any image needs generation
      const needsGeneration = !bg.images || bg.images.length === 0 ||
        bg.images.some((img) => !img.imageBase64 && !img.imageUrl);
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
    if (!currentProjectId) return;

    setIsSaving(true);
    try {
      // 1. Upload any remaining base64 images to S3
      const updatedBackgrounds = [...backgrounds];
      for (let bgIndex = 0; bgIndex < updatedBackgrounds.length; bgIndex++) {
        const bg = updatedBackgrounds[bgIndex];
        for (let imgIndex = 0; imgIndex < bg.images.length; imgIndex++) {
          const img = bg.images[imgIndex];
          if (img.imageBase64 && !img.imageUrl) {
            // Upload to S3
            const imageUrl = await uploadBackgroundImage(currentProjectId, bg.id, img.angle, img.imageBase64);
            await updateBackgroundAngleImage(currentProjectId, bg.id, img.angle, imageUrl, img.prompt);
            // Update local state with S3 URL
            updatedBackgrounds[bgIndex].images[imgIndex] = {
              ...img,
              imageUrl: `${imageUrl}?t=${Date.now()}`,
              imageBase64: "",
            };
          }
        }
      }
      setBackgrounds(updatedBackgrounds);

      // 2. Save settings to Firestore
      await saveBgSheetSettings(currentProjectId, {
        styleKeyword,
        backgroundBasePrompt,
      });

      // 3. Create metadata for context
      const metadata: BgSheetResultMetadata = {
        backgrounds: updatedBackgrounds.map((bg) => ({
          id: bg.id,
          name: bg.name,
          description: bg.description,
          images: bg.images.map((img) => ({
            angle: img.angle,
            prompt: img.prompt,
            imageId: img.imageUrl || "",  // S3 URL stored as imageId
          })),
        })),
        styleKeyword,
        backgroundBasePrompt,
      };

      // 4. Update context
      setStageResult(4, metadata);
      setBgSheetResult(metadata);
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
  }, [currentProjectId, backgrounds, styleKeyword, backgroundBasePrompt, setStageResult, setBgSheetResult, toast, dictionary, language]);

  // === Master Reference Handlers ===

  // Set reference image and analyze it for spatial elements
  const handleSetReferenceImage = async (bgId: string, base64: string) => {
    // Set the reference image immediately
    setBackgrounds(bgs => bgs.map(bg => {
      if (bg.id !== bgId) return bg;
      const newImages = [...bg.images];
      // Also set as first image if empty
      if (newImages.length > 0 && !newImages[0].imageBase64 && !newImages[0].imageUrl) {
        newImages[0] = { ...newImages[0], imageBase64: base64 };
      }
      return { ...bg, referenceImageBase64: base64, images: newImages };
    }));
    setIsSaved(false);

    // Analyze reference image for spatial elements
    try {
      const response = await fetch("/api/generate_bg_sheet/analyze-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, customApiKey: customApiKey || undefined }),
      });

      const data = await response.json();
      if (response.ok && data.analysis) {
        setBackgrounds(bgs => bgs.map(bg =>
          bg.id === bgId ? { ...bg, referenceAnalysis: data.analysis as ReferenceAnalysis } : bg
        ));
      }
    } catch (e) {
      console.error("Failed to analyze reference image:", e);
    }
  };

  // Upload reference image from file input
  const handleUploadReference = (bgId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        handleSetReferenceImage(bgId, base64);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ""; // Reset input
  };

  // Generate master reference image via AI
  const handleGenerateMasterRef = async (bgId: string) => {
    const bg = backgrounds.find(b => b.id === bgId);
    if (!bg || isGeneratingMaster[bgId]) return;

    setIsGeneratingMaster(prev => ({ ...prev, [bgId]: true }));

    try {
      const prompt = `${backgroundBasePrompt}. Description: ${bg.description}. Style: ${styleKeyword}. EMPTY SCENE, NO CHARACTERS, NO PEOPLE.`;

      const response = await fetch("/api/generate_bg_sheet/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio: "16:9", customApiKey: customApiKey || undefined }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      await handleSetReferenceImage(bgId, data.imageBase64);

      toast({
        variant: "success",
        title: phrase(dictionary, "bgsheet_toast_ref_generated", language) || "Reference Generated",
        description: bg.name,
      });
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: phrase(dictionary, "bgsheet_toast_image_failed", language),
        description: errorMessage,
      });
    } finally {
      setIsGeneratingMaster(prev => ({ ...prev, [bgId]: false }));
    }
  };

  // Remove reference image
  const handleRemoveReference = (bgId: string) => {
    setBackgrounds(bgs => bgs.map(bg =>
      bg.id === bgId
        ? { ...bg, referenceImageBase64: undefined, referenceAnalysis: undefined, plannedPrompts: undefined }
        : bg
    ));
    setIsSaved(false);
  };

  // Use a generated image as the master reference
  const handleSetGeneratedAsRef = async (bgId: string, base64?: string, imageUrl?: string) => {
    // If we have base64 data, use it directly
    if (base64) {
      handleSetReferenceImage(bgId, base64);
      return;
    }

    // If we only have URL, fetch and convert to base64
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove the data URL prefix to get pure base64
          const base64Data = result.split(",")[1];
          if (base64Data) {
            handleSetReferenceImage(bgId, base64Data);
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Failed to fetch image for reference:", error);
        toast({
          variant: "destructive",
          title: "Failed to set reference",
          description: "Could not load the image",
        });
      }
    }
  };

  // === Batch Prompt Planning Handlers ===

  // Plan prompts for all 9 angles based on reference image
  const handlePlanPrompts = async (bgId: string) => {
    const bg = backgrounds.find(b => b.id === bgId);
    if (!bg || !bg.referenceImageBase64 || isPlanningPrompts[bgId]) return;

    setIsPlanningPrompts(prev => ({ ...prev, [bgId]: true }));

    try {
      const response = await fetch("/api/generate_bg_sheet/plan-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: bg.referenceImageBase64,
          backgroundDesc: bg.description,
          customApiKey: customApiKey || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (data.prompts && Array.isArray(data.prompts) && data.prompts.length === 9) {
        setBackgrounds(bgs => bgs.map(b =>
          b.id === bgId ? { ...b, plannedPrompts: data.prompts } : b
        ));
        setIsSaved(false);

        toast({
          variant: "success",
          title: phrase(dictionary, "bgsheet_toast_prompts_planned", language) || "Prompts Planned",
          description: `${bg.name}: 9 ${phrase(dictionary, "bgsheet_prompts_ready", language) || "prompts ready"}`,
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: phrase(dictionary, "bgsheet_toast_planning_failed", language) || "Planning Failed",
        description: errorMessage,
      });
    } finally {
      setIsPlanningPrompts(prev => ({ ...prev, [bgId]: false }));
    }
  };

  // Update a single planned prompt
  const handleUpdatePlannedPrompt = (bgId: string, index: number, newPrompt: string) => {
    setBackgrounds(bgs => bgs.map(bg => {
      if (bg.id !== bgId || !bg.plannedPrompts) return bg;
      const newPrompts = [...bg.plannedPrompts];
      newPrompts[index] = newPrompt;
      return { ...bg, plannedPrompts: newPrompts };
    }));
    setIsSaved(false);
  };

  // Clear planned prompts
  const handleClearPlannedPrompts = (bgId: string) => {
    setBackgrounds(bgs => bgs.map(bg =>
      bg.id === bgId ? { ...bg, plannedPrompts: undefined } : bg
    ));
    setIsSaved(false);
  };

  // Apply planned prompts to all image cards (Plan Text button)
  // Also opens the prompt textbox for each card
  const handleApplyPlannedPrompts = (bgId: string) => {
    const background = backgrounds.find(b => b.id === bgId);
    if (!background || !background.plannedPrompts) return;

    setBackgrounds(bgs => bgs.map(bg => {
      if (bg.id !== bgId || !bg.plannedPrompts) return bg;
      return {
        ...bg,
        images: bg.images.map((img, idx) => {
          // Get the angle suffix/index to map to planned prompt
          // First try standard angle names (Front View, etc.)
          let angleIndex = BACKGROUND_ANGLES.indexOf(img.angle);

          // If not found, try to extract suffix from CSV-style ID (e.g., "1-3" -> 3)
          if (angleIndex < 0) {
            const parts = img.angle.split("-");
            if (parts.length >= 2) {
              const suffix = parseInt(parts[1], 10);
              if (!isNaN(suffix) && suffix >= 1 && suffix <= 9) {
                angleIndex = suffix - 1; // Convert 1-based to 0-based index
              }
            }
          }

          const plannedPrompt = angleIndex >= 0 && angleIndex < bg.plannedPrompts!.length
            ? bg.plannedPrompts![angleIndex]
            : "";

          // Always open the prompt editor, copy prompt if available
          return { ...img, prompt: plannedPrompt || img.prompt, isPromptOpen: true };
        })
      };
    }));
    setIsSaved(false);
    toast({
      variant: "success",
      title: phrase(dictionary, "bgsheet_prompts_applied", language) || "Prompts Applied",
      description: phrase(dictionary, "bgsheet_planned_prompts_copied", language) || "Planned prompts copied to all image cards",
    });
  };

  // Toggle prompt textbox visibility for an image card
  const handleTogglePrompt = (bgId: string, index: number) => {
    setBackgrounds(bgs => bgs.map(bg =>
      bg.id === bgId
        ? { ...bg, images: bg.images.map((img, i) => i === index ? { ...img, isPromptOpen: !img.isPromptOpen } : img) }
        : bg
    ));
  };

  // Update prompt for an image card
  const handleUpdatePrompt = (bgId: string, index: number, newPrompt: string) => {
    setBackgrounds(bgs => bgs.map(bg =>
      bg.id === bgId
        ? { ...bg, images: bg.images.map((img, i) => i === index ? { ...img, prompt: newPrompt } : img) }
        : bg
    ));
    setIsSaved(false);
  };

  // === Frame Management (Phase 4) ===

  // Frame numbering: creates global frame numbers, skipping inactive frames
  const frameNumbers = useMemo(() => {
    const map: Record<string, string> = {};
    let currentCount = 1;
    backgrounds.forEach(bg => {
      bg.images.forEach((img, idx) => {
        const key = `${bg.id}-${idx}`;
        if (img.isActive === false) {
          map[key] = "---";
          return;
        }
        map[key] = String(currentCount).padStart(3, "0");
        currentCount++;
      });
    });
    return map;
  }, [backgrounds]);

  // Total active frames count
  const totalActiveFrames = useMemo(() => {
    return backgrounds.reduce((acc, bg) => {
      return acc + bg.images.filter(img => img.isActive !== false).length;
    }, 0);
  }, [backgrounds]);

  // Toggle frame active/inactive
  const handleToggleActive = (bgId: string, index: number) => {
    setBackgrounds(prev => prev.map(bg =>
      bg.id !== bgId ? bg : {
        ...bg,
        images: bg.images.map((img, i) =>
          i === index ? { ...img, isActive: !(img.isActive !== false) } : img
        )
      }
    ));
    setIsSaved(false);
  };

  // Finalize/unfinalize a frame
  const handleFinalizeFrame = (bgId: string, index: number) => {
    setBackgrounds(prev => prev.map(bg => {
      if (bg.id !== bgId) return bg;
      const targetImg = bg.images[index];
      const newImages = [...bg.images];
      newImages[index] = {
        ...targetImg,
        isFinalized: !targetImg.isFinalized,
        characterPrompt: !targetImg.isFinalized && !targetImg.characterPrompt
          ? targetImg.csvContext
          : targetImg.characterPrompt
      };
      return { ...bg, images: newImages };
    }));
    setIsSaved(false);
  };

  // Update character prompt (notes for finalized frames)
  const handleUpdateCharacterPrompt = (bgId: string, index: number, newPrompt: string) => {
    setBackgrounds(bgs => bgs.map(bg =>
      bg.id === bgId
        ? {
            ...bg,
            images: bg.images.map((img, i) =>
              i === index ? { ...img, characterPrompt: newPrompt } : img
            )
          }
        : bg
    ));
    setIsSaved(false);
  };

  // === Generation Controls (Phase 5) ===

  // Update generation range for a background
  const handleUpdateGenerationRange = (bgId: string, range: string) => {
    setBackgrounds(bgs => bgs.map(bg =>
      bg.id === bgId ? { ...bg, generationRange: range } : bg
    ));
  };

  // Generate a single view image
  const handleGenerateSingleView = async (bgId: string, index: number, forceRegenerate: boolean = false) => {
    const background = backgrounds.find(b => b.id === bgId);
    if (!background || !background.images || index >= background.images.length) return;

    const imageInfo = background.images[index];
    // Block if already generating, or if image exists and not forcing regenerate
    if (imageInfo.isGenerating) return;
    if (!forceRegenerate && (imageInfo.imageBase64 || imageInfo.imageUrl)) return;

    // Set generating state
    setBackgrounds(prevBgs =>
      prevBgs.map(bg =>
        bg.id === bgId
          ? {
              ...bg,
              images: bg.images.map((img, idx) =>
                idx === index ? { ...img, isGenerating: true } : img
              ),
            }
          : bg
      )
    );

    // Use planned prompt if available, otherwise generate one
    const plannedPromptIndex = BACKGROUND_ANGLES.indexOf(imageInfo.angle);
    const plannedPrompt = background.plannedPrompts?.[plannedPromptIndex];

    const detailedAngleInstruction = angleToDetailedPrompt[imageInfo.angle] || imageInfo.angle;
    const prompt = plannedPrompt ||
      `${backgroundBasePrompt} ${detailedAngleInstruction} of ${background.name}. Description: ${background.description}. Style: ${styleKeyword}. EMPTY SCENE, NO CHARACTERS, NO PEOPLE.`;

    // Update prompt in state
    setBackgrounds(prevBgs =>
      prevBgs.map(bg =>
        bg.id === bgId
          ? {
              ...bg,
              images: bg.images.map((img, idx) =>
                idx === index ? { ...img, prompt } : img
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
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setBackgrounds(prevBgs =>
        prevBgs.map(bg =>
          bg.id === bgId
            ? {
                ...bg,
                images: bg.images.map((img, idx) =>
                  idx === index ? { ...img, imageBase64: data.imageBase64 } : img
                ),
              }
            : bg
        )
      );

      // Auto-save image
      await autoSaveImage(bgId, imageInfo.angle, data.imageBase64, prompt);
    } catch (e) {
      console.error(`Failed to generate ${imageInfo.angle}:`, e);
      const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: phrase(dictionary, "bgsheet_toast_image_failed", language),
        description: `${background.name} (${imageInfo.angle}): ${errorMessage}`,
      });
    } finally {
      setBackgrounds(prevBgs =>
        prevBgs.map(bg =>
          bg.id === bgId
            ? {
                ...bg,
                images: bg.images.map((img, idx) =>
                  idx === index ? { ...img, isGenerating: false } : img
                ),
              }
            : bg
        )
      );
    }
  };

  // Sequential generation with range support
  const handleGenerateBackgroundsSequential = async (bgId: string) => {
    const background = backgrounds.find(b => b.id === bgId);
    if (!background || !background.images) return;

    // Reset stop flag and set sequential generation state
    stopGenerationRef.current[bgId] = false;
    setBackgrounds(prev => prev.map(b =>
      b.id === bgId ? { ...b, isSequentiallyGenerating: true } : b
    ));

    // Parse range string (e.g., "All", "1-5", "1,3,5", "1-3,7,9")
    const rangeStr = background.generationRange || "All";
    let targetFrameNumbers: Set<number> | null = null;

    if (rangeStr.toLowerCase() !== "all") {
      targetFrameNumbers = new Set<number>();
      const parts = rangeStr.split(",").map(p => p.trim());
      for (const part of parts) {
        if (part.includes("-")) {
          const [startStr, endStr] = part.split("-").map(s => s.trim());
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              targetFrameNumbers.add(i);
            }
          }
        } else {
          const num = parseInt(part, 10);
          if (!isNaN(num)) {
            targetFrameNumbers.add(num);
          }
        }
      }
    }

    // Get indices to generate based on frame numbers
    const indicesToGenerate: number[] = [];
    background.images.forEach((img, idx) => {
      const key = `${bgId}-${idx}`;
      const frameNum = parseInt(frameNumbers[key], 10);

      // Skip inactive frames (frameNum is NaN for "---")
      if (isNaN(frameNum)) return;

      // Skip if already has image
      if (img.imageBase64 || img.imageUrl) return;

      // Check if in target range (or all)
      if (targetFrameNumbers === null || targetFrameNumbers.has(frameNum)) {
        indicesToGenerate.push(idx);
      }
    });

    // Generate images one by one
    for (const idx of indicesToGenerate) {
      // Check if stop was requested
      if (stopGenerationRef.current[bgId]) {
        break;
      }

      await handleGenerateSingleView(bgId, idx);
    }

    // Clear sequential generation state
    setBackgrounds(prev => prev.map(b =>
      b.id === bgId ? { ...b, isSequentiallyGenerating: false } : b
    ));
    setIsSaved(false);
  };

  // Stop sequential generation
  const handleStopGeneration = (bgId: string) => {
    stopGenerationRef.current[bgId] = true;
    setBackgrounds(prev => prev.map(b =>
      b.id === bgId ? { ...b, isSequentiallyGenerating: false } : b
    ));
  };

  // === Phase 7: Import/Export Handlers ===

  // File input refs for import
  const csvImportRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // CSV Import handler - imports prompts from CSV file and creates backgrounds
  const handleCsvImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const csvContent = ev.target?.result as string;
      const importedData = parseCsvForImport(csvContent);

      if (importedData.size === 0) {
        toast({
          variant: "destructive",
          title: phrase(dictionary, "bgsheet_import_failed", language) || "Import Failed",
          description: phrase(dictionary, "bgsheet_no_data_found", language) || "No valid data found in CSV",
        });
        return;
      }

      // Create or update backgrounds from CSV data
      setBackgrounds(prev => {
        const existingBgNames = new Set(prev.map(bg => bg.name));
        const updatedBackgrounds: Background[] = [];

        // Update existing backgrounds - merge new views from CSV
        for (const bg of prev) {
          const csvBgData = importedData.get(bg.name);
          if (csvBgData) {
            // Find existing angles to avoid duplicates
            const existingAngles = new Set(bg.images.map(img => img.angle));

            // Add new views from CSV that don't already exist
            const newImages = csvBgData.views
              .filter(view => !existingAngles.has(view.angle))
              .map(view => ({
                angle: view.angle,
                prompt: "",
                imageBase64: "",
                imageUrl: undefined,
                isGenerating: false,
                isActive: true,
                isFinalized: false,
                characterPrompt: "",
                csvContext: view.csvContext,
              }));

            updatedBackgrounds.push({
              ...bg,
              description: csvBgData.description || bg.description,
              images: [...bg.images, ...newImages],
            });
          } else {
            updatedBackgrounds.push(bg);
          }
        }

        // Create new backgrounds from CSV that don't exist yet
        // Each CSV row becomes a separate storyboard view
        for (const [bgName, csvBgData] of importedData) {
          if (!existingBgNames.has(bgName)) {
            const newBg: Background = {
              id: `bg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: csvBgData.name,
              description: csvBgData.description,
              images: csvBgData.views.map(view => ({
                angle: view.angle,
                prompt: "",
                imageBase64: "",
                imageUrl: undefined,
                isGenerating: false,
                isActive: true,
                isFinalized: false,
                characterPrompt: "",
                csvContext: view.csvContext,
              })),
            };
            updatedBackgrounds.push(newBg);
          }
        }

        return updatedBackgrounds;
      });

      setIsSaved(false);
      toast({
        variant: "success",
        title: phrase(dictionary, "bgsheet_import_success", language) || "Import Successful",
        description: `${importedData.size} ${phrase(dictionary, "bgsheet_backgrounds_imported", language) || "backgrounds imported"}`,
      });
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  }, [toast, dictionary, language]);

  // JSON Project Export handler
  const handleJsonExport = useCallback(() => {
    const projectData: BgSheetProjectExport = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      styleKeyword,
      backgroundBasePrompt,
      backgrounds: backgrounds.map(bg => ({
        id: bg.id,
        name: bg.name,
        description: bg.description,
        plannedPrompts: bg.plannedPrompts,
        referenceAnalysis: bg.referenceAnalysis,
        images: bg.images.map(img => ({
          angle: img.angle,
          prompt: img.prompt,
          isActive: img.isActive !== false,
          isFinalized: img.isFinalized === true,
          characterPrompt: img.characterPrompt,
          csvContext: img.csvContext,
          hasImage: !!(img.imageBase64 || img.imageUrl),
        })),
      })),
    };

    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bgsheet_project_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      variant: "success",
      title: phrase(dictionary, "bgsheet_export_success", language) || "Export Successful",
      description: phrase(dictionary, "bgsheet_project_exported", language) || "Project exported as JSON",
    });
  }, [backgrounds, styleKeyword, backgroundBasePrompt, toast, dictionary, language]);

  // JSON Project Import handler
  const handleJsonImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const jsonContent = ev.target?.result as string;
        const projectData: BgSheetProjectExport = JSON.parse(jsonContent);

        // Validate structure
        if (!projectData.backgrounds || !Array.isArray(projectData.backgrounds)) {
          throw new Error("Invalid project file format");
        }

        // Import settings
        if (projectData.styleKeyword) setStyleKeyword(projectData.styleKeyword);
        if (projectData.backgroundBasePrompt) setBackgroundBasePrompt(projectData.backgroundBasePrompt);

        // Import backgrounds
        const importedBackgrounds: Background[] = projectData.backgrounds.map(bg => ({
          id: bg.id || `bg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: bg.name,
          description: bg.description,
          plannedPrompts: bg.plannedPrompts,
          referenceAnalysis: bg.referenceAnalysis as ReferenceAnalysis | undefined,
          images: bg.images.map(img => ({
            angle: img.angle,
            prompt: img.prompt,
            imageBase64: "",
            imageUrl: undefined,
            isGenerating: false,
            isActive: img.isActive !== false,
            isFinalized: img.isFinalized === true,
            characterPrompt: img.characterPrompt,
            csvContext: img.csvContext,
          })),
        }));

        setBackgrounds(importedBackgrounds);
        setIsSaved(false);

        toast({
          variant: "success",
          title: phrase(dictionary, "bgsheet_import_success", language) || "Import Successful",
          description: `${importedBackgrounds.length} ${phrase(dictionary, "bgsheet_backgrounds_imported", language) || "backgrounds imported"}`,
        });
      } catch (err) {
        console.error("JSON import error:", err);
        toast({
          variant: "destructive",
          title: phrase(dictionary, "bgsheet_import_failed", language) || "Import Failed",
          description: phrase(dictionary, "bgsheet_invalid_json", language) || "Invalid JSON file format",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  }, [toast, dictionary, language]);

  // ZIP Download handler - downloads all images as ZIP
  const handleZipDownload = useCallback(async () => {
    const zip = new JSZip();
    let imageCount = 0;

    for (const bg of backgrounds) {
      // Create folder for each background
      const folderName = bg.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const folder = zip.folder(folderName);

      for (const img of bg.images) {
        // Skip deactivated frames
        if (img.isActive === false) continue;

        if (img.imageBase64) {
          // Add base64 image to zip
          const fileName = `${img.angle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.jpg`;
          folder?.file(fileName, img.imageBase64, { base64: true });
          imageCount++;
        } else if (img.imageUrl) {
          // For S3 URLs, we need to fetch the image
          try {
            const response = await fetch(img.imageUrl);
            if (response.ok) {
              const blob = await response.blob();
              const fileName = `${img.angle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.jpg`;
              folder?.file(fileName, blob);
              imageCount++;
            }
          } catch (err) {
            console.error(`Failed to fetch image for ${bg.name}/${img.angle}:`, err);
          }
        }
      }
    }

    if (imageCount === 0) {
      toast({
        variant: "destructive",
        title: phrase(dictionary, "bgsheet_no_images", language) || "No Images",
        description: phrase(dictionary, "bgsheet_no_images_to_download", language) || "No images available to download",
      });
      return;
    }

    // Generate and download ZIP
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `bgsheet_images_${new Date().toISOString().slice(0, 10)}.zip`);

    toast({
      variant: "success",
      title: phrase(dictionary, "bgsheet_download_success", language) || "Download Started",
      description: `${imageCount} ${phrase(dictionary, "bgsheet_images_in_zip", language) || "images in ZIP"}`,
    });
  }, [backgrounds, toast, dictionary, language]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{phrase(dictionary, "bgsheet_title", language)}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {phrase(dictionary, "bgsheet_subtitle", language)}
        </p>
      </div>

      {/* Cost Tracking Panel (Phase 6) */}
      {!isLoadingData && (
        <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {/* Clock In/Out Controls */}
            <div className="flex items-center gap-2">
              {!costSession.active ? (
                costSession.sessionStarted ? (
                  <>
                    <button
                      onClick={handleRestartClockIn}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-[#DB2777] dark:hover:text-[#DB2777] transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {phrase(dictionary, "bgsheet_restart", language) || "Restart"}
                    </button>
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                    <button
                      onClick={downloadInvoice}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#DB2777] dark:hover:text-[#DB2777] underline decoration-dotted transition-colors"
                    >
                      {phrase(dictionary, "bgsheet_last_invoice", language) || "Last Invoice"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleClockIn}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-[#DB2777] dark:hover:text-[#DB2777] transition-colors"
                  >
                    <Clock className="w-3 h-3" />
                    {phrase(dictionary, "bgsheet_clock_in", language) || "Clock In"}
                  </button>
                )
              ) : (
                <button
                  onClick={handleClockOut}
                  className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-500 transition-colors animate-pulse"
                >
                  <Clock className="w-3 h-3" />
                  {phrase(dictionary, "bgsheet_clock_out", language) || "Clock Out"}
                </button>
              )}
            </div>
          </div>

          {/* Cost Display */}
          {(costSession.sessionStarted || costSession.active) && (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-mono">
              <div className="flex flex-col leading-tight">
                <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                  {phrase(dictionary, "bgsheet_text_plan", language) || "Text Plan"}
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  ${currentTextCost.toFixed(4)}
                </span>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-600"></div>
              <div className="flex flex-col leading-tight">
                <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                  {phrase(dictionary, "bgsheet_img_gen", language) || "Img Gen"}
                </span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  ${currentImageCost.toFixed(4)}
                </span>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-600"></div>
              <div className="flex flex-col leading-tight">
                <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                  {phrase(dictionary, "bgsheet_total", language) || "Total"}
                </span>
                <span className="text-[#DB2777] font-bold">
                  ${totalCost.toFixed(4)}
                </span>
              </div>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-600"></div>
              <div className="flex flex-col leading-tight">
                <span className="text-gray-400 dark:text-gray-500 text-[10px]">
                  {phrase(dictionary, "bgsheet_images", language) || "Images"}
                </span>
                <span className="text-gray-600 dark:text-gray-300 font-bold">
                  {costSession.imageUsage.count}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

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

      {/* Analyze Button & Import Options - only show when no results */}
      {!isLoadingData && originalText && !isAnalyzing && backgrounds.length === 0 && (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {phrase(dictionary, "bgsheet_analyze_text", language)}
          </button>
          <div className="flex gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500 self-center">
              {phrase(dictionary, "bgsheet_or_import", language) || "or import:"}
            </span>
            {/* CSV Import */}
            <label className="cursor-pointer">
              <div className="flex items-center gap-1.5 bg-gray-500 hover:bg-gray-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-xs">
                <FileUp className="w-3.5 h-3.5" />
                <span>{phrase(dictionary, "bgsheet_import_csv", language) || "CSV"}</span>
              </div>
              <input
                ref={csvImportRef}
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="hidden"
              />
            </label>
            {/* JSON Import */}
            <label className="cursor-pointer">
              <div className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-xs">
                <FileUp className="w-3.5 h-3.5" />
                <span>{phrase(dictionary, "bgsheet_import_json", language) || "JSON"}</span>
              </div>
              <input
                ref={jsonImportRef}
                type="file"
                accept=".json"
                onChange={handleJsonImport}
                className="hidden"
              />
            </label>
          </div>
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
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="w-1 h-5 bg-[#DB2777] rounded-full"></span>
                {phrase(dictionary, "bgsheet_backgrounds", language)} ({backgrounds.length})
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                {totalActiveFrames} {phrase(dictionary, "bgsheet_active_frames", language) || "active frames"}
              </span>
            </div>
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
              {/* JSON Export */}
              <button
                onClick={handleJsonExport}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <FileJson className="w-4 h-4" />
                <span>{phrase(dictionary, "bgsheet_export_json", language) || "Export JSON"}</span>
              </button>
              {/* ZIP Download */}
              <button
                onClick={handleZipDownload}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm"
              >
                <Package className="w-4 h-4" />
                <span>{phrase(dictionary, "bgsheet_download_zip", language) || "ZIP"}</span>
              </button>
              <button
                onClick={() => {
                  setBackgrounds([]);
                  clearBgSheetAnalysis();
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

                {/* Master Reference Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {phrase(dictionary, "bgsheet_master_reference", language) || "Master Reference"}
                    </h4>
                    {bg.referenceImageBase64 && (
                      <button
                        onClick={() => handleRemoveReference(bg.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove reference"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {bg.referenceImageBase64 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column: Image */}
                      <div>
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                          <img
                            src={`data:image/jpeg;base64,${bg.referenceImageBase64}`}
                            alt="Master Reference"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Right Column: Planned Prompts */}
                      <div className="flex flex-col h-full">
                        {bg.referenceAnalysis && (
                          <>
                            {!bg.plannedPrompts ? (
                              <button
                                onClick={() => handlePlanPrompts(bg.id)}
                                disabled={isPlanningPrompts[bg.id]}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/20 transition-colors disabled:opacity-50"
                              >
                                {isPlanningPrompts[bg.id] ? (
                                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4" />
                                )}
                                <span className="text-xs font-medium">
                                  {phrase(dictionary, "bgsheet_plan_prompts", language) || "Batch Plan from Ref"}
                                </span>
                              </button>
                            ) : (
                              <div className="flex flex-col flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {phrase(dictionary, "bgsheet_planned_prompts", language) || "Planned Prompts"} ({bg.plannedPrompts.length})
                                  </p>
                                  <button
                                    onClick={() => handleClearPlannedPrompts(bg.id)}
                                    className="text-xs text-red-500 hover:text-red-600"
                                  >
                                    {phrase(dictionary, "bgsheet_clear_prompts", language) || "Clear"}
                                  </button>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1.5">
                                  {bg.plannedPrompts.map((prompt, idx) => (
                                    <div key={idx} className="flex gap-2 items-start">
                                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 w-5 shrink-0 pt-1">
                                        N-{idx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => handleUpdatePlannedPrompt(bg.id, idx, e.target.value)}
                                        className="flex-1 text-[10px] bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded px-2 py-1 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#DB2777]"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {!bg.referenceAnalysis && (
                          <div className="flex items-center justify-center h-full text-xs text-gray-400 dark:text-gray-500">
                            {phrase(dictionary, "bgsheet_analyzing_reference", language) || "Analyzing reference..."}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {/* Upload Reference Button */}
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg border border-dashed border-gray-300 dark:border-gray-500 transition-colors">
                          <Upload className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {phrase(dictionary, "bgsheet_upload_reference", language) || "Upload"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadReference(bg.id, e)}
                          className="hidden"
                        />
                      </label>

                      {/* Generate Reference Button */}
                      <button
                        onClick={() => handleGenerateMasterRef(bg.id)}
                        disabled={isGeneratingMaster[bg.id]}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#DB2777]/10 hover:bg-[#DB2777]/20 text-[#DB2777] rounded-lg border border-[#DB2777]/20 transition-colors disabled:opacity-50"
                      >
                        {isGeneratingMaster[bg.id] ? (
                          <div className="w-4 h-4 border-2 border-[#DB2777]/30 border-t-[#DB2777] rounded-full animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span className="text-xs">
                          {phrase(dictionary, "bgsheet_generate_reference", language) || "Generate"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Generation Controls */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {phrase(dictionary, "bgsheet_reference_views", language)}
                  </h4>
                  <div className="flex items-center gap-2">
                    {/* Range Input */}
                    <input
                      type="text"
                      value={bg.generationRange || "All"}
                      onChange={(e) => handleUpdateGenerationRange(bg.id, e.target.value)}
                      placeholder="All"
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs w-16 focus:outline-none focus:ring-1 focus:ring-[#DB2777]"
                      title="Range: All, 1-5, 1,3,5"
                    />
                    {/* Plan Text Button - Apply planned prompts to image cards */}
                    {bg.plannedPrompts && bg.plannedPrompts.length > 0 && (
                      <button
                        onClick={() => handleApplyPlannedPrompts(bg.id)}
                        className="text-xs bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20 font-bold hover:bg-purple-500/20 transition-colors"
                      >
                        {phrase(dictionary, "bgsheet_plan_text", language) || "Plan Text"}
                      </button>
                    )}
                    {/* Sequential Render / Stop Button */}
                    {bg.isSequentiallyGenerating ? (
                      <button
                        onClick={() => handleStopGeneration(bg.id)}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-full font-bold animate-pulse"
                      >
                        {phrase(dictionary, "bgsheet_stop", language) || "Stop"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateBackgroundsSequential(bg.id)}
                        className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1 rounded-full transition-colors"
                      >
                        {phrase(dictionary, "bgsheet_render_images", language) || "Render Images"}
                      </button>
                    )}
                    {/* Legacy generate all views button */}
                    {/* <button
                      onClick={() => handleGenerateBackgroundSheet(bg.id)}
                      className="text-xs bg-[#DB2777]/10 text-[#DB2777] px-3 py-1 rounded-full hover:bg-[#DB2777]/20 border border-[#DB2777]/20 transition-colors"
                    >
                      {phrase(dictionary, "bgsheet_generate_all_views", language)}
                    </button> */}
                  </div>
                </div>

                {/* Image Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(bg.images && bg.images.length > 0 ? bg.images : BACKGROUND_ANGLES.map((angle) => ({
                    angle,
                    prompt: "",
                    imageBase64: "",
                    imageUrl: undefined,
                    isGenerating: false,
                    isActive: true,
                    isFinalized: false,
                    isPromptOpen: false,
                    characterPrompt: "",
                    csvContext: "",
                  }))).map((img, idx) => {
                    const hasImage = img.imageBase64 || img.imageUrl;
                    const imageSrc = img.imageBase64
                      ? `data:image/jpeg;base64,${img.imageBase64}`
                      : img.imageUrl;
                    const isActive = img.isActive !== false;
                    const isFinalized = img.isFinalized === true;
                    const globalFrameNum = frameNumbers[`${bg.id}-${idx}`];

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col gap-1 rounded-lg border border-transparent p-1 transition-all ${!isActive ? "opacity-40 grayscale" : ""}`}
                      >
                        {/* Image Container */}
                        <div
                          className="group relative bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 aspect-video"
                        >
                          {hasImage ? (
                            <>
                              <img
                                src={imageSrc}
                                alt={img.angle}
                                className="w-full h-full object-cover"
                              />
                              {/* Hover overlay for edit/download/set-as-ref */}
                              {!img.isGenerating && !isFinalized && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                  {img.imageBase64 && (
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
                                  )}
                                  {(img.imageBase64 || img.imageUrl) && (
                                    <button
                                      onClick={() => handleSetGeneratedAsRef(bg.id, img.imageBase64, img.imageUrl)}
                                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white"
                                      title={phrase(dictionary, "bgsheet_set_as_reference", language) || "Set as Reference"}
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleEditImage(bg.id, idx, img.imageBase64 || img.imageUrl || "")
                                    }
                                    className="p-1.5 bg-[#DB2777] hover:bg-[#BE185D] rounded-full text-white shadow-lg"
                                    title={phrase(dictionary, "edit", language)}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              {/* Loading overlay for regeneration */}
                              {img.isGenerating && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#DB2777]"></div>
                                  <span className="mt-2 text-xs text-white">{phrase(dictionary, "bgsheet_generating", language)}</span>
                                </div>
                              )}
                            </>
                          ) : img.isGenerating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#DB2777]"></div>
                              <span className="mt-2 text-xs text-gray-400">{phrase(dictionary, "bgsheet_generating", language)}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateSingleView(bg.id, idx)}
                              className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-xs p-2 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                            >
                              <ImageIcon className="w-6 h-6 mb-1 group-hover:text-[#DB2777] transition-colors" />
                              <span className="group-hover:text-[#DB2777] transition-colors">
                                {phrase(dictionary, "bgsheet_click_to_generate", language) || "Click to generate"}
                              </span>
                              <span className="text-[10px] mt-1 opacity-60">{img.angle}</span>
                            </button>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pointer-events-none">
                            <span className="text-[10px] font-medium text-white">
                              {img.angle}
                            </span>
                          </div>
                        </div>

                        {/* Frame Info Bar */}
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-1 min-w-0">
                            {/* Frame Number (clickable to toggle active) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleActive(bg.id, idx);
                              }}
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors ${
                                isActive
                                  ? "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30 border border-teal-500/20"
                                  : "text-gray-400 bg-gray-200 dark:bg-gray-700"
                              }`}
                              title={isActive ? "Click to deactivate" : "Click to activate"}
                            >
                              {globalFrameNum}
                            </button>
                            {/* Angle Label */}
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded truncate border border-gray-200 dark:border-gray-600">
                              {img.angle}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Toggle Prompt Button */}
                            {!isFinalized && (
                              <button
                                onClick={() => handleTogglePrompt(bg.id, idx)}
                                className={`p-1 rounded transition-colors ${
                                  img.isPromptOpen
                                    ? "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30"
                                    : "text-gray-400 hover:text-purple-500 dark:hover:text-purple-400"
                                }`}
                                title={img.isPromptOpen ? "Hide prompt" : "Show prompt"}
                              >
                                <FileText className="w-3 h-3" />
                              </button>
                            )}
                            {/* Finalize Button */}
                            <button
                              onClick={() => handleFinalizeFrame(bg.id, idx)}
                              className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold transition-colors ${
                                isFinalized
                                  ? "text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500/20"
                                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              }`}
                            >
                              {isFinalized && <Check className="w-2 h-2" />}
                              {isFinalized ? "Done" : "Finalize"}
                            </button>
                          </div>
                        </div>

                        {/* Character Prompt (shown when finalized) */}
                        {isFinalized && (
                          <div className="px-1">
                            <textarea
                              value={img.characterPrompt || ""}
                              onChange={(e) => handleUpdateCharacterPrompt(bg.id, idx, e.target.value)}
                              className="w-full bg-gray-50 dark:bg-gray-600 border border-yellow-500/20 rounded p-1.5 text-[10px] text-yellow-700 dark:text-yellow-200 min-h-[40px] focus:outline-none focus:border-yellow-500/50 resize-none"
                              placeholder={phrase(dictionary, "bgsheet_scene_notes", language) || "Scene details..."}
                            />
                          </div>
                        )}

                        {/* Prompt Editor (shown when isPromptOpen and not finalized) */}
                        {img.isPromptOpen && !isFinalized && (
                          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 mx-1 mt-1">
                            <textarea
                              value={img.prompt || ""}
                              onChange={(e) => handleUpdatePrompt(bg.id, idx, e.target.value)}
                              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1.5 text-[10px] text-gray-700 dark:text-gray-300 min-h-[50px] focus:outline-none focus:ring-1 focus:ring-[#DB2777] resize-none"
                              placeholder={phrase(dictionary, "bgsheet_prompt_placeholder", language) || "Enter prompt..."}
                            />
                            <button
                              onClick={() => handleGenerateSingleView(bg.id, idx, hasImage ? true : false)}
                              disabled={img.isGenerating}
                              className="w-full mt-1.5 py-1.5 bg-[#DB2777] text-white text-[10px] font-bold rounded hover:bg-[#DB2777]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {img.isGenerating ? "Generating..." : (hasImage ? "Regenerate" : "Generate")}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

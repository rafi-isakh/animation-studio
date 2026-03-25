"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProject } from "@/contexts/ProjectContext";
import { phrase } from "@/utils/phrases";
import { getChapter, saveBgSheetSettings, updateBackgroundAngleImage, saveBackground, saveBackgroundWithId, updateBackgroundReferenceData, getBackgrounds, clearBgSheet } from "../services/firestore";
import { uploadBackgroundImage, uploadBackgroundReferenceImage, deleteBackgroundReferenceImage } from "../services/s3";
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
  FileUp,
  Package,
  FileJson,
  Shuffle,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import BgSheetImageEditor from "./BgSheetImageEditor";
import { useBgOrchestrator, type AngleUpdate } from "./useBgOrchestrator";
import { getActiveProjectBgJobs, mapBgJobToAngleUpdate } from "../services/firestore/jobQueue";
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

// Helper to get shot suffix (1-9) from angle string
// Handles both standard angles like "Front View" and storyboard angles like "1-3" or "Front View (1-3)"
const getShotSuffix = (angleString: string): string => {
  // First check if it's a standard angle name
  const standardIndex = BACKGROUND_ANGLES.indexOf(angleString);
  if (standardIndex >= 0) {
    return String(standardIndex + 1);
  }

  // Check for parenthetical format like "Front View (1-3)"
  const parenMatch = angleString.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const idParts = parenMatch[1].split('-');
    return idParts.length >= 2 ? idParts[1] : "";
  }

  // Check for direct format like "1-3"
  const idParts = angleString.split('-');
  return idParts.length >= 2 ? idParts[1] : "";
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
  onCancel?: () => void;
}

const Loader: React.FC<LoaderProps> = ({ dictionary, language, onCancel }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {phrase(dictionary, "bgsheet_ai_analyzing", language)}
    </p>
    {onCancel && (
      <button
        onClick={onCancel}
        className="mt-2 px-4 py-1.5 text-sm rounded-lg border border-[#272727] bg-[#211F21] text-gray-400 hover:text-[#E8E8E8] hover:border-[#DB2777] transition-colors"
      >
        Cancel
      </button>
    )}
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

// Column mapping configuration for CSV import
interface CsvColumnMapping {
  backgroundIdCol: number;    // Default: 4 (column E)
  backgroundPromptCol: number; // Default: 5 (column F)
  imagePromptCol: number;      // Default: 7 (column H)
}

const DEFAULT_CSV_COLUMN_MAPPING: CsvColumnMapping = {
  backgroundIdCol: 4,
  backgroundPromptCol: 5,
  imagePromptCol: 7,
};

// CSV Import parser - parses storyboard CSV to extract backgrounds
// Each CSV row becomes a separate storyboard view (not fixed 9 angles)
const parseCsvForImport = (csvContent: string, columnMapping: CsvColumnMapping = DEFAULT_CSV_COLUMN_MAPPING): Map<string, CsvBackgroundData> => {
  // Map: background name -> { name, description, views: CsvViewData[] }
  const result = new Map<string, CsvBackgroundData>();
  const bgOrder: string[] = []; // Track order of backgrounds as they appear

  const rows = parseCsvRows(csvContent);
  if (rows.length <= 1) return result; // Only header or empty

  let lastBgPrefix: string | null = null; // Track last valid BG prefix for implicit rows

  const { backgroundIdCol, backgroundPromptCol, imagePromptCol } = columnMapping;
  const minCols = Math.max(backgroundIdCol, backgroundPromptCol, imagePromptCol) + 1;

  // Skip header row, parse data rows
  for (let i = 1; i < rows.length; i++) {
    const fields = rows[i];
    if (fields.length < minCols) continue;

    const bgIdRaw = fields[backgroundIdCol]?.trim() || "";
    const bgPrompt = fields[backgroundPromptCol]?.trim() || "";
    const storyboardContext = fields[imagePromptCol]?.trim() || "";

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
      fullId = `${bgPrefix}-x`;
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
  const { setStageResult, bgSheetGenerator, startBgSheetAnalysis, cancelBgSheetAnalysis, clearBgSheetAnalysis, setBgSheetResult, customApiKey, storyboardGenerator } = useMithril();
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

  // Master reference remix state (per background)
  const [isRemixingMaster, setIsRemixingMaster] = useState<Record<string, boolean>>({});
  const [remixPrompts, setRemixPrompts] = useState<Record<string, string>>({});

  // Batch prompt planning state (per background)
  const [isPlanningPrompts, setIsPlanningPrompts] = useState<Record<string, boolean>>({});

  // Auto pilot state
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);
  const autoPilotAbortRef = useRef(false);

  // Sequential generation stop control (per background)
  const stopGenerationRef = useRef<Record<string, boolean>>({});

  // AbortController for canceling in-flight requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  // === Orchestrator Integration ===
  // Enable orchestrator mode (can be controlled by env variable)
  const useOrchestrator = process.env.NEXT_PUBLIC_USE_BG_ORCHESTRATOR === 'true';

  // Track active jobs: Map<`${bgId}-${angle}`, jobId>
  const activeJobsRef = useRef<Map<string, string>>(new Map());
  const isMountedRef = useRef(true);
  // Mirror backgrounds state for use in callbacks without stale closures
  const backgroundsRef = useRef<Background[]>([]);
  useEffect(() => { backgroundsRef.current = backgrounds; }, [backgrounds]);

  // Handle angle updates from orchestrator
  const handleAngleUpdate = useCallback((update: AngleUpdate) => {
    if (!isMountedRef.current) return;

    const angleKey = `${update.bgId}-${update.angle}`;
    const trackedJobId = activeJobsRef.current.get(angleKey);
    const isTrackedJob = trackedJobId === update.jobId;
    const hasNewImageUrl = update.imageUrl && update.imageUrl.trim() !== "";

    // Only process updates from the job we're tracking for this angle
    // This prevents old completed jobs from overwriting the generating state of new jobs
    if (!isTrackedJob && trackedJobId) {
      // We have a different job tracked for this angle - ignore this update
      return;
    }

    // Find the background and angle index
    setBackgrounds(prevBgs => {
      const bgIndex = prevBgs.findIndex(bg => bg.id === update.bgId);
      if (bgIndex === -1) return prevBgs;

      const bg = prevBgs[bgIndex];
      const angleIndex = bg.images?.findIndex(img => img.angle === update.angle);
      if (angleIndex === undefined || angleIndex === -1) return prevBgs;

      const updatedBgs = [...prevBgs];
      const updatedImages = [...bg.images];

      // Preserve old imageUrl/imageBase64 during generation unless new one is valid
      const existingImage = updatedImages[angleIndex];
      let newImageUrl = existingImage.imageUrl;
      if (hasNewImageUrl) {
        // Add cache-busting timestamp to force browser to fetch new image
        const baseUrl = update.imageUrl!.split('?')[0];
        newImageUrl = `${baseUrl}?t=${Date.now()}`;
      }

      updatedImages[angleIndex] = {
        ...existingImage,
        imageUrl: newImageUrl,
        imageBase64: hasNewImageUrl ? "" : existingImage.imageBase64, // Clear base64 when S3 URL arrives
        isGenerating: update.status !== "completed" && update.status !== "failed",
      };

      updatedBgs[bgIndex] = { ...bg, images: updatedImages };

      // Sync to MithrilContext when job completes successfully (so navigation preserves new image)
      if (update.status === "completed" && hasNewImageUrl) {
        const metadata: BgSheetResultMetadata = {
          backgrounds: updatedBgs.map((b) => ({
            id: b.id,
            name: b.name,
            description: b.description,
            referenceImageUrl: b.referenceImageUrl,
            referenceAnalysis: b.referenceAnalysis,
            plannedPrompts: b.plannedPrompts,
            images: b.images.map((img) => ({
              angle: img.angle,
              prompt: img.prompt,
              imageId: img.imageUrl || "",
            })),
          })),
          styleKeyword: styleKeywordRef.current,
          backgroundBasePrompt: backgroundBasePromptRef.current,
        };
        setBgSheetResult(metadata);
        setStageResult(6, metadata);
      }

      return updatedBgs;
    });

    // Cleanup on completion/failure (no success toast to avoid noise with batch generation)
    if (update.status === "completed" && isTrackedJob) {
      activeJobsRef.current.delete(angleKey);
    } else if (update.status === "failed" && isTrackedJob) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: `${update.bgName} - ${update.angle}: ${update.error || "Unknown error"}`,
      });
      activeJobsRef.current.delete(angleKey);
    }
  }, [toast, setBgSheetResult, setStageResult]);

  // Initialize orchestrator hook
  const { submitJob: submitBgJob, submitBatch: submitBgBatch, cancelJob: cancelBgJob, pendingUpdates: bgPendingUpdates, clearPendingUpdates: clearBgPendingUpdates } = useBgOrchestrator({
    projectId: currentProjectId,
    onAngleUpdate: handleAngleUpdate,
    enabled: useOrchestrator,
  });

  // Apply pending updates from initial Firestore snapshot once backgrounds are loaded
  useEffect(() => {
    if (bgPendingUpdates.length === 0 || backgrounds.length === 0) return;

    bgPendingUpdates.forEach((update) => {
      const angleKey = `${update.bgId}-${update.angle}`;
      const isTerminal = update.status === 'completed' || update.status === 'failed';
      if (!isTerminal) {
        // Re-track in-flight jobs so subsequent snapshots pick them up
        activeJobsRef.current.set(angleKey, update.jobId);
      }
      handleAngleUpdate(update);
    });
    clearBgPendingUpdates();
  }, [bgPendingUpdates, backgrounds.length, handleAngleUpdate, clearBgPendingUpdates]);

  // Load active jobs on mount (restores in-flight jobs not captured by initial snapshot)
  useEffect(() => {
    if (!useOrchestrator || !currentProjectId) return;

    const loadActiveJobs = async () => {
      try {
        const activeJobs = await getActiveProjectBgJobs(currentProjectId);

        activeJobs.forEach(job => {
          if (job.bg_id && job.bg_angle) {
            const angleKey = `${job.bg_id}-${job.bg_angle}`;
            activeJobsRef.current.set(angleKey, job.id);
            // Process update to sync UI state
            const update = mapBgJobToAngleUpdate(job);
            handleAngleUpdate(update);
          }
        });
      } catch (error) {
        console.error("[BgSheet] Failed to load active jobs:", error);
      }
    };

    loadActiveJobs();
  }, [useOrchestrator, currentProjectId, handleAngleUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
        if (chapter?.content) {
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

    const hydrateFromContext = async () => {
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
          // Load reference data from context if available
          referenceImageUrl: bgMeta.referenceImageUrl,
          referenceAnalysis: bgMeta.referenceAnalysis,
          plannedPrompts: bgMeta.plannedPrompts,
        }));

        // Mark as hydrated BEFORE setting state to prevent re-runs
        hasHydratedRef.current = true;

        setBackgrounds(backgroundsWithImages);
        setStyleKeyword(contextResult.styleKeyword);
        setBackgroundBasePrompt(contextResult.backgroundBasePrompt);
        setIsSaved(true);

        // If we have a projectId but context doesn't have reference data, load from Firestore
        if (currentProjectId) {
          try {
            const firestoreBackgrounds = await getBackgrounds(currentProjectId);
            if (firestoreBackgrounds.length > 0) {
              setBackgrounds(prevBgs => prevBgs.map(bg => {
                const firestoreBg = firestoreBackgrounds.find(fb => fb.id === bg.id);
                if (firestoreBg && (firestoreBg.referenceImageRef || firestoreBg.referenceAnalysis || firestoreBg.plannedPrompts)) {
                  return {
                    ...bg,
                    referenceImageUrl: firestoreBg.referenceImageRef || bg.referenceImageUrl,
                    referenceAnalysis: firestoreBg.referenceAnalysis || bg.referenceAnalysis,
                    plannedPrompts: firestoreBg.plannedPrompts || bg.plannedPrompts,
                  };
                }
                return bg;
              }));
            }
          } catch (error) {
            console.error("Failed to load reference data from Firestore:", error);
          }
        }
      } catch {
        // Ignore errors
        hasHydratedRef.current = true;
      }
      setIsLoadingData(false);
    };

    hydrateFromContext();
  }, [contextResult, currentProjectId]);

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
        setStageResult(6, metadata);
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
      setStageResult(6, metadata);
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
      setStageResult(6, metadata);
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
  // Also uploads to S3 and saves to Firestore for persistence
  const handleSetReferenceImage = async (bgId: string, base64: string) => {
    const bg = backgrounds.find(b => b.id === bgId);

    // Set the reference image locally (don't auto-populate first view)
    setBackgrounds(bgs => bgs.map(b =>
      b.id === bgId ? { ...b, referenceImageBase64: base64 } : b
    ));
    setIsSaved(false);

    let analysisResult: ReferenceAnalysis | undefined;

    // Analyze reference image for spatial elements
    try {
      const response = await fetch("/api/generate_bg_sheet/analyze-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, customApiKey: customApiKey || undefined }),
      });

      const data = await response.json();
      if (response.ok && data.analysis) {
        analysisResult = data.analysis as ReferenceAnalysis;
        setBackgrounds(bgs => bgs.map(b =>
          b.id === bgId ? { ...b, referenceAnalysis: analysisResult } : b
        ));
      }
    } catch (e) {
      console.error("Failed to analyze reference image:", e);
    }

    // Upload to S3 and save to Firestore for persistence
    if (currentProjectId) {
      try {
        // Upload reference image to S3
        const referenceImageUrl = await uploadBackgroundReferenceImage(currentProjectId, bgId, base64);

        // Update local state with S3 URL
        const urlWithCacheBust = `${referenceImageUrl}?t=${Date.now()}`;
        setBackgrounds(bgs => bgs.map(b =>
          b.id === bgId ? { ...b, referenceImageUrl: urlWithCacheBust } : b
        ));

        // Save to Firestore
        await updateBackgroundReferenceData(
          currentProjectId,
          bgId,
          {
            referenceImageRef: referenceImageUrl,
            referenceAnalysis: analysisResult || null,
          },
          bg?.name,
          bg?.description
        );

        setIsSaved(true);
      } catch (error) {
        console.error("Failed to persist reference image:", error);
        // Don't show error toast - the image is still usable locally
      }
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

  // Remix master reference image via Gemini (image-to-image variation)
  const handleRemixMasterRef = async (bgId: string) => {
    const bg = backgrounds.find(b => b.id === bgId);
    if (!bg || isRemixingMaster[bgId]) return;

    // Get reference image base64
    let refBase64 = bg.referenceImageBase64;
    if (!refBase64 && bg.referenceImageUrl) {
      try {
        const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(bg.referenceImageUrl.split("?")[0])}`;
        const imageResponse = await fetch(proxyUrl);
        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          refBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          setBackgrounds(bgs => bgs.map(b => b.id === bgId ? { ...b, referenceImageBase64: refBase64 } : b));
        }
      } catch (e) {
        console.error("Failed to fetch reference image for remix:", e);
      }
    }

    if (!refBase64) {
      toast({ variant: "destructive", title: "No reference image to remix" });
      return;
    }

    setIsRemixingMaster(prev => ({ ...prev, [bgId]: true }));

    try {
      const userInstruction = remixPrompts[bgId]?.trim();
      const prompt = userInstruction
        ? `${userInstruction}. ${backgroundBasePrompt}. Style: ${styleKeyword}. EMPTY SCENE, NO CHARACTERS, NO PEOPLE.`
        : `Create a stylistic variation of this background scene. Keep the same location, atmosphere, and visual style but explore a different composition, lighting mood, or time of day. ${backgroundBasePrompt}. Style: ${styleKeyword}. EMPTY SCENE, NO CHARACTERS, NO PEOPLE.`;

      const response = await fetch("/api/generate_bg_sheet/generate-from-reference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceImageBase64: refBase64, prompt, customApiKey: customApiKey || undefined }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      await handleSetReferenceImage(bgId, data.imageBase64);

      toast({
        variant: "success",
        title: "Reference Remixed",
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
      setIsRemixingMaster(prev => ({ ...prev, [bgId]: false }));
    }
  };

  // Remove reference image (also deletes from S3 and Firestore)
  const handleRemoveReference = async (bgId: string) => {
    const bg = backgrounds.find(b => b.id === bgId);

    // Update local state
    setBackgrounds(bgs => bgs.map(b =>
      b.id === bgId
        ? { ...b, referenceImageBase64: undefined, referenceImageUrl: undefined, referenceAnalysis: undefined, plannedPrompts: undefined }
        : b
    ));
    setIsSaved(false);

    // Delete from S3 and Firestore
    if (currentProjectId) {
      try {
        // Delete from S3
        await deleteBackgroundReferenceImage(currentProjectId, bgId);

        // Clear reference data in Firestore
        await updateBackgroundReferenceData(
          currentProjectId,
          bgId,
          {
            referenceImageRef: null,
            referenceAnalysis: null,
            plannedPrompts: null,
          },
          bg?.name,
          bg?.description
        );

        setIsSaved(true);
      } catch (error) {
        console.error("Failed to delete reference image from storage:", error);
        // Don't show error toast - the image is already removed locally
      }
    }
  };

  // Use a generated image as the master reference
  const handleSetGeneratedAsRef = async (bgId: string, base64?: string, imageUrl?: string) => {
    // If we have base64 data, use it directly
    if (base64) {
      handleSetReferenceImage(bgId, base64);
      return;
    }

    // If we only have URL, fetch via proxy to avoid CORS issues
    if (imageUrl) {
      try {
        // Use the S3 proxy endpoint to fetch the image
        const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(imageUrl)}`;
        const response = await fetch(proxyUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        // Convert response to base64
        const blob = await response.blob();
        const reader = new FileReader();

        reader.onloadend = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64Data = result.split(",")[1];
          if (base64Data) {
            handleSetReferenceImage(bgId, base64Data);
          }
        };

        reader.onerror = () => {
          console.error("Failed to read image blob");
          toast({
            variant: "destructive",
            title: "Failed to set reference",
            description: "Could not process the image",
          });
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
    if (!bg || (!bg.referenceImageBase64 && !bg.referenceImageUrl) || isPlanningPrompts[bgId]) return;

    setIsPlanningPrompts(prev => ({ ...prev, [bgId]: true }));

    try {
      // Get base64 image - either from memory or fetch from URL
      let imageBase64 = bg.referenceImageBase64;
      if (!imageBase64 && bg.referenceImageUrl) {
        // Fetch from URL via proxy and convert to base64
        const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(bg.referenceImageUrl.split("?")[0])}`;
        const imageResponse = await fetch(proxyUrl);
        if (!imageResponse.ok) throw new Error("Failed to fetch reference image");
        const blob = await imageResponse.blob();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove data URL prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        // Also update local state with the fetched base64
        setBackgrounds(bgs => bgs.map(b =>
          b.id === bgId ? { ...b, referenceImageBase64: imageBase64 } : b
        ));
      }

      const response = await fetch("/api/generate_bg_sheet/plan-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
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

        // Save planned prompts to Firestore
        if (currentProjectId) {
          try {
            await updateBackgroundReferenceData(
              currentProjectId,
              bgId,
              { plannedPrompts: data.prompts },
              bg.name,
              bg.description
            );
            setIsSaved(true);
          } catch (error) {
            console.error("Failed to save planned prompts to Firestore:", error);
          }
        }

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

  // Update a single planned prompt - REAL-TIME SYNC to storyboard cards with matching suffix
  const handleUpdatePlannedPrompt = (bgId: string, index: number, newPrompt: string) => {
    setBackgrounds(bgs => bgs.map(bg => {
      if (bg.id !== bgId) return bg;

      // Update the planned prompts list
      const newPrompts = bg.plannedPrompts ? [...bg.plannedPrompts] : Array(9).fill("");
      newPrompts[index] = newPrompt;

      // Propagate to all storyboard shots of this angle suffix in this location
      // index is 0-based, so suffix is index + 1
      const targetSuffix = String(index + 1);
      const newImages = bg.images.map(img => {
        if (getShotSuffix(img.angle) === targetSuffix) {
          return { ...img, prompt: newPrompt };
        }
        return img;
      });

      return { ...bg, plannedPrompts: newPrompts, images: newImages };
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

          // Paste the planned prompt (prompt is always visible when it has content)
          return { ...img, prompt: plannedPrompt || img.prompt };
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

  // Auto pilot: plan prompts → apply → generate for each eligible background
  const handleAutoPilot = async () => {
    const eligibleBgs = backgrounds.filter(
      bg => bg.referenceImageBase64 || bg.referenceImageUrl
    );
    if (eligibleBgs.length === 0) {
      toast({
        variant: "destructive",
        title: "No reference images found",
        description: "Add a reference image to at least one background first.",
      });
      return;
    }

    setIsAutoPiloting(true);
    autoPilotAbortRef.current = false;

    for (const bg of eligibleBgs) {
      if (autoPilotAbortRef.current) break;

      // Step 1: Plan prompts (skip if already planned)
      if (!bg.plannedPrompts || bg.plannedPrompts.length === 0) {
        await handlePlanPrompts(bg.id);
      }

      if (autoPilotAbortRef.current) break;

      // Step 2: Apply planned prompts using fresh state from ref
      const freshBg = backgroundsRef.current.find(b => b.id === bg.id);
      if (freshBg?.plannedPrompts && freshBg.plannedPrompts.length > 0) {
        handleApplyPlannedPrompts(bg.id);
      }

      if (autoPilotAbortRef.current) break;

      // Step 3: Generate all views
      await handleGenerateBackgroundSheet(bg.id);
    }

    setIsAutoPiloting(false);
  };

  const handleCancelAutoPilot = () => {
    autoPilotAbortRef.current = true;
  };

  const handleCancelImageGeneration = async (bgId: string, angle: string) => {
    const angleKey = `${bgId}-${angle}`;
    const jobId = activeJobsRef.current.get(angleKey);
    if (jobId) {
      try {
        await cancelBgJob({ jobId });
      } catch (e) {
        console.warn("[BgSheet] Failed to cancel job:", e);
      }
      activeJobsRef.current.delete(angleKey);
    }
    setBackgrounds(prevBgs =>
      prevBgs.map(bg =>
        bg.id === bgId
          ? { ...bg, images: bg.images.map(img => img.angle === angle ? { ...img, isGenerating: false } : img) }
          : bg
      )
    );
  };

  // Toggle prompt textbox visibility for an image card
  const handleTogglePrompt = (bgId: string, index: number) => {
    setBackgrounds(bgs => bgs.map(bg =>
      bg.id === bgId
        ? { ...bg, images: bg.images.map((img, i) => i === index ? { ...img, isPromptOpen: !img.isPromptOpen } : img) }
        : bg
    ));
  };

  // Update prompt for an image card - REAL-TIME SYNC to planned prompts and other cards with same suffix
  const handleUpdatePrompt = (bgId: string, index: number, newPrompt: string) => {
    setBackgrounds(bgs => bgs.map(bg => {
      if (bg.id !== bgId) return bg;

      const targetImage = bg.images[index];
      const suffix = getShotSuffix(targetImage.angle);
      const suffixInt = parseInt(suffix, 10);

      // 1. Update the master planned prompts list if suffix is valid (1-9)
      let newPlanned = bg.plannedPrompts ? [...bg.plannedPrompts] : undefined;
      if (newPlanned && !isNaN(suffixInt) && suffixInt >= 1 && suffixInt <= 9) {
        newPlanned[suffixInt - 1] = newPrompt;
      }

      // 2. Update all images in this location sharing the same angle suffix
      const newImages = bg.images.map(img => {
        const currentSuffix = getShotSuffix(img.angle);
        if (currentSuffix === suffix) {
          return { ...img, prompt: newPrompt };
        }
        return img;
      });

      return { ...bg, images: newImages, plannedPrompts: newPlanned };
    }));
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

  // Total active frames with images (downloadable)
  const totalDownloadableFrames = useMemo(() => {
    return backgrounds.reduce((acc, bg) => {
      return acc + bg.images.filter(img => img.isActive !== false && (img.imageBase64 || img.imageUrl)).length;
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

    // Extract shot suffix (1-9) from angle string for planned prompt lookup
    const viewSuffix = getShotSuffix(imageInfo.angle);
    const suffixInt = parseInt(viewSuffix, 10);

    // Look up planned prompt by suffix (1-indexed, so subtract 1 for array index)
    const plannedPrompt = (background.plannedPrompts && !isNaN(suffixInt) && suffixInt >= 1 && suffixInt <= 9)
      ? background.plannedPrompts[suffixInt - 1]
      : undefined;

    // Get detailed angle instruction - first try standard angles, then fall back
    const detailedAngleInstruction = angleToDetailedPrompt[imageInfo.angle] ||
      (suffixInt >= 1 && suffixInt <= 9 ? angleToDetailedPrompt[BACKGROUND_ANGLES[suffixInt - 1]] : imageInfo.angle);

    // Build base style prompt
    const baseStylePrompt = `${backgroundBasePrompt}. Description: ${background.description}. Style: ${styleKeyword}.`;

    // Get reference image for consistency (master ref or first generated image)
    // Priority: base64 in memory > URL-fetched base64 > first generated image
    let refImage: string | undefined = background.referenceImageBase64 ||
      (index !== 0 && background.images[0]?.imageBase64 ? background.images[0].imageBase64 : undefined);

    // If we have a URL but no base64, fetch and cache it
    if (!refImage && background.referenceImageUrl) {
      try {
        const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(background.referenceImageUrl.split("?")[0])}`;
        const imageResponse = await fetch(proxyUrl);
        if (imageResponse.ok) {
          const blob = await imageResponse.blob();
          const fetchedBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]); // Remove data URL prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          refImage = fetchedBase64;
          // Cache the base64 in local state for future use
          setBackgrounds(prevBgs =>
            prevBgs.map(bg =>
              bg.id === bgId ? { ...bg, referenceImageBase64: fetchedBase64 } : bg
            )
          );
        }
      } catch (error) {
        console.error("Failed to fetch reference image from URL:", error);
      }
    }

    // Determine final prompt - priority: existing prompt > planned prompt > csvContext-enhanced > auto-generated
    let prompt: string;
    if (imageInfo.prompt) {
      prompt = imageInfo.prompt;
    } else if (plannedPrompt) {
      prompt = plannedPrompt;
    } else if (imageInfo.csvContext) {
      // Use storyboard context in the prompt
      prompt = `${baseStylePrompt} ${detailedAngleInstruction}. Scene context: ${imageInfo.csvContext}. EMPTY SCENE, NO CHARACTERS, NO PEOPLE.`;
    } else {
      prompt = `${baseStylePrompt} ${detailedAngleInstruction} of ${background.name}. EMPTY SCENE, NO CHARACTERS, NO PEOPLE.`;
    }

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

    // === Orchestrator Mode ===
    if (useOrchestrator && currentProjectId) {
      try {
        // Clean up any existing job for this angle
        const angleKey = `${bgId}-${imageInfo.angle}`;
        const existingJobId = activeJobsRef.current.get(angleKey);

        if (existingJobId) {
          try {
            await cancelBgJob({ jobId: existingJobId });
          } catch (e) {
            console.warn("[BgSheet] Failed to cancel existing job:", e);
          }
          activeJobsRef.current.delete(angleKey);
        }

        // Submit to orchestrator with reference URL for style consistency
        const referenceUrl = background.referenceImageUrl || undefined;
        const result = await submitBgJob({
          projectId: currentProjectId,
          bgId: bgId,
          bgAngle: imageInfo.angle,
          bgName: background.name,
          prompt: prompt,
          aspectRatio: "16:9",
          referenceUrl: referenceUrl,
          apiKey: customApiKey || undefined,
        });

        // Track the job
        activeJobsRef.current.set(angleKey, result.jobId);

        // Don't reset isGenerating here - let the Firestore subscription handle it
        return;
      } catch (e) {
        console.error(`[BgSheet] Failed to submit orchestrator job for ${imageInfo.angle}:`, e);
        const errorMessage = e instanceof Error ? e.message : "Unknown error occurred";
        toast({
          variant: "destructive",
          title: "Failed to submit job",
          description: `${background.name} (${imageInfo.angle}): ${errorMessage}`,
        });
        // Reset generating state on error
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
        return;
      }
    }

    // === Direct Mode (existing logic) ===
    try {
      let response;

      if (refImage) {
        // Use image-to-image generation with reference for consistency
        const refPrompt = `Background consistent with the reference image style. ${prompt}`;
        response = await fetch("/api/generate_bg_sheet/generate-from-reference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            referenceImageBase64: refImage,
            prompt: refPrompt,
            customApiKey: customApiKey || undefined
          }),
        });
      } else {
        // Use text-only generation
        response = await fetch("/api/generate_bg_sheet/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, aspectRatio: "16:9", customApiKey: customApiKey || undefined }),
        });
      }

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

  // CSV column mapping state
  const [csvColumnMapping, setCsvColumnMapping] = useState<CsvColumnMapping>(DEFAULT_CSV_COLUMN_MAPPING);
  const [csvPreviewData, setCsvPreviewData] = useState<{ headers: string[]; rows: string[][]; rawContent: string } | null>(null);
  const [showCsvMappingModal, setShowCsvMappingModal] = useState(false);

  // File input refs for import
  const csvImportRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // CSV Import handler - shows column mapping modal first
  const handleCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const csvContent = ev.target?.result as string;
      const rows = parseCsvRows(csvContent);
      if (rows.length <= 1) {
        toast({
          variant: "destructive",
          title: phrase(dictionary, "bgsheet_import_failed", language) || "Import Failed",
          description: phrase(dictionary, "bgsheet_no_data_found", language) || "No valid data found in CSV",
        });
        return;
      }
      // Show mapping modal with preview
      setCsvPreviewData({ headers: rows[0], rows: rows.slice(1, 6), rawContent: csvContent });
      setCsvColumnMapping(DEFAULT_CSV_COLUMN_MAPPING);
      setShowCsvMappingModal(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [toast, dictionary, language]);

  // CSV Import confirm - actually parses and imports after column mapping
  const handleCsvImportConfirm = useCallback(async () => {
    if (!csvPreviewData) return;
    setShowCsvMappingModal(false);

    const csvContent = csvPreviewData.rawContent;
    const importedData = parseCsvForImport(csvContent, csvColumnMapping);

      if (importedData.size === 0) {
        toast({
          variant: "destructive",
          title: phrase(dictionary, "bgsheet_import_failed", language) || "Import Failed",
          description: phrase(dictionary, "bgsheet_no_data_found", language) || "No valid data found in CSV",
        });
        return;
      }

      // Build updated backgrounds list
      const existingBgNames = new Set(backgrounds.map(bg => bg.name));
      const updatedBackgrounds: Background[] = [];

      // Update existing backgrounds - merge new views from CSV
      for (const bg of backgrounds) {
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

      setBackgrounds(updatedBackgrounds);

      // Persist to Firestore immediately so backgrounds survive refresh
      if (currentProjectId) {
        try {
          for (const bg of updatedBackgrounds) {
            await saveBackgroundWithId(currentProjectId, bg.id, {
              name: bg.name,
              description: bg.description,
              angles: bg.images.map(img => ({
                angle: img.angle,
                prompt: img.prompt || "",
                imageRef: img.imageUrl || "",
              })),
            });
          }

          // Update context state so it hydrates on refresh
          const metadata: BgSheetResultMetadata = {
            backgrounds: updatedBackgrounds.map(bg => ({
              id: bg.id,
              name: bg.name,
              description: bg.description,
              images: bg.images.map(img => ({
                angle: img.angle,
                prompt: img.prompt || "",
                imageId: img.imageUrl || "",
              })),
            })),
            styleKeyword,
            backgroundBasePrompt,
          };
          setBgSheetResult(metadata);
          setStageResult(6, metadata);
          setIsSaved(true);
        } catch (err) {
          console.error("Failed to save imported backgrounds to Firestore:", err);
          setIsSaved(false);
        }
      } else {
        setIsSaved(false);
      }

      toast({
        variant: "success",
        title: phrase(dictionary, "bgsheet_import_success", language) || "Import Successful",
        description: `${importedData.size} ${phrase(dictionary, "bgsheet_backgrounds_imported", language) || "backgrounds imported"}`,
      });

    setCsvPreviewData(null);
  }, [toast, dictionary, language, backgrounds, currentProjectId, styleKeyword, backgroundBasePrompt, setBgSheetResult, setStageResult, csvPreviewData, csvColumnMapping]);

  // Storyboard Import handler - imports backgrounds from storyboard data
  const handleImportFromStoryboard = useCallback(async () => {
    const { scenes } = storyboardGenerator;

    if (!scenes || scenes.length === 0) {
      toast({
        variant: "destructive",
        title: phrase(dictionary, "bgsheet_import_failed", language) || "Import Failed",
        description: phrase(dictionary, "bgsheet_no_storyboard", language) || "No storyboard data available. Please generate a storyboard first.",
      });
      return;
    }

    // Parse storyboard clips to extract backgrounds
    // Map: background prefix (e.g., "1", "2") -> { name, description, views }
    const bgMap = new Map<string, { name: string; description: string; views: { angle: string; csvContext: string }[] }>();
    const bgOrder: string[] = [];

    for (const scene of scenes) {
      for (const clip of scene.clips) {
        const bgIdRaw = clip.backgroundId?.trim() || "";
        const bgPrompt = clip.backgroundPrompt?.trim() || "";
        const imagePrompt = clip.imagePrompt?.trim() || "";

        if (!bgIdRaw) continue;

        // Extract background prefix (e.g., "1" from "1-1", "1-2")
        const match = bgIdRaw.match(/^(\d+)/);
        if (!match) continue;

        const bgPrefix = match[1];
        const bgName = `Background ${bgPrefix}`;

        if (!bgMap.has(bgName)) {
          bgMap.set(bgName, {
            name: bgName,
            description: "",
            views: [],
          });
          bgOrder.push(bgName);
        }

        const bgData = bgMap.get(bgName)!;

        // Update description if we have a better one (longer)
        if (bgPrompt && bgPrompt.length > bgData.description.length) {
          bgData.description = bgPrompt;
        }

        // Add view for this angle only if not already present (multiple clips can share the same backgroundId)
        const existingView = bgData.views.find(v => v.angle === bgIdRaw);
        if (!existingView) {
          bgData.views.push({
            angle: bgIdRaw,
            csvContext: imagePrompt,
          });
        }
      }
    }

    if (bgMap.size === 0) {
      toast({
        variant: "destructive",
        title: phrase(dictionary, "bgsheet_import_failed", language) || "Import Failed",
        description: phrase(dictionary, "bgsheet_no_backgrounds_found", language) || "No backgrounds found in storyboard",
      });
      return;
    }

    // Create backgrounds from parsed data
    const newBackgrounds: Background[] = bgOrder.map(bgName => {
      const bgData = bgMap.get(bgName)!;
      return {
        id: `bg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: bgData.name,
        description: bgData.description,
        images: bgData.views.map(view => ({
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
    });

    setBackgrounds(newBackgrounds);

    // Persist to Firestore immediately so backgrounds survive refresh
    if (currentProjectId) {
      try {
        // Clear old backgrounds first to avoid duplicates on refresh
        await clearBgSheet(currentProjectId);

        // Save each background to Firestore
        for (const bg of newBackgrounds) {
          await saveBackgroundWithId(currentProjectId, bg.id, {
            name: bg.name,
            description: bg.description,
            angles: bg.images.map(img => ({
              angle: img.angle,
              prompt: img.prompt || "",
              imageRef: img.imageUrl || "",
            })),
          });
        }

        // Update context state so it hydrates on refresh
        const metadata: BgSheetResultMetadata = {
          backgrounds: newBackgrounds.map(bg => ({
            id: bg.id,
            name: bg.name,
            description: bg.description,
            images: bg.images.map(img => ({
              angle: img.angle,
              prompt: img.prompt || "",
              imageId: img.imageUrl || "",
            })),
          })),
          styleKeyword,
          backgroundBasePrompt,
        };
        setBgSheetResult(metadata);
        setStageResult(6, metadata);
        setIsSaved(true);
      } catch (err) {
        console.error("Failed to save imported backgrounds to Firestore:", err);
        setIsSaved(false);
      }
    } else {
      setIsSaved(false);
    }

    toast({
      variant: "success",
      title: phrase(dictionary, "bgsheet_import_success", language) || "Import Successful",
      description: `${newBackgrounds.length} ${phrase(dictionary, "bgsheet_backgrounds_imported", language) || "backgrounds imported from storyboard"}`,
    });
  }, [storyboardGenerator, toast, dictionary, language, currentProjectId, styleKeyword, backgroundBasePrompt, setBgSheetResult, setStageResult]);

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

      {/* Import from Storyboard & Import Options - only show when no results */}
      {!isLoadingData && !isAnalyzing && backgrounds.length === 0 && (
        <div className="flex flex-col items-center gap-3">
          {/* Primary: Import from Storyboard */}
          <button
            onClick={handleImportFromStoryboard}
            disabled={!storyboardGenerator.scenes || storyboardGenerator.scenes.length === 0}
            className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {phrase(dictionary, "bgsheet_import_storyboard", language) || "Import from Storyboard"}
          </button>
          {(!storyboardGenerator.scenes || storyboardGenerator.scenes.length === 0) && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {phrase(dictionary, "bgsheet_no_storyboard_hint", language) || "Generate a storyboard first to import backgrounds"}
            </p>
          )}
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
      {!isLoadingData && isAnalyzing && <Loader dictionary={dictionary} language={language} onCancel={cancelBgSheetAnalysis} />}

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
              {isAutoPiloting ? (
                <button
                  onClick={handleCancelAutoPilot}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#211F21] border border-[#272727] text-[#E8E8E8] font-medium rounded-lg transition-colors text-sm hover:bg-[#272727]"
                >
                  <span className="animate-pulse text-[#DB2777]">●</span>
                  <span>Auto Pilot</span>
                  <span className="text-gray-500 text-xs">Cancel</span>
                </button>
              ) : (
                <button
                  onClick={handleAutoPilot}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-colors text-sm"
                >
                  <span>▶</span>
                  <span>Auto Pilot</span>
                </button>
              )}
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
                disabled={totalDownloadableFrames === 0}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Package className="w-4 h-4" />
                <span>{phrase(dictionary, "bgsheet_download_zip", language) || "ZIP"}</span>
                <span className="bg-white/20 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {totalDownloadableFrames}/{totalActiveFrames}
                </span>
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
          <div className="space-y-6 max-h-[100vh] overflow-y-auto pr-1 scrollbar-hide">
            {[...backgrounds].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map((bg) => (
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
                    {(bg.referenceImageBase64 || bg.referenceImageUrl) && (
                      <button
                        onClick={() => handleRemoveReference(bg.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove reference"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {(bg.referenceImageBase64 || bg.referenceImageUrl) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left Column: Image */}
                      <div className="flex flex-col gap-2">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                          <img
                            src={bg.referenceImageBase64 ? `data:image/jpeg;base64,${bg.referenceImageBase64}` : bg.referenceImageUrl}
                            alt="Master Reference"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Remix prompt input */}
                        <input
                          type="text"
                          value={remixPrompts[bg.id] || ""}
                          onChange={(e) => setRemixPrompts(prev => ({ ...prev, [bg.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRemixMasterRef(bg.id); }}
                          placeholder="Remix instruction (e.g. make it night time)…"
                          className="w-full px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        {/* Replace reference buttons */}
                        <div className="flex gap-2">
                          <label className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg border border-dashed border-gray-300 dark:border-gray-500 transition-colors">
                              <Upload className="w-3 h-3 text-gray-500 dark:text-gray-400" />
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
                          <button
                            onClick={() => handleRemixMasterRef(bg.id)}
                            disabled={isRemixingMaster[bg.id] || isGeneratingMaster[bg.id]}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 rounded-lg border border-purple-500/20 transition-colors disabled:opacity-50"
                            title="Remix reference with Gemini"
                          >
                            {isRemixingMaster[bg.id] ? (
                              <div className="w-3 h-3 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                            ) : (
                              <Shuffle className="w-3 h-3" />
                            )}
                            <span className="text-xs">Remix</span>
                          </button>
                          <button
                            onClick={() => handleGenerateMasterRef(bg.id)}
                            disabled={isGeneratingMaster[bg.id] || isRemixingMaster[bg.id]}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-[#DB2777]/10 hover:bg-[#DB2777]/20 text-[#DB2777] rounded-lg border border-[#DB2777]/20 transition-colors disabled:opacity-50"
                          >
                            {isGeneratingMaster[bg.id] ? (
                              <div className="w-3 h-3 border-2 border-[#DB2777]/30 border-t-[#DB2777] rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            <span className="text-xs">
                              {phrase(dictionary, "bgsheet_generate_reference", language) || "Regenerate"}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Right Column: Planned Prompts */}
                      <div className="flex flex-col h-full">
                        {!bg.plannedPrompts ? (
                          <div className="flex flex-col gap-2">
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
                                {phrase(dictionary, "bgsheet_plan_prompts", language) || "Generate Prompts (N-1 ~ N-9)"}
                              </span>
                            </button>
                            {bg.referenceAnalysis && (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                                Reference analyzed
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {phrase(dictionary, "bgsheet_planned_prompts", language) || "Planned Prompts"} ({bg.plannedPrompts.length})
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePlanPrompts(bg.id)}
                                  disabled={isPlanningPrompts[bg.id]}
                                  className="text-xs text-blue-500 hover:text-blue-600 disabled:opacity-50"
                                  title="Regenerate prompts"
                                >
                                  {isPlanningPrompts[bg.id] ? (
                                    <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleClearPlannedPrompts(bg.id)}
                                  className="text-xs text-red-500 hover:text-red-600"
                                >
                                  {phrase(dictionary, "bgsheet_clear_prompts", language) || "Clear"}
                                </button>
                              </div>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxHeight: '300px' }}>
                              {bg.plannedPrompts.map((prompt, idx) => (
                                <div key={idx} className="flex gap-1.5 items-start group/prompt">
                                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 w-7 shrink-0 pt-1">
                                    N-{idx + 1}
                                  </span>
                                  <textarea
                                    value={prompt}
                                    onChange={(e) => handleUpdatePlannedPrompt(bg.id, idx, e.target.value)}
                                    className="flex-1 text-[10px] bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded px-2 py-1 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#DB2777] resize-none"
                                    rows={2}
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                  />
                                  <button
                                    onClick={() => navigator.clipboard.writeText(prompt)}
                                    className="p-1 text-gray-300 dark:text-gray-600 hover:text-[#DB2777] dark:hover:text-[#DB2777] opacity-0 group-hover/prompt:opacity-100 transition-opacity shrink-0"
                                    title="Copy prompt"
                                  >
                                    <FileDown className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            {/* Confirm: Apply prompts to image cards */}
                            <button
                              onClick={() => handleApplyPlannedPrompts(bg.id)}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Confirm &amp; Apply to Cards</span>
                            </button>
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
                                  <button
                                    onClick={() => handleCancelImageGeneration(bg.id, img.angle)}
                                    className="mt-2 px-3 py-1 text-xs rounded border border-white/30 text-white/70 hover:text-white hover:border-white/60 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </>
                          ) : img.isGenerating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#DB2777]"></div>
                              <span className="mt-2 text-xs text-gray-400">{phrase(dictionary, "bgsheet_generating", language)}</span>
                              <button
                                onClick={() => handleCancelImageGeneration(bg.id, img.angle)}
                                className="mt-2 px-3 py-1 text-xs rounded border border-[#272727] bg-[#211F21] text-gray-400 hover:text-[#E8E8E8] hover:border-[#DB2777] transition-colors"
                              >
                                Cancel
                              </button>
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
                                <Pencil className="w-3 h-3" />
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
                              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                              placeholder={phrase(dictionary, "bgsheet_scene_notes", language) || "Scene details..."}
                            />
                          </div>
                        )}

                        {/* Storyboard Context (csvContext) - always visible when available */}
                        {img.csvContext && (
                          <div className="px-1 mt-1">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3" title={img.csvContext}>
                              {img.csvContext}
                            </p>
                          </div>
                        )}

                        {/* Planned Prompt (always visible when prompt exists, editable with real-time sync) */}
                        {!isFinalized && img.prompt && (
                          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded border border-purple-300/30 dark:border-purple-500/20 mx-1 mt-1">
                            <textarea
                              value={img.prompt}
                              onChange={(e) => handleUpdatePrompt(bg.id, idx, e.target.value)}
                              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1.5 text-[10px] text-gray-700 dark:text-gray-300 min-h-[40px] focus:outline-none focus:ring-1 focus:ring-[#DB2777] resize-none"
                              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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

                        {/* Empty Prompt Editor (shown when isPromptOpen, no prompt yet, and not finalized) */}
                        {img.isPromptOpen && !img.prompt && !isFinalized && (
                          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600 mx-1 mt-1">
                            <textarea
                              value=""
                              onChange={(e) => handleUpdatePrompt(bg.id, idx, e.target.value)}
                              className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1.5 text-[10px] text-gray-700 dark:text-gray-300 min-h-[50px] focus:outline-none focus:ring-1 focus:ring-[#DB2777] resize-none"
                              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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

      {/* CSV Column Mapping Modal */}
      {showCsvMappingModal && csvPreviewData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">CSV Column Mapping</h3>
              <button
                onClick={() => { setShowCsvMappingModal(false); setCsvPreviewData(null); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Column Mapping Selectors */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              {([
                { label: "Background ID", key: "backgroundIdCol" as const, defaultCol: 4 },
                { label: "Background Prompt", key: "backgroundPromptCol" as const, defaultCol: 5 },
                { label: "Image Prompt", key: "imagePromptCol" as const, defaultCol: 7 },
              ]).map(({ label, key, defaultCol }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                  <select
                    value={csvColumnMapping[key]}
                    onChange={(e) => setCsvColumnMapping(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
                  >
                    {csvPreviewData.headers.map((header, colIdx) => (
                      <option key={colIdx} value={colIdx}>
                        {String.fromCharCode(65 + colIdx)}: {header || `Column ${colIdx + 1}`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    Default: Column {String.fromCharCode(65 + defaultCol)}
                  </span>
                </div>
              ))}
            </div>

            {/* Preview Table */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Preview (first {csvPreviewData.rows.length} rows)</p>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded-lg">
                <table className="min-w-full text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      {csvPreviewData.headers.map((header, colIdx) => {
                        const isMapped = colIdx === csvColumnMapping.backgroundIdCol
                          || colIdx === csvColumnMapping.backgroundPromptCol
                          || colIdx === csvColumnMapping.imagePromptCol;
                        return (
                          <th
                            key={colIdx}
                            className={`px-2 py-1.5 text-left font-bold whitespace-nowrap ${
                              isMapped
                                ? "text-[#DB2777] bg-pink-50 dark:bg-pink-900/20"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            <span className="text-[9px] text-gray-400 mr-1">{String.fromCharCode(65 + colIdx)}</span>
                            {header || `Col ${colIdx + 1}`}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreviewData.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-t border-gray-200 dark:border-gray-700">
                        {csvPreviewData.headers.map((_, colIdx) => {
                          const isMapped = colIdx === csvColumnMapping.backgroundIdCol
                            || colIdx === csvColumnMapping.backgroundPromptCol
                            || colIdx === csvColumnMapping.imagePromptCol;
                          return (
                            <td
                              key={colIdx}
                              className={`px-2 py-1 max-w-[200px] truncate ${
                                isMapped
                                  ? "text-gray-900 dark:text-white font-medium bg-pink-50/50 dark:bg-pink-900/10"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                              title={row[colIdx] || ""}
                            >
                              {row[colIdx] || ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCsvMappingModal(false); setCsvPreviewData(null); }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCsvImportConfirm}
                className="px-4 py-2 text-sm bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-colors"
              >
                Import
              </button>
            </div>
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

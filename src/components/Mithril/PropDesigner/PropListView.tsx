"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Prop, getEasyModeCharacterPrompt } from "./types";
import { usePropImageOrchestrator, PropJobStatus, PropUpdate } from "./usePropImageOrchestrator";
import { updatePropDesignSheetImage } from "../services/firestore";
import MannequinTemplatesPanel from "./MannequinTemplatesPanel";
import { getSuggestedTemplates } from "./characterTemplates";

// Status badge component for job statuses
function JobStatusBadge({ status }: { status: PropJobStatus | null }) {
  if (!status) return null;

  const statusConfig: Record<
    PropJobStatus,
    { bg: string; text: string; label: string; animate?: boolean }
  > = {
    pending: { bg: "bg-yellow-900/50", text: "text-yellow-400", label: "Queued" },
    preparing: { bg: "bg-blue-900/50", text: "text-blue-400", label: "Preparing", animate: true },
    generating: { bg: "bg-purple-900/50", text: "text-purple-400", label: "Generating", animate: true },
    uploading: { bg: "bg-cyan-900/50", text: "text-cyan-400", label: "Uploading", animate: true },
    completed: { bg: "bg-green-900/50", text: "text-green-400", label: "Done" },
    failed: { bg: "bg-red-900/50", text: "text-red-400", label: "Failed" },
    cancelled: { bg: "bg-gray-900/50", text: "text-gray-400", label: "Cancelled" },
    retrying: { bg: "bg-orange-900/50", text: "text-orange-400", label: "Retrying", animate: true },
  };

  const config = statusConfig[status];
  return (
    <span
      className={`text-[8px] px-1.5 py-0.5 rounded border ${config.bg} ${config.text} border-current/30 uppercase font-bold ${
        config.animate ? "animate-pulse" : ""
      }`}
    >
      {config.label}
    </span>
  );
}

interface PropListViewProps {
  props: Prop[];
  genre: string;
  styleKeyword: string;
  projectId?: string; // Required for async orchestrator
  customApiKey?: string; // Optional custom API key
  onGenerateImage: (
    propId: string,
    prompt: string,
    referenceImages?: string[]
  ) => Promise<void>;
  onSetReferenceImages: (propId: string, images: string[]) => void;
  onUpdateProp: (propId: string, updates: Partial<Prop>) => void;
  onSaveName: (propId: string, newName: string) => Promise<void>;
  onClose: () => void;
  onToggleMinimize?: () => void; // Toggle minimize from parent
  title?: string;
  accentColor?: "purple" | "cyan";
  initialMinimized?: boolean; // Start minimized (as floating button)
  sessionId?: string; // Session identifier
  minimizedIndex?: number; // Position offset for stacking minimized buttons
  isEasyMode?: boolean; // Controlled from parent (shared with DetectionPanel)
  onToggleEasyMode?: (enabled: boolean) => void;
  suggestedStartingImages?: Record<string, string[]>; // propId → suggested template paths
}

export default function PropListView({
  props,
  genre,
  styleKeyword,
  projectId,
  customApiKey,
  onGenerateImage,
  onSetReferenceImages,
  onUpdateProp,
  onSaveName,
  onClose,
  onToggleMinimize,
  title = "Design Sheet Generator",
  accentColor = "cyan",
  initialMinimized = false,
  sessionId,
  minimizedIndex = 0,
  isEasyMode: isEasyModeProp,
  onToggleEasyMode,
  suggestedStartingImages,
}: PropListViewProps) {
  // Sort props: Protagonist first, then other defaults, then variants
  const sortedProps = useMemo(() => {
    const rolePriority = (p: Prop): number => {
      if (!p.isVariant && p.role?.toLowerCase().includes("protagonist")) return 0;
      if (!p.isVariant) return 1;
      return 2;
    };
    return [...props].sort((a, b) => rolePriority(a) - rolePriority(b));
  }, [props]);

  // Map each variant to its matched base character (for display + auto-link)
  const variantBaseMap = useMemo(() => {
    const baseCharacters = props.filter(p => !p.isVariant && p.category === 'character');
    const map = new Map<string, Prop>();
    props.forEach(variant => {
      if (!variant.isVariant || variant.category !== 'character') return;
      const variantDetails = variant.variantDetails?.toLowerCase() || '';
      const variantName = variant.name.toUpperCase();
      for (const base of baseCharacters) {
        const baseName = base.name.toLowerCase();
        const baseId = base.name.toUpperCase();
        const basePrefix = baseId.split('_')[0];
        if (variantDetails.includes(baseName) || variantDetails.includes(baseId) || variantName.includes(basePrefix)) {
          map.set(variant.id, base);
          break;
        }
      }
    });
    return map;
  }, [props]);

  // Minimized state - controlled by parent via onToggleMinimize if provided
  const [isMinimizedLocal, setIsMinimizedLocal] = useState(initialMinimized);
  const isMinimized = onToggleMinimize ? initialMinimized : isMinimizedLocal;
  const toggleMinimize = useCallback(() => {
    if (onToggleMinimize) {
      onToggleMinimize();
    } else {
      setIsMinimizedLocal(prev => !prev);
    }
  }, [onToggleMinimize]);
  // Easy Mode state — controlled by parent if isEasyModeProp is provided
  const [isEasyModeLocal, setIsEasyModeLocal] = useState(true);
  const isEasyMode = isEasyModeProp !== undefined ? isEasyModeProp : isEasyModeLocal;

  // Active prop for mannequin template panel
  const [activePropId, setActivePropId] = useState<string | null>(null);

  // Per-prop selected template paths (for mannequin panel)
  // Pre-populate with top 2 suggestions; user can adjust via MannequinTemplatesPanel
  const [startingImages, setStartingImages] = useState<Record<string, string[]>>(() => {
    if (!suggestedStartingImages) return {};
    const initial: Record<string, string[]> = {};
    for (const [propId, paths] of Object.entries(suggestedStartingImages)) {
      initial[propId] = paths.slice(0, 2);
    }
    return initial;
  });

  // When suggestions change (e.g. new props detected), seed any prop not yet touched
  useEffect(() => {
    if (!suggestedStartingImages) return;
    setStartingImages((prev) => {
      const next = { ...prev };
      for (const [propId, paths] of Object.entries(suggestedStartingImages)) {
        if (!next[propId] || next[propId].length === 0) {
          next[propId] = paths.slice(0, 2);
        }
      }
      return next;
    });
  }, [suggestedStartingImages]);

  // Auto-apply each base character's design sheet to their name-matched variants
  useEffect(() => {
    const baseCharacters = props.filter(
      p => !p.isVariant && p.category === 'character' && p.designSheetImageUrl
    );
    if (baseCharacters.length === 0) return;

    props.forEach(variant => {
      if (!variant.isVariant || variant.category !== 'character') return;

      const variantDetails = variant.variantDetails?.toLowerCase() || '';
      const variantName = variant.name.toUpperCase();

      for (const base of baseCharacters) {
        const baseUrl = base.designSheetImageUrl!;
        if (variant.referenceImages?.includes(baseUrl)) continue;

        const baseName = base.name.toLowerCase();
        const baseId = base.name.toUpperCase();
        const basePrefix = baseId.split('_')[0];

        const isMatch =
          variantDetails.includes(baseName) ||
          variantDetails.includes(baseId) ||
          variantName.includes(basePrefix);

        if (isMatch) {
          onSetReferenceImages(variant.id, [baseUrl, ...(variant.referenceImages || [])]);
          break;
        }
      }
    });
  }, [props, onSetReferenceImages]);

  // Job statuses from orchestrator (real-time updates)
  const [jobStatuses, setJobStatuses] = useState<Record<string, PropJobStatus>>({});
  const [jobIds, setJobIds] = useState<Record<string, string>>({});
  
  // Batch generation state
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);

  // Async orchestrator hook
  const orchestrator = usePropImageOrchestrator({
    projectId: projectId || "",
    customApiKey,
    onPropUpdate: useCallback((update: PropUpdate) => {
      // Update job status from real-time Firestore updates
      setJobStatuses((prev) => ({ ...prev, [update.propId]: update.status }));
      
      // If completed, update the prop with the new image URL
      if (update.status === "completed" && update.imageUrl) {
        onUpdateProp(update.propId, {
          designSheetImageUrl: update.imageUrl,
          isGenerating: false
        });
        // Persist image URL to Firestore so it survives page refresh
        if (projectId) {
          const existingProp = props.find(p => p.id === update.propId);
          if (!existingProp?.designSheetImageUrl) {
            updatePropDesignSheetImage(projectId, update.propId, update.imageUrl, existingProp?.designSheetPrompt || "").catch(console.error);
          }
        }
      }
      
      // If failed, mark as not generating
      if (update.status === "failed" || update.status === "cancelled") {
        onUpdateProp(update.propId, { isGenerating: false });
      }
      
      // Update batch progress if batch generating
      if (isBatchGenerating) {
        const completedCount = Object.values(jobStatuses).filter(
          (s) => s === "completed" || s === "failed" || s === "cancelled"
        ).length;
        setBatchProgress((prev) => prev ? { ...prev, completed: completedCount } : null);
        
        // Check if batch is complete
        if (completedCount >= (batchProgress?.total || 0)) {
          setIsBatchGenerating(false);
          setBatchProgress(null);
        }
      }
    }, [onUpdateProp, isBatchGenerating, batchProgress, jobStatuses, props, projectId]),
  });

  // Editable prompts per prop (keyed by prop id)
  const [editablePrompts, setEditablePrompts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    sortedProps.forEach((prop) => {
      // Append description if not already in prompt
      const desc = prop.description ? ` ${prop.description}` : "";
      if (prop.designSheetPrompt.includes(prop.description)) {
        initial[prop.id] = prop.designSheetPrompt;
      } else {
        initial[prop.id] = `${prop.designSheetPrompt}${desc}`;
      }
    });
    return initial;
  });

  // Track which prop is currently generating
  const [activeLoadingId, setActiveLoadingId] = useState<string | null>(null);

  // Inline editing state for prop name
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [editDraftName, setEditDraftName] = useState("");

  const startEditProp = useCallback((prop: Prop) => {
    setEditingPropId(prop.id);
    setEditDraftName(prop.name);
  }, []);

  const cancelEditProp = useCallback(() => {
    setEditingPropId(null);
  }, []);

  const saveEditProp = useCallback(async (propId: string) => {
    const newName = editDraftName.trim();
    if (!newName) return;
    setEditingPropId(null);
    await onSaveName(propId, newName);
  }, [editDraftName, onSaveName]);

  // File input refs for each prop
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // Cache for resolved reference images (URL/path -> data URL)
  const referenceImageCacheRef = useRef<Map<string, string>>(new Map());

  const blobToDataUrl = useCallback((blob: Blob) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }, []);

  const resolveReferenceImages = useCallback(async (images: string[]) => {
    const isUrlLike = (value: string) =>
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/") ||
      value.startsWith("blob:");

    const resolved = await Promise.all(
      images.map(async (img) => {
        if (!img) return null;
        if (img.startsWith("data:image/")) return img;
        if (!isUrlLike(img)) return img;

        const cached = referenceImageCacheRef.current.get(img);
        if (cached) return cached;

        try {
          const response = await fetch(img);
          if (!response.ok) {
            console.warn("[PropListView] Failed to fetch reference image:", img, response.status);
            return null;
          }
          const blob = await response.blob();
          const dataUrl = await blobToDataUrl(blob);
          referenceImageCacheRef.current.set(img, dataUrl);
          return dataUrl;
        } catch (error) {
          console.warn("[PropListView] Failed to resolve reference image:", img, error);
          return null;
        }
      })
    );

    return resolved.filter((img): img is string => Boolean(img));
  }, [blobToDataUrl]);

  // Handle Easy Mode toggle
  const toggleEasyMode = useCallback(
    (enabled: boolean) => {
      setIsEasyModeLocal(enabled);
      onToggleEasyMode?.(enabled);
      if (enabled) {
        // Apply Easy Mode Template
        const newPrompts: Record<string, string> = {};
        sortedProps.forEach((prop) => {
          if (prop.category === "character") {
            newPrompts[prop.id] = getEasyModeCharacterPrompt(prop, genre);
          } else {
            // For objects, keep the original prompt
            const desc = prop.description ? ` ${prop.description}` : "";
            newPrompts[prop.id] = prop.designSheetPrompt.includes(prop.description)
              ? prop.designSheetPrompt
              : `${prop.designSheetPrompt}${desc}`;
          }
        });
        setEditablePrompts(newPrompts);

        // Seed starting images from suggestions (only for chars without existing selection)
        setStartingImages((prev) => {
          const next = { ...prev };
          sortedProps.forEach((prop) => {
            if (prop.category === "character" && !next[prop.id]?.length) {
              next[prop.id] = suggestedStartingImages?.[prop.id] ||
                getSuggestedTemplates(prop);
            }
          });
          return next;
        });

        // Set first character as active in the template panel
        const firstChar = sortedProps.find((p) => p.category === "character");
        if (firstChar) setActivePropId(firstChar.id);
      } else {
        // Revert to default prompts
        const defaultPrompts: Record<string, string> = {};
        sortedProps.forEach((prop) => {
          const desc = prop.description ? ` ${prop.description}` : "";
          defaultPrompts[prop.id] = prop.designSheetPrompt.includes(prop.description)
            ? prop.designSheetPrompt
            : `${prop.designSheetPrompt}${desc}`;
        });
        setEditablePrompts(defaultPrompts);
      }
    },
    [sortedProps, genre, onToggleEasyMode]
  );

  // Handle prompt change
  const handlePromptChange = useCallback((propId: string, value: string) => {
    setEditablePrompts((prev) => ({ ...prev, [propId]: value }));
  }, []);

  // Handle file upload for reference images
  const handleFileUpload = useCallback(
    (propId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const prop = props.find((p) => p.id === propId);
      const currentRefs = [...(prop?.referenceImages || [])];

      const promises = Array.from(files).map((file: File) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises).then((base64s) => {
        onSetReferenceImages(propId, [...currentRefs, ...base64s]);
      });

      if (e.target) e.target.value = "";
    },
    [props, onSetReferenceImages]
  );

  // Remove a reference image
  const removeReference = useCallback(
    (propId: string, refIdx: number) => {
      const prop = props.find((p) => p.id === propId);
      const currentRefs = [...(prop?.referenceImages || [])];
      currentRefs.splice(refIdx, 1);
      onSetReferenceImages(propId, currentRefs);
    },
    [props, onSetReferenceImages]
  );

  // Handle generate button click - uses async orchestrator when projectId is available
  const handleGenerate = useCallback(
    async (propId: string) => {
      const prop = props.find((p) => p.id === propId);
      if (!prop) return;

      const prompt = editablePrompts[propId] || prop.designSheetPrompt || "";


      // Merge starting images (mannequin templates) with manual reference images
      const isCharacterProp = prop.category === "character";
      const startingRefs = (isEasyMode && isCharacterProp) ? (startingImages[propId] || []) : [];
      const mergedRefs = [...startingRefs, ...(prop.referenceImages || [])];
      const resolvedRefs = mergedRefs.length > 0 ? await resolveReferenceImages(mergedRefs) : [];

      // Use async orchestrator if projectId is available
      if (projectId && orchestrator) {
        try {
          // Clear old job status and ID to ensure clean state
          setJobStatuses((prev) => {
            const updated = { ...prev };
            delete updated[propId];
            return updated;
          });
          setJobIds((prev) => {
            const updated = { ...prev };
            delete updated[propId];
            return updated;
          });

          // Mark as generating
          onUpdateProp(propId, { isGenerating: true });
          setJobStatuses((prev) => ({ ...prev, [propId]: "pending" as PropJobStatus }));

          const result = await orchestrator.submitJob({
            propId,
            propName: prop.name,
            category: prop.category,
            prompt,
            genre,
            styleKeyword,
            referenceImages: resolvedRefs.length > 0 ? resolvedRefs : undefined,
            aspectRatio: "16:9",
          });

          if (result.success && result.jobId) {
            setJobIds((prev) => ({ ...prev, [propId]: result.jobId! }));
          } else {
            // Submission failed
            setJobStatuses((prev) => ({ ...prev, [propId]: "failed" as PropJobStatus }));
            onUpdateProp(propId, { isGenerating: false });
            console.error("Failed to submit prop design job:", result.error);
          }
        } catch (error) {
          console.error("Error submitting prop design job:", error);
          setJobStatuses((prev) => ({ ...prev, [propId]: "failed" as PropJobStatus }));
          onUpdateProp(propId, { isGenerating: false });
        }
      } else {
        // Fallback to sync generation (legacy)
        setActiveLoadingId(propId);
        try {
          await onGenerateImage(
            propId,
            prompt,
            resolvedRefs.length > 0 ? resolvedRefs : prop.referenceImages
          );
        } finally {
          setActiveLoadingId(null);
        }
      }
    },
    [
      props,
      editablePrompts,
      onGenerateImage,
      projectId,
      orchestrator,
      genre,
      styleKeyword,
      onUpdateProp,
      isEasyMode,
      startingImages,
      resolveReferenceImages,
    ]
  );

  // Handle batch generation for all props without images
  const handleBatchGenerate = useCallback(async () => {
    if (!projectId || !orchestrator) {
      console.error("Batch generation requires projectId");
      return;
    }

    // Filter props that don't have images yet
    const propsToGenerate = props.filter((p) => !p.designSheetImageUrl && !p.designSheetImageBase64);
    
    if (propsToGenerate.length === 0) {
      return;
    }

    setIsBatchGenerating(true);
    setBatchProgress({ completed: 0, total: propsToGenerate.length });

    // Mark all as pending
    const initialStatuses: Record<string, PropJobStatus> = {};
    propsToGenerate.forEach((p) => {
      initialStatuses[p.id] = "pending";
      onUpdateProp(p.id, { isGenerating: true });
    });
    setJobStatuses((prev) => ({ ...prev, ...initialStatuses }));

    try {
      const jobs = await Promise.all(
        propsToGenerate.map(async (prop) => {
          const isCharacterProp = prop.category === "character";
          const startingRefs = (isEasyMode && isCharacterProp) ? (startingImages[prop.id] || []) : [];
          const mergedRefs = [...startingRefs, ...(prop.referenceImages || [])];
          const resolvedRefs = mergedRefs.length > 0 ? await resolveReferenceImages(mergedRefs) : [];
          return {
            propId: prop.id,
            propName: prop.name,
            category: prop.category as 'character' | 'object',
            prompt: editablePrompts[prop.id] || prop.designSheetPrompt || "",
            genre,
            styleKeyword,
            referenceImages: resolvedRefs.length > 0 ? resolvedRefs : undefined,
            aspectRatio: "16:9" as const,
          };
        })
      );

      const result = await orchestrator.submitBatch({ jobs });

      if (result.success && result.jobs) {
        const newJobIds: Record<string, string> = {};
        result.jobs.forEach((job) => {
          newJobIds[job.propId] = job.jobId;
        });
        setJobIds((prev) => ({ ...prev, ...newJobIds }));
      } else {
        console.error("Batch submission failed:", result.error);
        // Reset statuses
        propsToGenerate.forEach((p) => {
          onUpdateProp(p.id, { isGenerating: false });
        });
        setIsBatchGenerating(false);
        setBatchProgress(null);
      }
    } catch (error) {
      console.error("Error in batch generation:", error);
      propsToGenerate.forEach((p) => {
        onUpdateProp(p.id, { isGenerating: false });
      });
      setIsBatchGenerating(false);
      setBatchProgress(null);
    }
  }, [
    projectId,
    orchestrator,
    props,
    editablePrompts,
    genre,
    styleKeyword,
    onUpdateProp,
    isEasyMode,
    startingImages,
    resolveReferenceImages,
  ]);

  // Handle retry for failed jobs
  const handleRetry = useCallback(
    async (propId: string) => {
      const jobId = jobIds[propId];
      if (!jobId || !orchestrator) {
        // If no job ID, just regenerate
        await handleGenerate(propId);
        return;
      }

      // Clear failed status and regenerate
      setJobStatuses((prev) => ({ ...prev, [propId]: "pending" as PropJobStatus }));
      await handleGenerate(propId);
    },
    [jobIds, orchestrator, handleGenerate]
  );

  // Handle cancel for in-progress jobs
  const handleCancel = useCallback(
    async (propId: string) => {
      const jobId = jobIds[propId];
      if (!jobId || !orchestrator) return;

      try {
        const result = await orchestrator.cancelJob({ jobId });
        if (result.success) {
          setJobStatuses((prev) => ({ ...prev, [propId]: "cancelled" as PropJobStatus }));
          onUpdateProp(propId, { isGenerating: false });
        }
      } catch (error) {
        console.error("Error cancelling job:", error);
      }
    },
    [jobIds, orchestrator, onUpdateProp]
  );

  // Download generated image (handles cross-origin S3 URLs via proxy)
  const downloadImage = useCallback(async (url: string, name: string) => {
    try {
      // Use image-proxy for cross-origin S3/CloudFront URLs to avoid CORS issues
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Proxy failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert base64 to blob
      const base64Data = data.base64;
      const contentType = data.contentType || 'image/png';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });
      
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      const safeName = name.replace(/[^a-zA-Z0-9\s_]/g, "").replace(/\s+/g, "_");
      // Use correct extension based on content type
      const extension = contentType.includes('jpeg') ? 'jpg' : 'png';
      link.download = `${safeName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  }, []);

  // Get image URL for a prop
  const getImageUrl = (prop: Prop) => {
    return (
      prop.designSheetImageUrl ||
      (prop.designSheetImageBase64
        ? `data:image/png;base64,${prop.designSheetImageBase64}`
        : null)
    );
  };

  if (props.length === 0) {
    return null;
  }

  // Minimized view - just a small floating button
  if (isMinimized) {
    return (
      <div className="fixed z-[100] right-4" style={{ bottom: `${16 + minimizedIndex * 48}px` }}>
        <button
          onClick={() => toggleMinimize()}
          className={`px-4 py-2 ${accentColor === "purple" ? "bg-[#DB2777] hover:bg-[#BE185D]" : "bg-cyan-700 hover:bg-cyan-600"} text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-bold transition-colors`}
        >
          {accentColor === "purple" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
              />
            </svg>
          )}
          {title} ({props.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`flex gap-3 h-[90vh] w-full ${isEasyMode ? "max-w-[72rem]" : "max-w-6xl"}`}>
        {/* Mannequin Templates side panel — only visible in Easy Mode */}
        {isEasyMode && (
          <MannequinTemplatesPanel
            activePropName={sortedProps.find((p) => p.id === activePropId)?.name}
            selectedPaths={startingImages[activePropId || ""] || []}
            onSelectionChange={(paths) =>
              setStartingImages((prev) => ({ ...prev, [activePropId!]: paths }))
            }
          />
        )}
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex-1 h-full flex flex-col overflow-hidden min-w-0">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <div>
            <h2 className={`text-xl font-bold ${accentColor === "purple" ? "text-[#DB2777]" : "text-cyan-400"}`}>
              {title}
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">
              {accentColor === "purple" ? "Character Design & Reference Management" : "Prop Design & Reference Management"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Easy Mode Toggle */}
            <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-700">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isEasyMode ? "text-green-400" : "text-gray-500"
                }`}
              >
                Easy Mode
              </span>
              <button
                onClick={() => toggleEasyMode(!isEasyMode)}
                className={`relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none ${
                  isEasyMode ? "bg-green-600" : "bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${
                    isEasyMode ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Batch Generate Button */}
            {projectId && (
              <button
                onClick={handleBatchGenerate}
                disabled={isBatchGenerating || props.every((p) => p.designSheetImageUrl || p.designSheetImageBase64)}
                className={`px-3 py-1.5 ${
                  accentColor === "purple"
                    ? "bg-[#DB2777] hover:bg-[#BE185D] disabled:bg-[#DB2777]/30"
                    : "bg-cyan-700 hover:bg-cyan-600 disabled:bg-cyan-900/50"
                } text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-50`}
                title="Generate all missing design sheets"
              >
                {isBatchGenerating ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>
                      {batchProgress
                        ? `${batchProgress.completed}/${batchProgress.total}`
                        : "Processing..."}
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                      />
                    </svg>
                    <span>Generate All</span>
                  </>
                )}
              </button>
            )}

            {/* Window Controls */}
            <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
              <button
                onClick={() => toggleMinimize()}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-cyan-400 transition-colors"
                title="Minimize (Fold)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                title="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/20">
        {sortedProps.map((prop) => {
          const isItemLoading = activeLoadingId === prop.id;
          const imageUrl = getImageUrl(prop);
          const isCharacter = prop.category === "character";
          const jobStatus = jobStatuses[prop.id] || null;
          const isAsyncLoading = jobStatus && !["completed", "failed", "cancelled"].includes(jobStatus);
          const isAnyLoading = isItemLoading || isAsyncLoading || prop.isGenerating;

          return (
            <div
              key={prop.id}
              onClick={() => { if (isEasyMode && isCharacter) setActivePropId(prop.id); }}
              className={`bg-gray-800 border rounded-lg p-3 flex flex-col md:flex-row gap-4 shadow-sm min-h-[350px] transition-colors ${
                isEasyMode && isCharacter && activePropId === prop.id
                  ? "border-green-700 border-l-2 border-l-green-500"
                  : "border-gray-700"
              } ${isEasyMode && isCharacter ? "cursor-pointer" : ""}`}
            >
              {/* Left Column: Details */}
              <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-start">
                  {editingPropId === prop.id ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-2" onClick={e => e.stopPropagation()}>
                      <input
                        value={editDraftName}
                        onChange={e => setEditDraftName(e.target.value)}
                        className="flex-1 px-2 py-0.5 bg-black/60 border border-cyan-700 rounded text-sm font-bold text-gray-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        placeholder="Display Name"
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") saveEditProp(prop.id); if (e.key === "Escape") cancelEditProp(); }}
                      />
                      <button
                        onClick={() => saveEditProp(prop.id)}
                        className="px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white text-[9px] font-bold rounded transition-colors shrink-0"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditProp}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-[9px] font-bold rounded transition-colors shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-base font-bold text-gray-100 flex items-center gap-2 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isCharacter ? "bg-[#DB2777]" : "bg-cyan-500"
                        }`}
                      />
                      <span className="truncate">{prop.name}</span>
                      {prop.isVariant && (
                        <span className="text-[8px] bg-[#DB2777]/10 text-[#DB2777]/80 px-1 rounded border border-[#DB2777]/40">
                          VARIANT
                        </span>
                      )}
                      {isCharacter && !prop.isVariant && prop.role?.toLowerCase().includes("protagonist") && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded border font-bold uppercase bg-amber-900/40 text-amber-400 border-amber-700/60">
                          ★ Protagonist
                        </span>
                      )}
                      <span
                        className={`text-[8px] px-1 rounded border uppercase ${
                          isCharacter
                            ? "bg-[#DB2777]/10 text-[#DB2777] border-[#DB2777]/50"
                            : "bg-teal-900/30 text-teal-400 border-teal-800"
                        }`}
                      >
                        {prop.category}
                      </span>
                      <JobStatusBadge status={jobStatus} />
                      <button
                        onClick={e => { e.stopPropagation(); startEditProp(prop); }}
                        className="p-0.5 text-gray-600 hover:text-cyan-400 transition-colors shrink-0"
                        title="Edit name"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </h3>
                  )}
                  {prop.appearingClips && prop.appearingClips.length > 0 && editingPropId !== prop.id && (
                    <div className="text-[8px] font-bold text-cyan-500 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800 uppercase shrink-0">
                      {prop.appearingClips.slice(0, 5).join(", ")}
                      {prop.appearingClips.length > 5 && "..."}
                    </div>
                  )}
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/10 p-2 rounded border border-gray-700/50">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">
                      Visual Description (EN)
                    </span>
                    <p
                      className="text-[10px] text-gray-400 leading-snug italic line-clamp-3"
                      title={prop.description}
                    >
                      {prop.description}
                    </p>
                  </div>
                  <div className="space-y-1 border-l border-gray-700/50 pl-3">
                    <span className="text-[8px] font-black text-cyan-700 uppercase tracking-widest block">
                      Purpose/Context (KO)
                    </span>
                    <p
                      className="text-[10px] text-cyan-200 leading-snug line-clamp-3"
                      title={prop.descriptionKo}
                    >
                      {prop.descriptionKo}
                    </p>
                  </div>
                </div>

                {/* Easy Mode Metadata Display (for characters with metadata) */}
                {isCharacter && prop.role && (
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-[9px] text-gray-500 font-mono border-b border-gray-700/30 pb-1 mb-1">
                    <span>
                      Role: <b className="text-gray-300">{prop.role}</b>
                    </span>
                    <span className="text-gray-700">|</span>
                    <span>
                      Age: <b className="text-gray-300">{prop.age}</b>
                    </span>
                    <span className="text-gray-700">|</span>
                    <span>
                      Gender: <b className="text-gray-300">{prop.gender}</b>
                    </span>
                    <span className="text-gray-700">|</span>
                    <span>
                      Personality: <b className="text-gray-300">{prop.personality}</b>
                    </span>
                  </div>
                )}

                {/* Starting References — selected mannequin templates (Easy Mode only) */}
                {isEasyMode && isCharacter && (startingImages[prop.id]?.length ?? 0) > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[8px] font-black text-green-700 uppercase tracking-widest shrink-0">
                      Starting Ref:
                    </span>
                    {startingImages[prop.id].map((path, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={path}
                          alt={`Template ${idx + 1}`}
                          className="h-8 w-8 object-contain rounded border border-green-800 bg-black/40"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setStartingImages((prev) => ({
                              ...prev,
                              [prop.id]: (prev[prop.id] || []).filter((_, i) => i !== idx),
                            }));
                          }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-900 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Variant Details Display */}
                {isCharacter && prop.isVariant && (prop.variantDetails || prop.variantVisuals || variantBaseMap.has(prop.id)) && (
                  <div className="bg-[#DB2777]/5 border border-[#DB2777]/30 rounded p-2 text-[9px] space-y-1">
                    <span className="text-[8px] font-black text-[#DB2777] uppercase tracking-widest">
                      Variant Information
                    </span>
                    {variantBaseMap.has(prop.id) && (() => {
                      const base = variantBaseMap.get(prop.id)!;
                      return (
                        <p className="text-[#DB2777]/80 flex items-center gap-1">
                          <b>Based on:</b> {base.name}
                          {base.designSheetImageUrl && (
                            <span className="text-green-500 font-bold">✓ ref linked</span>
                          )}
                          {!base.designSheetImageUrl && (
                            <span className="text-yellow-600 italic">no design sheet yet</span>
                          )}
                        </p>
                      );
                    })()}
                    {prop.variantDetails && (
                      <p className="text-[#DB2777]/70">
                        <b>Type:</b> {prop.variantDetails}
                      </p>
                    )}
                    {prop.variantVisuals && (
                      <p className="text-[#DB2777]/50 italic">
                        <b>Visual Changes:</b> {prop.variantVisuals}
                      </p>
                    )}
                  </div>
                )}

                {/* Context Prompts */}
                {prop.contextPrompts && prop.contextPrompts.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                      Appearing Scenes Context
                    </span>
                    <div className="max-h-24 overflow-y-auto bg-black/20 rounded p-1.5 border border-gray-700/30">
                      {prop.contextPrompts.slice(0, 5).map((ctx, cIdx) => (
                        <div key={cIdx} className="text-[9px] mb-1.5 last:mb-0">
                          <span className="text-cyan-600 font-bold shrink-0">
                            [{ctx.clipId}]
                          </span>{" "}
                          <span
                            className="text-gray-500 italic leading-tight"
                            title={ctx.text}
                          >
                            {ctx.text.substring(0, 100)}
                            {ctx.text.length > 100 && "..."}
                          </span>
                        </div>
                      ))}
                      {prop.contextPrompts.length > 5 && (
                        <div className="text-[8px] text-gray-600">
                          +{prop.contextPrompts.length - 5} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Design Sheet Prompt */}
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
                      {isEasyMode && isCharacter
                        ? "Design Sheet Prompt (Easy Mode)"
                        : "Design Sheet Prompt (Advanced)"}
                    </span>
                    {isEasyMode && isCharacter && (
                      <span className="text-[8px] text-green-500 animate-pulse">
                        Template Applied
                      </span>
                    )}
                  </div>
                  <textarea
                    value={editablePrompts[prop.id] || ""}
                    onChange={(e) => handlePromptChange(prop.id, e.target.value)}
                    className={`w-full p-2 bg-black/40 border rounded text-[10px] font-mono focus:ring-1 outline-none transition-all resize-none ${
                      isEasyMode && isCharacter
                        ? "border-green-900 text-green-100 focus:ring-green-500"
                        : "border-gray-700 text-gray-300 focus:ring-cyan-500"
                    }`}
                    rows={3}
                  />
                  <div className="flex items-center gap-2 text-[9px] text-gray-600">
                    <span>Genre: {genre}</span>
                    <span>|</span>
                    <span>Style: {styleKeyword}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-700/50">
                  {/* Main Generate Button - changes based on job status */}
                  {jobStatus === "failed" ? (
                    <button
                      onClick={() => handleRetry(prop.id)}
                      className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold rounded transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                        />
                      </svg>
                      <span>Retry</span>
                    </button>
                  ) : isAsyncLoading ? (
                    <button
                      onClick={() => handleCancel(prop.id)}
                      className="flex-1 py-1.5 bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold rounded transition-all flex items-center justify-center gap-1.5"
                    >
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>Cancel</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenerate(prop.id)}
                      disabled={isAnyLoading}
                      className={`flex-1 py-1.5 hover:opacity-90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded transition-all flex items-center justify-center gap-1.5 ${
                        isEasyMode && isCharacter
                          ? "bg-green-700 hover:bg-green-600"
                          : isCharacter
                          ? "bg-[#DB2777] hover:bg-[#BE185D]"
                          : "bg-cyan-600 hover:bg-cyan-500"
                      }`}
                    >
                      {isItemLoading ? (
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-3.5 h-3.5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                            />
                          </svg>
                          <span>Generate Design</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => fileInputRefs.current[prop.id]?.click()}
                    disabled={isAnyLoading}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                    title="Upload Reference Images (Multiple)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    <span>Ref</span>
                  </button>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    ref={(el) => {
                      fileInputRefs.current[prop.id] = el;
                    }}
                    onChange={(e) => handleFileUpload(prop.id, e)}
                    accept="image/*"
                  />
                  {imageUrl && (
                    <button
                      onClick={() => downloadImage(imageUrl, prop.name)}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-3.5 h-3.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                      <span>DL</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Previews */}
              <div className="w-full md:w-1/2 flex flex-col gap-2">
                {/* Generated Design Sheet */}
                <div className="flex-1 w-full bg-black/60 rounded border border-gray-900 flex items-center justify-center relative shadow-inner overflow-hidden min-h-[200px]">
                  {isAnyLoading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <svg
                        className="animate-spin h-10 w-10"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span className="text-sm capitalize">
                        {jobStatus === "preparing" ? "Preparing..." : 
                         jobStatus === "generating" ? "Generating..." : 
                         jobStatus === "uploading" ? "Uploading..." :
                         jobStatus === "retrying" ? "Retrying..." :
                         "Processing..."}
                      </span>
                    </div>
                  ) : jobStatus === "failed" ? (
                    <div className="text-center text-red-500 flex flex-col items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-10 h-10 mb-1 opacity-50"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                        />
                      </svg>
                      <p className="text-[10px] font-bold uppercase">
                        Generation Failed
                      </p>
                      <p className="text-[8px] text-red-400/70 mt-0.5">
                        Click Retry to try again
                      </p>
                    </div>
                  ) : imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={prop.name}
                      className="max-w-full max-h-full w-full h-full object-contain block"
                    />
                  ) : (
                    <div className="text-center text-gray-700 flex flex-col items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                        className="w-10 h-10 mb-1 opacity-10"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                      <p className="text-[8px] font-bold uppercase tracking-tighter opacity-30">
                        Generated Design
                      </p>
                    </div>
                  )}
                </div>

                {/* Multiple Reference Thumbnails */}
                {prop.referenceImages && prop.referenceImages.length > 0 && (
                  <div className="max-h-[140px] overflow-y-auto w-full bg-black/30 p-2 rounded border border-gray-700/50">
                    <span className="text-[8px] font-black text-cyan-700 uppercase mb-2 block tracking-widest">
                      Reference Stack ({prop.referenceImages.length})
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {prop.referenceImages.map((refImg, rIdx) => (
                        <div
                          key={rIdx}
                          className="relative aspect-square rounded border border-cyan-900 group overflow-hidden"
                        >
                          <img
                            src={refImg}
                            alt={`Reference ${rIdx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeReference(prop.id, rIdx)}
                            className="absolute top-0 right-0 p-1 bg-red-900/80 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                              className="w-2.5 h-2.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-between items-center">
          <div className="text-[10px] text-gray-500">
            {props.length} items | Genre: {genre}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleMinimize()}
              className="px-5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
            >
              Fold Window
            </button>
              <button
                onClick={onClose}
                className="px-5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
              >
                Close
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

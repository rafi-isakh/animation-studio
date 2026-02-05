"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Prop, getEasyModeCharacterPrompt } from "./types";
import { usePropImageOrchestrator, PropJobStatus, PropUpdate } from "./usePropImageOrchestrator";

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
  onClose: () => void;
  onClearAll: () => void;
  title?: string;
  accentColor?: "purple" | "cyan";
  initialMinimized?: boolean; // Start minimized (as floating button)
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
  onClose,
  onClearAll,
  title = "Design Sheet Generator",
  accentColor = "cyan",
  initialMinimized = false,
}: PropListViewProps) {
  // Minimized state - use initialMinimized prop
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  // Easy Mode state
  const [isEasyMode, setIsEasyMode] = useState(false);

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
    }, [onUpdateProp, isBatchGenerating, batchProgress, jobStatuses]),
  });

  // Editable prompts per prop (keyed by prop id)
  const [editablePrompts, setEditablePrompts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    props.forEach((prop) => {
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

  // File input refs for each prop
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Handle Easy Mode toggle
  const toggleEasyMode = useCallback(
    (enabled: boolean) => {
      setIsEasyMode(enabled);
      if (enabled) {
        // Apply Easy Mode Template
        const newPrompts: Record<string, string> = {};
        props.forEach((prop) => {
          if (prop.category === "character") {
            newPrompts[prop.id] = getEasyModeCharacterPrompt(prop);
          } else {
            // For objects, keep the original prompt
            const desc = prop.description ? ` ${prop.description}` : "";
            newPrompts[prop.id] = prop.designSheetPrompt.includes(prop.description)
              ? prop.designSheetPrompt
              : `${prop.designSheetPrompt}${desc}`;
          }
        });
        setEditablePrompts(newPrompts);
      } else {
        // Revert to default prompts
        const defaultPrompts: Record<string, string> = {};
        props.forEach((prop) => {
          const desc = prop.description ? ` ${prop.description}` : "";
          defaultPrompts[prop.id] = prop.designSheetPrompt.includes(prop.description)
            ? prop.designSheetPrompt
            : `${prop.designSheetPrompt}${desc}`;
        });
        setEditablePrompts(defaultPrompts);
      }
    },
    [props]
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

      console.log('[PropListView] handleGenerate:', {
        propId,
        propName: prop.name,
        hasReferenceImages: !!prop.referenceImages,
        referenceImagesCount: prop.referenceImages?.length || 0,
        referenceImages: prop.referenceImages,
        existingJobId: jobIds[propId],
        existingStatus: jobStatuses[propId],
      });

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
            referenceImages: prop.referenceImages,
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
          await onGenerateImage(propId, prompt, prop.referenceImages);
        } finally {
          setActiveLoadingId(null);
        }
      }
    },
    [props, editablePrompts, onGenerateImage, projectId, orchestrator, genre, styleKeyword, onUpdateProp]
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
      console.log("All props already have images");
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
      const jobs = propsToGenerate.map((prop) => ({
        propId: prop.id,
        propName: prop.name,
        category: prop.category as 'character' | 'object',
        prompt: editablePrompts[prop.id] || prop.designSheetPrompt || "",
        genre,
        styleKeyword,
        referenceImages: prop.referenceImages,
        aspectRatio: "16:9" as const,
      }));

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
  }, [projectId, orchestrator, props, editablePrompts, genre, styleKeyword, onUpdateProp]);

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
      <div className={`fixed bottom-4 ${accentColor === "purple" ? "right-36" : "right-4"} z-[100]`}>
        <button
          onClick={() => setIsMinimized(false)}
          className={`px-4 py-2 ${accentColor === "purple" ? "bg-purple-700 hover:bg-purple-600" : "bg-cyan-700 hover:bg-cyan-600"} text-white rounded-lg shadow-lg flex items-center gap-2 text-sm font-bold transition-colors`}
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
          {accentColor === "purple" ? "Characters" : "Objects"} ({props.length})
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
          <div>
            <h2 className={`text-xl font-bold ${accentColor === "purple" ? "text-purple-400" : "text-cyan-400"}`}>
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
                    ? "bg-purple-700 hover:bg-purple-600 disabled:bg-purple-900/50"
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
                onClick={() => setIsMinimized(true)}
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
        {props.map((prop) => {
          const isItemLoading = activeLoadingId === prop.id;
          const imageUrl = getImageUrl(prop);
          const isCharacter = prop.category === "character";
          const jobStatus = jobStatuses[prop.id] || null;
          const isAsyncLoading = jobStatus && !["completed", "failed", "cancelled"].includes(jobStatus);
          const isAnyLoading = isItemLoading || isAsyncLoading || prop.isGenerating;

          return (
            <div
              key={prop.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex flex-col md:flex-row gap-4 shadow-sm min-h-[350px]"
            >
              {/* Left Column: Details */}
              <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-bold text-gray-100 flex items-center gap-2 truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isCharacter ? "bg-purple-500" : "bg-cyan-500"
                      }`}
                    />
                    {prop.name}
                    {prop.isVariant && (
                      <span className="text-[8px] bg-purple-900/50 text-purple-300 px-1 rounded border border-purple-800">
                        VARIANT
                      </span>
                    )}
                    <span
                      className={`text-[8px] px-1 rounded border uppercase ${
                        isCharacter
                          ? "bg-purple-900/30 text-purple-400 border-purple-800"
                          : "bg-teal-900/30 text-teal-400 border-teal-800"
                      }`}
                    >
                      {prop.category}
                    </span>
                    {/* Job Status Badge */}
                    <JobStatusBadge status={jobStatus} />
                  </h3>
                  {prop.appearingClips && prop.appearingClips.length > 0 && (
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

                {/* Variant Details Display */}
                {isCharacter && prop.isVariant && (prop.variantDetails || prop.variantVisuals) && (
                  <div className="bg-purple-950/30 border border-purple-800/50 rounded p-2 text-[9px] space-y-1">
                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">
                      Variant Information
                    </span>
                    {prop.variantDetails && (
                      <p className="text-purple-300">
                        <b>Type:</b> {prop.variantDetails}
                      </p>
                    )}
                    {prop.variantVisuals && (
                      <p className="text-purple-200 italic">
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
                          ? "bg-purple-600 hover:bg-purple-500"
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
              onClick={() => setIsMinimized(true)}
              className="px-5 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors"
            >
              Fold Window
            </button>
            <button
              onClick={onClearAll}
              className="px-5 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded text-xs font-bold transition-colors"
            >
              Clear All
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
  );
}
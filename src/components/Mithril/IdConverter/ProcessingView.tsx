"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  StopCircle,
} from "lucide-react";
import type {
  IdConverterEntity,
  IdConverterChunk,
} from "../services/firestore/types";
import { useIdConverterOrchestrator, IdConverterJobUpdate } from "./hooks/useIdConverterOrchestrator";

interface ProcessingViewProps {
  projectId: string;
  fileName: string;
  originalText: string;
  glossary: IdConverterEntity[];
  initialChunks: IdConverterChunk[];
  existingBatchJobId?: string | null;
  onSaveProgress: (chunks: IdConverterChunk[]) => void;
  onComplete: () => void;
  apiKey?: string;
}

const CHUNK_SIZE = 5000;

const createChunks = (text: string): IdConverterChunk[] => {
  const chunks: IdConverterChunk[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    let end = Math.min(currentIndex + CHUNK_SIZE, text.length);

    // Try to find the nearest newline to break cleanly
    if (end < text.length) {
      const lastNewLine = text.lastIndexOf("\n", end);
      if (lastNewLine > currentIndex) {
        end = lastNewLine + 1;
      }
    }

    chunks.push({
      originalIndex: chunks.length,
      originalText: text.substring(currentIndex, end),
      translatedText: "",
      status: "pending",
    });
    currentIndex = end;
  }
  return chunks;
};

export function ProcessingView({
  projectId,
  fileName,
  originalText,
  glossary,
  initialChunks,
  existingBatchJobId,
  onSaveProgress,
  onComplete,
  apiKey,
}: ProcessingViewProps) {
  const [chunks, setChunks] = useState<IdConverterChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");
  const [batchJobId, setBatchJobId] = useState<string | null>(existingBatchJobId || null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Ref to track job ID synchronously (avoids race condition with state)
  const batchJobIdRef = useRef<string | null>(existingBatchJobId || null);

  // Navigation State
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const initialized = useRef(false);

  // Handle job updates from orchestrator
  const handleJobUpdate = useCallback((update: IdConverterJobUpdate) => {
    if (update.jobType !== "id_converter_batch") {
      return;
    }

    // Only process updates for our specific batch job (use ref for synchronous check)
    // If we don't have a batchJobId yet, don't process any updates (we haven't started)
    const currentJobId = batchJobIdRef.current;
    if (!currentJobId || update.jobId !== currentJobId) {
      return;
    }

    console.log("[ProcessingView] Job update for our job:", update);

    if (update.status === "generating") {
      setIsProcessing(true);
      setJobError(null); // Clear errors when job is processing

      // Update chunks progress from job data
      if (update.completedChunks !== undefined && update.totalChunks !== undefined) {
        setChunks((prevChunks) => {
          const newChunks = [...prevChunks];
          // Mark completed chunks
          for (let i = 0; i < update.completedChunks!; i++) {
            if (newChunks[i] && newChunks[i].status !== "completed") {
              newChunks[i] = { ...newChunks[i], status: "completed" };
            }
          }
          // Mark current chunk as processing
          const currentIdx = update.currentChunkIndex;
          if (currentIdx !== undefined && currentIdx < newChunks.length) {
            newChunks[currentIdx] = { ...newChunks[currentIdx], status: "processing" };
          }
          return newChunks;
        });
      }

      // Update chunk content if provided
      if (update.chunksData) {
        setChunks((prevChunks) => {
          const newChunks = [...prevChunks];
          update.chunksData!.forEach((chunkData, idx) => {
            if (newChunks[idx] && chunkData.translatedText) {
              newChunks[idx] = {
                ...newChunks[idx],
                translatedText: chunkData.translatedText,
                status: "completed",
              };
            }
          });
          return newChunks;
        });
      }
    } else if (update.status === "completed") {
      setIsProcessing(false);
      setIsCancelling(false);
      setJobError(null); // Clear errors on successful completion

      // Update all chunks from final data
      if (update.chunksData) {
        setChunks((prevChunks) => {
          const newChunks = [...prevChunks];
          update.chunksData!.forEach((chunkData, idx) => {
            if (newChunks[idx]) {
              newChunks[idx] = {
                ...newChunks[idx],
                translatedText: chunkData.translatedText || "",
                status: "completed",
              };
            }
          });
          return newChunks;
        });
      }

      onComplete();
    } else if (update.status === "failed") {
      setIsProcessing(false);
      setIsCancelling(false);
      setJobError(update.error || "Batch processing failed");
    } else if (update.status === "cancelled") {
      setIsProcessing(false);
      setIsCancelling(false);
    }
  }, [onComplete]); // batchJobIdRef is used instead of batchJobId state

  // Initialize orchestrator hook
  const { submitBatchJob, cancelJob } = useIdConverterOrchestrator({
    projectId,
    customApiKey: apiKey,
    onJobUpdate: handleJobUpdate,
    enabled: !!projectId,
  });

  // Get all unique variant IDs
  const allVariantIds = useMemo(() => {
    return glossary.flatMap((g) => g.variants.map((v) => v.id));
  }, [glossary]);

  // Initialize chunks - only run once or when component remounts
  useEffect(() => {
    if (initialized.current) return; // Already initialized

    if (initialChunks && initialChunks.length > 0) {
      setChunks(initialChunks);
      // Check if there are incomplete chunks
      const hasIncomplete = initialChunks.some(c => c.status === "pending" || c.status === "processing");
      setIsProcessing(hasIncomplete && !!existingBatchJobId);
      initialized.current = true;
    } else if (originalText) {
      const newChunks = createChunks(originalText);
      setChunks(newChunks);
      setIsProcessing(false);
      initialized.current = true;
    }
  }, [originalText, initialChunks, existingBatchJobId]);

  // Report progress
  useEffect(() => {
    if (chunks.length > 0 && initialized.current) {
      onSaveProgress(chunks);
    }
  }, [chunks, onSaveProgress]);

  // Check for existing job on mount (resume scenario) - only run once
  useEffect(() => {
    if (existingBatchJobId) {
      batchJobIdRef.current = existingBatchJobId;
      setBatchJobId(existingBatchJobId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Start batch processing via orchestrator
  const startProcessing = useCallback(async () => {
    if (!projectId || chunks.length === 0) return;

    setIsProcessing(true);
    setJobError(null);

    try {
      // Prepare glossary for submission
      const glossaryForSubmission = glossary.map((entity) => ({
        name: entity.name,
        type: entity.type,
        variants: entity.variants.map((v) => ({
          id: v.id,
          description: v.description,
          tags: v.tags,
        })),
      }));

      // Prepare chunks for submission
      const chunksForSubmission = chunks.map((chunk) => ({
        originalIndex: chunk.originalIndex,
        originalText: chunk.originalText,
      }));

      const result = await submitBatchJob({
        glossary: glossaryForSubmission,
        chunks: chunksForSubmission,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit batch job");
      }

      // Set ref first (synchronous) so job updates are accepted immediately
      batchJobIdRef.current = result.jobId || null;
      setBatchJobId(result.jobId || null);
      console.log("[ProcessingView] Batch job submitted:", result.jobId);
      // Job is now running in background - progress updates come via Firestore subscription
    } catch (error) {
      console.error("Error starting batch processing:", error);
      setJobError(error instanceof Error ? error.message : "Failed to start processing");
      setIsProcessing(false);
    }
  }, [projectId, chunks, glossary, submitBatchJob]);

  // Cancel current job
  const handleCancel = useCallback(async () => {
    if (!batchJobId) return;

    setIsCancelling(true);
    try {
      const result = await cancelJob(batchJobId);
      if (!result.success) {
        console.error("Failed to cancel job:", result.error);
      }
      // Status update will come via Firestore subscription
    } catch (error) {
      console.error("Error cancelling job:", error);
      setIsCancelling(false);
    }
  }, [batchJobId, cancelJob]);

  // Entity Navigation Logic
  const updateEntityMatches = useCallback((id: string | null) => {
    if (!id) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

    requestAnimationFrame(() => {
      const matches = document.querySelectorAll(
        `.entity-occurrence[data-entity-id="${id}"]`
      );
      setTotalMatches(matches.length);

      if (matches.length > 0) {
        setCurrentMatchIndex((prev) =>
          prev >= matches.length ? 0 : prev
        );
      } else {
        setCurrentMatchIndex(0);
      }
    });
  }, []);

  useEffect(() => {
    updateEntityMatches(selectedEntityId);
  }, [chunks, selectedEntityId, activeTab, updateEntityMatches]);

  const scrollToMatch = useCallback(
    (index: number) => {
      if (!selectedEntityId) return;
      const matches = document.querySelectorAll(
        `.entity-occurrence[data-entity-id="${selectedEntityId}"]`
      );

      if (matches[index]) {
        matches[index].scrollIntoView({ behavior: "smooth", block: "center" });

        // Visual highlight
        matches.forEach((el) =>
          el.classList.remove(
            "ring-2",
            "ring-white",
            "scale-110",
            "bg-[#DB2777]",
            "text-white"
          )
        );
        matches[index].classList.add(
          "ring-2",
          "ring-white",
          "scale-110",
          "bg-[#DB2777]",
          "text-white"
        );
      }
    },
    [selectedEntityId]
  );

  const handleTagClick = useCallback(
    (id: string) => {
      if (selectedEntityId === id) {
        scrollToMatch(currentMatchIndex);
        return;
      }

      setSelectedEntityId(id);
      setCurrentMatchIndex(0);

      setTimeout(() => {
        const matches = document.querySelectorAll(
          `.entity-occurrence[data-entity-id="${id}"]`
        );
        if (matches.length > 0) {
          matches[0].scrollIntoView({ behavior: "smooth", block: "center" });

          document
            .querySelectorAll(".entity-occurrence")
            .forEach((el) =>
              el.classList.remove(
                "ring-2",
                "ring-white",
                "scale-110",
                "bg-[#DB2777]",
                "text-white"
              )
            );
          matches[0].classList.add(
            "ring-2",
            "ring-white",
            "scale-110",
            "bg-[#DB2777]",
            "text-white"
          );
        }
      }, 50);
    },
    [selectedEntityId, currentMatchIndex, scrollToMatch]
  );

  const handleNextMatch = useCallback(() => {
    if (totalMatches === 0) return;
    const nextIndex = (currentMatchIndex + 1) % totalMatches;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex);
  }, [currentMatchIndex, totalMatches, scrollToMatch]);

  const handlePrevMatch = useCallback(() => {
    if (totalMatches === 0) return;
    const prevIndex = (currentMatchIndex - 1 + totalMatches) % totalMatches;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex);
  }, [currentMatchIndex, totalMatches, scrollToMatch]);

  // Retry failed chunks by resubmitting the batch job
  const retryFailed = useCallback(() => {
    // Reset failed chunks to pending and start a new job
    setChunks((prev) => {
      const next = [...prev];
      next.forEach((chunk, idx) => {
        if (chunk.status === "error") {
          next[idx] = { ...next[idx], status: "pending" };
        }
      });
      return next;
    });
    // After reset, user can click Start to resubmit
    setJobError(null);
  }, []);

  const downloadTxt = () => {
    const fullText = chunks.map((c) => c.translatedText).join("\n\n");
    const element = document.createElement("a");
    const file = new Blob([fullText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `converted_storyboard_${fileName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const completedCount = chunks.filter((c) => c.status === "completed").length;
  const totalCount = chunks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Highlighted Text Component
  const HighlightedText = ({ text }: { text: string }) => {
    const parts = text.split(/([A-Z]+_[A-Z0-9_]+)/g);

    return (
      <span className="whitespace-pre-wrap font-serif leading-relaxed text-lg">
        {parts.map((part, i) => {
          if (/^[A-Z]+_[A-Z0-9_]+$/.test(part)) {
            const isKnownEntity = allVariantIds.includes(part);

            return (
              <span
                key={i}
                data-entity-id={part}
                className={`entity-occurrence font-mono text-sm px-1 rounded border mx-1 select-all transition-all duration-300 inline-block cursor-pointer ${
                  isKnownEntity
                    ? "bg-[#DB2777]/30 text-[#DB2777] border-[#DB2777]/50 hover:bg-[#DB2777]/50"
                    : "bg-gray-800 text-gray-400 border-gray-700"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isKnownEntity) handleTagClick(part);
                }}
              >
                {part}
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] bg-gray-950 text-gray-200 rounded-lg overflow-hidden border border-gray-800">
      {/* Header / Controls */}
      <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between shadow-md z-20 relative">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-xl text-[#DB2777] font-mono hidden md:block">
            STORYBOARD_MODE
          </h1>
          <div className="h-6 w-px bg-gray-700 mx-2"></div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase">Status</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">
                {isCancelling
                  ? "Cancelling..."
                  : isProcessing
                    ? "Processing..."
                    : progressPercent === 100
                      ? "Completed"
                      : "Ready"}
              </span>
              {batchJobId && isProcessing && (
                <span className="text-xs text-gray-500 font-mono">
                  Job: {batchJobId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col w-48 md:w-64 gap-1">
            <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#DB2777] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-xs text-right text-gray-500">
              {completedCount} / {totalCount} chunks
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isProcessing ? (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30"
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <RefreshCw className="animate-spin" size={18} /> Cancelling...
                </>
              ) : (
                <>
                  <StopCircle size={18} /> Stop
                </>
              )}
            </button>
          ) : (
            <button
              onClick={startProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all bg-[#DB2777] text-white hover:bg-[#DB2777]/80"
              disabled={progressPercent === 100 || chunks.length === 0}
            >
              <Play size={18} /> {completedCount > 0 ? "Resume" : "Start"}
            </button>
          )}

          {jobError && (
            <button
              onClick={retryFailed}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30"
            >
              <RefreshCw size={18} /> Retry
            </button>
          )}

          <button
            onClick={downloadTxt}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700"
            disabled={completedCount === 0}
          >
            <Download size={18} />{" "}
            <span className="hidden md:inline">Download .txt</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Entity Tags + Source Text */}
        <div className="hidden lg:flex flex-1 flex-col border-r border-gray-800 bg-gray-900/50 min-w-[300px]">
          {/* Entity Navigation Bar */}
          <div className="p-3 bg-gray-925 border-b border-gray-800 flex flex-col gap-2 shadow-inner z-10">
            <div className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
              <Search size={14} /> Entities in Output
            </div>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {allVariantIds.map((id) => {
                const isActive = selectedEntityId === id;
                return (
                  <div key={id} className="flex items-center group">
                    <button
                      onClick={() => handleTagClick(id)}
                      className={`px-3 py-1 rounded-full text-xs font-mono border transition-all flex items-center gap-2 ${
                        isActive
                          ? "bg-[#DB2777] text-white border-[#DB2777] shadow-lg"
                          : "bg-gray-800 text-gray-400 border-gray-700 hover:border-[#DB2777]/50 hover:text-[#DB2777]"
                      }`}
                    >
                      {id}
                      {isActive && totalMatches > 0 && (
                        <span className="bg-[#DB2777]/50 px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[30px] text-center">
                          {currentMatchIndex + 1} / {totalMatches}
                        </span>
                      )}
                    </button>

                    {isActive && totalMatches > 0 && (
                      <div className="flex items-center ml-1 bg-gray-800 rounded-full border border-gray-700 overflow-hidden">
                        <button
                          onClick={handlePrevMatch}
                          className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          title="Previous occurrence"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <div className="w-px h-3 bg-gray-700"></div>
                        <button
                          onClick={handleNextMatch}
                          className="p-1 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          title="Next occurrence"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {allVariantIds.length === 0 && (
                <span className="text-xs text-gray-600 italic px-1">
                  No entities detected yet.
                </span>
              )}
            </div>
          </div>

          {/* Source Text Section */}
          <div className="p-3 bg-gray-900 border-b border-gray-800 text-xs text-gray-500 uppercase font-bold mt-1">
            Source Text (Korean)
          </div>
          <div className="flex-1 overflow-y-auto p-6 font-mono text-sm text-gray-400 leading-relaxed">
            {chunks.map((chunk) => (
              <div
                key={chunk.originalIndex}
                className={`mb-6 p-2 rounded transition-colors ${
                  chunk.status === "processing"
                    ? "bg-[#DB2777]/20 border-l-2 border-[#DB2777]"
                    : chunk.status === "completed"
                      ? "opacity-50 hover:opacity-100"
                      : ""
                }`}
              >
                <div className="text-xs text-gray-600 mb-1">
                  #{chunk.originalIndex + 1}
                </div>
                {chunk.originalText}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Output */}
        <div className="flex-[2] flex flex-col bg-gray-950 relative">
          <div className="p-3 bg-gray-950 border-b border-gray-800 flex justify-between items-center">
            <span className="text-xs text-[#DB2777] uppercase font-bold tracking-widest">
              Storyboard Output
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("preview")}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  activeTab === "preview"
                    ? "bg-gray-800 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  activeTab === "raw"
                    ? "bg-gray-800 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Raw Text
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
            {/* Job Error Banner */}
            {jobError && (
              <div className="mb-6 border border-red-900/50 bg-red-900/10 p-4 rounded text-red-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} />
                  <span>{jobError}</span>
                </div>
                <button
                  onClick={retryFailed}
                  className="text-xs bg-red-900/30 px-3 py-1 rounded hover:bg-red-900/50"
                >
                  Retry
                </button>
              </div>
            )}

            {chunks.every((c) => c.status === "pending") && !isProcessing && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                <FileText size={48} className="mb-4" />
                <p>Ready to start processing...</p>
                <p className="text-sm mt-2">Click &quot;Start&quot; to begin async batch conversion</p>
              </div>
            )}

            {chunks.map((chunk) => (
              <div key={chunk.originalIndex} className="mb-8">
                {/* Error State - simplified since errors are handled at job level */}
                {chunk.status === "error" && (
                  <div className="border border-red-900/50 bg-red-900/10 p-4 rounded text-red-400 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    <span>
                      Error processing chunk #{chunk.originalIndex + 1}
                    </span>
                  </div>
                )}

                {/* Completed Content */}
                {chunk.translatedText && (
                  <div className="relative group">
                    <div className="absolute -left-8 top-1 text-[10px] text-gray-700 font-mono opacity-0 group-hover:opacity-100 flex flex-col items-end">
                      <span>#{chunk.originalIndex + 1}</span>
                    </div>
                    {activeTab === "preview" ? (
                      <HighlightedText text={chunk.translatedText} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300">
                        {chunk.translatedText}
                      </pre>
                    )}
                  </div>
                )}

                {/* Loading Indicator */}
                {chunk.status === "processing" && (
                  <div className="flex gap-2 items-center text-[#DB2777] animate-pulse mt-4 bg-[#DB2777]/10 p-4 rounded border border-[#DB2777]/30">
                    <RefreshCw className="animate-spin" size={16} />
                    <span className="text-sm font-mono">
                      Translating chunk #{chunk.originalIndex + 1}...
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

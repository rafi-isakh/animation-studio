"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  Play,
  Pause,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type {
  IdConverterEntity,
  IdConverterChunk,
} from "../services/firestore/types";

interface ProcessingViewProps {
  originalText: string;
  glossary: IdConverterEntity[];
  initialChunks: IdConverterChunk[];
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
  originalText,
  glossary,
  initialChunks,
  onSaveProgress,
  onComplete,
  apiKey,
}: ProcessingViewProps) {
  const [chunks, setChunks] = useState<IdConverterChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  // Navigation State
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const initialized = useRef(false);
  const processingRef = useRef(false);

  // Get all unique variant IDs
  const allVariantIds = useMemo(() => {
    return glossary.flatMap((g) => g.variants.map((v) => v.id));
  }, [glossary]);

  // Initialize chunks
  useEffect(() => {
    if (initialized.current && chunks.length > 0) return;

    if (initialChunks && initialChunks.length > 0) {
      setChunks(initialChunks);
      initialized.current = true;
    } else if (originalText) {
      const newChunks = createChunks(originalText);
      setChunks(newChunks);
      initialized.current = true;
    }
  }, [originalText, initialChunks, chunks.length]);

  // Report progress
  useEffect(() => {
    if (chunks.length > 0 && initialized.current) {
      onSaveProgress(chunks);
    }
  }, [chunks, onSaveProgress]);

  // Process a single chunk
  const processChunk = useCallback(
    async (index: number, currentChunks: IdConverterChunk[]) => {
      const prevText = index > 0 ? currentChunks[index - 1].translatedText : "";
      const context = prevText.slice(-1000);

      try {
        const response = await fetch("/api/id-converter/convert-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            textChunk: currentChunks[index].originalText,
            glossary,
            previousContext: context,
            apiKey,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to convert chunk");
        }

        const data = await response.json();
        return data.translatedText || "";
      } catch (e) {
        console.error("Chunk processing failed", e);
        throw e;
      }
    },
    [glossary, apiKey]
  );

  // Processing Loop
  useEffect(() => {
    if (!isProcessing || processingRef.current) return;

    const processNextChunk = async () => {
      processingRef.current = true;

      const currentChunks = [...chunks];
      const nextIdx = currentChunks.findIndex((c) => c.status === "pending");

      if (nextIdx === -1) {
        setIsProcessing(false);
        processingRef.current = false;
        onComplete();
        return;
      }

      // Mark as processing
      currentChunks[nextIdx] = { ...currentChunks[nextIdx], status: "processing" };
      setChunks([...currentChunks]);

      try {
        const translatedText = await processChunk(nextIdx, currentChunks);
        currentChunks[nextIdx] = {
          ...currentChunks[nextIdx],
          translatedText,
          status: "completed",
        };
        setChunks([...currentChunks]);
      } catch {
        currentChunks[nextIdx] = { ...currentChunks[nextIdx], status: "error" };
        setChunks([...currentChunks]);
        setIsProcessing(false);
      }

      processingRef.current = false;
    };

    processNextChunk();
  }, [isProcessing, chunks, processChunk, onComplete]);

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

  const toggleProcessing = () => {
    setIsProcessing(!isProcessing);
  };

  const retryChunk = (index: number) => {
    setChunks((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: "pending" };
      return next;
    });
    setIsProcessing(true);
  };

  const downloadTxt = () => {
    const fullText = chunks.map((c) => c.translatedText).join("\n\n");
    const element = document.createElement("a");
    const file = new Blob([fullText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "converted_storyboard.txt";
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
                {isProcessing
                  ? "Translating..."
                  : progressPercent === 100
                    ? "Completed"
                    : "Paused"}
              </span>
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
          <button
            onClick={toggleProcessing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              isProcessing
                ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                : "bg-[#DB2777] text-white hover:bg-[#DB2777]/80"
            }`}
            disabled={progressPercent === 100}
          >
            {isProcessing ? (
              <>
                <Pause size={18} /> Pause
              </>
            ) : (
              <>
                <Play size={18} /> {completedCount > 0 ? "Resume" : "Start"}
              </>
            )}
          </button>

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
            {chunks.every((c) => c.status === "pending") && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                <FileText size={48} className="mb-4" />
                <p>Ready to start processing...</p>
              </div>
            )}

            {chunks.map((chunk) => (
              <div key={chunk.originalIndex} className="mb-8">
                {/* Error State */}
                {chunk.status === "error" && (
                  <div className="border border-red-900/50 bg-red-900/10 p-4 rounded text-red-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={18} />
                      <span>
                        Error translating chunk #{chunk.originalIndex + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => retryChunk(chunk.originalIndex)}
                      className="text-xs bg-red-900/30 px-3 py-1 rounded hover:bg-red-900/50"
                    >
                      Retry
                    </button>
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

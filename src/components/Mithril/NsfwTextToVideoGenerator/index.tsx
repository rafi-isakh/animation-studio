"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Trash2, ChevronDown, Video } from "lucide-react";
import { useMithril } from "../MithrilContext";
import { useToast } from "@/hooks/use-toast";
import { getImageGenFrames } from "../services/firestore/imageGen";
import {
  getT2VNsfwVideoMeta,
  getT2VNsfwClips,
  saveT2VNsfwClips,
  saveT2VNsfwVideoMeta,
  updateT2VNsfwClip,
  clearT2VNsfwVideo,
} from "../services/firestore/t2vNsfwVideo";
import {
  getProviderConstraints,
  getDefaultProviderId,
} from "../VideoGenerator/providers";
import ProviderSelector from "../VideoGenerator/ProviderSelector";
import ClipCard from "./ClipCard";
import { parseCsvData, parseCellReference } from "@/utils/csvHelper";
import type { NsfwT2VClip } from "./types";
import type { AspectRatio } from "../VideoGenerator/providers/types";

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "Landscape (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function NsfwTextToVideoGenerator() {
  const {
    currentStage,
    currentProjectId,
    setStageResult,
    videoApiKey,
    isLoading: isContextLoading,
  } = useMithril();
  const { toast } = useToast();

  const [clips, setClips] = useState<NsfwT2VClip[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(getDefaultProviderId());
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");

  // Batch generation
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [revisingClips, setRevisingClips] = useState<Set<number>>(new Set());
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const shouldStopRef = useRef(false);
  const isMountedRef = useRef(true);

  // CSV state
  const [isCsvPanelOpen, setIsCsvPanelOpen] = useState(false);
  const [parsedCsvData, setParsedCsvData] = useState<Record<string, string>[] | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvStartCell, setCsvStartCell] = useState("M2");

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      shouldStopRef.current = true;
    };
  }, []);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (currentStage !== 8) {
      setHasLoaded(false);
      return;
    }
    if (isContextLoading || hasLoaded || !currentProjectId) return;

    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // 1. Load finalized frames from imageGen Firestore
        const imageGenFrames = await getImageGenFrames(currentProjectId);
        const finalizedFrames = imageGenFrames.filter((f) => f.isFinalized);

        if (finalizedFrames.length === 0) {
          setIsLoadingData(false);
          setHasLoaded(true);
          return;
        }

        // 2. Load any saved video data
        const savedMeta = await getT2VNsfwVideoMeta(currentProjectId);
        const savedClips = await getT2VNsfwClips(currentProjectId);
        const savedClipMap = new Map(savedClips.map((c) => [c.clipNumber, c]));

        if (savedMeta?.aspectRatio) setAspectRatio(savedMeta.aspectRatio);
        if (savedMeta?.providerId) setSelectedProvider(savedMeta.providerId);

        // 3. Build clip list from finalized frames, merging saved video data
        const built: NsfwT2VClip[] = finalizedFrames.map((f) => {
          const saved = savedClipMap.get(f.clipNumber ?? 0);
          return {
            clipNumber: f.clipNumber ?? 0,
            promptVariant: f.promptVariant ?? null,
            frameLabel: f.frameLabel,
            imageRef: f.imageRef || null,
            videoPrompt: saved?.videoPrompt ?? "",
            videoUrl: saved?.videoRef ?? null,
            jobId: saved?.jobId ?? null,
            s3FileName: saved?.s3FileName ?? null,
            status: (saved?.status ?? "pending") as NsfwT2VClip["status"],
            error: saved?.error,
            providerId: saved?.providerId,
          };
        });

        setClips(built);
      } catch (err) {
        console.error("[NsfwT2V] Failed to load:", err);
        toast({ title: "Load Failed", description: "Could not load video generator data.", variant: "destructive" });
      } finally {
        setIsLoadingData(false);
        setHasLoaded(true);
      }
    };

    loadData();
  }, [currentStage, currentProjectId, isContextLoading, hasLoaded, toast]);

  // ── CSV ───────────────────────────────────────────────────────────────────

  const handleCsvFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const { headers, data } = parseCsvData(text);
      setCsvHeaders(headers);
      setParsedCsvData(data);
      toast({ title: "CSV Loaded", description: `${data.length} rows, ${headers.length} columns`, variant: "default" });
    };
    reader.readAsText(file);
    if (e.target) e.target.value = "";
  }, [toast]);

  const handleApplyCsv = useCallback(() => {
    if (!parsedCsvData || !csvStartCell.trim()) {
      toast({ title: "Missing Data", description: "Upload a CSV and specify the start cell (e.g., M2).", variant: "destructive" });
      return;
    }

    const parsed = parseCellReference(csvStartCell.trim());
    if (!parsed) {
      toast({ title: "Invalid Cell", description: "Use format like M2.", variant: "destructive" });
      return;
    }

    const colHeader = csvHeaders[parsed.colIndex];
    if (!colHeader) {
      toast({ title: "Invalid Column", description: "Column not found in CSV headers.", variant: "destructive" });
      return;
    }

    const startRowIndex = parsed.row - 2; // row 1 = header, row 2 = index 0
    const rows = parsedCsvData.slice(Math.max(0, startRowIndex));

    setClips((prev) => {
      const updated = [...prev];
      updated.forEach((clip) => {
        const rowIdx = clip.clipNumber - 1; // clip 1 → rows[0]
        const prompt = rows[rowIdx]?.[colHeader]?.trim() ?? "";
        if (prompt) {
          updated[updated.indexOf(clip)] = { ...clip, videoPrompt: prompt };
        }
      });
      return updated;
    });

    toast({ title: "Prompts Applied", description: `Video prompts mapped from column ${csvStartCell}.`, variant: "default" });
  }, [parsedCsvData, csvHeaders, csvStartCell, toast]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePromptChange = useCallback((clipNumber: number, value: string) => {
    setClips((prev) => prev.map((c) => c.clipNumber === clipNumber ? { ...c, videoPrompt: value } : c));
  }, []);

  const generateClip = useCallback(async (clipNumber: number) => {
    const clip = clips.find((c) => c.clipNumber === clipNumber);
    if (!clip) return;

    const providerConstraints = getProviderConstraints(selectedProvider);
    const duration = providerConstraints?.durations?.[0] ?? 5;

    setClips((prev) => prev.map((c) =>
      c.clipNumber === clipNumber ? { ...c, status: "generating", error: undefined } : c
    ));

    try {
      // Submit job
      const submitRes = await fetch(`/api/video/${selectedProvider}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: clip.videoPrompt,
          imageBase64: clip.imageRef,
          duration,
          aspectRatio,
          ...(videoApiKey && { apiKey: videoApiKey }),
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json();
        throw new Error(err.error || "Failed to submit job");
      }

      const { jobId } = await submitRes.json();

      setClips((prev) => prev.map((c) =>
        c.clipNumber === clipNumber ? { ...c, jobId } : c
      ));
      if (currentProjectId) {
        await updateT2VNsfwClip(currentProjectId, clipNumber, { jobId, status: "generating", providerId: selectedProvider });
      }

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 120;
      while (attempts < maxAttempts) {
        if (!isMountedRef.current || shouldStopRef.current) break;
        await sleep(5000);

        const statusRes = await fetch(`/api/video/${selectedProvider}/status/${jobId}`);
        if (!statusRes.ok) { attempts++; continue; }

        const statusData = await statusRes.json();

        if (statusData.status === "completed" && statusData.videoUrl) {
          setClips((prev) => prev.map((c) =>
            c.clipNumber === clipNumber
              ? { ...c, status: "completed", videoUrl: statusData.videoUrl, s3FileName: statusData.s3FileName ?? null, jobId }
              : c
          ));
          if (currentProjectId) {
            await updateT2VNsfwClip(currentProjectId, clipNumber, {
              videoRef: statusData.videoUrl,
              s3FileName: statusData.s3FileName ?? null,
              status: "completed",
              providerId: selectedProvider,
            });
          }
          return;
        }

        if (statusData.status === "failed") {
          throw new Error(statusData.error || "Video generation failed");
        }

        attempts++;
      }

      throw new Error("Timed out waiting for video");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setClips((prev) => prev.map((c) =>
        c.clipNumber === clipNumber ? { ...c, status: "failed", error: message } : c
      ));
      if (currentProjectId) {
        await updateT2VNsfwClip(currentProjectId, clipNumber, { status: "failed", error: message });
      }
    }
  }, [clips, selectedProvider, aspectRatio, videoApiKey, currentProjectId]);

  const handleGenerateAll = useCallback(async () => {
    const pending = clips.filter((c) => !c.videoUrl && c.videoPrompt.trim());
    if (pending.length === 0) {
      toast({ title: "Nothing to generate", description: "All clips have videos or missing prompts.", variant: "default" });
      return;
    }

    setIsGeneratingAll(true);
    shouldStopRef.current = false;
    setBatchProgress({ current: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      if (shouldStopRef.current) break;
      setBatchProgress({ current: i + 1, total: pending.length });
      await generateClip(pending[i].clipNumber);
      if (i < pending.length - 1) await sleep(1000);
    }

    setBatchProgress(null);
    setIsGeneratingAll(false);
  }, [clips, generateClip, toast]);

  const handleDownload = useCallback((clipNumber: number) => {
    const clip = clips.find((c) => c.clipNumber === clipNumber);
    if (!clip?.videoUrl) return;
    const a = document.createElement("a");
    a.href = clip.videoUrl;
    a.download = `clip_${clip.frameLabel || clipNumber}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [clips]);

  const handleSave = useCallback(async () => {
    if (!currentProjectId) return;
    try {
      await saveT2VNsfwVideoMeta(currentProjectId, { aspectRatio, providerId: selectedProvider });
      await saveT2VNsfwClips(
        currentProjectId,
        clips.map((c) => ({
          clipNumber: c.clipNumber,
          promptVariant: c.promptVariant,
          frameLabel: c.frameLabel,
          imageRef: c.imageRef,
          videoPrompt: c.videoPrompt,
        }))
      );
      // Persist prompts per clip that already have video data
      for (const c of clips) {
        if (c.videoUrl || c.jobId) {
          await updateT2VNsfwClip(currentProjectId, c.clipNumber, {
            videoRef: c.videoUrl,
            jobId: c.jobId,
            s3FileName: c.s3FileName,
            status: c.status,
            videoPrompt: c.videoPrompt,
          });
        }
      }
      toast({ title: "Saved", variant: "default" });
    } catch (err) {
      console.error(err);
      toast({ title: "Save Failed", variant: "destructive" });
    }
  }, [currentProjectId, aspectRatio, selectedProvider, clips, toast]);

  const handleRevisePrompt = useCallback(async (clipNumber: number) => {
    const clip = clips.find((c) => c.clipNumber === clipNumber);
    if (!clip || !clip.imageRef || !clip.videoPrompt.trim() || !clip.promptVariant) return;
    if (clip.promptVariant !== 'B' && clip.promptVariant !== 'C') return;

    setRevisingClips((prev) => new Set(prev).add(clipNumber));
    try {
      const res = await fetch("/api/nsfw-video/revise-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: clip.imageRef,
          currentPrompt: clip.videoPrompt,
          variant: clip.promptVariant,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to revise prompt");
      }
      const { revisedPrompt } = await res.json();
      setClips((prev) => prev.map((c) =>
        c.clipNumber === clipNumber ? { ...c, videoPrompt: revisedPrompt } : c
      ));
      toast({ title: "Prompt Revised", description: `Clip ${clipNumber} prompt updated.`, variant: "default" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Revision Failed", description: message, variant: "destructive" });
    } finally {
      setRevisingClips((prev) => { const s = new Set(prev); s.delete(clipNumber); return s; });
    }
  }, [clips, toast]);

  const handleClear = useCallback(async () => {
    if (!confirm("Clear all video data for this project?")) return;
    if (currentProjectId) {
      await clearT2VNsfwVideo(currentProjectId);
    }
    setClips((prev) => prev.map((c) => ({ ...c, videoUrl: null, jobId: null, s3FileName: null, status: "pending", error: undefined })));
    setStageResult(8, null);
  }, [currentProjectId, setStageResult]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* ── Left Sidebar ───────────────────────────────────────────── */}
      <div className="w-full lg:w-72 flex-shrink-0 space-y-4 h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar">

        {/* Provider */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-3">
          <label className="text-[10px] font-bold text-yellow-500 uppercase block">Provider</label>
          <ProviderSelector
            value={selectedProvider}
            onChange={setSelectedProvider}
            disabled={isGeneratingAll}
          />
          <label className="text-[10px] font-bold text-yellow-500 uppercase block mt-2">Aspect Ratio</label>
          <div className="grid grid-cols-2 gap-2">
            {ASPECT_RATIOS.map((r) => (
              <button
                key={r.value}
                onClick={() => setAspectRatio(r.value)}
                className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                  aspectRatio === r.value
                    ? "bg-yellow-500 text-slate-900 border-yellow-500"
                    : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* CSV Import */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-emerald-500/30">
          <button
            onClick={() => setIsCsvPanelOpen(!isCsvPanelOpen)}
            className="w-full flex justify-between items-center text-[10px] font-bold text-emerald-400 uppercase"
          >
            <span>CSV Video Prompts</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isCsvPanelOpen ? "rotate-180" : ""}`} />
          </button>

          {isCsvPanelOpen && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Upload CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileUpload}
                  className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
                />
                {parsedCsvData && (
                  <p className="text-[9px] text-emerald-400 mt-1">{parsedCsvData.length} rows · {csvHeaders.length} cols</p>
                )}
              </div>

              <div>
                <label className="text-[9px] font-bold text-emerald-500 uppercase block mb-1">
                  Start Cell (e.g. M2)
                </label>
                <input
                  type="text"
                  value={csvStartCell}
                  onChange={(e) => setCsvStartCell(e.target.value)}
                  placeholder="M2"
                  className="w-full p-2 bg-slate-900/80 border border-emerald-700 rounded text-[10px] text-slate-300 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleApplyCsv}
                disabled={!parsedCsvData}
                className="w-full py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                Apply Prompts
              </button>

              <p className="text-[9px] text-slate-500 italic">
                Row at start cell = Clip 1, next row = Clip 2, etc.
              </p>
            </div>
          )}
        </div>

        {/* Batch controls */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-2">
          <button
            onClick={isGeneratingAll ? () => { shouldStopRef.current = true; } : handleGenerateAll}
            disabled={clips.length === 0}
            className={`w-full py-2 text-[10px] font-black rounded-lg transition-colors disabled:opacity-50 ${
              isGeneratingAll
                ? "bg-rose-700 text-white hover:bg-rose-600"
                : "bg-cyan-600 text-white hover:bg-cyan-500"
            }`}
          >
            {isGeneratingAll ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                {batchProgress ? `${batchProgress.current}/${batchProgress.total} — STOP` : "STOP"}
              </span>
            ) : "GENERATE ALL"}
          </button>

          {batchProgress && (
            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-1.5 transition-all"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          )}

          <button
            onClick={handleSave}
            className="w-full py-2 bg-green-700 text-white text-[10px] font-bold rounded-lg hover:bg-green-600 transition-colors"
          >
            Save All
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="w-full py-2 text-[10px] text-rose-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3 h-3" /> Clear Video Data
        </button>
      </div>

      {/* ── Main area ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-slate-900/40 rounded-2xl border border-slate-700/50 h-[calc(100vh-6rem)] flex flex-col">
        <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 p-4">
          <h2 className="text-xl font-black text-cyan-400 uppercase tracking-widest">
            Video Generator
            {clips.length > 0 && (
              <span className="ml-3 text-sm font-normal text-slate-500 normal-case tracking-normal">
                {clips.length} clip{clips.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          {clips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Video className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No finalized images</p>
              <p className="text-slate-600 text-xs mt-2 text-center">
                Go to Stage 7 (Image Generator), finalize images for each clip, then return here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {clips.map((clip) => (
                <ClipCard
                  key={clip.clipNumber}
                  clip={clip}
                  onPromptChange={handlePromptChange}
                  onGenerate={generateClip}
                  onDownload={handleDownload}
                  onRevisePrompt={handleRevisePrompt}
                  isGeneratingAll={isGeneratingAll}
                  isRevisingPrompt={revisingClips.has(clip.clipNumber)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

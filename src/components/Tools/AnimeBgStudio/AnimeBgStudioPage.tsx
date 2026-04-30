"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Upload,
  Image as ImageIcon,
  Settings,
  Download,
  UploadCloud,
  Play,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  FileArchive,
  Camera,
} from "lucide-react";
import JSZip from "jszip";
import type {
  WorkspaceImage,
  WorkspaceState,
  ImageProvider,
  AspectRatio,
} from "./types";
import {
  DEFAULT_PROMPT,
  GEMINI_API_KEY_STORAGE_KEY,
  GROK_API_KEY_STORAGE_KEY,
  PROVIDERS,
  ASPECT_RATIOS,
} from "./constants";
import { StageSidebarPortal } from "@/components/Mithril/StageSidebarContext";

// --- Helpers ---

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

function extractBase64Data(dataUrl: string): {
  base64: string;
  mimeType: string;
} {
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 data URL");
  }
  return { mimeType: matches[1], base64: matches[2] };
}

function downloadJson(data: unknown, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getStorageKey(provider: ImageProvider): string {
  return provider === "grok"
    ? GROK_API_KEY_STORAGE_KEY
    : GEMINI_API_KEY_STORAGE_KEY;
}

const apiKeyCache = new Map<ImageProvider, string>();

function getStoredApiKey(provider: ImageProvider): string {
  return apiKeyCache.get(provider) || "";
}

function setStoredApiKey(provider: ImageProvider, key: string) {
  if (key) {
    apiKeyCache.set(provider, key);
  } else {
    apiKeyCache.delete(provider);
  }
}

/** Upload a base64 image to S3 via /api/anime-bg/upload */
async function uploadToS3(
  base64: string,
  mimeType: string,
  imageId: string,
  type: "source" | "reference" | "result",
  sessionId: string
): Promise<string> {
  const res = await fetch("/api/anime-bg/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64, mimeType, imageId, type, sessionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url;
}

// --- Main Component ---

interface AnimeBgStudioPageProps {
  embedded?: boolean;
  initialImages?: WorkspaceImage[];
}

export default function AnimeBgStudioPage({ embedded = false, initialImages }: AnimeBgStudioPageProps) {
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  const [state, setState] = useState<WorkspaceState>({
    images: initialImages ?? [],
    globalPrompt: DEFAULT_PROMPT,
    aspectRatio: "16:9",
    provider: "gemini",
  });

  // Append new images when initialImages changes (e.g. from 3D Screenshot)
  const prevInitialRef = useRef(initialImages);
  if (initialImages && initialImages !== prevInitialRef.current) {
    prevInitialRef.current = initialImages;
    // Deduplicate by id
    const existingIds = new Set(state.images.map((img) => img.id));
    const newImages = initialImages.filter((img) => !existingIds.has(img.id));
    if (newImages.length > 0) {
      setState((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  }

  const [apiKey, setApiKeyState] = useState(() => getStoredApiKey("gemini"));
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // --- API key management ---

  const setApiKey = useCallback(
    (key: string) => {
      setApiKeyState(key);
      setStoredApiKey(state.provider, key);
    },
    [state.provider]
  );

  const handleProviderChange = useCallback(
    (provider: ImageProvider) => {
      setStoredApiKey(state.provider, apiKey);
      const newKey = getStoredApiKey(provider);
      setApiKeyState(newKey);
      setState((prev) => ({ ...prev, provider }));
    },
    [state.provider, apiKey]
  );

  // --- Image management ---

  const handleTargetImagesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return;

    const newImages: WorkspaceImage[] = [];

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];

      if (file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip") {
        // Extract images from ZIP
        const zip = await JSZip.loadAsync(file);
        const imageFiles = Object.entries(zip.files).filter(([name, entry]) => {
          if (entry.dir) return false;
          const lower = name.toLowerCase();
          return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp");
        });

        for (const [name, entry] of imageFiles) {
          const blob = await entry.async("blob");
          const ext = name.split(".").pop()?.toLowerCase() || "png";
          const mimeType = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";
          const imageFile = new File([blob], name, { type: mimeType });
          const dataUrl = await fileToBase64(imageFile);
          newImages.push({
            id: crypto.randomUUID(),
            originalDataUrl: dataUrl,
            prompt: "",
            status: "idle",
          });
        }
      } else {
        const dataUrl = await fileToBase64(file);
        newImages.push({
          id: crypto.randomUUID(),
          originalDataUrl: dataUrl,
          prompt: "",
          status: "idle",
        });
      }
    }

    setState((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleReferenceImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const dataUrl = await fileToBase64(file);
    setState((prev) => ({
      ...prev,
      referenceImageDataUrl: dataUrl,
      referenceS3Url: undefined, // reset S3 URL, will re-upload on next generate
    }));
    if (refFileInputRef.current) refFileInputRef.current.value = "";
  };

  const removeReferenceImage = () => {
    setState((prev) => ({
      ...prev,
      referenceImageDataUrl: undefined,
      referenceS3Url: undefined,
    }));
  };

  const updateImage = useCallback(
    (id: string, updates: Partial<WorkspaceImage>) => {
      setState((prev) => ({
        ...prev,
        images: prev.images.map((img) =>
          img.id === id ? { ...img, ...updates } : img
        ),
      }));
    },
    []
  );

  const removeImage = (id: string) => {
    setState((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== id),
    }));
  };

  // --- S3 Upload helpers ---

  /** Ensure source image is uploaded to S3, return its CloudFront URL */
  const ensureSourceUploaded = useCallback(
    async (image: WorkspaceImage): Promise<string> => {
      if (image.originalS3Url) return image.originalS3Url;

      const { base64, mimeType } = extractBase64Data(image.originalDataUrl);
      const url = await uploadToS3(base64, mimeType, image.id, "source", sessionId);
      updateImage(image.id, { originalS3Url: url });
      return url;
    },
    [sessionId, updateImage]
  );

  /** Ensure reference image is uploaded to S3, return its CloudFront URL */
  const ensureReferenceUploaded = useCallback(async (): Promise<
    string | undefined
  > => {
    if (!state.referenceImageDataUrl) return undefined;

    // Check current state for cached S3 URL
    if (state.referenceS3Url) return state.referenceS3Url;

    const { base64, mimeType } = extractBase64Data(state.referenceImageDataUrl);
    const url = await uploadToS3(base64, mimeType, "ref", "reference", sessionId);
    setState((prev) => ({ ...prev, referenceS3Url: url }));
    return url;
  }, [state.referenceImageDataUrl, state.referenceS3Url, sessionId]);

  // --- Generation ---

  const generateImage = useCallback(
    async (id: string) => {
      const image = state.images.find((img) => img.id === id);
      if (!image) return;

      updateImage(id, { status: "generating", error: undefined });

      try {
        // Upload source to S3
        const imageUrl = await ensureSourceUploaded(image);

        // Upload reference to S3 (if present)
        const referenceImageUrl = await ensureReferenceUploaded();

        const activePrompt = image.prompt.trim() || state.globalPrompt;

        const res = await fetch("/api/anime-bg/enhance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            prompt: activePrompt,
            referenceImageUrl,
            aspectRatio: state.aspectRatio,
            apiKey,
            provider: state.provider,
            sessionId,
            imageId: id,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Generation failed");
        }

        updateImage(id, { status: "success", generatedUrl: data.imageUrl });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Generation failed";
        updateImage(id, { status: "error", error: message });
      }
    },
    [
      state.images,
      state.globalPrompt,
      state.aspectRatio,
      state.provider,
      apiKey,
      sessionId,
      updateImage,
      ensureSourceUploaded,
      ensureReferenceUploaded,
    ]
  );

  const generateAll = async () => {
    abortRef.current = false;
    setIsGeneratingAll(true);

    const pendingImages = state.images.filter(
      (img) => img.status === "idle" || img.status === "error"
    );

    for (const img of pendingImages) {
      if (abortRef.current) break;
      await generateImage(img.id);
    }

    setIsGeneratingAll(false);
  };

  const stopGenerating = () => {
    abortRef.current = true;
  };

  // --- Export / Import ---

  const exportWorkspace = () => {
    downloadJson(state, "anime-bg-workspace.json");
  };

  const importWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedState = JSON.parse(event.target?.result as string);
        if (importedState && Array.isArray(importedState.images)) {
          setState(importedState);
        } else {
          alert("Invalid workspace file format.");
        }
      } catch {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    if (importInputRef.current) importInputRef.current.value = "";
  };

  // --- Download ZIP ---

  const downloadSingleImage = async (url: string, filename: string) => {
    const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(url)}`;
    const resp = await fetch(proxyUrl);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const downloadAllZip = async () => {
    const completed = state.images.filter((img) => img.generatedUrl);
    if (completed.length === 0) return;

    const zip = new JSZip();
    for (const img of completed) {
      const proxyUrl = `/api/mithril/s3/proxy?url=${encodeURIComponent(img.generatedUrl!)}`;
      const resp = await fetch(proxyUrl);
      const blob = await resp.blob();
      zip.file(`anime-bg-${img.id.slice(0, 8)}.png`, blob);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anime-bg-results.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Clear S3 session ---

  const clearSessionFiles = async () => {
    try {
      const res = await fetch("/api/anime-bg/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear files");
      setState({
        images: [],
        globalPrompt: DEFAULT_PROMPT,
        aspectRatio: "16:9",
        provider: state.provider,
      });
    } catch (error) {
      console.error("Failed to clear session files:", error);
      alert("Failed to clear session files from S3.");
    }
  };

  // --- Derived state ---

  const hasPendingImages = state.images.some(
    (img) => img.status === "idle" || img.status === "error"
  );
  const hasCompletedImages = state.images.some((img) => img.generatedUrl);

  // --- Sidebar content (shared between standalone and embedded) ---
  const sidebarControls = (
    <div className="space-y-4 text-zinc-200">
      {/* Provider Selector */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Provider
        </label>
        <select
          value={state.provider}
          onChange={(e) =>
            handleProviderChange(e.target.value as ImageProvider)
          }
          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#DB2777] transition-colors"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          {state.provider === "grok" ? "Grok" : "Gemini"} API Key (Optional)
        </label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Enter ${state.provider === "grok" ? "xAI" : "Gemini"} API key...`}
            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#DB2777] transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
          >
            {showApiKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Global Prompt */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Global Style Prompt
        </label>
        <textarea
          value={state.globalPrompt}
          onChange={(e) =>
            setState((prev) => ({ ...prev, globalPrompt: e.target.value }))
          }
          className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#DB2777] transition-colors resize-none h-24"
          placeholder="Enter global style instructions..."
        />
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Aspect Ratio
        </label>
        <select
          value={state.aspectRatio}
          onChange={(e) =>
            setState((prev) => ({
              ...prev,
              aspectRatio: e.target.value as AspectRatio,
            }))
          }
          className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#DB2777] transition-colors"
        >
          {ASPECT_RATIOS.map((ar) => (
            <option key={ar.value} value={ar.value}>
              {ar.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reference Image */}
      <div>
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Color/Style Reference (Optional)
        </label>
        {state.referenceImageDataUrl ? (
          <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-zinc-950">
            <img
              src={state.referenceImageDataUrl}
              alt="Reference"
              className="w-full h-32 object-contain opacity-80"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={removeReferenceImage}
                className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => refFileInputRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white hover:border-white/30 transition-colors bg-zinc-950"
          >
            <ImageIcon className="w-6 h-6" />
            <span className="text-sm">Upload Reference</span>
          </button>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={refFileInputRef}
          onChange={handleReferenceImageUpload}
        />
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-white/5 space-y-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-white/10"
        >
          <Upload className="w-4 h-4" />
          Add Images / ZIP
        </button>
        <input
          type="file"
          accept="image/*,.zip"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleTargetImagesUpload}
        />

        {isGeneratingAll ? (
          <button
            onClick={stopGenerating}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            Stop Generation
          </button>
        ) : (
          <button
            onClick={generateAll}
            disabled={state.images.length === 0 || !hasPendingImages}
            className="w-full py-3 bg-[#DB2777] hover:bg-[#BE185D] disabled:bg-[#DB2777]/40 disabled:text-white/50 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#DB2777]/20"
          >
            <Play className="w-4 h-4 fill-current" />
            Convert All Pending
          </button>
        )}

        {hasCompletedImages && (
          <button
            onClick={downloadAllZip}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-white/10"
          >
            <FileArchive className="w-4 h-4" />
            Download All as ZIP
          </button>
        )}
      </div>

      {/* Clear Session */}
      {state.images.length > 0 && (
        <button
          onClick={clearSessionFiles}
          disabled={isGeneratingAll}
          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear Session & S3 Files
        </button>
      )}
    </div>
  );

  return (
    <div className={`${embedded ? 'h-full' : 'min-h-screen'} bg-zinc-950 text-zinc-200 font-sans flex flex-col md:flex-row`}>
      {/* When embedded, render sidebar controls into the pipeline's left panel via portal */}
      {embedded && <StageSidebarPortal>{sidebarControls}</StageSidebarPortal>}

      {/* Sidebar — only rendered in standalone mode */}
      {!embedded && (
      <div className="w-full md:w-80 bg-zinc-900 border-r border-white/5 p-6 flex flex-col gap-5 shrink-0 overflow-y-auto h-screen sticky top-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#DB2777]" />
            Anime BG Studio
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Image-to-Anime Batch Converter
          </p>
          {!embedded && (
            <Link
              href="/tools/3d-screenshot"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-[#DB2777] transition-colors"
            >
              <Camera className="w-3 h-3" />
              3D Screenshot Tool
            </Link>
          )}
        </div>

        {sidebarControls}

        {/* Export / Import */}
        <div className="mt-auto pt-6 border-t border-white/5 flex gap-2">
          <button
            onClick={exportWorkspace}
            className="flex-1 py-2 bg-zinc-950 hover:bg-white/5 border border-white/10 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-3 h-3" /> Export
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="flex-1 py-2 bg-zinc-950 hover:bg-white/5 border border-white/10 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <UploadCloud className="w-3 h-3" /> Import
          </button>
          <input
            type="file"
            accept=".json"
            className="hidden"
            ref={importInputRef}
            onChange={importWorkspace}
          />
        </div>
      </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        {state.images.length === 0 ? (
          <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-zinc-500">
            <div className="w-24 h-24 mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <ImageIcon className="w-10 h-10 opacity-50" />
            </div>
            <h2 className="text-xl font-medium text-zinc-300 mb-2">
              Workspace is empty
            </h2>
            <p className="text-sm max-w-md text-center">
              Upload target background images from the sidebar to start
              converting them into anime style.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {state.images.map((img) => (
              <div
                key={img.id}
                className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col shadow-xl"
              >
                {/* Image Comparison */}
                <div className="grid grid-cols-2 bg-zinc-950 aspect-[2/1] relative">
                  <div className="relative border-r border-white/10">
                    <img
                      src={img.originalDataUrl}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-wider px-2 py-1 rounded text-white/80">
                      Original
                    </div>
                  </div>
                  <div className="relative bg-zinc-950/80 flex items-center justify-center">
                    {img.generatedUrl ? (
                      <img
                        src={img.generatedUrl}
                        alt="Generated"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-zinc-600 flex flex-col items-center gap-2">
                        {img.status === "generating" ? (
                          <>
                            <RefreshCw className="w-6 h-6 animate-spin text-[#DB2777]" />
                            <span className="text-xs">Generating...</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-6 h-6 opacity-30" />
                            <span className="text-xs">Pending</span>
                          </>
                        )}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-wider px-2 py-1 rounded text-white/80">
                      Result
                    </div>

                    {/* Status Overlays */}
                    {img.status === "error" && (
                      <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center p-4 text-center">
                        <div className="bg-red-500/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-md flex items-center gap-2 max-w-full">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {img.error || "Generation failed"}
                          </span>
                        </div>
                      </div>
                    )}
                    {img.status === "success" && (
                      <div className="absolute top-2 right-2 bg-emerald-500/90 text-white p-1 rounded-full backdrop-blur-md">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Controls */}
                <div className="p-4 flex flex-col gap-3">
                  <input
                    type="text"
                    value={img.prompt}
                    onChange={(e) =>
                      updateImage(img.id, { prompt: e.target.value })
                    }
                    placeholder="Custom prompt override (leave empty to use global)"
                    className="w-full bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-sm outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#DB2777] transition-colors"
                  />
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => removeImage(img.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex gap-2">
                      {img.generatedUrl && (
                        <button
                          onClick={() =>
                            downloadSingleImage(
                              img.generatedUrl!,
                              `anime-bg-${img.id.slice(0, 8)}.png`
                            )
                          }
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => generateImage(img.id)}
                        disabled={img.status === "generating"}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        {img.status === "generating" ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : img.generatedUrl ? (
                          <RefreshCw className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        {img.generatedUrl ? "Regenerate" : "Convert"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

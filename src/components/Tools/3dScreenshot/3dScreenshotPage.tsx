"use client";

import { useState, useCallback, useRef } from "react";
import { Camera, Plus, Loader2, Download, Upload, Paintbrush } from "lucide-react";
import Link from "next/link";
import type { ViewConfig, RenderResult } from "./types";
import ViewConfigRow from "./components/ViewConfigRow";

const DEFAULT_VIEW: Omit<ViewConfig, "id" | "label"> = {
  azimuth: 0, elevation: 0, fov: 75,
  offsetX: 0, offsetY: 0, offsetZ: 0,
};

const PRESETS: { label: string; views: Omit<ViewConfig, "id" | "label">[] }[] = [
  {
    label: "4 Cardinals",
    views: [
      { ...DEFAULT_VIEW, azimuth: 0 },
      { ...DEFAULT_VIEW, azimuth: 90 },
      { ...DEFAULT_VIEW, azimuth: 180 },
      { ...DEFAULT_VIEW, azimuth: -90 },
    ],
  },
  {
    label: "8 Compass",
    views: [0, 45, 90, 135, 180, -135, -90, -45].map((az) => ({ ...DEFAULT_VIEW, azimuth: az })),
  },
];

const RESOLUTIONS: { label: string; value: [number, number] }[] = [
  { label: "1920 × 1080", value: [1920, 1080] },
  { label: "1280 × 720", value: [1280, 720] },
  { label: "3840 × 2160", value: [3840, 2160] },
];

let nextId = 1;
function makeId() { return `view-${nextId++}`; }

function makeViews(configs: Omit<ViewConfig, "id" | "label">[]): ViewConfig[] {
  return configs.map((c, i) => ({ id: makeId(), label: `View ${i + 1}`, ...c }));
}

interface ThreeDScreenshotPageProps {
  embedded?: boolean;
  onScreenshotsReady?: (results: RenderResult[]) => void;
}

export default function ThreeDScreenshotPage({ embedded = false, onScreenshotsReady }: ThreeDScreenshotPageProps) {
  const [modelUrl, setModelUrl] = useState("");
  const [modelFileName, setModelFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [views, setViews] = useState<ViewConfig[]>(() => makeViews(PRESETS[0].views));
  const [results, setResults] = useState<RenderResult[]>([]);
  const [resolution, setResolution] = useState<[number, number]>([1920, 1080]);
  const [fixedExtent, setFixedExtent] = useState("");
  const [cameraMode, setCameraMode] = useState<"interior" | "environment">("interior");
  const [upAxis, setUpAxis] = useState<"y" | "-y" | "z" | "-z">("y");
  const [renderingViewId, setRenderingViewId] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedKeyRef = useRef<string | null>(null);

  const hasModel = Boolean(modelUrl.trim());

  const deleteUploadedFile = useCallback((key: string) => {
    fetch("/api/mithril/s3/presign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    }).catch(() => {}); // fire-and-forget
  }, []);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setIsUploading(true);
    setError(null);
    // Delete the previous uploaded file if any
    if (uploadedKeyRef.current) {
      deleteUploadedFile(uploadedKeyRef.current);
      uploadedKeyRef.current = null;
    }
    try {
      const key = `mithril/3d-screenshots/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const presignRes = await fetch("/api/mithril/s3/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, contentType: "application/octet-stream" }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error || "Failed to get upload URL");

      const uploadRes = await fetch(presignData.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload file to S3");

      uploadedKeyRef.current = key;
      setModelFileName(file.name);
      setModelUrl(presignData.fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [deleteUploadedFile]);

  const applyPreset = useCallback((preset: (typeof PRESETS)[number]) => {
    setViews(makeViews(preset.views));
    setResults([]);
  }, []);

  const addView = useCallback(() => {
    setViews((prev) => [
      ...prev,
      { id: makeId(), label: `View ${prev.length + 1}`, ...DEFAULT_VIEW },
    ]);
  }, []);

  const updateView = useCallback((updated: ViewConfig) => {
    setViews((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }, []);

  const deleteView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
    setResults((prev) => prev.filter((r) => r.viewId !== id));
  }, []);

  const renderPayload = useCallback((view: ViewConfig) => ({
    modelUrl: modelUrl.trim(),
    modelFormat: "3dgs",
    cameraMode,
    upAxis,
    azimuth: view.azimuth,
    elevation: view.elevation,
    fov: view.fov,
    interiorOffsetX: view.offsetX,
    interiorOffsetY: view.offsetY,
    interiorOffsetZ: view.offsetZ,
    resolution,
    maxGaussians: 500000,
    fixedExtent: fixedExtent ? parseFloat(fixedExtent) : undefined,
    outputMode: "direct",
  }), [modelUrl, resolution, fixedExtent, upAxis, cameraMode]);

  const renderSingle = useCallback(async (viewId: string) => {
    if (!hasModel || isRendering) return;
    const view = views.find((v) => v.id === viewId);
    if (!view) return;
    setIsRendering(true);
    setRenderingViewId(viewId);
    setError(null);
    try {
      const res = await fetch("/api/render-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(renderPayload(view)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `View "${view.label}" failed`);
      setResults((prev) => [
        ...prev.filter((r) => r.viewId !== viewId),
        { viewId, image: data.image, cameraParams: data.cameraParams },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rendering failed");
    } finally {
      setIsRendering(false);
      setRenderingViewId(null);
    }
  }, [hasModel, isRendering, views, renderPayload]);

  const renderAll = useCallback(async () => {
    if (!hasModel || views.length === 0) return;
    setIsRendering(true);
    setError(null);
    setResults([]);

    const newResults: RenderResult[] = [];

    try {
      for (const view of views) {
        setRenderingViewId(view.id);
        const res = await fetch("/api/render-3d", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(renderPayload(view)),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `View "${view.label}" failed`);

        newResults.push({
          viewId: view.id,
          image: data.image,
          cameraParams: data.cameraParams,
        });
        setResults([...newResults]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rendering failed");
    } finally {
      setIsRendering(false);
      setRenderingViewId(null);
      // Clean up temporary S3 file — all views rendered, it's no longer needed
      if (uploadedKeyRef.current) {
        deleteUploadedFile(uploadedKeyRef.current);
        uploadedKeyRef.current = null;
      }
    }
  }, [hasModel, views, renderPayload, deleteUploadedFile]);

  const getTimestamp = () => {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
      "_",
      String(d.getHours()).padStart(2, "0"),
      String(d.getMinutes()).padStart(2, "0"),
      String(d.getSeconds()).padStart(2, "0"),
    ].join("");
  };

  const downloadImage = useCallback((dataUri: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = filename;
    a.click();
  }, []);

  const downloadAll = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const ts = getTimestamp();
    results.forEach((r) => {
      const view = views.find((v) => v.id === r.viewId);
      const label = view?.label?.replace(/\s+/g, "_") || r.viewId;
      const base64 = r.image.split(",")[1];
      zip.file(`3d-shot-${label}_${ts}.png`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `3d-screenshots_${ts}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }, [results, views]);

  return (
    <div className={`${embedded ? 'h-full overflow-y-auto' : 'min-h-screen'} bg-zinc-950 text-zinc-100`}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-[#DB2777]" />
            <h1 className="text-lg font-semibold">3D Scene Screenshot</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">Mode</span>
              <select
                value={cameraMode}
                onChange={(e) => setCameraMode(e.target.value as typeof cameraMode)}
                className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-300 outline-none focus:ring-0 focus:ring-offset-0"
              >
                <option value="interior">Interior</option>
                <option value="environment">Environment</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500">Up</span>
              <select
                value={upAxis}
                onChange={(e) => setUpAxis(e.target.value as typeof upAxis)}
                className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-300 outline-none focus:ring-0 focus:ring-offset-0"
              >
                <option value="y">+Y</option>
                <option value="-y">-Y</option>
                <option value="z">+Z</option>
                <option value="-z">-Z</option>
              </select>
            </div>

            <select
              value={`${resolution[0]}x${resolution[1]}`}
              onChange={(e) => {
                const r = RESOLUTIONS.find((r) => `${r.value[0]}x${r.value[1]}` === e.target.value);
                if (r) setResolution(r.value);
              }}
              className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-300 outline-none focus:ring-0 focus:ring-offset-0"
            >
              {RESOLUTIONS.map((r) => (
                <option key={`${r.value[0]}x${r.value[1]}`} value={`${r.value[0]}x${r.value[1]}`}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Model Source */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            3D Scene Source (.spz)
          </h2>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".spz,.ply"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100 disabled:opacity-50 disabled:pointer-events-none transition-colors shrink-0"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Upload</>
              )}
            </button>
            <span className="flex-1 truncate text-sm font-mono text-[#DB2777]">
              {modelFileName
                ? modelFileName
                : modelUrl
                  ? modelUrl
                  : <span className="text-zinc-600">No file selected</span>}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <label className="text-xs text-zinc-500 shrink-0">Fixed Extent</label>
            <input
              type="text"
              inputMode="decimal"
              value={fixedExtent}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || /^\d*\.?\d*$/.test(v)) setFixedExtent(v);
              }}
              placeholder="Auto (use model's dense region)"
              className="flex-1 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:ring-0 focus:ring-offset-0"
            />
            {fixedExtent && (
              <button
                onClick={() => setFixedExtent("")}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* View Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Camera Views ({views.length})
            </h2>
            <div className="flex gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 text-xs rounded-md border border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {views.map((view, i) => (
              <div key={view.id} className="relative">
                <ViewConfigRow
                  view={view}
                  index={i}
                  canDelete={views.length > 1}
                  hasResult={Boolean(results.find((r) => r.viewId === view.id))}
                  isRendering={renderingViewId === view.id}
                  canRender={hasModel && !isRendering}
                  onChange={updateView}
                  onDelete={() => deleteView(view.id)}
                  onRender={() => renderSingle(view.id)}
                />
                {renderingViewId === view.id && (
                  <div className="absolute inset-0 rounded-lg bg-[#DB2777]/10 border border-[#DB2777]/40 pointer-events-none" />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addView}
              disabled={false}
              className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Plus className="w-3 h-3 mr-1.5" />
              Add View
            </button>

            <button
              onClick={renderAll}
              disabled={!hasModel || views.length === 0 || isRendering}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-4 bg-[#DB2777] text-white hover:bg-[#BE185D] disabled:opacity-50 disabled:pointer-events-none transition-colors ml-auto"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rendering {results.length + 1}/{views.length}...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Render All
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md border border-red-900/50 bg-red-950/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Screenshots ({results.length}/{views.length})
              </h2>
              <div className="flex gap-2">
                {results.length > 0 && (
                  <button
                    onClick={downloadAll}
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 transition-colors"
                  >
                    <Download className="w-3 h-3 mr-1.5" />
                    Download All
                  </button>
                )}
                {onScreenshotsReady ? (
                  <button
                    onClick={() => onScreenshotsReady(results)}
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 bg-[#DB2777] text-white hover:bg-[#BE185D] transition-colors"
                  >
                    <Paintbrush className="w-3 h-3 mr-1.5" />
                    Send to Workspace
                  </button>
                ) : (
                  <Link
                    href="/tools/anime-bg-studio"
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 bg-[#DB2777] text-white hover:bg-[#BE185D] transition-colors"
                  >
                    <Paintbrush className="w-3 h-3 mr-1.5" />
                    Open Anime BG Studio
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => {
                const view = views.find((v) => v.id === result.viewId);
                const label = view?.label || result.viewId;
                return (
                  <div
                    key={result.viewId}
                    className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 overflow-hidden"
                  >
                    <div className="aspect-video bg-zinc-950 relative group">
                      <img
                        src={result.image}
                        alt={label}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() =>
                          downloadImage(result.image, `3d-shot-${label.replace(/\s+/g, "_")}_${getTimestamp()}.png`)
                        }
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-900/80 text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-200">{label}</span>
                      <span className="text-xs text-zinc-500 font-mono">
                        az:{result.cameraParams?.azimuth} el:{result.cameraParams?.elevation} fov:{result.cameraParams?.fov}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isRendering && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
            <Camera className="w-12 h-12 opacity-30" />
            <p className="text-sm">
              {hasModel
                ? "Configure views and click Render All"
                : "Upload a .spz file or paste a URL to start"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback, useRef } from "react";
import { Camera, Plus, Loader2, Download, Upload } from "lucide-react";
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

export default function ThreeDScreenshotPage() {
  const [modelUrl, setModelUrl] = useState("");
  const [modelData, setModelData] = useState<string | null>(null);
  const [modelFileName, setModelFileName] = useState<string | null>(null);
  const [views, setViews] = useState<ViewConfig[]>(() => makeViews(PRESETS[0].views));
  const [results, setResults] = useState<RenderResult[]>([]);
  const [resolution, setResolution] = useState<[number, number]>([1920, 1080]);
  const [fixedExtent, setFixedExtent] = useState("");
  const [renderingViewId, setRenderingViewId] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasModel = Boolean(modelUrl.trim() || modelData);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setModelFileName(file.name);
    setModelUrl("");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setModelData(dataUri.split(",")[1]);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setModelUrl(url);
    setModelData(null);
    setModelFileName(null);
  }, []);

  const applyPreset = useCallback((preset: (typeof PRESETS)[number]) => {
    setViews(makeViews(preset.views));
    setResults([]);
  }, []);

  const addView = useCallback(() => {
    if (views.length >= 12) return;
    setViews((prev) => [
      ...prev,
      { id: makeId(), label: `View ${prev.length + 1}`, ...DEFAULT_VIEW },
    ]);
  }, [views.length]);

  const updateView = useCallback((updated: ViewConfig) => {
    setViews((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }, []);

  const deleteView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
    setResults((prev) => prev.filter((r) => r.viewId !== id));
  }, []);

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
          body: JSON.stringify({
            modelUrl: modelData ? "" : modelUrl.trim(),
            modelData: modelData || undefined,
            modelFormat: "3dgs",
            cameraMode: "interior",
            upAxis: "-y",
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
          }),
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
    }
  }, [hasModel, views, modelUrl, modelData, resolution, fixedExtent]);

  const downloadImage = useCallback((dataUri: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = filename;
    a.click();
  }, []);

  const downloadAll = useCallback(async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    results.forEach((r) => {
      const view = views.find((v) => v.id === r.viewId);
      const label = view?.label?.replace(/\s+/g, "_") || r.viewId;
      const base64 = r.image.split(",")[1];
      zip.file(`3d-shot-${label}.png`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "3d-screenshots.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [results, views]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-[#DB2777]" />
            <h1 className="text-lg font-semibold">3D Scene Screenshot</h1>
          </div>

          <select
            value={`${resolution[0]}x${resolution[1]}`}
            onChange={(e) => {
              const r = RESOLUTIONS.find((r) => `${r.value[0]}x${r.value[1]}` === e.target.value);
              if (r) setResolution(r.value);
            }}
            className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
          >
            {RESOLUTIONS.map((r) => (
              <option key={`${r.value[0]}x${r.value[1]}`} value={`${r.value[0]}x${r.value[1]}`}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Model Source */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            3D Scene Source (.spz)
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={modelUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste .spz URL..."
              className="flex-1 h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept=".spz,.ply"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </button>
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
              className="flex-1 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
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
          {modelFileName && (
            <p className="text-xs text-[#DB2777] font-mono">{modelFileName}</p>
          )}
        </div>

        {/* View Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Camera Views ({views.length}/12)
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
                  onChange={updateView}
                  onDelete={() => deleteView(view.id)}
                />
                {renderingViewId === view.id && (
                  <div className="absolute inset-0 rounded-lg bg-[#DB2777]/10 border border-[#DB2777]/40 flex items-center justify-center pointer-events-none">
                    <Loader2 className="w-4 h-4 text-[#DB2777] animate-spin" />
                  </div>
                )}
                {results.find((r) => r.viewId === view.id) && renderingViewId !== view.id && (
                  <div className="absolute right-3 top-3 w-2 h-2 rounded-full bg-green-500 pointer-events-none" />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={addView}
              disabled={views.length >= 12}
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
              {results.length === views.length && (
                <button
                  onClick={downloadAll}
                  className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 transition-colors"
                >
                  <Download className="w-3 h-3 mr-1.5" />
                  Download All
                </button>
              )}
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
                          downloadImage(result.image, `3d-shot-${label.replace(/\s+/g, "_")}.png`)
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

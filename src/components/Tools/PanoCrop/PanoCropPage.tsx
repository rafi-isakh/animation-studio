"use client";

import { useState, useCallback, useRef } from "react";
import {
  Plus,
  Loader2,
  Download,
  Upload,
  Scissors,
  Image as ImageIcon,
} from "lucide-react";
import type { ViewConfig, CropResult } from "./types";
import ViewConfigRow from "./components/ViewConfigRow";

const PRESETS: { label: string; views: Omit<ViewConfig, "id" | "label">[] }[] =
  [
    {
      label: "4 Cardinals",
      views: [
        { azimuth: 0, elevation: 0, fov: 90 },
        { azimuth: 90, elevation: 0, fov: 90 },
        { azimuth: 180, elevation: 0, fov: 90 },
        { azimuth: -90, elevation: 0, fov: 90 },
      ],
    },
    {
      label: "6 Around",
      views: [
        { azimuth: 0, elevation: 0, fov: 90 },
        { azimuth: 60, elevation: 0, fov: 90 },
        { azimuth: 120, elevation: 0, fov: 90 },
        { azimuth: 180, elevation: 0, fov: 90 },
        { azimuth: -120, elevation: 0, fov: 90 },
        { azimuth: -60, elevation: 0, fov: 90 },
      ],
    },
    {
      label: "8 Compass",
      views: [
        { azimuth: 0, elevation: 0, fov: 90 },
        { azimuth: 45, elevation: 0, fov: 90 },
        { azimuth: 90, elevation: 0, fov: 90 },
        { azimuth: 135, elevation: 0, fov: 90 },
        { azimuth: 180, elevation: 0, fov: 90 },
        { azimuth: -135, elevation: 0, fov: 90 },
        { azimuth: -90, elevation: 0, fov: 90 },
        { azimuth: -45, elevation: 0, fov: 90 },
      ],
    },
  ];

const RESOLUTIONS: { label: string; value: [number, number] }[] = [
  { label: "1920 x 1080", value: [1920, 1080] },
  { label: "1280 x 720", value: [1280, 720] },
  { label: "3840 x 2160", value: [3840, 2160] },
];

let nextId = 1;
function makeId() {
  return `view-${nextId++}`;
}

function makeViews(
  configs: Omit<ViewConfig, "id" | "label">[]
): ViewConfig[] {
  return configs.map((c, i) => ({
    id: makeId(),
    label: `View ${i + 1}`,
    ...c,
  }));
}

export default function PanoCropPage() {
  const [panoUrl, setPanoUrl] = useState("");
  const [panoData, setPanoData] = useState<string | null>(null);
  const [panoPreview, setPanoPreview] = useState<string | null>(null);
  const [views, setViews] = useState<ViewConfig[]>(() =>
    makeViews(PRESETS[0].views)
  );
  const [results, setResults] = useState<CropResult[]>([]);
  const [resolution, setResolution] = useState<[number, number]>([1920, 1080]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPano = Boolean(panoUrl || panoData);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUri = reader.result as string;
        setPanoPreview(dataUri);
        // Extract raw base64 (remove data:...;base64, prefix)
        const base64 = dataUri.split(",")[1];
        setPanoData(base64);
        setPanoUrl("");
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    []
  );

  const handleUrlChange = useCallback((url: string) => {
    setPanoUrl(url);
    setPanoData(null);
    setPanoPreview(url || null);
  }, []);

  const applyPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      setViews(makeViews(preset.views));
      setResults([]);
    },
    []
  );

  const addView = useCallback(() => {
    if (views.length >= 12) return;
    setViews((prev) => [
      ...prev,
      {
        id: makeId(),
        label: `View ${prev.length + 1}`,
        azimuth: 0,
        elevation: 0,
        fov: 90,
      },
    ]);
  }, [views.length]);

  const updateView = useCallback((updated: ViewConfig) => {
    setViews((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }, []);

  const deleteView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id));
    setResults((prev) => prev.filter((r) => r.viewId !== id));
  }, []);

  const extractAll = useCallback(async () => {
    if (!hasPano || views.length === 0) return;
    setIsExtracting(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/tools/pano-crop/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panoUrl: panoUrl || undefined,
          panoData: panoData || undefined,
          views: views.map((v) => ({
            azimuth: v.azimuth,
            elevation: v.elevation,
            fov: v.fov,
          })),
          resolution,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");

      const newResults: CropResult[] = views.map((v, i) => ({
        viewId: v.id,
        image: data.images[i],
        cameraParams: data.cameraParams[i],
      }));
      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  }, [hasPano, panoUrl, panoData, views, resolution]);

  const downloadImage = useCallback((dataUri: string, filename: string) => {
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = filename;
    a.click();
  }, []);

  const downloadAll = useCallback(() => {
    results.forEach((r) => {
      const view = views.find((v) => v.id === r.viewId);
      const label = view?.label?.replace(/\s+/g, "_") || r.viewId;
      downloadImage(r.image, `pano-crop-${label}.png`);
    });
  }, [results, views, downloadImage]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scissors className="w-5 h-5 text-[#DB2777]" />
            <h1 className="text-lg font-semibold">Panorama Crop</h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={`${resolution[0]}x${resolution[1]}`}
              onChange={(e) => {
                const r = RESOLUTIONS.find(
                  (r) => `${r.value[0]}x${r.value[1]}` === e.target.value
                );
                if (r) setResolution(r.value);
              }}
              className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
            >
              {RESOLUTIONS.map((r) => (
                <option
                  key={`${r.value[0]}x${r.value[1]}`}
                  value={`${r.value[0]}x${r.value[1]}`}
                >
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Panorama Source */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Panorama Source
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={panoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste panorama URL..."
              className="flex-1 h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
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

          {panoPreview && (
            <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
              <img
                src={panoPreview}
                alt="Panorama preview"
                className="w-full h-auto max-h-48 object-cover"
              />
            </div>
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
              <ViewConfigRow
                key={view.id}
                view={view}
                index={i}
                canDelete={views.length > 1}
                onChange={updateView}
                onDelete={() => deleteView(view.id)}
              />
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
              onClick={extractAll}
              disabled={!hasPano || views.length === 0 || isExtracting}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-4 bg-[#DB2777] text-white hover:bg-[#BE185D] disabled:opacity-50 disabled:pointer-events-none transition-colors ml-auto"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4 mr-2" />
                  Extract All
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
                Extracted Views ({results.length})
              </h2>
              <button
                onClick={downloadAll}
                className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300 transition-colors"
              >
                <Download className="w-3 h-3 mr-1.5" />
                Download All
              </button>
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
                          downloadImage(
                            result.image,
                            `pano-crop-${label.replace(/\s+/g, "_")}.png`
                          )
                        }
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-900/80 text-zinc-300 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="px-3 py-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-200">
                        {label}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">
                        az:{result.cameraParams.azimuth} el:
                        {result.cameraParams.elevation} fov:
                        {result.cameraParams.fov}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !isExtracting && (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600 gap-3">
            <ImageIcon className="w-12 h-12 opacity-30" />
            <p className="text-sm">
              {hasPano
                ? "Configure views and click Extract All"
                : "Upload a panorama or paste a URL to start"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

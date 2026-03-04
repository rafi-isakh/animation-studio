"use client";

import { useState } from "react";

type OutputMode = "direct" | "ai_enhanced";
type CameraMode = "exterior" | "interior";

interface CameraParams {
  azimuth: number;
  elevation: number;
  distanceMultiplier: number;
  fov: number;
  tilt: number;
  cameraMode: CameraMode;
  interiorOffsetX: number;
  interiorOffsetY: number;
  interiorOffsetZ: number;
}

interface RenderEntry {
  image: string;
  params: CameraParams;
  timestamp: number;
}

export default function ThreeDBackgroundTestPage() {
  const [modelUrl, setModelUrl] = useState("");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localFileData, setLocalFileData] = useState<string | null>(null); // base64
  const [azimuth, setAzimuth] = useState(0);
  const [elevation, setElevation] = useState(30);
  const [distanceMultiplier, setDistanceMultiplier] = useState(2.5);
  const [fov, setFov] = useState(45);
  const [tilt, setTilt] = useState(0);
  const [interiorOffsetX, setInteriorOffsetX] = useState(0);
  const [interiorOffsetY, setInteriorOffsetY] = useState(0);
  const [interiorOffsetZ, setInteriorOffsetZ] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>("exterior");
  const [outputMode, setOutputMode] = useState<OutputMode>("direct");
  const [stylePrompt, setStylePrompt] = useState(
    "Transform this 3D render into a polished anime-style animation background. Maintain the exact camera angle and composition."
  );
  const [apiKey, setApiKey] = useState("");
  const [resolution, setResolution] = useState<[number, number]>([1920, 1080]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [history, setHistory] = useState<RenderEntry[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalFile(file);
    setLocalFileData(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      // result is "data:application/octet-stream;base64,XXXX" — strip the prefix
      const result = ev.target?.result as string;
      const base64 = result.split(",")[1];
      setLocalFileData(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRender = async () => {
    const usingLocalFile = localFile !== null;
    if (!usingLocalFile && !modelUrl.trim()) {
      setError("Please enter a .glb model URL or select a local file");
      return;
    }
    if (usingLocalFile && !localFileData) {
      setError("File is still loading, please wait a moment");
      return;
    }
    if (outputMode === "ai_enhanced" && !apiKey.trim()) {
      setError("API key is required for AI Enhanced mode");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/render-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelUrl: localFile ? "" : modelUrl.trim(),
          modelData: localFile ? localFileData : undefined,
          azimuth,
          elevation,
          distanceMultiplier,
          fov,
          tilt,
          cameraMode,
          interiorOffsetX,
          interiorOffsetY,
          interiorOffsetZ,
          resolution,
          outputMode,
          stylePrompt: outputMode === "ai_enhanced" ? stylePrompt : undefined,
          apiKey: outputMode === "ai_enhanced" ? apiKey : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || `Request failed with status ${res.status}`
        );
      }

      setCurrentImage(data.image);
      setHistory((prev) => [
        {
          image: data.image,
          params: { azimuth, elevation, distanceMultiplier, fov, tilt, cameraMode, interiorOffsetX, interiorOffsetY, interiorOffsetZ },
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (entry: RenderEntry) => {
    setAzimuth(entry.params.azimuth);
    setElevation(entry.params.elevation);
    setDistanceMultiplier(entry.params.distanceMultiplier);
    setFov(entry.params.fov);
    setTilt(entry.params.tilt);
    setInteriorOffsetX(entry.params.interiorOffsetX);
    setInteriorOffsetY(entry.params.interiorOffsetY);
    setInteriorOffsetZ(entry.params.interiorOffsetZ);
    setCameraMode(entry.params.cameraMode);
    setCurrentImage(entry.image);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">3D Background Renderer</h1>
        <p className="text-gray-400 text-sm mb-6">
          Experimental — Render camera views from a .glb 3D model
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: Controls */}
          <div className="bg-gray-900 rounded-lg p-5 space-y-4 h-fit">
            {/* Model source */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                3D Model (.glb)
              </label>

              {/* Local file */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Local file</label>
                <input
                  type="file"
                  accept=".glb"
                  onChange={handleFileChange}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {localFile && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {localFileData ? `✓ ${localFile.name} (${(localFile.size / 1024).toFixed(0)} KB)` : `Loading ${localFile.name}...`}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-xs text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>

              {/* URL */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">URL (S3 / CDN)</label>
                <input
                  type="text"
                  value={modelUrl}
                  onChange={(e) => { setModelUrl(e.target.value); if (e.target.value) { setLocalFile(null); setLocalFileData(null); } }}
                  placeholder="https://cdn.example.com/model.glb"
                  disabled={!!localFile}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
                />
              </div>
            </div>

            {/* Camera Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Camera Mode
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setCameraMode("exterior")}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    cameraMode === "exterior"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Exterior
                </button>
                <button
                  onClick={() => setCameraMode("interior")}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    cameraMode === "interior"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Interior
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {cameraMode === "exterior"
                  ? "Camera orbits outside the model looking in"
                  : "Camera is inside the model looking outward"}
              </p>
            </div>

            {/* Camera Controls */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300">
                Camera Parameters
              </h3>

              {/* Azimuth */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Azimuth (horizontal)</span>
                  <span>{azimuth}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={5}
                  value={azimuth}
                  onChange={(e) => setAzimuth(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Elevation */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Elevation (vertical)</span>
                  <span>{elevation}°</span>
                </div>
                <input
                  type="range"
                  min={-80}
                  max={80}
                  step={5}
                  value={elevation}
                  onChange={(e) => setElevation(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Distance (exterior only) */}
              {cameraMode === "exterior" && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Distance</span>
                    <span>{distanceMultiplier.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={10}
                    step={0.1}
                    value={distanceMultiplier}
                    onChange={(e) =>
                      setDistanceMultiplier(Number(e.target.value))
                    }
                    className="w-full accent-blue-500"
                  />
                </div>
              )}

              {/* FOV */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Field of View</span>
                  <span>{fov}°</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={5}
                  value={fov}
                  onChange={(e) => setFov(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Tilt */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Tilt (roll / Dutch angle)</span>
                  <span>{tilt}°</span>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={5}
                  value={tilt}
                  onChange={(e) => setTilt(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Interior position offsets (interior mode only) */}
              {cameraMode === "interior" && (
                <div className="space-y-2 pt-1 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    Camera position offset (fraction of model size)
                  </p>
                  {(
                    [
                      ["Offset X (left/right)", interiorOffsetX, setInteriorOffsetX],
                      ["Offset Y (up/down)", interiorOffsetY, setInteriorOffsetY],
                      ["Offset Z (forward/back)", interiorOffsetZ, setInteriorOffsetZ],
                    ] as [string, number, (v: number) => void][]
                  ).map(([label, value, setter]) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{label}</span>
                        <span>{value.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.05}
                        value={value}
                        onChange={(e) => setter(Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => { setInteriorOffsetX(0); setInteriorOffsetY(0); setInteriorOffsetZ(0); }}
                    className="text-xs text-gray-500 hover:text-gray-300 underline"
                  >
                    Reset to center
                  </button>
                </div>
              )}
            </div>

            {/* Resolution */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Resolution
              </label>
              <select
                value={`${resolution[0]}x${resolution[1]}`}
                onChange={(e) => {
                  const [w, h] = e.target.value.split("x").map(Number);
                  setResolution([w, h]);
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1920x1080">1920 x 1080</option>
                <option value="1280x720">1280 x 720</option>
                <option value="960x540">960 x 540</option>
              </select>
            </div>

            {/* Output Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Output Mode
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setOutputMode("direct")}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    outputMode === "direct"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  Direct
                </button>
                <button
                  onClick={() => setOutputMode("ai_enhanced")}
                  className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    outputMode === "ai_enhanced"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  AI Enhanced
                </button>
              </div>
            </div>

            {/* AI Enhanced options */}
            {outputMode === "ai_enhanced" && (
              <div className="space-y-3 pl-3 border-l-2 border-blue-600/30">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Style Prompt
                  </label>
                  <textarea
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                    rows={2}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Render Button */}
            <button
              onClick={handleRender}
              disabled={isLoading || (!modelUrl.trim() && !localFile)}
              className="w-full px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md text-sm font-medium transition-colors"
            >
              {isLoading ? "Rendering..." : "Render"}
            </button>

            {/* Error */}
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-md p-3">
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}
          </div>

          {/* Right: Output */}
          <div className="space-y-4">
            {/* Current render */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center aspect-video">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-gray-400 text-sm">Rendering...</p>
                  </div>
                </div>
              ) : currentImage ? (
                <img
                  src={currentImage}
                  alt="3D Render"
                  className="w-full aspect-video object-contain bg-black"
                />
              ) : (
                <div className="flex items-center justify-center aspect-video text-gray-600 text-sm">
                  Adjust camera parameters and click Render
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  History ({history.length})
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {history.map((entry, i) => (
                    <button
                      key={entry.timestamp}
                      onClick={() => loadFromHistory(entry)}
                      className="bg-gray-900 rounded overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      <img
                        src={entry.image}
                        alt={`Render ${i + 1}`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="px-1.5 py-1">
                        <p className="text-[10px] text-gray-500 font-mono truncate">
                          {entry.params.cameraMode === "interior" ? "IN" : "EX"}{" "}
                          Az {entry.params.azimuth}° El {entry.params.elevation}°
                          {entry.params.cameraMode === "exterior" &&
                            ` D ${entry.params.distanceMultiplier.toFixed(1)}x`}
                          {entry.params.tilt !== 0 && ` T ${entry.params.tilt}°`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

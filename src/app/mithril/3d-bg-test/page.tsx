"use client";

import { useState } from "react";

type OutputMode = "direct" | "ai_enhanced";
type CameraMode = "exterior" | "interior" | "absolute" | "environment";
type ModelFormat = "auto" | "glb" | "3dgs";
type UpAxis = "auto" | "y" | "-y" | "z" | "-z";

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
  const [modelFormat, setModelFormat] = useState<ModelFormat>("auto");
  const [maxGaussians, setMaxGaussians] = useState(200000);
  const [azimuth, setAzimuth] = useState(0);
  const [elevation, setElevation] = useState(30);
  const [distanceMultiplier, setDistanceMultiplier] = useState(2.5);
  const [fov, setFov] = useState(45);
  const [tilt, setTilt] = useState(0);
  const [interiorOffsetX, setInteriorOffsetX] = useState(0);
  const [interiorOffsetY, setInteriorOffsetY] = useState(0);
  const [interiorOffsetZ, setInteriorOffsetZ] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>("exterior");
  const [eyeX, setEyeX] = useState(0);
  const [eyeY, setEyeY] = useState(0);
  const [eyeZ, setEyeZ] = useState(0);
  const [upAxis, setUpAxis] = useState<UpAxis>("auto");
  const [lookAtCenter, setLookAtCenter] = useState(true);
  const [outputMode, setOutputMode] = useState<OutputMode>("direct");
  const [stylePrompt, setStylePrompt] = useState(
    "Transform this 3D render into a polished anime-style animation background. Maintain the exact camera angle and composition."
  );
  const [apiKey, setApiKey] = useState("");
  const [resolution, setResolution] = useState<[number, number]>([1920, 1080]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [sceneInfo, setSceneInfo] = useState<Record<string, number[]> | null>(null);
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
          modelFormat,
          maxGaussians,
          azimuth,
          elevation,
          distanceMultiplier,
          fov,
          tilt,
          cameraMode,
          upAxis,
          eye: cameraMode === "absolute" ? [eyeX, eyeY, eyeZ] : undefined,
          lookAtCenter: cameraMode === "absolute" ? lookAtCenter : undefined,
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
      setSceneInfo(data.sceneInfo ?? null);
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
                  accept=".glb,.ply,.splat,.spz"
                  onChange={(e) => {
                    handleFileChange(e);
                    const name = e.target.files?.[0]?.name?.toLowerCase() ?? "";
                    if (name.endsWith(".ply") || name.endsWith(".splat") || name.endsWith(".spz")) setModelFormat("3dgs");
                    else if (name.endsWith(".glb")) setModelFormat("glb");
                    else setModelFormat("auto");
                  }}
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

            {/* Model Format */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Model Format
              </label>
              <div className="flex gap-1">
                {(["auto", "glb", "3dgs"] as ModelFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setModelFormat(f)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      modelFormat === f
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {f === "auto" ? "Auto" : f === "glb" ? "GLB" : "3DGS (.ply/.spz)"}
                  </button>
                ))}
              </div>
              {modelFormat === "3dgs" && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Max Gaussians (speed vs quality)</span>
                    <span>{maxGaussians.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={50000}
                    max={500000}
                    step={50000}
                    value={maxGaussians}
                    onChange={(e) => setMaxGaussians(Number(e.target.value))}
                    className="w-full accent-green-500"
                  />
                  <p className="text-xs text-gray-600 mt-0.5">
                    Lower = faster (CPU rendering ~20-60 s)
                  </p>
                </div>
              )}
            </div>

            {/* Camera Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Camera Mode
              </label>
              <div className="flex gap-1 flex-wrap">
                {(["exterior", "interior", "environment", "absolute"] as CameraMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCameraMode(mode)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      cameraMode === mode
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {mode === "environment" ? "Environ." : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {cameraMode === "exterior"
                  ? "Camera orbits outside the model looking in"
                  : cameraMode === "interior"
                  ? "Camera is inside the model looking outward"
                  : cameraMode === "environment"
                  ? "Ground-level camera for outdoor scenes (auto-detects ground plane)"
                  : "Raw XYZ camera position (paste from SuperSplat)"}
              </p>

              {/* Absolute eye position inputs */}
              {cameraMode === "absolute" && (
                <div className="space-y-2 mt-2 pt-2 border-t border-gray-700">
                  <p className="text-xs text-gray-500">
                    Camera position (world coordinates)
                  </p>
                  {([
                    ["X", eyeX, setEyeX],
                    ["Y", eyeY, setEyeY],
                    ["Z", eyeZ, setEyeZ],
                  ] as [string, number, (v: number) => void][]).map(([label, value, setter]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-4">{label}</span>
                      <input
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => setter(Number(e.target.value))}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}

                  {/* Look at Center toggle */}
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={lookAtCenter}
                      onChange={(e) => setLookAtCenter(e.target.checked)}
                      className="accent-blue-500"
                    />
                    <span className="text-xs text-gray-400">
                      Look at scene center {lookAtCenter ? "(ignores azimuth/elevation)" : "(uses azimuth/elevation for direction)"}
                    </span>
                  </label>

                  {/* Quick position buttons (show after first render with scene info) */}
                  {sceneInfo && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">Quick positions</p>
                      <div className="grid grid-cols-4 gap-1">
                        {(() => {
                          const dc = sceneInfo.center;
                          const dmin = sceneInfo.dense_min;
                          const dmax = sceneInfo.dense_max;
                          return [
                            { label: "Center", pos: dc },
                            { label: "+X edge", pos: [dmax[0], dc[1], dc[2]] },
                            { label: "-X edge", pos: [dmin[0], dc[1], dc[2]] },
                            { label: "+Y edge", pos: [dc[0], dmax[1], dc[2]] },
                            { label: "-Y edge", pos: [dc[0], dmin[1], dc[2]] },
                            { label: "+Z edge", pos: [dc[0], dc[1], dmax[2]] },
                            { label: "-Z edge", pos: [dc[0], dc[1], dmin[2]] },
                            { label: "+X mid", pos: [(dc[0] + dmax[0]) / 2, dc[1], dc[2]] },
                            { label: "-X mid", pos: [(dc[0] + dmin[0]) / 2, dc[1], dc[2]] },
                            { label: "+Z mid", pos: [dc[0], dc[1], (dc[2] + dmax[2]) / 2] },
                            { label: "-Z mid", pos: [dc[0], dc[1], (dc[2] + dmin[2]) / 2] },
                          ];
                        })().map(({ label, pos }) => (
                          <button
                            key={label}
                            onClick={() => { setEyeX(Math.round(pos[0] * 100) / 100); setEyeY(Math.round(pos[1] * 100) / 100); setEyeZ(Math.round(pos[2] * 100) / 100); }}
                            className="px-1.5 py-1 rounded text-[10px] bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Up Axis — only relevant for 3DGS */}
            {modelFormat === "3dgs" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Up Axis
                </label>
                <div className="flex gap-1">
                  {(["auto", "y", "-y", "z", "-z"] as UpAxis[]).map((axis) => (
                    <button
                      key={axis}
                      onClick={() => setUpAxis(axis)}
                      className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                        upAxis === axis
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {axis === "auto" ? "Auto" : axis.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {upAxis === "auto"
                    ? "Guessed from bounding box — try other options if scene is flipped"
                    : upAxis === "y"
                    ? "Y-up (OpenGL / COLMAP convention)"
                    : upAxis === "-y"
                    ? "-Y up (inverted Y — try if Y is upside down)"
                    : upAxis === "z"
                    ? "Z-up (Blender convention)"
                    : "-Z up (inverted Z — try if Z is upside down)"}
                </p>
              </div>
            )}

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

              {/* Position offsets (interior & environment modes) */}
              {(cameraMode === "interior" || cameraMode === "environment") && (
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
                <option value="1920x1080">1920 × 1080 (final)</option>
                <option value="1280x720">1280 × 720</option>
                <option value="960x540">960 × 540</option>
                <option value="480x270">480 × 270 (draft — fastest)</option>
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

            {/* Scene Info */}
            {sceneInfo && (
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-400 space-y-1">
                <h4 className="text-gray-300 text-sm font-medium mb-2">Scene Info</h4>
                <p className="text-yellow-400">Dense center: [{sceneInfo.center?.map((v: number) => v.toFixed(2)).join(", ")}]</p>
                <p className="text-yellow-600">Dense min: [{sceneInfo.dense_min?.map((v: number) => v.toFixed(2)).join(", ")}]</p>
                <p className="text-yellow-600">Dense max: [{sceneInfo.dense_max?.map((v: number) => v.toFixed(2)).join(", ")}]</p>
                <p className="text-yellow-600">Dense extents: [{sceneInfo.extents?.map((v: number) => v.toFixed(2)).join(", ")}]</p>
                <p className="text-gray-600 mt-1">Raw bbox min: [{sceneInfo.bbox_min?.map((v: number) => v.toFixed(2)).join(", ")}]</p>
                <p className="text-gray-600">Raw bbox max: [{sceneInfo.bbox_max?.map((v: number) => v.toFixed(2)).join(", ")}]</p>
                <p className="text-green-400 mt-1">Eye: [{sceneInfo.eye?.map((v: number) => v.toFixed(2)).join(", ")}]</p>
                <p className="text-blue-400">Target: [{sceneInfo.target?.map((v: number) => v.toFixed(2)).join(", ")}]</p>
              </div>
            )}

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
                          {entry.params.cameraMode === "interior" ? "IN" : entry.params.cameraMode === "environment" ? "ENV" : "EX"}{" "}
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

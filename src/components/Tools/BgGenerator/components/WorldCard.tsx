"use client";

import {
  RefreshCw,
  Download,
  Trash2,
  Upload,
  Loader2,
  Box,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectItem, TimeOfDay, ModelProvider } from "../types";

interface WorldCardProps {
  item: ProjectItem;
  index: number;
  modelProvider: ModelProvider;
  galleryFileInputRef: (el: HTMLInputElement | null) => void;
  onDelete: () => void;
  onGenerateTimeVariant: (time: TimeOfDay) => void;
  onReplaceFrontImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRegenerateFront: () => void;
  onGenerateBack: () => void;
  onSelectBackImage: (index: number) => void;
  onDownload: (dataUrl: string, filename: string) => void;
  onGenerate3DWorld: () => void;
}

export default function WorldCard({
  item,
  index,
  modelProvider,
  galleryFileInputRef,
  onDelete,
  onGenerateTimeVariant,
  onReplaceFrontImage,
  onRegenerateFront,
  onGenerateBack,
  onSelectBackImage,
  onDownload,
  onGenerate3DWorld,
}: WorldCardProps) {
  const currentFrontImage =
    item.timeVariants[item.selectedTime].front ||
    (item.selectedTime === "day" ? item.frontImage : null);

  const currentBackImage =
    item.selectedTime === "day"
      ? item.backImages.length > 0
        ? item.backImages[item.selectedBackImageIndex]
        : null
      : item.timeVariants[item.selectedTime].back;

  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 text-zinc-100 shadow-sm p-6 relative">
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Time Selector */}
        <div className="flex bg-zinc-950 rounded-md border border-zinc-800 p-0.5 mr-2">
          {(["morning", "day", "evening", "night"] as TimeOfDay[]).map((t) => (
            <button
              key={t}
              onClick={() => onGenerateTimeVariant(t)}
              className={cn(
                "px-2 py-1 text-xs rounded-sm transition-colors capitalize",
                item.selectedTime === t
                  ? "bg-[#DB2777] text-white"
                  : item.timeVariants[t].front
                    ? "text-zinc-300 hover:text-white"
                    : "text-zinc-600 hover:text-zinc-400"
              )}
              title={
                item.timeVariants[t].front
                  ? `Switch to ${t}`
                  : `Generate ${t} version`
              }
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={onDelete}
          className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          title="Delete Workspace Item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        {/* Front View Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pr-10">
            <div className="flex items-center gap-2 text-[#DB2777] font-mono text-sm uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-[#DB2777]" />
              Front View ({item.selectedTime})
            </div>
            <div className="flex gap-2">
              {item.selectedTime === "day" && (
                <>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    ref={galleryFileInputRef}
                    onChange={onReplaceFrontImage}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector(
                        `#gallery-file-${index}`
                      ) as HTMLInputElement;
                      input?.click();
                    }}
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100"
                  >
                    <Upload className="w-3 h-3 mr-2" /> Replace
                  </button>
                  <button
                    onClick={onRegenerateFront}
                    disabled={item.status === "generating-front"}
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={cn(
                        "w-3 h-3 mr-2",
                        item.status === "generating-front" && "animate-spin"
                      )}
                    />
                    {modelProvider === "z-image" ? "Z-Gen" : "Re-Gen"}
                  </button>
                </>
              )}

              {currentFrontImage && (
                <button
                  onClick={() =>
                    onDownload(
                      currentFrontImage,
                      `front-${item.id}-${item.selectedTime}.png`
                    )
                  }
                  className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                >
                  <Download className="w-3 h-3 mr-2" /> Save
                </button>
              )}
            </div>
          </div>

          <div className="aspect-video w-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden relative group">
            {item.status === "generating-front" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-[#DB2777] animate-spin" />
                <p className="text-sm text-zinc-400">
                  Generating {item.selectedTime}...
                </p>
              </div>
            ) : currentFrontImage ? (
              <img
                src={currentFrontImage}
                alt="Front"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
                {item.selectedTime === "day"
                  ? "Waiting..."
                  : "Select to generate"}
              </div>
            )}
          </div>
          <p
            className="text-xs text-zinc-500 line-clamp-2 font-mono"
            title={item.frontPrompt}
          >
            {item.frontPrompt || "Uploaded Image"}
          </p>
        </div>

        {/* Back View Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Back View ({item.selectedTime})
            </div>

            {item.selectedTime === "day" ? (
              item.backImages.length > 0 ? (
                <div className="flex gap-2">
                  <div className="flex bg-zinc-950 rounded-md border border-zinc-800 p-0.5">
                    {item.backImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSelectBackImage(idx)}
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-sm transition-colors",
                          item.selectedBackImageIndex === idx
                            ? "bg-emerald-600 text-white"
                            : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      onDownload(
                        item.backImages[item.selectedBackImageIndex],
                        `back-${item.id}-${item.selectedBackImageIndex + 1}.png`
                      )
                    }
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 hover:bg-zinc-800 text-zinc-300 hover:text-white"
                  >
                    <Download className="w-3 h-3 mr-2" /> Save
                  </button>
                </div>
              ) : (
                item.frontImage && (
                  <button
                    onClick={onGenerateBack}
                    disabled={item.status === "generating-back"}
                    className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {item.status === "generating-back" ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-2" /> Generate (
                        {modelProvider === "z-image" ? "Z" : "G"})
                      </>
                    )}
                  </button>
                )
              )
            ) : item.timeVariants[item.selectedTime].back ? (
              <button
                onClick={() =>
                  onDownload(
                    item.timeVariants[item.selectedTime].back!,
                    `back-${item.id}-${item.selectedTime}.png`
                  )
                }
                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              >
                <Download className="w-3 h-3 mr-2" /> Save
              </button>
            ) : (
              <span className="text-xs text-zinc-500">
                {item.timeVariants[item.selectedTime].front
                  ? "Generating back..."
                  : "Generate front first"}
              </span>
            )}
          </div>

          <div className="aspect-video w-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden relative group">
            {item.status === "generating-back" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-sm text-zinc-400">Connecting edges...</p>
              </div>
            ) : currentBackImage ? (
              <img
                src={currentBackImage}
                alt="Back"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 gap-2">
                {item.selectedTime === "day" ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 border-dashed">
                      <RefreshCw className="w-5 h-5 opacity-20" />
                    </div>
                    <span className="text-xs">Ready to generate</span>
                  </>
                ) : (
                  <span className="text-xs">
                    {item.timeVariants[item.selectedTime].front
                      ? "Waiting for back..."
                      : "Select to generate"}
                  </span>
                )}
              </div>
            )}
          </div>
          {item.backPrompt && (
            <p
              className="text-xs text-zinc-500 line-clamp-2 font-mono"
              title={item.backPrompt}
            >
              {item.backPrompt}
            </p>
          )}
        </div>
      </div>

      {/* WorldLabs 3D Section */}
      {(item.backImages.length > 0 || item.worldLabs) && (
        <div className="mt-6 pt-6 border-t border-zinc-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-400 font-mono text-sm uppercase tracking-wider">
              <Box className="w-4 h-4" />
              3D World
            </div>

            {(!item.worldLabs || item.worldLabs.status === "failed") && (
              <button
                onClick={onGenerate3DWorld}
                disabled={item.backImages.length === 0}
                className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 py-1 px-3 bg-violet-700 text-white hover:bg-violet-600 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Box className="w-3 h-3 mr-2" />
                Generate 3D World
              </button>
            )}
          </div>

          {item.worldLabs && (
            <div className="mt-3">
              {(item.worldLabs.status === "uploading" ||
                item.worldLabs.status === "generating") && (
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  {item.worldLabs.status === "uploading"
                    ? "Uploading images to WorldLabs..."
                    : "Generating 3D world (may take 1–3 min)..."}
                </div>
              )}

              {item.worldLabs.status === "failed" && (
                <div className="text-xs text-red-400 mt-1">
                  Failed: {item.worldLabs.error}
                </div>
              )}

              {item.worldLabs.status === "completed" && (
                <div className="mt-2 space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {item.worldLabs.worldMarbleUrl && (
                      <a
                        href={item.worldLabs.worldMarbleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-violet-700/60 bg-violet-900/20 text-violet-300 hover:bg-violet-800/30 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View World
                      </a>
                    )}
                    {item.worldLabs.panoUrl && (
                      <a
                        href={item.worldLabs.panoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-700 bg-zinc-900/20 text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Panorama
                      </a>
                    )}
                    {item.worldLabs.splatUrls && (
                      <>
                        <a
                          href={item.worldLabs.splatUrls["100k"]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-700 bg-zinc-900/20 text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          3DGS 100k
                        </a>
                        <a
                          href={item.worldLabs.splatUrls["500k"]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-700 bg-zinc-900/20 text-zinc-300 hover:bg-zinc-800 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          3DGS 500k
                        </a>
                      </>
                    )}
                    {item.worldLabs.meshUrl && (
                      <a
                        href={item.worldLabs.meshUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-zinc-700 bg-zinc-900/20 text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Mesh (.glb)
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

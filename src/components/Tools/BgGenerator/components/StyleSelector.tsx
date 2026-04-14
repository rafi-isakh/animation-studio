"use client";

import { STYLE_PRESETS } from "../constants";
import type { ModelProvider } from "../types";
import { cn } from "@/lib/utils";

interface StyleSelectorProps {
  style: string;
  onStyleChange: (style: string) => void;
  modelProvider: ModelProvider;
  onModelProviderChange: (provider: ModelProvider) => void;
}

export default function StyleSelector({
  style,
  onStyleChange,
  modelProvider,
  onModelProviderChange,
}: StyleSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Art Style</label>
        <select
          className="w-full h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none"
          value={style}
          onChange={(e) => onStyleChange(e.target.value)}
        >
          {STYLE_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">Image Model</label>
        <div className="flex bg-zinc-950 p-1 rounded-md border border-zinc-800">
          <button
            onClick={() => onModelProviderChange("gemini")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-sm transition-colors",
              modelProvider === "gemini"
                ? "bg-[#DB2777] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Gemini
          </button>
          <button
            onClick={() => onModelProviderChange("z-image")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-sm transition-colors",
              modelProvider === "z-image"
                ? "bg-[#DB2777] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Z-Image Turbo
          </button>
        </div>
      </div>
    </div>
  );
}

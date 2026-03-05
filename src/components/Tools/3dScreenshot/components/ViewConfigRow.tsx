"use client";

import { X, Camera, RefreshCw, Loader2 } from "lucide-react";
import type { ViewConfig } from "../types";

interface ViewConfigRowProps {
  view: ViewConfig;
  index: number;
  canDelete: boolean;
  hasResult: boolean;
  isRendering: boolean;
  canRender: boolean;
  onChange: (updated: ViewConfig) => void;
  onDelete: () => void;
  onRender: () => void;
}

function NumInput({
  label, value, min, max, step = 1, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-xs text-zinc-500">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
      />
    </div>
  );
}

export default function ViewConfigRow({
  view, index, canDelete, hasResult, isRendering, canRender, onChange, onDelete, onRender,
}: ViewConfigRowProps) {
  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3 space-y-2">
      {/* Row 1: index, label, az/el/fov, render, delete */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 font-mono w-6 shrink-0">{index + 1}</span>

        <input
          type="text"
          value={view.label}
          onChange={(e) => onChange({ ...view, label: e.target.value })}
          className="w-28 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
          placeholder="Label"
        />

        <NumInput label="Az"  value={view.azimuth}   min={-180} max={180} onChange={(v) => onChange({ ...view, azimuth: v })} />
        <NumInput label="El"  value={view.elevation}  min={-90}  max={90}  onChange={(v) => onChange({ ...view, elevation: v })} />
        <NumInput label="FoV" value={view.fov}        min={30}   max={120} onChange={(v) => onChange({ ...view, fov: v })} />

        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={onRender}
            disabled={!canRender || isRendering}
            title={hasResult ? "Re-render" : "Render"}
            className="p-1.5 text-zinc-500 hover:text-[#DB2777] hover:bg-[#DB2777]/10 rounded-md transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            {isRendering
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#DB2777]" />
              : hasResult
                ? <RefreshCw className="w-3.5 h-3.5" />
                : <Camera className="w-3.5 h-3.5" />
            }
          </button>

          {canDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: interior position sliders */}
      <div className="grid grid-cols-3 gap-3 pl-9">
        {([
          ["X", "offsetX"],
          ["Y (vert)", "offsetY"],
          ["Z", "offsetZ"],
        ] as [string, keyof ViewConfig][]).map(([label, key]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>{label}</span>
              <span className="font-mono">{(view[key] as number).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={view[key] as number}
              onChange={(e) => onChange({ ...view, [key]: Number(e.target.value) })}
              className="w-full accent-[#DB2777]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

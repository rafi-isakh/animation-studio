"use client";

import { X } from "lucide-react";
import type { ViewConfig } from "../types";

interface ViewConfigRowProps {
  view: ViewConfig;
  index: number;
  canDelete: boolean;
  onChange: (updated: ViewConfig) => void;
  onDelete: () => void;
}

export default function ViewConfigRow({
  view,
  index,
  canDelete,
  onChange,
  onDelete,
}: ViewConfigRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30">
      <span className="text-xs text-zinc-500 font-mono w-6 shrink-0">
        {index + 1}
      </span>

      <input
        type="text"
        value={view.label}
        onChange={(e) => onChange({ ...view, label: e.target.value })}
        className="w-28 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
        placeholder="Label"
      />

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-zinc-500">Az</label>
        <input
          type="number"
          value={view.azimuth}
          min={-180}
          max={180}
          onChange={(e) =>
            onChange({ ...view, azimuth: Number(e.target.value) })
          }
          className="w-20 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-zinc-500">El</label>
        <input
          type="number"
          value={view.elevation}
          min={-90}
          max={90}
          onChange={(e) =>
            onChange({ ...view, elevation: Number(e.target.value) })
          }
          className="w-20 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <label className="text-xs text-zinc-500">FoV</label>
        <input
          type="number"
          value={view.fov}
          min={30}
          max={120}
          onChange={(e) => onChange({ ...view, fov: Number(e.target.value) })}
          className="w-20 h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-sm text-zinc-100 text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#DB2777]"
        />
      </div>

      {canDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors ml-auto"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { DetectedId } from "./types";

interface DetectionPanelProps {
  detectedIds: DetectedId[];
  onToggleCategory: (id: string) => void;
  onRemoveId: (id: string) => void;
  onDetectProps: () => void;
  isAnalyzing: boolean;
  totalClips: number;
}

export default function DetectionPanel({
  detectedIds,
  onToggleCategory,
  onRemoveId,
  onDetectProps,
  isAnalyzing,
  totalClips,
}: DetectionPanelProps) {
  const characters = detectedIds.filter((d) => d.category === "character");
  const objects = detectedIds.filter((d) => d.category === "object");

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-200">Detected IDs</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Found {detectedIds.length} IDs across {totalClips} clips. Click to toggle category, &times; to remove.
          </p>
        </div>
        <button
          onClick={onDetectProps}
          disabled={isAnalyzing || objects.length === 0}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-600 disabled:bg-gray-700 disabled:opacity-50 text-white rounded text-sm font-bold transition-colors flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Analyzing...
            </>
          ) : (
            "Detect Props"
          )}
        </button>
      </div>

      {/* Character IDs */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
            Characters ({characters.length})
          </span>
          <span className="text-[9px] text-gray-600">
            - will be skipped during prop detection
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {characters.length === 0 ? (
            <span className="text-xs text-gray-600 italic">No character IDs detected</span>
          ) : (
            characters.map((d) => (
              <div
                key={d.id}
                className="flex items-center bg-pink-900/30 border border-pink-800/50 rounded overflow-hidden"
              >
                <button
                  onClick={() => onToggleCategory(d.id)}
                  className="text-[10px] text-pink-300 font-mono italic px-1.5 py-0.5 hover:bg-pink-800/50 transition-colors"
                  title={`Appears in ${d.occurrences} clip(s). Click to move to Objects.`}
                >
                  {d.id}
                  <span className="ml-1 text-[8px] text-pink-500">({d.occurrences})</span>
                </button>
                <button
                  onClick={() => onRemoveId(d.id)}
                  className="px-1 border-l border-pink-800/50 hover:bg-red-900/50 text-pink-500 text-[10px] font-black transition-colors"
                  title="Remove from detection"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Object IDs */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">
            Objects ({objects.length})
          </span>
          <span className="text-[9px] text-gray-600">
            - will be analyzed for prop details
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {objects.length === 0 ? (
            <span className="text-xs text-gray-600 italic">No object IDs detected</span>
          ) : (
            objects.map((d) => (
              <div
                key={d.id}
                className="flex items-center bg-teal-900/30 border border-teal-800/50 rounded overflow-hidden"
              >
                <button
                  onClick={() => onToggleCategory(d.id)}
                  className="text-[10px] text-teal-300 font-mono italic px-1.5 py-0.5 hover:bg-teal-800/50 transition-colors"
                  title={`Appears in ${d.occurrences} clip(s). Click to move to Characters.`}
                >
                  {d.id}
                  <span className="ml-1 text-[8px] text-teal-500">({d.occurrences})</span>
                </button>
                <button
                  onClick={() => onRemoveId(d.id)}
                  className="px-1 border-l border-teal-800/50 hover:bg-red-900/50 text-teal-500 text-[10px] font-black transition-colors"
                  title="Remove from detection"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Help text */}
      <div className="text-[9px] text-gray-600 bg-gray-900/50 rounded p-2">
        <strong>Tip:</strong> IDs are auto-categorized based on keywords. Click an ID to switch between
        Character/Object. Only Objects will be analyzed when you click &quot;Detect Props&quot;.
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { DetectedId } from "./types";

interface DetectionPanelProps {
  detectedIds: DetectedId[];
  onToggleCategory: (id: string) => void;
  onRemoveId: (id: string) => void;
  onDetectCharacters: () => void;
  onDetectObjects: () => void;
  isAnalyzingCharacters: boolean;
  isAnalyzingObjects: boolean;
  totalClips: number;
}

export default function DetectionPanel({
  detectedIds,
  onToggleCategory,
  onRemoveId,
  onDetectCharacters,
  onDetectObjects,
  isAnalyzingCharacters,
  isAnalyzingObjects,
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
      </div>

      {/* Character IDs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">
              Characters ({characters.length})
            </span>
          </div>
          <button
            onClick={onDetectCharacters}
            disabled={isAnalyzingCharacters || isAnalyzingObjects || characters.length === 0}
            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            {isAnalyzingCharacters ? (
              <>
                <svg
                  className="animate-spin h-3 w-3"
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
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-3 h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                Detect Characters
              </>
            )}
          </button>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest">
              Objects ({objects.length})
            </span>
          </div>
          <button
            onClick={onDetectObjects}
            disabled={isAnalyzingCharacters || isAnalyzingObjects || objects.length === 0}
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 disabled:bg-gray-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            {isAnalyzingObjects ? (
              <>
                <svg
                  className="animate-spin h-3 w-3"
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
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-3 h-3"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                  />
                </svg>
                Detect Objects
              </>
            )}
          </button>
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
        Character/Object. Use &quot;Detect Characters&quot; or &quot;Detect Objects&quot; to analyze each category separately.
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { ALL_TEMPLATES } from "./characterTemplates";
import type { CustomMannequinTemplate } from "../services/firestore/mannequinTemplates";

interface MannequinTemplatesPanelProps {
  activePropName?: string;
  selectedPaths: string[];
  onSelectionChange: (paths: string[]) => void;
  customTemplates?: CustomMannequinTemplate[];
  onDeleteCustomTemplate?: (id: string) => void;
}

export default function MannequinTemplatesPanel({
  activePropName,
  selectedPaths,
  onSelectionChange,
  customTemplates = [],
  onDeleteCustomTemplate,
}: MannequinTemplatesPanelProps) {
  const handleCardClick = (path: string) => {
    const isSelected = selectedPaths.includes(path);
    if (isSelected) {
      onSelectionChange(selectedPaths.filter((p) => p !== path));
    } else if (selectedPaths.length < 2) {
      onSelectionChange([...selectedPaths, path]);
    } else {
      // FIFO: drop oldest, add new
      onSelectionChange([selectedPaths[1], path]);
    }
  };

  return (
    <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden h-full w-48 shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-gray-700 flex items-center justify-between bg-gray-800/80">
        <span className="text-[9px] font-black text-[#DB2777] uppercase tracking-widest leading-none">
          Templates
        </span>
        {customTemplates.length > 0 && (
          <span className="text-[8px] font-bold text-[#DB2777] bg-[#DB2777]/10 px-1.5 py-0.5 rounded border border-[#DB2777]/30">
            +{customTemplates.length}
          </span>
        )}
      </div>

      {/* Active prop indicator */}
      {activePropName && (
        <div className="px-3 py-1.5 bg-green-950/40 border-b border-green-900/40">
          <p className="text-[8px] text-green-400 truncate">
            <span className="text-green-600 mr-1">▶</span>
            {activePropName}
          </p>
        </div>
      )}

      {/* Template list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Custom templates section */}
        {customTemplates.length > 0 && (
          <>
            <div className="px-1 pt-1 pb-0.5">
              <span className="text-[8px] font-black text-[#DB2777] uppercase tracking-widest">
                Custom
              </span>
            </div>
            {customTemplates.map((template) => {
              const isSelected = selectedPaths.includes(template.path);
              return (
                <div key={template.id} className="relative group">
                  <button
                    onClick={() => handleCardClick(template.path)}
                    className={`w-full rounded-lg border transition-all overflow-hidden text-left ${
                      isSelected
                        ? "border-green-500 bg-green-950/30"
                        : "border-[#DB2777]/40 bg-gray-900/50 hover:border-[#DB2777]/70"
                    }`}
                  >
                    <div className="relative w-full aspect-[3/4] bg-gray-900 flex items-center justify-center">
                      <img
                        src={template.path}
                        alt={template.label}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div
                        className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-green-500 border-green-400"
                            : "bg-gray-800/80 border-gray-600"
                        }`}
                      >
                        {isSelected && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-white">
                            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${isSelected ? "text-green-400" : "text-[#DB2777]/80"}`}>
                      {template.label}
                    </div>
                  </button>
                  {onDeleteCustomTemplate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteCustomTemplate(template.id); }}
                      className="absolute top-1 left-1 w-4 h-4 bg-red-900/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Remove custom template"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
            <div className="border-t border-gray-700/50 my-1" />
          </>
        )}

        {/* Built-in templates */}
        {ALL_TEMPLATES.map((template) => {
          const isSelected = selectedPaths.includes(template.path);
          return (
            <button
              key={template.path}
              onClick={() => handleCardClick(template.path)}
              className={`w-full rounded-lg border transition-all overflow-hidden text-left ${
                isSelected
                  ? "border-green-500 bg-green-950/30"
                  : "border-gray-700 bg-gray-900/50 hover:border-gray-500"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-full aspect-[3/4] bg-gray-900 flex items-center justify-center">
                <img
                  src={template.path}
                  alt={template.label}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Selection indicator */}
                <div
                  className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-green-500 border-green-400"
                      : "bg-gray-800/80 border-gray-600"
                  }`}
                >
                  {isSelected && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-2.5 h-2.5 text-white"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Label */}
              <div
                className={`px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                  isSelected ? "text-green-400" : "text-gray-400"
                }`}
              >
                {template.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection count footer */}
      <div className="px-3 py-2 border-t border-gray-700 bg-gray-800/50">
        <p className="text-[8px] text-gray-500 text-center">
          {selectedPaths.length > 0 ? (
            <span className="text-green-500 font-bold">
              {selectedPaths.length}/2 selected
            </span>
          ) : (
            "No template selected"
          )}
        </p>
      </div>
    </div>
  );
}

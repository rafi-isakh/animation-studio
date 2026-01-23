"use client";

import React from "react";
import { Prop } from "./types";

interface PropGridProps {
  props: Prop[];
  selectedPropId: string | null;
  onSelectProp: (propId: string) => void;
  onGenerateImage: (propId: string, prompt: string, referenceImageBase64?: string) => void;
}

export default function PropGrid({
  props,
  selectedPropId,
  onSelectProp,
  onGenerateImage,
}: PropGridProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-gray-200">
        Detected Props ({props.length})
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {props.map((prop) => (
          <PropCard
            key={prop.id}
            prop={prop}
            isSelected={selectedPropId === prop.id}
            onSelect={() => onSelectProp(prop.id)}
            onGenerateImage={onGenerateImage}
          />
        ))}
      </div>
    </div>
  );
}

interface PropCardProps {
  prop: Prop;
  isSelected: boolean;
  onSelect: () => void;
  onGenerateImage: (propId: string, prompt: string, referenceImageBase64?: string) => void;
}

function PropCard({ prop, isSelected, onSelect, onGenerateImage }: PropCardProps) {
  const imageUrl = prop.designSheetImageUrl ||
    (prop.designSheetImageBase64 ? `data:image/png;base64,${prop.designSheetImageBase64}` : null);

  return (
    <div
      className={`bg-gray-800 border rounded-lg overflow-hidden transition-all cursor-pointer hover:border-teal-600 ${
        isSelected ? "border-teal-500 ring-2 ring-teal-500/30" : "border-gray-700"
      }`}
      onClick={onSelect}
    >
      {/* Image preview */}
      <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
        {prop.isGenerating ? (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <svg
              className="animate-spin h-8 w-8"
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
            <span className="text-xs">Generating...</span>
          </div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={prop.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateImage(prop.id, prop.designSheetPrompt, prop.referenceImageBase64);
            }}
            className="flex flex-col items-center gap-2 text-gray-600 hover:text-teal-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-10 h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
            <span className="text-xs font-bold">Generate</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-gray-200 text-sm truncate flex-1">{prop.name}</h4>
          <span className="text-[8px] font-bold text-teal-500 bg-teal-900/50 px-1.5 py-0.5 rounded border border-teal-800 uppercase shrink-0 ml-2">
            {prop.appearingClips.slice(0, 3).join(", ")}
            {prop.appearingClips.length > 3 && "..."}
          </span>
        </div>

        <p className="text-[10px] text-gray-400 line-clamp-2" title={prop.description}>
          {prop.description}
        </p>

        <p className="text-[10px] text-teal-400 line-clamp-1" title={prop.descriptionKo}>
          {prop.descriptionKo}
        </p>
      </div>
    </div>
  );
}

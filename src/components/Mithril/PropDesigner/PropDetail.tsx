"use client";

import React, { useState, useRef } from "react";
import { Prop } from "./types";

interface PropDetailProps {
  prop: Prop;
  genre: string;
  styleKeyword: string;
  onClose: () => void;
  onGenerateImage: (propId: string, prompt: string, referenceImageBase64?: string) => void;
  onSetReferenceImage: (propId: string, base64: string) => void;
}

export default function PropDetail({
  prop,
  genre,
  styleKeyword,
  onClose,
  onGenerateImage,
  onSetReferenceImage,
}: PropDetailProps) {
  const [editedPrompt, setEditedPrompt] = useState(prop.designSheetPrompt);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onSetReferenceImage(prop.id, base64);
    };
    reader.readAsDataURL(file);
  };

  const imageUrl = prop.designSheetImageUrl ||
    (prop.designSheetImageBase64 ? `data:image/png;base64,${prop.designSheetImageBase64}` : null);

  const referenceUrl = prop.referenceImageUrl ||
    (prop.referenceImageBase64 ? prop.referenceImageBase64 : null);

  const isCharacter = prop.category === "character";
  const accentColor = isCharacter ? "text-purple-500" : "text-teal-500";
  const accentBg = isCharacter ? "bg-purple-900/50 border-purple-800" : "bg-teal-900/50 border-teal-800";
  const buttonBg = isCharacter ? "bg-purple-700 hover:bg-purple-600" : "bg-teal-700 hover:bg-teal-600";

  return (
    <div className="bg-gray-800/80 border border-gray-700 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-200">{prop.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[9px] font-black ${accentColor} ${accentBg} px-2 py-0.5 rounded border uppercase`}>
              {prop.category}
            </span>
            <span className="text-xs text-gray-500">
              {prop.appearingClips && prop.appearingClips.length > 0 && `Appears in: ${prop.appearingClips.join(", ")}`}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Description (EN)</label>
          <p className="text-sm text-gray-300 bg-gray-900/50 rounded p-3 min-h-[80px]">
            {prop.description}
          </p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase">Description (KO)</label>
          <p className="text-sm text-teal-300 bg-gray-900/50 rounded p-3 min-h-[80px]">
            {prop.descriptionKo}
          </p>
        </div>
      </div>

      {/* Images Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reference Image */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Reference Image (Optional)</label>
          <div className="aspect-video bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden">
            {referenceUrl ? (
              <img
                src={referenceUrl}
                alt="Reference"
                className="w-full h-full object-contain"
              />
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
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
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-xs font-bold">Upload Reference</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {referenceUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              Change Reference Image
            </button>
          )}
        </div>

        {/* Generated Design Sheet */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Design Sheet</label>
          <div className="aspect-video bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden">
            {prop.isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <svg
                  className="animate-spin h-10 w-10"
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
                <span className="text-sm">Generating...</span>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={prop.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-gray-600 text-sm">No image generated yet</span>
            )}
          </div>
          {imageUrl && (
            <a
              href={imageUrl}
              download={`${prop.name.replace(/\s+/g, "_")}_design_sheet.png`}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors inline-block"
            >
              Download Image
            </a>
          )}
        </div>
      </div>

      {/* Design Sheet Prompt */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-500 uppercase">Design Sheet Prompt</label>
        <textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
          placeholder="Enter design sheet prompt..."
        />
        <div className="flex items-center gap-2 text-[10px] text-gray-600">
          <span>Genre: {genre}</span>
          <span>|</span>
          <span>Style: {styleKeyword}</span>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-bold transition-colors"
        >
          Close
        </button>
        <button
          onClick={() => {
            const refBase64 = prop.referenceImageBase64 ||
              (prop.referenceImageUrl ? undefined : undefined);
            onGenerateImage(prop.id, editedPrompt, refBase64);
          }}
          disabled={prop.isGenerating || !editedPrompt.trim()}
          className={`px-4 py-2 ${buttonBg} disabled:bg-gray-700 disabled:opacity-50 text-white rounded text-sm font-bold transition-colors flex items-center gap-2`}
        >
          {prop.isGenerating ? (
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
              Generating...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
                />
              </svg>
              Generate Design Sheet
            </>
          )}
        </button>
      </div>
    </div>
  );
}

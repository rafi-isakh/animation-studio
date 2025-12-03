"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2, Sparkles, RefreshCw, Pencil, Check, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import type { Continuity, ClipImageState, ReferenceImage } from "../types";
import { BackgroundSelector } from "./StoryboardTable";

interface ClipTableRowProps {
  row: Continuity;
  sceneIndex: number;
  clipIndex: number;
  clipKey: string;
  clipState: ClipImageState | undefined;
  selectedRef: ReferenceImage | null;
  isNewBackground: boolean;
  isLoadingRefs: boolean;
  isGeneratingAll: boolean;
  aspectRatio: "16:9" | "9:16";
  availableReferences: ReferenceImage[];
  referenceObjectUrls: Map<string, string>;
  clipHeadersLength: number;
  onBgSelect: (refId: string | null) => void;
  onGenerateClip: () => void;
  onOpenLightbox: (base64: string, clipName: string) => void;
  onUpdatePrompt: (field: 'imagePrompt' | 'videoPrompt', value: string) => void;
  getOriginalPrompt: (field: 'imagePrompt' | 'videoPrompt') => string | null;
}

// Editable cell component for prompts
function EditablePromptCell({
  value,
  originalValue,
  onSave,
  onReset,
  placeholderKey,
}: {
  value: string;
  originalValue: string | null;
  onSave: (newValue: string) => void;
  onReset: () => void;
  placeholderKey?: string;
}) {
  const { language, dictionary } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync editValue when value prop changes (e.g., after reset)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  // Auto-focus and auto-resize textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (originalValue !== null) {
      onReset();
      setEditValue(originalValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  const hasChanges = originalValue !== null && value !== originalValue;

  if (isEditing) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholderKey ? phrase(dictionary, placeholderKey, language) : ""}
          className="w-full min-h-[60px] p-2 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
            title={phrase(dictionary, "storyboard_edit_save_hint", language)}
          >
            <Check className="w-3 h-3" />
            {phrase(dictionary, "storyboard_edit_save", language)}
          </button>
          {originalValue !== null && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors"
              title={phrase(dictionary, "storyboard_edit_reset_hint", language)}
            >
              <RotateCcw className="w-3 h-3" />
              {phrase(dictionary, "storyboard_edit_reset", language)}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div className="whitespace-pre-wrap pr-6">
        {value || <span className="text-gray-400 italic">{phrase(dictionary, "storyboard_edit_empty", language)}</span>}
      </div>
      <div className="absolute top-0 right-0 flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-[#DB2777] opacity-0 group-hover:opacity-100 transition-opacity"
          title={phrase(dictionary, "storyboard_edit_button", language)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        {hasChanges && (
          <button
            onClick={handleReset}
            className="p-1 text-amber-500 hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"
            title={phrase(dictionary, "storyboard_edit_reset_hint", language)}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {hasChanges && (
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l -ml-2" title={phrase(dictionary, "storyboard_edit_modified", language)} />
      )}
    </div>
  );
}

export default function ClipTableRow({
  row,
  sceneIndex,
  clipIndex,
  clipState,
  selectedRef,
  isNewBackground,
  isLoadingRefs,
  isGeneratingAll,
  aspectRatio,
  availableReferences,
  referenceObjectUrls,
  clipHeadersLength,
  onBgSelect,
  onGenerateClip,
  onOpenLightbox,
  onUpdatePrompt,
  getOriginalPrompt,
}: ClipTableRowProps) {
  const { language, dictionary } = useLanguage();

  return (
    <React.Fragment>
      {isNewBackground && (
        <tr className="bg-gray-100 dark:bg-gray-800/70">
          <td
            colSpan={clipHeadersLength}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 italic pl-8"
          >
            {phrase(dictionary, "table_background", language)} {row.backgroundPrompt}
          </td>
        </tr>
      )}
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-center">{`${sceneIndex + 1}.${clipIndex + 1}`}</td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300 w-20 text-center">
          {row.length}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300 w-24 text-center">
          {row.accumulatedTime}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-[#DB2777] w-24 text-center font-mono">
          {row.backgroundId}
        </td>

        {/* Background Selection Column */}
        <td className="px-4 py-4 min-w-[180px]">
          {isLoadingRefs ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">{phrase(dictionary, "storyboard_loading", language)}</span>
            </div>
          ) : availableReferences.length === 0 ? (
            <span className="text-xs text-gray-400">
              {phrase(dictionary, "storyboard_no_bg_available", language) || "No backgrounds"}
            </span>
          ) : (
            <BackgroundSelector
              selectedRef={selectedRef}
              selectedObjectUrl={selectedRef ? (referenceObjectUrls.get(selectedRef.id) || "") : ""}
              references={availableReferences}
              referenceObjectUrls={referenceObjectUrls}
              selectedBgId={clipState?.selectedBgId || null}
              onSelect={onBgSelect}
              selectBgLabel={phrase(dictionary, "storyboard_select_bg", language) || "Select BG..."}
              clearSelectionLabel={phrase(dictionary, "storyboard_clear_selection", language) || "Clear selection"}
            />
          )}
        </td>

        {/* Generated Image Column */}
        <td className="px-4 py-4 min-w-[200px]">
          <div className="flex flex-col items-center gap-2">
            {clipState?.isGenerating ? (
              <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${aspectRatio === "9:16" ? "w-20 h-32" : "w-32 h-20"}`}>
                <Loader2 className="w-6 h-6 animate-spin text-[#DB2777]" />
              </div>
            ) : clipState?.generatedImageBase64 ? (
              <div className="relative group">
                <button
                  onClick={() => onOpenLightbox(
                    clipState.generatedImageBase64!,
                    `${sceneIndex + 1}.${clipIndex + 1}`
                  )}
                  className={`relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#DB2777] transition-all ${aspectRatio === "9:16" ? "w-20 h-32" : "w-32 h-20"}`}
                >
                  <Image
                    src={`data:image/jpeg;base64,${clipState.generatedImageBase64}`}
                    alt="Generated"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
                {/* Regenerate button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateClip();
                  }}
                  disabled={(!!row.backgroundId?.trim() && !clipState?.selectedBgId) || isGeneratingAll}
                  className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title={phrase(dictionary, "storyboard_regenerate", language) || "Regenerate"}
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            ) : (clipState?.selectedBgId || !row.backgroundId?.trim()) ? (
              <button
                onClick={onGenerateClip}
                disabled={isGeneratingAll}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#DB2777] hover:bg-[#BE185D] text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {phrase(dictionary, "storyboard_generate_single", language) || "Generate"}
              </button>
            ) : (
              <span className="text-xs text-gray-400">
                {phrase(dictionary, "storyboard_select_bg_first", language) || "Select BG first"}
              </span>
            )}

            {clipState?.error && (
              <span className="text-xs text-red-500 max-w-[180px] truncate" title={clipState.error}>
                {clipState.error}
              </span>
            )}
          </div>
        </td>

        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
          {row.story}
        </td>

        {/* Editable Image Prompt */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
          <EditablePromptCell
            value={row.imagePrompt}
            originalValue={getOriginalPrompt('imagePrompt')}
            onSave={(newValue) => onUpdatePrompt('imagePrompt', newValue)}
            onReset={() => {
              const original = getOriginalPrompt('imagePrompt');
              if (original !== null) {
                onUpdatePrompt('imagePrompt', original);
              }
            }}
            placeholderKey="storyboard_edit_image_prompt_placeholder"
          />
        </td>

        {/* Editable Video Prompt */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
          <EditablePromptCell
            value={row.videoPrompt}
            originalValue={getOriginalPrompt('videoPrompt')}
            onSave={(newValue) => onUpdatePrompt('videoPrompt', newValue)}
            onReset={() => {
              const original = getOriginalPrompt('videoPrompt');
              if (original !== null) {
                onUpdatePrompt('videoPrompt', original);
              }
            }}
            placeholderKey="storyboard_edit_video_prompt_placeholder"
          />
        </td>

        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-blue-600 dark:text-blue-300 min-w-[200px]">
          {row.soraVideoPrompt}
        </td>
        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
          {row.dialogue}
        </td>
        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
          {row.dialogueEn}
        </td>
        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
          {row.sfx}
        </td>
        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
          {row.sfxEn}
        </td>
        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
          {row.bgm}
        </td>
        <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
          {row.bgmEn}
        </td>
      </tr>
    </React.Fragment>
  );
}

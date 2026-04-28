"use client";

import React, { useState, useEffect, useRef } from "react";
import { Pencil, Check, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import type { Continuity } from "../types";
import type { EditableClipField } from "../../MithrilContext";

interface ClipTableRowProps {
  row: Continuity;
  sceneIndex: number;
  clipIndex: number;
  showTrailerColumns?: boolean;
  onUpdatePrompt: (sceneIndex: number, clipIndex: number, field: EditableClipField, value: string) => void;
  getOriginalPrompt: (sceneIndex: number, clipIndex: number, field: EditableClipField) => string | null;
}

// Editable cell component for prompts
function EditablePromptCell({
  value,
  originalValue,
  onSave,
  placeholderKey,
}: {
  value: string;
  originalValue: string | null;
  onSave: (newValue: string) => void;
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
      onSave(originalValue);
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

const ClipTableRow = React.memo(function ClipTableRow({
  row,
  sceneIndex,
  clipIndex,
  showTrailerColumns = false,
  onUpdatePrompt,
  getOriginalPrompt,
}: ClipTableRowProps) {
  return (
    <React.Fragment>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-center">{`${sceneIndex + 1}.${clipIndex + 1}`}</td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300 w-20 text-center">
          {row.length}
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300 w-24 text-center">
          {row.accumulatedTime}
        </td>
        <td className="px-4 py-4 text-sm text-[#DB2777] min-w-[120px] text-center font-mono">
          <EditablePromptCell
            value={row.backgroundId}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'backgroundId')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'backgroundId', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
          <EditablePromptCell
            value={row.backgroundPrompt || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'backgroundPrompt')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'backgroundPrompt', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-[#DB2777]/70 min-w-[120px] text-center font-mono">
          <EditablePromptCell
            value={row.backgroundIdA || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'backgroundIdA')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'backgroundIdA', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-[#DB2777]/70 min-w-[120px] text-center font-mono">
          <EditablePromptCell
            value={row.backgroundIdB || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'backgroundIdB')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'backgroundIdB', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-[#DB2777]/70 min-w-[120px] text-center font-mono">
          <EditablePromptCell
            value={row.backgroundIdC || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'backgroundIdC')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'backgroundIdC', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-[#DB2777]/70 min-w-[120px] text-center font-mono">
          <EditablePromptCell
            value={row.backgroundIdD || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'backgroundIdD')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'backgroundIdD', newValue)}
          />
        </td>

        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
          <EditablePromptCell
            value={row.story}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'story')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'story', newValue)}
          />
        </td>

        {/* Attention reference fields */}
        <td className="px-4 py-4 text-sm text-orange-600 dark:text-orange-300 min-w-[150px]">
          <EditablePromptCell
            value={row.attentionDevice || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'attentionDevice')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'attentionDevice', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-orange-600 dark:text-orange-300 min-w-[150px]">
          <EditablePromptCell
            value={row.attentionAction || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'attentionAction')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'attentionAction', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-orange-600 dark:text-orange-300 min-w-[150px]">
          <EditablePromptCell
            value={row.attentionExpression || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'attentionExpression')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'attentionExpression', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-orange-600 dark:text-orange-300 min-w-[150px]">
          <EditablePromptCell
            value={row.attentionMood || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'attentionMood')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'attentionMood', newValue)}
          />
        </td>

        {/* A/B/C/D image prompt variants */}
        <td className="px-4 py-4 text-sm text-teal-600 dark:text-teal-300 min-w-[200px]">
          <EditablePromptCell
            value={row.imagePromptA || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'imagePromptA')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'imagePromptA', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-teal-600 dark:text-teal-300 min-w-[200px]">
          <EditablePromptCell
            value={row.imagePromptB || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'imagePromptB')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'imagePromptB', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-teal-600 dark:text-teal-300 min-w-[200px]">
          <EditablePromptCell
            value={row.imagePromptC || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'imagePromptC')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'imagePromptC', newValue)}
          />
        </td>
        <td className="px-4 py-4 text-sm text-teal-600 dark:text-teal-300 min-w-[200px]">
          <EditablePromptCell
            value={row.imagePromptD || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'imagePromptD')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'imagePromptD', newValue)}
          />
        </td>

        {/* Editable Video Prompt */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
          <EditablePromptCell
            value={row.videoPrompt}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'videoPrompt')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'videoPrompt', newValue)}
            placeholderKey="storyboard_edit_video_prompt_placeholder"
          />
        </td>

        <td className="px-4 py-4 text-sm text-blue-600 dark:text-blue-300 min-w-[200px]">
          <EditablePromptCell
            value={row.soraVideoPrompt}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'soraVideoPrompt')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'soraVideoPrompt', newValue)}
          />
        </td>

        <td className="px-4 py-4 text-sm text-purple-600 dark:text-purple-300 min-w-[200px]">
          <EditablePromptCell
            value={row.veoVideoPrompt}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'veoVideoPrompt')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'veoVideoPrompt', newValue)}
          />
        </td>

        <td className="px-4 py-4 text-sm text-pink-600 dark:text-pink-300 min-w-[200px]">
          <EditablePromptCell
            value={row.pixAiPrompt || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'pixAiPrompt')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'pixAiPrompt', newValue)}
          />
        </td>

        {/* Editable Dialogue (Ko) */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
          <EditablePromptCell
            value={row.dialogue}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'dialogue')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'dialogue', newValue)}
            placeholderKey="storyboard_edit_dialogue_placeholder"
          />
        </td>

        {/* Editable Dialogue (En) */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
          <EditablePromptCell
            value={row.dialogueEn}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'dialogueEn')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'dialogueEn', newValue)}
            placeholderKey="storyboard_edit_dialogue_en_placeholder"
          />
        </td>

        {/* Narration (Ko) */}
        <td className="px-4 py-4 text-sm text-yellow-600 dark:text-yellow-300 min-w-[150px]">
          <EditablePromptCell
            value={row.narration || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'narration')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'narration', newValue)}
          />
        </td>

        {/* Narration (En) */}
        <td className="px-4 py-4 text-sm text-yellow-500 dark:text-yellow-100 min-w-[150px]">
          <EditablePromptCell
            value={row.narrationEn || ""}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'narrationEn')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'narrationEn', newValue)}
          />
        </td>

        {/* Editable SFX (Ko) */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
          <EditablePromptCell
            value={row.sfx}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'sfx')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'sfx', newValue)}
            placeholderKey="storyboard_edit_sfx_placeholder"
          />
        </td>

        {/* Editable SFX (En) */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
          <EditablePromptCell
            value={row.sfxEn}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'sfxEn')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'sfxEn', newValue)}
            placeholderKey="storyboard_edit_sfx_en_placeholder"
          />
        </td>

        {/* Editable BGM (Ko) */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
          <EditablePromptCell
            value={row.bgm}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'bgm')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'bgm', newValue)}
            placeholderKey="storyboard_edit_bgm_placeholder"
          />
        </td>

        {/* Editable BGM (En) */}
        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
          <EditablePromptCell
            value={row.bgmEn}
            originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'bgmEn')}
            onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'bgmEn', newValue)}
            placeholderKey="storyboard_edit_bgm_en_placeholder"
          />
        </td>

        {/* Trailer Script columns (only when showTrailerColumns is true) */}
        {showTrailerColumns && (
          <>
            <td className="px-4 py-4 text-sm text-teal-600 dark:text-teal-300 min-w-[200px]">
              <EditablePromptCell
                value={row.trailerScriptKo || ""}
                originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'trailerScriptKo')}
                onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'trailerScriptKo', newValue)}
              />
            </td>
            <td className="px-4 py-4 text-sm text-teal-500 dark:text-teal-100 min-w-[200px]">
              <EditablePromptCell
                value={row.trailerScriptEn || ""}
                originalValue={getOriginalPrompt(sceneIndex, clipIndex, 'trailerScriptEn')}
                onSave={(newValue) => onUpdatePrompt(sceneIndex, clipIndex, 'trailerScriptEn', newValue)}
              />
            </td>
          </>
        )}
      </tr>
    </React.Fragment>
  );
});

export default ClipTableRow;

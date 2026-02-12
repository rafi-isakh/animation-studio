"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Lock, Trash2, Plus, Pencil, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/shadcnUI/Dialog";
import type { GenrePreset, GenrePresetData } from "../hooks/useGenrePresets";

interface PresetManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: GenrePreset[];
  onUpdatePreset: (id: string, data: Partial<GenrePresetData>) => void;
  onRenamePreset: (id: string, name: string) => void;
  onDeletePreset: (id: string) => void;
  onAddPreset: (name: string, data: GenrePresetData) => void;
}

const FIELDS: { key: keyof GenrePresetData; labelKey: string }[] = [
  { key: "story", labelKey: "preset_field_story" },
  { key: "image", labelKey: "preset_field_image" },
  { key: "video", labelKey: "preset_field_video" },
  { key: "sound", labelKey: "preset_field_sound" },
];

export default function PresetManagerModal({
  open,
  onOpenChange,
  presets,
  onUpdatePreset,
  onRenamePreset,
  onDeletePreset,
  onAddPreset,
}: PresetManagerModalProps) {
  const { language, dictionary } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>(presets[0]?.id || "");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editValues, setEditValues] = useState<GenrePresetData>({
    story: "",
    image: "",
    video: "",
    sound: "",
  });
  const [hasChanges, setHasChanges] = useState(false);

  const selectedPreset = presets.find((p) => p.id === selectedId);

  // Load preset data when selection changes
  useEffect(() => {
    if (selectedPreset) {
      setEditValues({
        story: selectedPreset.story,
        image: selectedPreset.image,
        video: selectedPreset.video,
        sound: selectedPreset.sound,
      });
      setHasChanges(false);
    }
  }, [selectedPreset]);

  // Reset selection when modal opens
  useEffect(() => {
    if (open && presets.length > 0) {
      setSelectedId(presets[0].id);
      setRenamingId(null);
    }
  }, [open, presets]);

  const getPresetDisplayName = (preset: GenrePreset) => {
    if (preset.isSystem && preset.nameKey) {
      return phrase(dictionary, preset.nameKey, language);
    }
    return preset.name || preset.id;
  };

  const handleFieldChange = (field: keyof GenrePresetData, value: string) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (selectedPreset && !selectedPreset.isSystem && hasChanges) {
      onUpdatePreset(selectedId, editValues);
      setHasChanges(false);
    }
  };

  const handleStartRename = (preset: GenrePreset) => {
    if (preset.isSystem) return;
    setRenamingId(preset.id);
    setRenameValue(preset.name || "");
  };

  const handleConfirmRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenamePreset(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleCancelRename = () => {
    setRenamingId(null);
  };

  const handleAddNewPreset = () => {
    const name = `${phrase(dictionary, "preset_custom", language)} ${presets.filter((p) => !p.isSystem).length + 1}`;
    onAddPreset(name, { story: "", image: "", video: "", sound: "" });
  };

  const handleDelete = (id: string) => {
    const target = presets.find((p) => p.id === id);
    if (!target || target.isSystem) return;
    onDeletePreset(id);
    // Select first preset if we deleted the selected one
    if (selectedId === id) {
      const remaining = presets.filter((p) => p.id !== id);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[85vh] flex flex-col"
        showCloseButton
        closeOnOutsideClick
      >
        <DialogHeader>
          <DialogTitle>
            {phrase(dictionary, "preset_manager_title", language)}
          </DialogTitle>
          <DialogDescription>
            {phrase(dictionary, "preset_manager_desc", language)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
          {/* Left sidebar — preset list */}
          <div className="w-64 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 pr-4">
            <div className="flex-1 overflow-y-auto space-y-1">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                    selectedId === preset.id
                      ? "bg-[#DB2777]/10 text-[#DB2777] dark:bg-[#DB2777]/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                  onClick={() => setSelectedId(preset.id)}
                >
                  {preset.isSystem && (
                    <Lock className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    {renamingId === preset.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirmRename();
                            if (e.key === "Escape") handleCancelRename();
                          }}
                          className="w-full px-1 py-0.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmRename();
                          }}
                          className="p-0.5 text-green-600 hover:text-green-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelRename();
                          }}
                          className="p-0.5 text-red-500 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="truncate block">
                        {getPresetDisplayName(preset)}
                      </span>
                    )}
                  </div>
                  {!preset.isSystem && renamingId !== preset.id && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(preset);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title={phrase(dictionary, "preset_rename", language)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(preset.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title={phrase(dictionary, "preset_delete", language)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add new preset button */}
            <button
              onClick={handleAddNewPreset}
              className="mt-3 flex items-center gap-2 px-3 py-2 text-sm text-[#DB2777] hover:bg-[#DB2777]/10 rounded-md transition-colors w-full"
            >
              <Plus className="w-4 h-4" />
              {phrase(dictionary, "preset_add_new", language)}
            </button>
          </div>

          {/* Right panel — preset fields */}
          <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
            {selectedPreset ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {getPresetDisplayName(selectedPreset)}
                    {selectedPreset.isSystem && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">
                        ({phrase(dictionary, "preset_system", language)})
                      </span>
                    )}
                  </h3>
                  {!selectedPreset.isSystem && hasChanges && (
                    <button
                      onClick={handleSave}
                      className="px-4 py-1.5 text-sm bg-[#DB2777] text-white rounded-md hover:bg-[#DB2777]/90 transition-colors"
                    >
                      {phrase(dictionary, "preset_save", language)}
                    </button>
                  )}
                </div>

                {FIELDS.map(({ key, labelKey }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {phrase(dictionary, labelKey, language)}
                    </label>
                    <textarea
                      value={editValues[key]}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      readOnly={selectedPreset.isSystem}
                      rows={6}
                      className={`w-full px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedPreset.isSystem
                          ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                          : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-[#DB2777] focus:border-[#DB2777]"
                      } focus:outline-none`}
                    />
                  </div>
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {phrase(dictionary, "preset_select_to_edit", language)}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

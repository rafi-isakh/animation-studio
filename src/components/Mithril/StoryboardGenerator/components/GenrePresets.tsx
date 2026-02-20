"use client";

import { useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Palette, Settings, Save, Plus } from "lucide-react";
import type { GenrePreset, GenrePresetData } from "../hooks/useGenrePresets";
import PresetManagerModal from "./PresetManagerModal";

export type { GenrePreset, GenrePresetData };

interface GenrePresetsProps {
  presets: GenrePreset[];
  onApply: (preset: GenrePreset) => void;
  onSaveCurrent: (id: string) => void;
  onAddPreset: (name: string, data: GenrePresetData) => void;
  onUpdatePreset: (id: string, data: Partial<GenrePresetData>) => void;
  onRenamePreset: (id: string, name: string) => void;
  onDeletePreset: (id: string) => void;
  currentConditions: GenrePresetData;
}

export default function GenrePresets({
  presets,
  onApply,
  onSaveCurrent,
  onAddPreset,
  onUpdatePreset,
  onRenamePreset,
  onDeletePreset,
  currentConditions,
}: GenrePresetsProps) {
  const { language, dictionary } = useLanguage();
  const [selectedId, setSelectedId] = useState<string>("");
  const [managerOpen, setManagerOpen] = useState(false);

  const selectedPreset = presets.find((p) => p.id === selectedId);

  const getPresetDisplayName = useCallback(
    (preset: GenrePreset) => {
      if (preset.isSystem && preset.nameKey) {
        return phrase(dictionary, preset.nameKey, language);
      }
      return preset.name || preset.id;
    },
    [dictionary, language]
  );

  const handleSelectPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedId(e.target.value);
  };

  const handleApply = () => {
    if (selectedPreset) {
      onApply(selectedPreset);
    }
  };

  const handleSaveCurrent = () => {
    if (selectedPreset && !selectedPreset.isSystem) {
      onSaveCurrent(selectedId);
    }
  };

  const handleAddFromCurrent = () => {
    const name = `${phrase(dictionary, "preset_custom", language)} ${presets.filter((p) => !p.isSystem).length + 1}`;
    onAddPreset(name, currentConditions);
  };

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <Palette className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <select
          onChange={handleSelectPreset}
          value={selectedId}
          className="px-3 py-2 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none cursor-pointer"
        >
          <option value="" disabled>
            {phrase(dictionary, "genre_select_preset", language)}
          </option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {getPresetDisplayName(preset)}
              {preset.isSystem ? ` (${phrase(dictionary, "preset_system", language)})` : ""}
            </option>
          ))}
        </select>

        {/* Apply button */}
        <button
          onClick={handleApply}
          disabled={!selectedPreset}
          className="px-3 py-2 text-sm font-medium text-white bg-[#DB2777] rounded-lg hover:bg-[#DB2777]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {phrase(dictionary, "preset_apply", language)}
        </button>

        {/* Save Current into selected custom preset */}
        {selectedPreset && !selectedPreset.isSystem && (
          <button
            onClick={handleSaveCurrent}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={phrase(dictionary, "preset_save_current", language)}
          >
            <Save className="w-4 h-4" />
            {phrase(dictionary, "preset_save_current", language)}
          </button>
        )}

        {/* New Preset from current conditions */}
        <button
          onClick={handleAddFromCurrent}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={phrase(dictionary, "preset_new_from_current", language)}
        >
          <Plus className="w-4 h-4" />
          {phrase(dictionary, "preset_new_from_current", language)}
        </button>

        {/* Manage Presets */}
        <button
          onClick={() => setManagerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title={phrase(dictionary, "preset_manage", language)}
        >
          <Settings className="w-4 h-4" />
          {phrase(dictionary, "preset_manage", language)}
        </button>
      </div>

      <PresetManagerModal
        open={managerOpen}
        onOpenChange={setManagerOpen}
        presets={presets}
        onUpdatePreset={onUpdatePreset}
        onRenamePreset={onRenamePreset}
        onDeletePreset={onDeletePreset}
        onAddPreset={onAddPreset}
      />
    </>
  );
}

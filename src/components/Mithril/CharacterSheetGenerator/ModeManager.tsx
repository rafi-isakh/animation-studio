"use client";

import React, { useState } from "react";
import { Plus, Trash2, Image, Loader2, Search } from "lucide-react";
import { Mode } from "./types";

interface ModeManagerProps {
  characterId: string;
  characterName: string;
  modes: Mode[];
  masterSheetImage: string | null;
  onAddMode: (mode: Omit<Mode, "id" | "imageBase64" | "imageUrl" | "isGenerating">) => void;
  onDeleteMode: (modeId: string) => void;
  onGenerateMode: (modeId: string) => void;
  onDetectModes: () => void;
  isDetecting?: boolean;
  disabled?: boolean;
}

/**
 * ModeManager Component
 *
 * Manages character modes/variations:
 * - List existing modes with their images
 * - Add new modes manually
 * - Delete modes
 * - Generate mode images
 * - Detect modes from text automatically
 */
export const ModeManager: React.FC<ModeManagerProps> = ({
  characterId,
  characterName,
  modes,
  masterSheetImage,
  onAddMode,
  onDeleteMode,
  onGenerateMode,
  onDetectModes,
  isDetecting = false,
  disabled = false,
}) => {
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [newModeName, setNewModeName] = useState("");
  const [newModeDescription, setNewModeDescription] = useState("");

  const handleAddMode = () => {
    if (!newModeName.trim() || !newModeDescription.trim()) return;

    // Build the prompt from the description
    const prompt = `${characterName} in ${newModeDescription}. Full body view and close-up view.`;

    onAddMode({
      name: `${characterName}-${newModeName}`,
      description: newModeDescription,
      prompt,
    });

    // Reset form
    setNewModeName("");
    setNewModeDescription("");
    setIsAddingMode(false);
  };

  const getImageSrc = (mode: Mode): string | null => {
    if (mode.imageUrl) {
      return mode.imageUrl;
    }
    if (mode.imageBase64) {
      return mode.imageBase64.startsWith("data:")
        ? mode.imageBase64
        : `data:image/webp;base64,${mode.imageBase64}`;
    }
    return null;
  };

  const canGenerateMode = !!masterSheetImage;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Modes / Variations ({modes.length})
        </h4>
        <div className="flex items-center gap-2">
          {/* Detect modes button */}
          <button
            onClick={onDetectModes}
            disabled={disabled || isDetecting}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDetecting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Search className="w-3 h-3" />
            )}
            Detect from Text
          </button>

          {/* Add mode button */}
          <button
            onClick={() => setIsAddingMode(true)}
            disabled={disabled}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-[#DB2777] text-white rounded hover:bg-[#BE185D] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            Add Mode
          </button>
        </div>
      </div>

      {/* Add mode form */}
      {isAddingMode && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Mode Name (e.g., &quot;Battle Armor&quot;, &quot;Ch5-Banquet&quot;)
            </label>
            <input
              type="text"
              value={newModeName}
              onChange={(e) => setNewModeName(e.target.value)}
              placeholder="Enter mode name..."
              className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-[#DB2777] focus:border-[#DB2777]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Description (what makes this mode different)
            </label>
            <textarea
              value={newModeDescription}
              onChange={(e) => setNewModeDescription(e.target.value)}
              placeholder="Describe the outfit, pose, or situation..."
              rows={2}
              className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-[#DB2777] focus:border-[#DB2777]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingMode(false)}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMode}
              disabled={!newModeName.trim() || !newModeDescription.trim()}
              className="px-3 py-1 text-xs bg-[#DB2777] text-white rounded hover:bg-[#BE185D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Modes list */}
      {modes.length === 0 ? (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500">
          <p className="text-sm">No modes yet</p>
          <p className="text-xs mt-1">
            Add modes manually or detect them from the story text.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {modes.map((mode) => {
            const imageSrc = getImageSrc(mode);

            return (
              <div
                key={mode.id}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
              >
                {/* Mode image */}
                <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                  {mode.isGenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-[#DB2777] animate-spin" />
                    </div>
                  ) : imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={mode.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <Image className="w-6 h-6 mb-1" />
                      <span className="text-xs">No image</span>
                    </div>
                  )}
                </div>

                {/* Mode info */}
                <div className="p-2">
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                    {mode.name}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                    {mode.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => onGenerateMode(mode.id)}
                      disabled={disabled || mode.isGenerating || !canGenerateMode}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-[#DB2777] text-white rounded hover:bg-[#BE185D] disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        !canGenerateMode
                          ? "Generate master sheet first"
                          : "Generate mode image"
                      }
                    >
                      <Image className="w-3 h-3" />
                      {mode.isGenerating ? "Generating..." : "Generate"}
                    </button>
                    <button
                      onClick={() => onDeleteMode(mode.id)}
                      disabled={disabled || mode.isGenerating}
                      className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Warning if no master sheet */}
      {!canGenerateMode && modes.length > 0 && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          Generate a master sheet first to enable mode image generation.
        </p>
      )}
    </div>
  );
};

export default ModeManager;
"use client";

import React from "react";
import {
  ArrowLeft,
  Crown,
  Image,
  Loader2,
  Download,
} from "lucide-react";
import { Character, Mode } from "./types";
import { ModeManager } from "./ModeManager";

interface CharacterDetailProps {
  character: Character;
  onBack: () => void;
  onUpdateField: (field: keyof Character, value: string | boolean) => void;
  onGenerateProfile: () => void;
  onGenerateMasterSheet: () => void;
  onAddMode: (mode: Omit<Mode, "id" | "imageBase64" | "imageUrl" | "isGenerating">) => void;
  onDeleteMode: (modeId: string) => void;
  onGenerateMode: (modeId: string) => void;
  onDetectModes: () => void;
  isDetectingModes?: boolean;
  disabled?: boolean;
}

/**
 * EditableField Component
 */
const EditableField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  disabled?: boolean;
}> = ({ label, value, onChange, rows = 2, disabled }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      disabled={disabled}
      className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-[#DB2777] focus:border-[#DB2777] disabled:opacity-50"
    />
  </div>
);

/**
 * CharacterDetail Component
 *
 * Full detail view for a single character with:
 * - Profile image section (1:1)
 * - Master sheet section (16:9)
 * - All editable fields
 * - Modes section
 */
export const CharacterDetail: React.FC<CharacterDetailProps> = ({
  character,
  onBack,
  onUpdateField,
  onGenerateProfile,
  onGenerateMasterSheet,
  onAddMode,
  onDeleteMode,
  onGenerateMode,
  onDetectModes,
  isDetectingModes = false,
  disabled = false,
}) => {
  const getImageSrc = (
    base64?: string,
    url?: string
  ): string | null => {
    if (url) return url;
    if (base64) {
      return base64.startsWith("data:")
        ? base64
        : `data:image/webp;base64,${base64}`;
    }
    return null;
  };

  const profileSrc = getImageSrc(
    character.profileImageBase64,
    character.profileImageUrl
  );
  const masterSheetSrc = getImageSrc(
    character.masterSheetImageBase64 || character.imageBase64,
    character.masterSheetImageUrl || character.imageUrl
  );

  const handleDownload = (imageSrc: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {character.isProtagonist && (
            <Crown className="w-5 h-5 text-yellow-500" />
          )}
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            {character.name}
          </h2>
          <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded capitalize">
            {character.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Profile & Fields */}
        <div className="space-y-4">
          {/* Profile Image Section */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Profile Image (1:1)
            </h3>
            <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden max-w-xs">
              {character.profileIsGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#DB2777] animate-spin" />
                </div>
              ) : profileSrc ? (
                <>
                  <img
                    src={profileSrc}
                    alt={`${character.name} profile`}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay button */}
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={() => handleDownload(profileSrc, `${character.name}-profile.png`)}
                      className="p-1.5 bg-black/50 hover:bg-black/70 rounded text-white"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Image className="w-8 h-8 mb-2" />
                  <span className="text-sm">No profile image</span>
                </div>
              )}
            </div>
            <button
              onClick={onGenerateProfile}
              disabled={disabled || character.profileIsGenerating}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#DB2777] text-white rounded-lg hover:bg-[#BE185D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image className="w-4 h-4" />
              {character.profileIsGenerating ? "Generating..." : profileSrc ? "Regenerate Profile" : "Generate Profile"}
            </button>
          </div>

          {/* Editable Fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Age
                </label>
                <input
                  type="text"
                  value={character.age}
                  onChange={(e) => onUpdateField("age", e.target.value)}
                  disabled={disabled}
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-[#DB2777] focus:border-[#DB2777] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Gender
                </label>
                <input
                  type="text"
                  value={character.gender}
                  onChange={(e) => onUpdateField("gender", e.target.value)}
                  disabled={disabled}
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-[#DB2777] focus:border-[#DB2777] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Protagonist
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    checked={character.isProtagonist}
                    onChange={(e) => onUpdateField("isProtagonist", e.target.checked)}
                    disabled={disabled}
                    className="w-4 h-4 text-[#DB2777] rounded focus:ring-[#DB2777]"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Yes</span>
                </label>
              </div>
            </div>

            <EditableField
              label="Traits (hair, eyes, features)"
              value={character.traits}
              onChange={(v) => onUpdateField("traits", v)}
              rows={2}
              disabled={disabled}
            />
            <EditableField
              label="Appearance"
              value={character.appearance}
              onChange={(v) => onUpdateField("appearance", v)}
              rows={3}
              disabled={disabled}
            />
            <EditableField
              label="Clothing"
              value={character.clothing}
              onChange={(v) => onUpdateField("clothing", v)}
              rows={2}
              disabled={disabled}
            />
            <EditableField
              label="Personality"
              value={character.personality}
              onChange={(v) => onUpdateField("personality", v)}
              rows={2}
              disabled={disabled}
            />
            <EditableField
              label="Background Story"
              value={character.backgroundStory}
              onChange={(v) => onUpdateField("backgroundStory", v)}
              rows={3}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Right Column - Master Sheet & Modes */}
        <div className="space-y-4">
          {/* Master Sheet Section */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Master Sheet (16:9)
            </h3>
            <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {character.masterSheetIsGenerating || character.isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#DB2777] animate-spin" />
                </div>
              ) : masterSheetSrc ? (
                <>
                  <img
                    src={masterSheetSrc}
                    alt={`${character.name} master sheet`}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay button */}
                  <div className="absolute bottom-2 right-2">
                    <button
                      onClick={() => handleDownload(masterSheetSrc, `${character.name}-mastersheet.png`)}
                      className="p-1.5 bg-black/50 hover:bg-black/70 rounded text-white"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Image className="w-8 h-8 mb-2" />
                  <span className="text-sm">No master sheet</span>
                  {!profileSrc && (
                    <span className="text-xs mt-1 text-yellow-500">
                      Generate profile first
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onGenerateMasterSheet}
              disabled={
                disabled ||
                character.masterSheetIsGenerating ||
                character.isGenerating ||
                !profileSrc
              }
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#DB2777] text-white rounded-lg hover:bg-[#BE185D] disabled:opacity-50 disabled:cursor-not-allowed"
              title={!profileSrc ? "Generate profile first" : ""}
            >
              <Image className="w-4 h-4" />
              {character.masterSheetIsGenerating || character.isGenerating
                ? "Generating..."
                : masterSheetSrc
                ? "Regenerate Master Sheet"
                : "Generate Master Sheet"}
            </button>
            {!profileSrc && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                Profile image required for master sheet generation.
              </p>
            )}
          </div>

          {/* Modes Section */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <ModeManager
              characterId={character.id}
              characterName={character.name}
              modes={character.modes}
              masterSheetImage={masterSheetSrc}
              onAddMode={onAddMode}
              onDeleteMode={onDeleteMode}
              onGenerateMode={onGenerateMode}
              onDetectModes={onDetectModes}
              isDetecting={isDetectingModes}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetail;
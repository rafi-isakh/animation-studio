"use client";

import React from "react";
import { Crown, User, Image, Loader2 } from "lucide-react";
import { Character } from "./types";

interface CharacterGridProps {
  characters: Character[];
  onSelectCharacter: (characterId: string) => void;
  onGenerateProfile: (characterId: string) => void;
  disabled?: boolean;
}

/**
 * CharacterGrid Component
 *
 * Displays characters in a responsive grid with:
 * - Profile image thumbnail (or placeholder)
 * - Character name
 * - Role badge (protagonist crown, antagonist, supporting, minor)
 * - Quick action buttons
 */
export const CharacterGrid: React.FC<CharacterGridProps> = ({
  characters,
  onSelectCharacter,
  onGenerateProfile,
  disabled = false,
}) => {
  const getProfileImageSrc = (char: Character): string | null => {
    // Try profile image first
    if (char.profileImageUrl) {
      return char.profileImageUrl;
    }
    if (char.profileImageBase64) {
      return char.profileImageBase64.startsWith("data:")
        ? char.profileImageBase64
        : `data:image/webp;base64,${char.profileImageBase64}`;
    }
    // Fall back to master sheet / legacy image
    if (char.masterSheetImageUrl || char.imageUrl) {
      return char.masterSheetImageUrl || char.imageUrl || null;
    }
    if (char.masterSheetImageBase64 || char.imageBase64) {
      const base64 = char.masterSheetImageBase64 || char.imageBase64;
      return base64.startsWith("data:")
        ? base64
        : `data:image/webp;base64,${base64}`;
    }
    return null;
  };

  const getRoleBadge = (char: Character) => {
    if (char.isProtagonist) {
      return (
        <div className="absolute top-2 left-2 bg-yellow-500 rounded-full p-1" title="Protagonist">
          <Crown className="w-3 h-3 text-white" />
        </div>
      );
    }

    const roleColors: Record<string, string> = {
      protagonist: "bg-yellow-500",
      antagonist: "bg-red-500",
      supporting: "bg-blue-500",
      minor: "bg-gray-500",
    };

    const bgColor = roleColors[char.role] || roleColors.minor;

    return (
      <div
        className={`absolute top-2 left-2 ${bgColor} rounded-full px-2 py-0.5`}
        title={char.role}
      >
        <span className="text-[10px] text-white font-medium capitalize">
          {char.role}
        </span>
      </div>
    );
  };

  if (characters.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No characters extracted yet</p>
        <p className="text-xs mt-1">
          Analyze the story text to extract characters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {characters.map((char) => {
        const profileSrc = getProfileImageSrc(char);
        const isGenerating = char.profileIsGenerating || char.isGenerating;

        return (
          <div
            key={char.id}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-[#DB2777] transition-all cursor-pointer"
            onClick={() => !disabled && onSelectCharacter(char.id)}
          >
            {/* Image */}
            <div className="relative aspect-square bg-gray-200 dark:bg-gray-700">
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#DB2777] animate-spin" />
                </div>
              ) : profileSrc ? (
                <img
                  src={profileSrc}
                  alt={char.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <User className="w-8 h-8 mb-1" />
                  <span className="text-xs">No image</span>
                </div>
              )}

              {/* Role badge */}
              {getRoleBadge(char)}

              {/* Generate profile button (on hover) */}
              {!profileSrc && !isGenerating && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateProfile(char.id);
                    }}
                    disabled={disabled}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#DB2777] text-white text-xs rounded-lg hover:bg-[#BE185D]"
                  >
                    <Image className="w-3 h-3" />
                    Generate
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {char.name}
              </h4>
              {char.age && char.gender && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {char.age}, {char.gender}
                </p>
              )}
              {char.traits && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                  {char.traits}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CharacterGrid;
"use client";

import React, { useRef } from "react";
import { Upload, X, Check } from "lucide-react";
import { StyleSlot } from "./types";

interface StyleSlotsProps {
  slots: StyleSlot[];
  activeIndex: number | null;
  onUpload: (index: number, file: File) => void;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
  disabled?: boolean;
}

/**
 * StyleSlots Component
 *
 * Displays 4 uploadable style reference slots for character generation.
 * Users can:
 * - Upload an image to any slot
 * - Select one slot as the active style reference
 * - Delete images from slots
 *
 * The active style is used as a reference for all character image generations.
 */
export const StyleSlots: React.FC<StyleSlotsProps> = ({
  slots,
  activeIndex,
  onUpload,
  onSelect,
  onDelete,
  disabled = false,
}) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(index, file);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const handleSlotClick = (index: number) => {
    const slot = slots[index];
    if (slot.imageBase64 || slot.imageUrl) {
      // If slot has an image, select it
      onSelect(index);
    } else {
      // If slot is empty, trigger file upload
      fileInputRefs.current[index]?.click();
    }
  };

  const getImageSrc = (slot: StyleSlot): string | null => {
    if (slot.imageUrl) {
      return slot.imageUrl;
    }
    if (slot.imageBase64) {
      return slot.imageBase64.startsWith("data:")
        ? slot.imageBase64
        : `data:image/webp;base64,${slot.imageBase64}`;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Style Reference Slots
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Upload style reference images. The selected style will be applied to all character generations.
      </p>
      <div className="grid grid-cols-4 gap-3">
        {slots.map((slot, index) => {
          const imageSrc = getImageSrc(slot);
          const isActive = activeIndex === index;
          const hasImage = !!imageSrc;

          return (
            <div key={slot.id} className="relative">
              {/* Hidden file input */}
              <input
                ref={(el) => {
                  fileInputRefs.current[index] = el;
                }}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(index, e)}
                className="hidden"
                disabled={disabled}
              />

              {/* Slot container */}
              <div
                onClick={() => !disabled && handleSlotClick(index)}
                className={`
                  relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all
                  ${
                    isActive
                      ? "ring-2 ring-[#DB2777] ring-offset-2 dark:ring-offset-gray-800"
                      : "border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  }
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                {hasImage ? (
                  <>
                    {/* Image */}
                    <img
                      src={imageSrc}
                      alt={slot.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute top-1 left-1 bg-[#DB2777] rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Delete button (appears on hover) */}
                    {!disabled && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(index);
                        }}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ opacity: 1 }} // Always visible for now
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}

                    {/* Click to select overlay */}
                    {!isActive && !disabled && (
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white text-xs font-medium opacity-0 hover:opacity-100">
                          Click to select
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  // Empty slot
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
                    <Upload className="w-5 h-5 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Style {index + 1}</span>
                  </div>
                )}
              </div>

              {/* Slot label */}
              <div className="mt-1 text-center">
                <span
                  className={`text-xs ${
                    isActive
                      ? "text-[#DB2777] font-medium"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {slot.name || `Style ${index + 1}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* No active style message */}
      {activeIndex === null && slots.some((s) => s.imageBase64 || s.imageUrl) && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
          Click on a style image to select it as the active reference.
        </p>
      )}
    </div>
  );
};

/**
 * Helper to create empty style slots
 */
export const createEmptyStyleSlots = (): StyleSlot[] => {
  return Array.from({ length: 4 }, (_, index) => ({
    id: `style-slot-${index}`,
    name: `Style ${index + 1}`,
    imageBase64: "",
    imageUrl: undefined,
  }));
};

export default StyleSlots;
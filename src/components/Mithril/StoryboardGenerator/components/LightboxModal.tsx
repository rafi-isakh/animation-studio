"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";

interface LightboxModalProps {
  image: { base64: string; clipName: string };
  aspectRatio: "16:9" | "9:16";
  onClose: () => void;
}

export default function LightboxModal({ image, aspectRatio, onClose }: LightboxModalProps) {
  const { language, dictionary } = useLanguage();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with clip name and close button */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {phrase(dictionary, "table_clip", language)} {image.clipName}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Image container */}
        <div className="p-4">
          <div
            className={`relative ${aspectRatio === "9:16" ? "w-[50vh] max-w-[80vw]" : "w-[80vw] max-w-[1200px]"}`}
            style={{ aspectRatio: aspectRatio.replace(":", "/") }}
          >
            <Image
              src={`data:image/jpeg;base64,${image.base64}`}
              alt={`Clip ${image.clipName}`}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>
    </div>
  );
}

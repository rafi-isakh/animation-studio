"use client";

import { Play, Download, AlertCircle, Loader2, Video, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import type { SoraVideoClip, ClipStatus } from "./types";

// Helper to check if string is a URL
function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}

interface ClipCardProps {
  clip: SoraVideoClip;
  onGenerate: (clipIndex: number, sceneIndex: number) => void;
  onRegenerate: (clipIndex: number, sceneIndex: number) => void;
  isGeneratingAll: boolean;
}

const StatusBadge = ({ status }: { status: ClipStatus }) => {
  const { language, dictionary } = useLanguage();

  const styles: Record<ClipStatus, string> = {
    pending: "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    generating: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    failed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  };

  const labelKeys: Record<ClipStatus, string> = {
    pending: "sora_status_pending",
    generating: "sora_status_generating",
    completed: "sora_status_done",
    failed: "sora_status_failed",
  };

  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[status]}`}>
      {phrase(dictionary, labelKeys[status], language)}
    </span>
  );
};

export default function ClipCard({ clip, onGenerate, onRegenerate, isGeneratingAll }: ClipCardProps) {
  const { language, dictionary } = useLanguage();
  const { clipIndex, sceneIndex, sceneTitle, imageBase64, videoUrl, status, error } = clip;

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `clip_${sceneIndex + 1}_${clipIndex + 1}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
      {/* Image/Video Preview */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-800">
        {status === "completed" && videoUrl ? (
          // Show video player
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          />
        ) : imageBase64 ? (
          // Show storyboard image (S3 URL or base64)
          <Image
            src={isUrl(imageBase64) ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`}
            alt={`Clip ${sceneIndex + 1}-${clipIndex + 1}`}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          // No image placeholder
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <Video size={32} className="opacity-50" />
          </div>
        )}

        {/* Generating overlay */}
        {status === "generating" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Error overlay */}
        {status === "failed" && (
          <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {/* Info & Actions */}
      <div className="p-2 space-y-2">
        {/* Title and status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
            {sceneTitle} #{clipIndex + 1}
          </span>
          <StatusBadge status={status} />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-2">
            {error}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-1">
          {status === "completed" && videoUrl ? (
            <>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-colors"
              >
                <Download size={14} />
                <span>{phrase(dictionary, "sora_clip_download", language)}</span>
              </button>
              <button
                onClick={() => onRegenerate(clipIndex, sceneIndex)}
                disabled={isGeneratingAll}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={phrase(dictionary, "sora_clip_regenerate", language)}
              >
                <RefreshCw size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => onGenerate(clipIndex, sceneIndex)}
              disabled={status === "generating" || isGeneratingAll || !imageBase64}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-[#DB2777] hover:bg-[#BE185D] text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={14} />
              <span>{phrase(dictionary, "sora_clip_generate", language)}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

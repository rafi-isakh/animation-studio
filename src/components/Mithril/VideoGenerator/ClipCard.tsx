"use client";

import { useState } from "react";
import {
  Play,
  Download,
  AlertCircle,
  Loader2,
  Video,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Edit3,
} from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import type { VideoClip, ClipStatus } from "./types";

// Helper to check if string is a URL
function isUrl(str: string): boolean {
  return str.startsWith("http://") || str.startsWith("https://");
}

interface ClipCardProps {
  clip: VideoClip;
  onGenerate: (clipIndex: number, sceneIndex: number, customPrompt?: string) => void;
  onRegenerate: (clipIndex: number, sceneIndex: number, customPrompt?: string) => void;
  onUpdatePrompt: (clipIndex: number, sceneIndex: number, prompt: string) => void;
  isGeneratingAll: boolean;
}

const StatusBadge = ({ status }: { status: ClipStatus }) => {
  const { language, dictionary } = useLanguage();

  const styles: Record<ClipStatus, string> = {
    pending: "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    generating:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    completed:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    failed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    retrying:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  };

  const labelKeys: Record<ClipStatus, string> = {
    pending: "sora_status_pending",
    generating: "sora_status_generating",
    completed: "sora_status_done",
    failed: "sora_status_failed",
    retrying: "sora_status_retrying",
  };

  // Fallback labels in case translation keys don't exist
  const fallbackLabels: Record<ClipStatus, string> = {
    pending: "Pending",
    generating: "Generating",
    completed: "Done",
    failed: "Failed",
    retrying: "Retrying",
  };

  const label = phrase(dictionary, labelKeys[status], language) || fallbackLabels[status];

  return (
    <span
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[status]}`}
    >
      {label}
    </span>
  );
};

export default function ClipCard({
  clip,
  onGenerate,
  onRegenerate,
  onUpdatePrompt,
  isGeneratingAll,
}: ClipCardProps) {
  const { language, dictionary } = useLanguage();
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState("");

  const {
    clipIndex,
    sceneIndex,
    sceneTitle,
    imageBase64,
    videoUrl,
    status,
    error,
    soraVideoPrompt,
    videoPrompt,
    customPrompt,
  } = clip;

  // Use custom prompt if set, otherwise fall back to soraVideoPrompt or videoPrompt
  const currentPrompt = customPrompt || soraVideoPrompt || videoPrompt || "";

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!videoUrl || isDownloading) return;

    setIsDownloading(true);
    try {
      // Fetch the video as a blob to handle CORS properly
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      const blob = await response.blob();

      // Create an Object URL for the blob
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `clip_${sceneIndex + 1}_${clipIndex + 1}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the Object URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTogglePrompt = () => {
    if (!isPromptExpanded) {
      // Initialize edited prompt with current prompt when expanding
      setEditedPrompt(currentPrompt);
    }
    setIsPromptExpanded(!isPromptExpanded);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedPrompt(e.target.value);
  };

  const handleSavePrompt = () => {
    onUpdatePrompt(clipIndex, sceneIndex, editedPrompt);
    setIsPromptExpanded(false);
  };

  const handleGenerateWithPrompt = () => {
    // Save the prompt first if it was edited
    if (editedPrompt && editedPrompt !== currentPrompt) {
      onUpdatePrompt(clipIndex, sceneIndex, editedPrompt);
    }
    onGenerate(clipIndex, sceneIndex, editedPrompt || currentPrompt);
    setIsPromptExpanded(false);
  };

  const handleRegenerateWithPrompt = () => {
    // Save the prompt first if it was edited
    if (editedPrompt && editedPrompt !== currentPrompt) {
      onUpdatePrompt(clipIndex, sceneIndex, editedPrompt);
    }
    onRegenerate(clipIndex, sceneIndex, editedPrompt || currentPrompt);
    setIsPromptExpanded(false);
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
            src={
              isUrl(imageBase64)
                ? imageBase64
                : `data:image/jpeg;base64,${imageBase64}`
            }
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

        {/* Retrying overlay */}
        {status === "retrying" && (
          <div className="absolute inset-0 bg-orange-900/50 flex items-center justify-center flex-col gap-1">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <span className="text-white text-xs">Retrying...</span>
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

        {/* Error message - show for failed and retrying status */}
        {(status === "failed" || status === "retrying") && error && (
          <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-2">
            {error}
          </p>
        )}

        {/* Prompt Editor Toggle */}
        <button
          onClick={handleTogglePrompt}
          className="w-full flex items-center justify-between gap-1 py-1 px-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-[10px] font-medium rounded transition-colors"
        >
          <span className="flex items-center gap-1">
            <Edit3 size={12} />
            {customPrompt ? "Custom Prompt" : phrase(dictionary, "prompt", language)}
          </span>
          {isPromptExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Expanded Prompt Editor */}
        {isPromptExpanded && (
          <div className="space-y-2">
            <textarea
              value={editedPrompt}
              onChange={handlePromptChange}
              placeholder="Enter video generation prompt..."
              className="w-full h-24 p-2 text-[10px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-1 focus:ring-[#DB2777]"
            />
            <div className="flex gap-1">
              <button
                onClick={handleSavePrompt}
                className="flex-1 py-1 px-2 bg-gray-500 hover:bg-gray-600 text-white text-[10px] font-medium rounded transition-colors"
              >
                {phrase(dictionary, "sora_save", language)}
              </button>
              {status === "completed" ? (
                <button
                  onClick={handleRegenerateWithPrompt}
                  disabled={isGeneratingAll || !editedPrompt.trim()}
                  className="flex-1 py-1 px-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phrase(dictionary, "sora_clip_regenerate", language)}
                </button>
              ) : (
                <button
                  onClick={handleGenerateWithPrompt}
                  disabled={status === "generating" || status === "retrying" || isGeneratingAll || !editedPrompt.trim()}
                  className="flex-1 py-1 px-2 bg-[#DB2777] hover:bg-[#BE185D] text-white text-[10px] font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {phrase(dictionary, "generateButton", language)}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action buttons (only show when prompt editor is collapsed) */}
        {!isPromptExpanded && (
          <div className="flex gap-1">
            {status === "completed" && videoUrl ? (
              <>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
                >
                  {isDownloading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
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
                disabled={status === "generating" || status === "retrying" || isGeneratingAll}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-[#DB2777] hover:bg-[#BE185D] text-white text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={14} />
                <span>{phrase(dictionary, "sora_clip_generate", language)}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
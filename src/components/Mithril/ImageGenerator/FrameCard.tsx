"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import type { FrameCardProps } from "./types";

const ImageIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-12 w-12 text-slate-700"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export default function FrameCard({
  frame,
  onPromptChange,
  onRemixPromptChange,
  onBgChange,
  onRefChange,
  onGenerate,
  onRemix,
  onEdit,
  onDownload,
  onOpenModal,
  isBatchRunning,
  globalIdx,
  characterAssets,
}: FrameCardProps) {
  const { language, dictionary } = useLanguage();
  const [isRemixOpen, setIsRemixOpen] = useState(false);

  return (
    <div
      className={`bg-slate-800/80 rounded-lg p-3 flex flex-col gap-2 shadow-lg border border-slate-700/50 ${
        frame.isLoading ? "ring-2 ring-cyan-500 animate-pulse" : ""
      }`}
    >
      {/* Image Preview */}
      <div
        className="relative group aspect-video bg-slate-900 flex items-center justify-center rounded overflow-hidden cursor-pointer"
        onClick={() => frame.imageUrl && onOpenModal(frame.imageUrl)}
      >
        {frame.isLoading && !frame.remixImageUrl ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className={`w-8 h-8 animate-spin ${frame.status === 'retrying' ? 'text-orange-500' : 'text-cyan-500'}`} />
            {frame.status === 'retrying' && (
              <span className="text-[10px] text-orange-400 font-bold">Retrying...</span>
            )}
          </div>
        ) : frame.imageUrl ? (
          <img
            src={frame.imageUrl.startsWith("data:") ? frame.imageUrl : `${frame.imageUrl}${frame.imageUpdatedAt ? `?t=${frame.imageUpdatedAt}` : ""}`}
            alt={`Frame ${frame.frameLabel}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <ImageIcon />
        )}
      </div>

      {/* Controls */}
      <div className="space-y-2">
        {/* Header Row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-cyan-400 bg-cyan-900/40 px-2 py-0.5 rounded">
              {frame.frameLabel}
            </span>
            <span className="text-[10px] font-black text-yellow-500">
              #{frame.frameNumber}
            </span>
            {frame.status === 'retrying' && (
              <span className="text-[10px] font-black text-orange-400 bg-orange-900/40 px-2 py-0.5 rounded animate-pulse">
                RETRYING
              </span>
            )}
          </div>
          <div className="flex gap-1">
            {frame.imageUrl && (
              <button
                onClick={() => onDownload(frame.id)}
                className="px-2 py-0.5 text-[10px] bg-slate-700 text-white rounded font-bold hover:bg-slate-600 transition-colors"
                title={phrase(dictionary, "imagegen_download", language) || "Download"}
              >
                ⬇️
              </button>
            )}
            <button
              onClick={() => onGenerate(frame.id)}
              disabled={isBatchRunning || frame.isLoading}
              className="px-2 py-0.5 text-[10px] bg-cyan-600 text-white rounded font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50 min-w-[50px]"
            >
              {frame.isLoading && !frame.remixImageUrl ? "..." : frame.imageUrl ? phrase(dictionary, "imagegen_regenerate", language) || "Regenerate" : phrase(dictionary, "imagegen_generate", language) || "Generate"}
            </button>
          </div>
        </div>

        {/* Original Prompt */}
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase">
            {phrase(dictionary, "imagegen_original_prompt", language) || "Original Prompt"}
          </label>
          <textarea
            value={frame.prompt}
            onChange={(e) => onPromptChange(frame.id, e.target.value)}
            className="w-full text-[11px] text-slate-300 bg-slate-900/50 p-2 rounded border border-slate-700 focus:border-cyan-500 outline-none resize-none no-scrollbar"
            rows={2}
          />
        </div>

        {/* Remix Section - Only show if image exists */}
        {frame.imageUrl && (
          <div className="pt-1">
            <button
              onClick={() => setIsRemixOpen(!isRemixOpen)}
              className={`w-full py-1 text-[10px] font-black uppercase rounded border transition-all ${
                isRemixOpen
                  ? "bg-purple-600 border-purple-400 text-white"
                  : "bg-slate-900/40 border-slate-700 text-purple-400 hover:bg-slate-700"
              }`}
            >
              {isRemixOpen ? phrase(dictionary, "imagegen_close_remix", language) || "Close Remix Panel" : phrase(dictionary, "imagegen_open_remix", language) || "Open Remix / In-Between"}
            </button>

            {isRemixOpen && (
              <div className="mt-2 p-2 bg-purple-900/20 border border-purple-500/30 rounded space-y-2">
                {/* Remix Image Preview */}
                {frame.remixImageUrl && (
                  <div
                    className="relative group aspect-video bg-black rounded overflow-hidden cursor-pointer mb-2 border border-purple-500/50"
                    onClick={() => onOpenModal(frame.remixImageUrl!)}
                  >
                    {frame.isLoading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent animate-spin rounded-full"></div>
                      </div>
                    ) : (
                      <div className="absolute top-1 right-1 z-10 flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(frame.id, true);
                          }}
                          className="w-6 h-6 bg-slate-800/80 rounded flex items-center justify-center text-[10px] hover:bg-slate-700"
                          title={phrase(dictionary, "imagegen_download_remix", language) || "Download Remix"}
                        >
                          ⬇️
                        </button>
                      </div>
                    )}
                    <img
                      src={frame.remixImageUrl}
                      alt={`Remix ${frame.frameLabel}`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-purple-600/80 py-0.5 text-center">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">
                        {phrase(dictionary, "imagegen_remix_result", language) || "Remix Result"}
                      </span>
                    </div>
                  </div>
                )}

                <label className="text-[9px] font-bold text-purple-400 uppercase">
                  {phrase(dictionary, "imagegen_remix_prompt", language) || "Remix Prompt (Reference original image)"}
                </label>
                <textarea
                  value={frame.remixPrompt || ""}
                  onChange={(e) => onRemixPromptChange(frame.id, e.target.value)}
                  placeholder={phrase(dictionary, "imagegen_remix_placeholder", language) || "Enter changes or in-between action..."}
                  className="w-full text-[11px] text-purple-100 bg-slate-900/80 p-2 rounded border border-purple-500/30 focus:border-purple-400 outline-none resize-none no-scrollbar"
                  rows={3}
                />
                <button
                  onClick={() => onRemix(frame.id)}
                  disabled={frame.isLoading || !frame.remixPrompt}
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[10px] font-bold rounded shadow-lg transition-all uppercase flex items-center justify-center gap-2"
                >
                  {frame.isLoading ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                  ) : null}
                  {frame.isLoading ? phrase(dictionary, "imagegen_remixing", language) || "Remixing..." : phrase(dictionary, "imagegen_run_remix", language) || "Run Remix"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Controls Row */}
        <div className="grid grid-cols-2 gap-1">
          <input
            type="text"
            value={frame.backgroundId}
            onChange={(e) => onBgChange(frame.id, e.target.value)}
            className="text-[10px] bg-slate-900/50 p-1.5 rounded border border-slate-700 text-slate-300 focus:border-cyan-500 outline-none"
            placeholder={phrase(dictionary, "imagegen_bg_id", language) || "BG ID"}
            title={phrase(dictionary, "imagegen_bg_id_tooltip", language) || "Background ID (e.g., bg-001-0). Format: bgId-angleIndex"}
          />
          <div className="flex gap-1">
            <input
              type="text"
              value={frame.refFrame}
              onChange={(e) => onRefChange(frame.id, e.target.value)}
              className="w-12 text-[10px] bg-slate-900/50 p-1.5 rounded border border-slate-700 text-slate-300 focus:border-cyan-500 outline-none"
              placeholder={phrase(dictionary, "imagegen_ref", language) || "Ref#"}
              title={phrase(dictionary, "imagegen_ref_tooltip", language) || "Reference frame label (e.g., 1A). Use this frame's image as reference."}
            />
            <button
              onClick={() => onEdit(frame.id)}
              className="flex-1 py-1 bg-slate-700 text-[10px] text-slate-300 rounded hover:bg-slate-600 transition-colors"
              title={phrase(dictionary, "imagegen_edit", language) || "Edit with Drawing Tools"}
            >
              ✏️
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {frame.error && (
        <p className="text-[10px] text-rose-400 mt-1">{frame.error}</p>
      )}
    </div>
  );
}

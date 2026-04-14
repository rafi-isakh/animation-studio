"use client";

import { Loader2, Video, Download, Play, Wand2 } from "lucide-react";
import type { NsfwT2VClip } from "./types";

interface ClipCardProps {
  clip: NsfwT2VClip;
  onPromptChange: (clipNumber: number, value: string) => void;
  onGenerate: (clipNumber: number) => void;
  onDownload: (clipNumber: number) => void;
  onRevisePrompt: (clipNumber: number) => void;
  isGeneratingAll: boolean;
  isRevisingPrompt?: boolean;
}

export default function ClipCard({
  clip,
  onPromptChange,
  onGenerate,
  onDownload,
  onRevisePrompt,
  isGeneratingAll,
  isRevisingPrompt = false,
}: ClipCardProps) {
  const isLoading = clip.status === 'generating';
  const hasVideo = !!clip.videoUrl;

  return (
    <div className={`bg-slate-800/80 rounded-xl border flex flex-col gap-3 overflow-hidden shadow-lg transition-all ${
      isLoading ? 'border-cyan-500 ring-1 ring-cyan-500/30' :
      hasVideo ? 'border-green-600/50' :
      'border-slate-700/50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-cyan-400 bg-cyan-900/40 px-2 py-0.5 rounded">
            Clip {clip.clipNumber}
          </span>
          {clip.promptVariant && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
              clip.promptVariant === 'A' ? 'bg-purple-900/50 text-purple-300' :
              clip.promptVariant === 'B' ? 'bg-blue-900/50 text-blue-300' :
              'bg-orange-900/50 text-orange-300'
            }`}>
              {clip.promptVariant}
            </span>
          )}
          {clip.status === 'retrying' && (
            <span className="text-[9px] font-black text-orange-400 bg-orange-900/40 px-2 py-0.5 rounded animate-pulse">
              RETRYING
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {hasVideo && (
            <button
              onClick={() => onDownload(clip.clipNumber)}
              className="px-2 py-0.5 text-[10px] bg-slate-700 text-white rounded font-bold hover:bg-slate-600 transition-colors"
              title="Download video"
            >
              <Download className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onGenerate(clip.clipNumber)}
            disabled={isGeneratingAll || isLoading}
            className="px-3 py-0.5 text-[10px] bg-cyan-600 text-white rounded font-bold hover:bg-cyan-500 disabled:opacity-50 transition-colors min-w-[70px] text-center"
          >
            {isLoading ? (
              <span className="flex items-center gap-1 justify-center">
                <Loader2 className="w-3 h-3 animate-spin" />
              </span>
            ) : hasVideo ? 'Regen' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Image + Video row */}
      <div className="grid grid-cols-2 gap-2 px-3">
        {/* Source image */}
        <div className="aspect-video bg-slate-900 rounded overflow-hidden flex items-center justify-center relative">
          {clip.imageRef ? (
            <img
              src={clip.imageRef}
              alt={`Clip ${clip.clipNumber} source`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-40">
              <Video className="w-6 h-6 text-slate-500" />
              <span className="text-[9px] text-slate-500">No image</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Source</span>
          </div>
        </div>

        {/* Generated video */}
        <div className="aspect-video bg-slate-900 rounded overflow-hidden flex items-center justify-center relative">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
              <span className="text-[9px] text-cyan-400">Generating...</span>
            </div>
          ) : hasVideo ? (
            <video
              src={clip.videoUrl!}
              className="w-full h-full object-contain"
              controls
              loop
              playsInline
            />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-30">
              <Play className="w-6 h-6 text-slate-500" />
              <span className="text-[9px] text-slate-500">No video yet</span>
            </div>
          )}
          {hasVideo && (
            <div className="absolute bottom-0 left-0 right-0 bg-green-600/60 py-0.5 text-center pointer-events-none">
              <span className="text-[8px] font-black text-white uppercase tracking-wider">Done</span>
            </div>
          )}
        </div>
      </div>

      {/* Video prompt */}
      <div className="px-3 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-bold text-slate-500 uppercase">Video Prompt</label>
          {(clip.promptVariant === 'B' || clip.promptVariant === 'C') && (
            <button
              onClick={() => onRevisePrompt(clip.clipNumber)}
              disabled={isRevisingPrompt || isGeneratingAll}
              className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded bg-violet-700/60 text-violet-300 hover:bg-violet-600/80 disabled:opacity-50 transition-colors"
              title="Revise this prompt to match the image perspective"
            >
              {isRevisingPrompt ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Wand2 className="w-2.5 h-2.5" />
              )}
              {isRevisingPrompt ? "Revising..." : "Revise Prompt"}
            </button>
          )}
        </div>
        <textarea
          value={clip.videoPrompt}
          onChange={(e) => onPromptChange(clip.clipNumber, e.target.value)}
          placeholder="Enter video prompt..."
          className="w-full text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-700 focus:border-cyan-500 outline-none resize-none no-scrollbar"
          rows={2}
        />
        {clip.error && (
          <p className="text-[10px] text-rose-400">{clip.error}</p>
        )}
      </div>
    </div>
  );
}

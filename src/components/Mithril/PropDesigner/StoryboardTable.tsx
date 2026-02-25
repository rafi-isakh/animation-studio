"use client";

import React, { useState } from "react";

// Matches CSV: Scene,Clip,Length,Accumulated Time,Background ID,Background Prompt,Story,
// Image Prompt (Start),Image Prompt (End),Video Prompt,Sora Video Prompt,
// Dialogue (Ko),Dialogue (En),SFX (Ko),SFX (En),BGM (Ko),BGM (En),Reference Image
interface Clip {
  story?: string;
  imagePrompt?: string;
  imagePromptEnd?: string;
  videoPrompt?: string;
  dialogue?: string;
  dialogueEn?: string;
  backgroundId?: string;
  backgroundPrompt?: string;
  length?: string;
  accumulatedTime?: string;
  soraVideoPrompt?: string;
  sfx?: string;
  sfxEn?: string;
  bgm?: string;
  bgmEn?: string;
  refFileName?: string;
}

interface Scene {
  clips: Clip[];
}

interface StoryboardTableProps {
  scenes: Scene[];
  totalClips: number;
  onRequestImageSample?: (sceneIndex: number, clipIndex: number) => Promise<void>;
  generatedImages?: Record<string, string>; // key: "sIdx-cIdx", value: base64 or URL
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-cyan-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function StoryboardTable({ scenes, totalClips, onRequestImageSample, generatedImages = {} }: StoryboardTableProps) {
  const allHeaders = [
    "클립",          // 0
    "Visual",        // 1 - GEN button / generated image
    "길이",          // 2
    "누적 시간",      // 3
    "배경 ID",       // 4
    "배경 프롬프트",   // 5
    "스토리",         // 6
    "Image Prompt (Start)", // 7
    "Image Prompt (End)",   // 8
    "비디오 프롬프트",  // 9
    "Sora 비디오 프롬프트", // 10
    "Reference Image", // 11 - refFileName
    "대사 (Ko)",     // 12
    "대사 (En)",     // 13
    "효과음 (Ko)",   // 14
    "효과음 (En)",   // 15
    "BGM (Ko)",      // 16
    "BGM (En)",      // 17
  ];

  // Default collapsed columns - show only essential ones initially
  // Visible: 클립(0), 스토리(6), Image Prompt Start(7), 비디오 프롬프트(9), 대사 Ko(12)
  const [collapsedCols, setCollapsedCols] = useState<Set<number>>(
    new Set([1, 2, 3, 5, 8, 10, 11, 13, 14, 15, 16, 17])
  );

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const toggleColumn = (idx: number) => {
    const next = new Set(collapsedCols);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCollapsedCols(next);
  };

  const handleGenImage = async (sIdx: number, cIdx: number) => {
    if (!onRequestImageSample) return;
    const key = `${sIdx}-${cIdx}`;
    setLoadingMap(prev => ({ ...prev, [key]: true }));
    try {
      await onRequestImageSample(sIdx, cIdx);
    } finally {
      setLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  if (scenes.length === 0) {
    return null;
  }

  // Helper to get cell value safely
  const getVal = (clip: Clip, field: keyof Clip): string => {
    const val = clip[field];
    return typeof val === "string" ? val : "-";
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header with column toggles */}
      <div className="bg-gray-800 border-b border-gray-700 p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-300">Storyboard Data</h3>
            <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
              {totalClips} clips
            </span>
          </div>
        </div>

        {/* Column toggles */}
        <div className="flex flex-wrap items-center gap-1 overflow-x-auto">
          <span className="text-[9px] font-black text-gray-500 uppercase px-2 mr-1 border-r border-gray-700 shrink-0">
            Cols
          </span>
          {allHeaders.map((header, idx) => (
            <button
              key={idx}
              onClick={() => toggleColumn(idx)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors shrink-0 ${
                collapsedCols.has(idx)
                  ? "bg-gray-800 border-gray-700 text-gray-500"
                  : "bg-cyan-900/40 border-cyan-700 text-cyan-400"
              }`}
            >
              {header}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[350px]">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr>
              {allHeaders.map(
                (header, idx) =>
                  !collapsedCols.has(idx) && (
                    <th
                      key={idx}
                      scope="col"
                      className="px-3 py-2 text-left text-[9px] font-black text-gray-500 uppercase tracking-tighter bg-gray-800 border-r border-gray-700/30 whitespace-nowrap"
                    >
                      {header}
                    </th>
                  )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900">
            {scenes.flatMap((scene, sIdx) =>
              scene.clips.map((clip, cIdx) => {
                const key = `${sIdx}-${cIdx}`;
                return (
                  <tr
                    key={key}
                    className="hover:bg-gray-800/40 transition-colors"
                  >
                    {/* 0: 클립 (Clip) */}
                    {!collapsedCols.has(0) && (
                      <td className="px-3 py-2 text-[10px] text-cyan-500 font-mono border-r border-gray-800/50 whitespace-nowrap">
                        {`${sIdx + 1}.${cIdx + 1}`}
                      </td>
                    )}
                    {/* 1: Visual (GEN button / generated image) */}
                    {!collapsedCols.has(1) && (
                      <td className="px-3 py-2 border-r border-gray-800/50">
                        {generatedImages[key] ? (
                          <img
                            src={generatedImages[key]}
                            className="w-20 h-12 object-cover rounded border border-gray-700 cursor-pointer hover:border-cyan-500 transition-colors"
                            onClick={() => handleGenImage(sIdx, cIdx)}
                            title="Click to regenerate"
                          />
                        ) : (
                          <button
                            onClick={() => handleGenImage(sIdx, cIdx)}
                            disabled={!onRequestImageSample || loadingMap[key]}
                            className="w-20 h-12 border border-dashed border-gray-700 rounded text-[8px] font-black text-gray-600 hover:text-cyan-500 hover:border-cyan-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {loadingMap[key] ? <Spinner /> : "GEN"}
                          </button>
                        )}
                      </td>
                    )}
                    {/* 2: 길이 (Length) */}
                    {!collapsedCols.has(2) && (
                      <td className="px-3 py-2 text-[10px] text-gray-400 border-r border-gray-800/50">
                        {getVal(clip, "length")}
                      </td>
                    )}
                    {/* 3: 누적 시간 (Accumulated Time) */}
                    {!collapsedCols.has(3) && (
                      <td className="px-3 py-2 text-[10px] text-gray-400 font-mono border-r border-gray-800/50">
                        {getVal(clip, "accumulatedTime")}
                      </td>
                    )}
                    {/* 4: 배경 ID (Background ID) */}
                    {!collapsedCols.has(4) && (
                      <td className="px-3 py-2 text-[10px] text-purple-400 font-mono border-r border-gray-800/50">
                        {getVal(clip, "backgroundId")}
                      </td>
                    )}
                    {/* 5: 배경 프롬프트 (Background Prompt) */}
                    {!collapsedCols.has(5) && (
                      <td className="px-3 py-2 text-[10px] text-gray-500 italic border-r border-gray-800/50 max-w-[150px] truncate" title={getVal(clip, "backgroundPrompt")}>
                        {getVal(clip, "backgroundPrompt")}
                      </td>
                    )}
                    {/* 6: 스토리 (Story) */}
                    {!collapsedCols.has(6) && (
                      <td className="px-3 py-2 text-[11px] text-gray-300 border-r border-gray-800/50 max-w-[200px] truncate" title={getVal(clip, "story")}>
                        {getVal(clip, "story")}
                      </td>
                    )}
                    {/* 7: Image Prompt (Start) */}
                    {!collapsedCols.has(7) && (
                      <td className="px-3 py-2 text-[10px] text-gray-400 italic border-r border-gray-800/50 max-w-[200px] truncate" title={getVal(clip, "imagePrompt")}>
                        {getVal(clip, "imagePrompt")}
                      </td>
                    )}
                    {/* 8: Image Prompt (End) */}
                    {!collapsedCols.has(8) && (
                      <td className="px-3 py-2 text-[10px] text-gray-400 italic border-r border-gray-800/50 max-w-[200px] truncate" title={getVal(clip, "imagePromptEnd")}>
                        {getVal(clip, "imagePromptEnd")}
                      </td>
                    )}
                    {/* 9: 비디오 프롬프트 (Video Prompt) */}
                    {!collapsedCols.has(9) && (
                      <td className="px-3 py-2 text-[10px] text-gray-300 border-r border-gray-800/50 max-w-[200px] truncate" title={getVal(clip, "videoPrompt")}>
                        {getVal(clip, "videoPrompt")}
                      </td>
                    )}
                    {/* 10: Sora 비디오 프롬프트 (Sora Video Prompt) */}
                    {!collapsedCols.has(10) && (
                      <td className="px-3 py-2 text-[10px] text-blue-400 font-mono border-r border-gray-800/50 max-w-[200px] truncate" title={getVal(clip, "soraVideoPrompt")}>
                        {getVal(clip, "soraVideoPrompt")}
                      </td>
                    )}
                    {/* 11: Reference Image (refFileName) */}
                    {!collapsedCols.has(11) && (
                      <td className="px-3 py-2 text-[9px] text-[#A3E635] font-black border-r border-gray-800/50 uppercase tracking-tighter">
                        {getVal(clip, "refFileName")}
                      </td>
                    )}
                    {/* 12: 대사 (Ko) (Dialogue Ko) */}
                    {!collapsedCols.has(12) && (
                      <td className="px-3 py-2 text-[11px] text-gray-200 border-r border-gray-800/50 max-w-[200px] truncate" title={getVal(clip, "dialogue")}>
                        {getVal(clip, "dialogue")}
                      </td>
                    )}
                    {/* 13: 대사 (En) (Dialogue En) */}
                    {!collapsedCols.has(13) && (
                      <td className="px-3 py-2 text-[10px] text-gray-500 italic border-r border-gray-800/50 max-w-[200px] truncate" title={getVal(clip, "dialogueEn")}>
                        {getVal(clip, "dialogueEn")}
                      </td>
                    )}
                    {/* 14: 효과음 (Ko) (SFX Ko) */}
                    {!collapsedCols.has(14) && (
                      <td className="px-3 py-2 text-[10px] text-purple-400 border-r border-gray-800/50">
                        {getVal(clip, "sfx")}
                      </td>
                    )}
                    {/* 15: 효과음 (En) (SFX En) */}
                    {!collapsedCols.has(15) && (
                      <td className="px-3 py-2 text-[9px] text-gray-600 border-r border-gray-800/50">
                        {getVal(clip, "sfxEn")}
                      </td>
                    )}
                    {/* 16: BGM (Ko) */}
                    {!collapsedCols.has(16) && (
                      <td className="px-3 py-2 text-[10px] text-green-400 border-r border-gray-800/50">
                        {getVal(clip, "bgm")}
                      </td>
                    )}
                    {/* 17: BGM (En) */}
                    {!collapsedCols.has(17) && (
                      <td className="px-3 py-2 text-[9px] text-gray-600">
                        {getVal(clip, "bgmEn")}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useMemo } from 'react';
import { Upload, Trash2 } from 'lucide-react';
import type { Scene, VoicePrompt, Continuity } from './types';

interface StoryboardTableProps {
  data: Scene[];
  voicePrompts: VoicePrompt[];
  hasEndPrompt: boolean;
  onUpdateClip?: (sceneIndex: number, clipIndex: number, changes: Partial<Continuity>) => void;
  onReplaceReferenceImage?: (sceneIndex: number, clipIndex: number, base64: string) => Promise<void>;
}

// Flattened row types for pagination
type RowItem =
  | { type: 'scene-header'; sceneTitle: string; sceneIndex: number }
  | { type: 'clip'; sceneIndex: number; clipIndex: number; globalClipIndex: number; clip: Continuity; isNewBg: boolean; prevBgPrompt?: string };

const ITEMS_PER_PAGE = 20;

export const StoryboardTable: React.FC<StoryboardTableProps> = ({ data, voicePrompts, hasEndPrompt, onUpdateClip, onReplaceReferenceImage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadingCell, setUploadingCell] = useState<string | null>(null);

  const clipHeaders = [
    "Clip", "Length", "Acc. Time", "BG ID", "Reference", "Story",
    "Image Prompt (Start)",
    ...(hasEndPrompt ? ["Image Prompt (End)"] : []),
    "Video Prompt",
    "Video API",
    "Pix AI",
    "Dialogue (Ko)", "Dialogue (En)",
    "SFX (Ko)", "SFX (En)",
    "BGM (Ko)", "BGM (En)"
  ];

  // Flatten data for pagination
  const flatRows = useMemo(() => {
    const rows: RowItem[] = [];
    let globalClipCounter = 1;
    data.forEach((scene, sIdx) => {
      rows.push({ type: 'scene-header', sceneTitle: scene.sceneTitle, sceneIndex: sIdx });
      scene.clips.forEach((clip, cIdx) => {
        const prevClip = cIdx > 0 ? scene.clips[cIdx - 1] : null;
        const isNewBg = cIdx === 0 || clip.backgroundPrompt !== prevClip?.backgroundPrompt;
        rows.push({
          type: 'clip',
          sceneIndex: sIdx,
          clipIndex: cIdx,
          globalClipIndex: globalClipCounter++,
          clip,
          isNewBg,
          prevBgPrompt: prevClip?.backgroundPrompt
        });
      });
    });
    return rows;
  }, [data]);

  const totalPages = Math.ceil(flatRows.length / ITEMS_PER_PAGE);
  const currentRows = flatRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, sIdx: number, cIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input value so the same file can be re-selected
    e.target.value = '';

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          if (result.includes(',')) {
            resolve(result.split(',')[1]);
          } else {
            resolve(result);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (onReplaceReferenceImage) {
        const cellKey = `${sIdx}-${cIdx}`;
        setUploadingCell(cellKey);
        try {
          await onReplaceReferenceImage(sIdx, cIdx, base64);
        } finally {
          setUploadingCell(null);
        }
      } else if (onUpdateClip) {
        onUpdateClip(sIdx, cIdx, { referenceImage: base64 });
      }
    } catch (err) {
      console.error("Failed to upload reference image", err);
      setUploadingCell(null);
    }
  };

  const handleDeleteImage = (sIdx: number, cIdx: number) => {
    if (onUpdateClip) {
      onUpdateClip(sIdx, cIdx, { referenceImage: undefined });
    }
  };

  // Reset page when data changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
        <div className="text-center text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto h-12 w-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold">Storyboard will appear here</h3>
          <p className="mt-1 text-sm">Upload manga panels and generate the storyboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      {/* Voice Prompts Section */}
      {voicePrompts.length > 0 && (
        <div className="p-4 bg-gray-800 border-b border-gray-700 shrink-0">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Character Voice Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {voicePrompts.map((vp, index) => (
              <div key={index} className="text-xs p-3 bg-gray-900/50 rounded border border-gray-700">
                <div className="text-gray-300 mb-1 font-bold">Character {index + 1}</div>
                <div className="grid grid-cols-5 gap-2">
                  <span className="text-gray-500">KO:</span>
                  <span className="col-span-4 text-gray-400">{vp.promptKo}</span>
                  <span className="text-gray-500">EN:</span>
                  <span className="col-span-4 text-gray-400">{vp.promptEn}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto max-h-[600px]">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800 sticky top-0 z-30 shadow-lg">
            <tr>
              {clipHeaders.map((header) => (
                <th key={header} className="px-3 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap border-r border-gray-700 last:border-r-0">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-900">
            {currentRows.map((row, idx) => {
              if (row.type === 'scene-header') {
                return (
                  <tr key={`h-${row.sceneIndex}-${idx}`} className="bg-cyan-900/20 border-l-4 border-cyan-500">
                    <td colSpan={clipHeaders.length} className="px-4 py-3 text-sm font-bold text-cyan-100 sticky left-0 z-10 bg-cyan-900/20">
                      Scene {row.sceneIndex + 1}: {row.sceneTitle}
                    </td>
                  </tr>
                );
              }

              const { sceneIndex, clipIndex, globalClipIndex, clip, isNewBg } = row;

              return (
                <React.Fragment key={`c-${sceneIndex}-${clipIndex}`}>
                  {isNewBg && clip.backgroundPrompt && (
                    <tr className="bg-gray-800/40">
                      <td colSpan={clipHeaders.length} className="px-4 py-1.5 text-[10px] text-gray-500 italic sticky left-0 z-10 bg-gray-800/40">
                        Background: {clip.backgroundPrompt}
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-gray-800/50 group">
                    <td className="px-3 py-3 text-[11px] font-mono text-gray-500 text-center border-r border-gray-800">{String(globalClipIndex).padStart(3, '0')}</td>
                    <td className="px-3 py-3 text-[11px] text-gray-400 text-center border-r border-gray-800">{clip.length}</td>
                    <td className="px-3 py-3 text-[11px] text-gray-400 text-center border-r border-gray-800">{clip.accumulatedTime}</td>
                    <td className="px-3 py-3 text-[11px] text-cyan-600 font-mono text-center border-r border-gray-800">{clip.backgroundId}</td>

                    {/* Reference Image Cell */}
                    <td className="px-3 py-3 border-r border-gray-800 min-w-[140px] relative group/cell">
                      {clip.referenceImage ? (
                        <div className="relative overflow-hidden rounded bg-black flex items-center justify-center h-20 w-32 mx-auto border border-gray-700">
                          <img
                            src={
                              clip.referenceImage.startsWith('http') || clip.referenceImage.startsWith('blob:')
                                ? clip.referenceImage
                                : `data:image/jpeg;base64,${clip.referenceImage}`
                            }
                            className="object-contain h-full w-full"
                            alt="Ref"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-32 mx-auto bg-gray-800/20 flex items-center justify-center rounded border border-gray-700/50 border-dashed">
                          <span className="text-[10px] text-gray-600">No Image</span>
                        </div>
                      )}
                      {clip.refFileName && (
                        <div className="mt-2 text-[10px] text-center text-gray-400 break-all">
                          {clip.refFileName}
                        </div>
                      )}
                      {(onUpdateClip || onReplaceReferenceImage) && (
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-100 z-10">
                          {uploadingCell === `${sceneIndex}-${clipIndex}` ? (
                            <div className="p-2 text-white">
                              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            </div>
                          ) : (
                            <>
                              <label className="cursor-pointer p-2 bg-blue-600/90 rounded-full hover:bg-blue-500 hover:scale-110 transition-transform text-white shadow-lg" title="Upload/Change Image">
                                <Upload className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, sceneIndex, clipIndex)} />
                              </label>
                              {clip.referenceImage && (
                                <button
                                  onClick={() => handleDeleteImage(sceneIndex, clipIndex)}
                                  className="p-2 bg-red-600/90 rounded-full hover:bg-red-500 hover:scale-110 transition-transform text-white shadow-lg"
                                  title="Delete Image"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-gray-300 min-w-[200px] leading-relaxed border-r border-gray-800">
                      {clip.storyGroupLabel && (
                        <div className="text-[10px] uppercase tracking-wide text-cyan-300/80 mb-1">{clip.storyGroupLabel}</div>
                      )}
                      {clip.story}
                    </td>

                    <td className="px-3 py-3 text-[11px] text-gray-500 italic min-w-[180px] border-r border-gray-800">{clip.imagePrompt}</td>
                    {hasEndPrompt && <td className="px-3 py-3 text-[11px] text-orange-400/80 italic min-w-[180px] border-r border-gray-800">{clip.imagePromptEnd || "-"}</td>}
                    <td className="px-3 py-3 text-[11px] text-gray-500 min-w-[180px] border-r border-gray-800">{clip.videoPrompt}</td>
                    <td className="px-3 py-3 min-w-[120px] border-r border-gray-800">
                      {onUpdateClip ? (
                        <select
                          value={clip.videoApi || 'Grok'}
                          onChange={(e) => onUpdateClip(sceneIndex, clipIndex, { videoApi: e.target.value })}
                          className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded px-2 py-1 text-[11px]"
                        >
                          <option value="Grok">Grok</option>
                          <option value="Wan 2.2">Wan 2.2</option>
                          <option value="Sora">Sora</option>
                          <option value="Veo 3">Veo 3</option>
                        </select>
                      ) : (
                        <span className="text-[11px] text-gray-300">{clip.videoApi || 'Grok'}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[11px] text-cyan-200/80 min-w-[180px] border-r border-gray-800">{clip.pixAiPrompt || "-"}</td>
                    <td className="px-3 py-3 text-[12px] text-gray-200 min-w-[120px] border-r border-gray-800">{clip.dialogue}</td>
                    <td className="px-3 py-3 text-[11px] text-gray-400 min-w-[120px] border-r border-gray-800 italic">{clip.dialogueEn}</td>
                    <td className="px-3 py-3 text-[11px] text-orange-200/60 min-w-[100px] border-r border-gray-800">{clip.sfx}</td>
                    <td className="px-3 py-3 text-[11px] text-gray-500 min-w-[100px] border-r border-gray-800">{clip.sfxEn}</td>
                    <td className="px-3 py-3 text-[11px] text-purple-200/60 min-w-[100px] border-r border-gray-800">{clip.bgm}</td>
                    <td className="px-3 py-3 text-[11px] text-gray-500 min-w-[100px]">{clip.bgmEn}</td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="bg-gray-800 border-t border-gray-700 p-3 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-400">
            Showing <span className="text-white font-bold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-white font-bold">{Math.min(currentPage * ITEMS_PER_PAGE, flatRows.length)}</span> of <span className="text-white font-bold">{flatRows.length}</span> rows
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-200"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  p = currentPage - 2 + i;
                  if (p > totalPages) p = totalPages - (4 - i);
                }

                return (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-all ${currentPage === p ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
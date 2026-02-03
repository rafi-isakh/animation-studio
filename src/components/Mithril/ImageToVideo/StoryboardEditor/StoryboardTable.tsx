"use client";

import React from 'react';
import { ImageIcon } from 'lucide-react';
import type { Scene, VoicePrompt } from './types';

interface StoryboardTableProps {
  data: Scene[];
  voicePrompts: VoicePrompt[];
  hasEndPrompt: boolean;
}

export const StoryboardTable: React.FC<StoryboardTableProps> = ({
  data,
  hasEndPrompt,
}) => {
  const clipHeaders = [
    'Clip',
    'Length',
    'Acc. Time',
    'BG ID',
    'Reference',
    'Story',
    'Image Prompt (Start)',
    ...(hasEndPrompt ? ['Image Prompt (End)'] : []),
    'Video Prompt',
    'Sora Video Prompt',
    'Dialogue (Ko)',
    'Dialogue (En)',
    'SFX (Ko)',
    'SFX (En)',
    'BGM (Ko)',
    'BGM (En)',
  ];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
        <div className="text-center text-gray-500">
          <ImageIcon className="mx-auto h-12 w-12 opacity-50" />
          <h3 className="mt-2 text-sm font-semibold">
            Storyboard data will appear here
          </h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest">
            Load a project or import from the previous stage
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full max-h-[calc(100vh-300px)] rounded-lg bg-gray-900 border border-gray-700">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800 sticky top-0 z-20 shadow-lg">
          <tr>
            {clipHeaders.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap border-r border-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-gray-900">
          {data.map((scene, sIdx) => (
            <React.Fragment key={`s-${sIdx}`}>
              {/* Scene header row */}
              <tr className="bg-cyan-900/20 border-l-4 border-cyan-500 sticky top-[43px] z-10">
                <td
                  colSpan={clipHeaders.length}
                  className="px-4 py-3 text-sm font-bold text-cyan-100"
                >
                  Scene {sIdx + 1}: {scene.sceneTitle}
                </td>
              </tr>

              {/* Clip rows */}
              {scene.clips.map((row, cIdx) => {
                const isNewBg =
                  cIdx === 0 ||
                  row.backgroundPrompt !== scene.clips[cIdx - 1].backgroundPrompt;
                return (
                  <React.Fragment key={`s-${sIdx}-c-${cIdx}`}>
                    {/* Background change indicator */}
                    {isNewBg && row.backgroundPrompt && (
                      <tr className="bg-gray-800/40">
                        <td
                          colSpan={clipHeaders.length}
                          className="px-4 py-1.5 text-[10px] text-gray-500 italic"
                        >
                          Background: {row.backgroundPrompt}
                        </td>
                      </tr>
                    )}

                    {/* Clip data row */}
                    <tr className="hover:bg-gray-800/50 group">
                      <td className="px-4 py-3 text-[11px] font-mono text-gray-500 text-center border-r border-gray-800">
                        {`${sIdx + 1}.${cIdx + 1}`}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-400 text-center border-r border-gray-800">
                        {row.length}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-400 text-center border-r border-gray-800">
                        {row.accumulatedTime}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-cyan-600 font-mono text-center border-r border-gray-800">
                        {row.backgroundId}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-800 min-w-[120px]">
                        {row.referenceImage ? (
                          <div className="relative group/img overflow-hidden rounded bg-black flex items-center justify-center h-20 w-32 mx-auto">
                            <img
                              src={
                                row.referenceImage.startsWith('data:')
                                  ? row.referenceImage
                                  : `data:image/jpeg;base64,${row.referenceImage}`
                              }
                              className="object-contain h-full w-full transition-transform group-hover/img:scale-110"
                              alt="Ref"
                            />
                          </div>
                        ) : (
                          <div className="h-20 w-32 mx-auto bg-gray-800/20 flex items-center justify-center rounded border border-gray-700/50">
                            <span className="text-[10px] text-gray-700">
                              No Image
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-300 min-w-[250px] max-w-[300px] leading-relaxed border-r border-gray-800">
                        <div className="line-clamp-4">{row.story}</div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500 italic min-w-[200px] max-w-[250px] border-r border-gray-800">
                        <div className="line-clamp-4">{row.imagePrompt}</div>
                      </td>
                      {hasEndPrompt && (
                        <td className="px-4 py-3 text-[11px] text-orange-400/80 italic min-w-[200px] max-w-[250px] border-r border-gray-800">
                          <div className="line-clamp-4">
                            {row.imagePromptEnd || '-'}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-[11px] text-gray-500 min-w-[200px] max-w-[250px] border-r border-gray-800">
                        <div className="line-clamp-4">{row.videoPrompt}</div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-blue-400/80 min-w-[200px] max-w-[250px] border-r border-gray-800 font-mono text-[10px]">
                        <div className="line-clamp-4">{row.soraVideoPrompt}</div>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-200 min-w-[150px] border-r border-gray-800">
                        {row.dialogue}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-400 min-w-[150px] border-r border-gray-800 italic">
                        {row.dialogueEn}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-orange-200/60 min-w-[120px] border-r border-gray-800">
                        {row.sfx}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500 min-w-[120px] border-r border-gray-800">
                        {row.sfxEn}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-purple-200/60 min-w-[120px] border-r border-gray-800">
                        {row.bgm}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500 min-w-[120px]">
                        {row.bgmEn}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

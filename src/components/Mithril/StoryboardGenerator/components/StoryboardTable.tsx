"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useMithril } from "../../MithrilContext";
import type { Scene, VoicePrompt, CharacterIdSummary } from "../types";
import ClipTableRow from "./ClipTableRow";

interface StoryboardTableProps {
  data: Scene[];
  voicePrompts: VoicePrompt[];
  characterIdSummary?: CharacterIdSummary[];
  genre?: string;
}

export default function StoryboardTable({
  data,
  voicePrompts,
  characterIdSummary,
  genre,
}: StoryboardTableProps) {
  const { language, dictionary } = useLanguage();
  const { updateClipPrompt, getOriginalClipPrompt } = useMithril();

  const clipHeaders = [
    phrase(dictionary, "table_clip", language),
    phrase(dictionary, "table_length", language),
    phrase(dictionary, "table_accumulated_time", language),
    phrase(dictionary, "table_background_id", language),
    phrase(dictionary, "table_story", language),
    phrase(dictionary, "table_image_prompt", language),
    phrase(dictionary, "table_image_prompt_end", language),
    phrase(dictionary, "table_video_prompt", language),
    phrase(dictionary, "table_sora_video_prompt", language),
    phrase(dictionary, "table_dialogue_ko", language),
    phrase(dictionary, "table_dialogue_en", language),
    phrase(dictionary, "table_narration_ko", language),
    phrase(dictionary, "table_narration_en", language),
    phrase(dictionary, "table_sfx_ko", language),
    phrase(dictionary, "table_sfx_en", language),
    phrase(dictionary, "table_bgm_ko", language),
    phrase(dictionary, "table_bgm_en", language),
  ];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-semibold">
            {phrase(dictionary, "table_empty_title", language)}
          </h3>
          <p className="mt-1 text-sm">
            {phrase(dictionary, "table_empty_desc", language)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-auto max-h-[100vh] rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        {voicePrompts.length > 0 && (
          <details className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 group">
            <summary className="p-4 cursor-pointer flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors list-none">
              <div className="flex items-center space-x-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5 text-[#DB2777] group-open:rotate-180 transition-transform"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                  {phrase(dictionary, "table_voice_prompts", language)} ({voicePrompts.length})
                </h3>
              </div>
            </summary>
            <div className="p-4 pt-0 space-y-4">
              <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {voicePrompts.map((vp, index) => (
                  <div
                    key={index}
                    className="text-sm bg-white dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700 border-l-4 border-l-[#DB2777]"
                  >
                    <dt className="font-bold text-[#DB2777] mb-2">
                      {phrase(dictionary, "table_prompt", language)} {index + 1}
                    </dt>
                    <dd className="mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                        {phrase(dictionary, "table_korean", language)}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {vp.promptKo}
                      </span>
                    </dd>
                    <dd>
                      <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                        English
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                        {vp.promptEn}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </details>
        )}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {clipHeaders.map((header) => (
                <th
                  key={header}
                  scope="col"
                  className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {data.map((scene, sceneIndex) => (
              <React.Fragment key={`scene-${sceneIndex}`}>
                {/* Scene Header Row */}
                <tr className="bg-gray-200 dark:bg-gray-700 sticky top-[53px] z-10">
                  <td
                    colSpan={clipHeaders.length}
                    className="px-4 py-3 text-lg font-bold text-gray-900 dark:text-gray-100"
                  >
                    {phrase(dictionary, "table_scene", language)} {sceneIndex + 1}: {scene.sceneTitle}
                  </td>
                </tr>
                {scene.clips.map((row, clipIndex) => {
                  const isNewBackground =
                    clipIndex === 0 ||
                    row.backgroundPrompt !==
                      scene.clips[clipIndex - 1].backgroundPrompt;

                  return (
                    <ClipTableRow
                      key={`scene-${sceneIndex}-clip-${clipIndex}`}
                      row={row}
                      sceneIndex={sceneIndex}
                      clipIndex={clipIndex}
                      isNewBackground={isNewBackground}
                      clipHeadersLength={clipHeaders.length}
                      onUpdatePrompt={(field, value) => updateClipPrompt(sceneIndex, clipIndex, field, value)}
                      getOriginalPrompt={(field) => getOriginalClipPrompt(sceneIndex, clipIndex, field)}
                    />
                  );
                })}
              </React.Fragment>
            ))}
            {/* Spacer row + Character ID Summary + Genre after last clip */}
            {(characterIdSummary && characterIdSummary.length > 0 || genre) && (
              <>
                {/* Empty spacer row */}
                <tr>
                  <td colSpan={clipHeaders.length} className="py-4" />
                </tr>

                {/* Character ID Summary rows */}
                {characterIdSummary && characterIdSummary.length > 0 && (
                  <>
                    <tr className="bg-purple-100 dark:bg-purple-900/30">
                      <td
                        colSpan={clipHeaders.length}
                        className="px-4 py-3 text-lg font-bold text-purple-900 dark:text-purple-200"
                      >
                        {phrase(dictionary, "table_character_id_summary", language)}
                      </td>
                    </tr>
                    {characterIdSummary.map((char, index) => (
                      <tr key={`char-${index}`} className="bg-purple-50 dark:bg-purple-900/10">
                        <td className="px-4 py-2 font-mono font-bold text-sm text-purple-700 dark:text-purple-300 whitespace-nowrap">
                          {char.characterId}
                        </td>
                        <td
                          colSpan={clipHeaders.length - 1}
                          className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          {char.description}
                        </td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Genre row */}
                {genre && (
                  <tr className="bg-blue-50 dark:bg-blue-900/20">
                    <td className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase whitespace-nowrap">
                      {phrase(dictionary, "table_genre", language)}
                    </td>
                    <td
                      colSpan={clipHeaders.length - 1}
                      className="px-4 py-2 text-sm font-bold text-blue-800 dark:text-blue-300"
                    >
                      {genre}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
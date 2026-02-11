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
    phrase(dictionary, "table_character_info", language),
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
          </tbody>
        </table>
      </div>

      {/* Character ID Summary Section */}
      {characterIdSummary && characterIdSummary.length > 0 && (
        <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
          <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
            {phrase(dictionary, "table_character_id_summary", language)}
          </h3>
          <div className="space-y-2">
            {characterIdSummary.map((char, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-md border border-purple-200 dark:border-purple-700 hover:shadow-md transition-shadow"
              >
                <span className="font-mono font-bold text-purple-700 dark:text-purple-300 text-sm min-w-[180px] break-all">
                  {char.characterId}:
                </span>
                <span className="text-gray-700 dark:text-gray-300 text-sm flex-1">
                  {char.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Genre Section */}
      {genre && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6h.008v.008H6V6Z"
              />
            </svg>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">
              {phrase(dictionary, "table_genre", language)}:
            </span>
            <span className="text-base font-bold text-blue-800 dark:text-blue-300">
              {genre}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
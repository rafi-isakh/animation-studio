"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useMithril } from "../../MithrilContext";
import type { Scene, VoicePrompt } from "../types";
import ClipTableRow from "./ClipTableRow";

interface StoryboardTableProps {
  data: Scene[];
  voicePrompts: VoicePrompt[];
}

export default function StoryboardTable({
  data,
  voicePrompts,
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
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">
              {phrase(dictionary, "table_voice_prompts", language)}
            </h3>
            <dl className="space-y-2">
              {voicePrompts.map((vp, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-400 border-l-2 border-[#DB2777] pl-3"
                >
                  <dt className="font-semibold text-gray-700 dark:text-gray-300">
                    {phrase(dictionary, "table_prompt", language)} {index + 1}
                  </dt>
                  <dd className="mt-1">
                    <span className="font-medium text-gray-500 dark:text-gray-400">
                      {phrase(dictionary, "table_korean", language)}
                    </span>{" "}
                    {vp.promptKo}
                  </dd>
                  <dd>
                    <span className="font-medium text-gray-500 dark:text-gray-400">
                      [EN]:
                    </span>{" "}
                    {vp.promptEn}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
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
    </div>
  );
}
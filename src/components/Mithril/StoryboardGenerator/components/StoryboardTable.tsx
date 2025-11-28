"use client";

import React from "react";
import { Image as ImageIcon } from "lucide-react";
import type { Scene, VoicePrompt } from "../types";

interface StoryboardTableProps {
  data: Scene[];
  voicePrompts: VoicePrompt[];
}

export default function StoryboardTable({
  data,
  voicePrompts,
}: StoryboardTableProps) {
  const clipHeaders = [
    "클립",
    "길이",
    "누적 시간",
    "배경 ID",
    "스토리",
    "이미지 프롬프트",
    "비디오 프롬프트",
    "Sora 비디오 프롬프트",
    "대사 (Ko)",
    "대사 (En)",
    "효과음 (Ko)",
    "효과음 (En)",
    "BGM (Ko)",
    "BGM (En)",
  ];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 className="mt-2 text-sm font-semibold">
            이곳에 콘티가 표시됩니다
          </h3>
          <p className="mt-1 text-sm">
            파트를 선택하고 조건을 설정하여 생성하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[60vh] rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      {voicePrompts.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-2">
            캐릭터 보이스 프롬프트
          </h3>
          <dl className="space-y-2">
            {voicePrompts.map((vp, index) => (
              <div
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400 border-l-2 border-[#DB2777] pl-3"
              >
                <dt className="font-semibold text-gray-700 dark:text-gray-300">
                  프롬프트 {index + 1}
                </dt>
                <dd className="mt-1">
                  <span className="font-medium text-gray-500 dark:text-gray-400">
                    [한글]:
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
                  씬 {sceneIndex + 1}: {scene.sceneTitle}
                </td>
              </tr>
              {scene.clips.map((row, clipIndex) => {
                const isNewBackground =
                  clipIndex === 0 ||
                  row.backgroundPrompt !==
                    scene.clips[clipIndex - 1].backgroundPrompt;

                return (
                  <React.Fragment key={`scene-${sceneIndex}-clip-${clipIndex}`}>
                    {isNewBackground && (
                      <tr className="bg-gray-100 dark:bg-gray-800/70">
                        <td
                          colSpan={clipHeaders.length}
                          className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 italic pl-8"
                        >
                          배경: {row.backgroundPrompt}
                        </td>
                      </tr>
                    )}
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-center">{`${sceneIndex + 1}.${clipIndex + 1}`}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300 w-20 text-center">
                        {row.length}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300 w-24 text-center">
                        {row.accumulatedTime}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#DB2777] w-24 text-center font-mono">
                        {row.backgroundId}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                        {row.story}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                        {row.imagePrompt}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[200px]">
                        {row.videoPrompt}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-blue-600 dark:text-blue-300 min-w-[200px]">
                        {row.soraVideoPrompt}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
                        {row.dialogue}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[150px]">
                        {row.dialogueEn}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                        {row.sfx}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                        {row.sfxEn}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                        {row.bgm}
                      </td>
                      <td className="whitespace-pre-wrap px-4 py-4 text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
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
}

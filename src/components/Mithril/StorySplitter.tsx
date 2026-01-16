"use client";

import { useState, useEffect, useCallback } from "react";
import { useMithril } from "./MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Dictionary, Language } from "@/components/Types";
import { useProject } from "@/contexts/ProjectContext";
import { getChapter } from "./services/firestore";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Download, Trash2 } from "lucide-react";

const GENRE_PRESETS: Record<string, string> = {
  fantasy: `[Core Principles]
클리프행어는 궁금증과 기대감을 폭발시키는 장면입니다.
독자의 궁금증과 기대감을 폭발시키는 **클리프행어(Hook Point)**를 추출하십시오.
주인공 절대 중심 (Protagonist-Centric): 모든 엔딩은 주인공의 시점, 행동, 감정, 반응에서 끝나야 합니다. (조연 시점 금지)
'직전'의 미학 (The "Just Before"): 사건이 터진 후가 아니라, 터지기 0.1초 전의 긴장감을 포착하십시오.
분할용 클리프행어는 파트당 세 개의 클리프행어 중 가장 강렬한 클리프행어여야 합니다.
아래 기준 중 하나를 반드시 충족하는 장면을 찾으십시오.

1. [Growth & Reward] (성장과 보상)
주인공이 성장의 계기(시스템 알림, 아이템 획득, 깨달음)를 얻었으나, 그 구체적인 결과(능력치, 스킬 내용)가 서술되기 직전.

2. [Knowledge Advantage] (지식의 독점)
(전투 외 상황 포함) 주인공이 회귀/빙의/원작 정보/전생의 지식 등을 활용해 남들은 모르는 기연을 선점하거나, 함정을 간파하고 전략적 우위를 점하는 순간.

3. [Dominance & Reversal] (압도와 반격)
무시당하거나 위기에 몰린 상황에서, 주인공이 숨겨둔 힘(히든 카드)이나 전략을 꺼내 들며 상황을 뒤집을 확신을 보여주는 순간.

4. [Plot Divergence] (원작 파괴와 변수)
주인공의 개입으로 인해 알고 있던 미래(원작)와 다른 흐름이 발생하거나, 예측 불가능한 돌발 변수(죽어야 할 자의 생존 등)가 튀어나온 순간.

5. [New Threat & Crisis] (새로운 위협)
사건이 해결되어 안도하는 찰나, 더 거대하고 이질적인 기운이나 적이 등장하여 공포를 다시 불러일으키는 순간.

6. [Critical Action] (결정적 행동)
갈등이 폭발하여 무력을 행사하기 직전, 혹은 전투의 결정타(Critical Hit)가 들어가기 직전의 0.1초 찰나.

7. [Shock & Reaction] (충격과 경악)
주인공의 정체가 드러나거나 충격적인 진실(배신)을 마주했을 때, 혹은 주인공의 능력에 주변 인물들이 경악하는 반응의 정점.

🚫 제외 조건 (Negative Constraints)
다음 상황은 절대 클리프행어로 선정하지 마십시오.
마침표 엔딩: 사건이 완전히 해결되고 주인공이 잠을 자거나 휴식을 취하는 장면. (-5점)
루즈한 연결: 긴장감 없이 평범하게 이동하거나, 의미 없는 대화가 이어지는 도중. (-5점)
타인 시점: 주인공 없이 악당들끼리만 회의하거나 잡담하는 장면. (-5점)`,

  romance: `🌟 [Core Principles] — 반드시 지킬 기본 원칙
1. 주인공 절대 중심 (Protagonist-Centric)

모든 클리프행어는 주인공의 감정·행동·반응·시점에서 끝나야 합니다.
조연/악역 시점 금지.

2. '직전'의 미학 (The Just Before Rule)

사건이 터진 후가 아니라
터지기 0.1초 전에 끊으십시오.
고백 직전, 키스 직전, 비밀 노출 직전 등
가장 뜨거운 순간, 아직 결과가 드러나지 않은 지점.

3. 파트당 1개의 최강 순간만 선정

각 파트에서 사건·감정선 중 가장 폭발적인 순간 하나만 선택합니다.

💗 [Cliffhanger Criteria — 로맨스/로판 전용 7대 기준]

각 클리프행어는 아래 기준 중 하나 이상을 충족해야 합니다.

1. Realization & Turning Point (자각과 변곡점)
주인공이 상대방에 대한 감정을 불현듯 깨닫거나(입덕 부정기 끝), 상대를 이성으로 인식하기 시작한 순간.

2. Secret & Misunderstanding (비밀과 착각)
주인공이 알고 있는 비밀·원작 정보·거짓말 때문에 발생하는 오해, 혹은 상대가 주인공의 비밀을 간파하기 '직전'의 위기.

3. Seduction & Reversal (유혹과 주도권 역전)
항상 수동적이던 쪽이 주도권을 쥐거나, 상대의 평정을 무너뜨리는 유혹/도발의 순간.

4. Twist of Fate (예측 불허의 변수)
계약 관계 종료, 이별 선언, 관계 청산 직전 등 예상한 흐름을 통째로 뒤집는 돌발 변수가 터지기 직전.

5. New Rival & Obstacle (새로운 장애물)
두 사람의 감정이 막 연결되려는 찰나, 서브 남주/여주, 전 연인, 집안 반대 등 관계를 위협하는 강력한 외부 장애물이 등장하는 순간.

6. Critical Intimacy (결정적 스킨십)
첫 키스, 첫날밤, 혹은 그에 준하는 결정적 스킨십이 이루어지기 직전의 0.1초.

7. Truth & Exposure (정체 발각과 충격)
남장·위장·계약 결혼·빙의·회귀 등 주인공의 치명적인 비밀이 드러나기 직전의 위기.

❌ [Negative Constraints — 반드시 제외]

아래 장면은 절대 클리프행어로 선정하지 마십시오.

• 안온한 마무리: 데이트 후 만족하고 각자 집에 가는 장면, 포근하게 잠드는 장면.
• 일상적·영양가 없는 대화: 날씨 얘기, 잡담, 의미 없는 설명.
• 제3자 시점: 하녀·시종·악당끼리만 대화하는 장면. 주인공 부재 신 금지.
• 긴장 없는 이동 장면: 마차/자동차/비행기 등 단순 이동 묘사.
• 사건 완료 후 정리된 엔딩: 이미 해결된 후의 평온한 분위기.`,

  custom: ""
};

interface LoaderProps {
  dictionary: Dictionary;
  language: Language;
}

const Loader: React.FC<LoaderProps> = ({ dictionary, language }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {phrase(dictionary, "storysplitter_ai_analyzing", language)}
    </p>
  </div>
);


export default function StorySplitter() {
  const { setStageResult, storySplitter, startStorySplit, clearStorySplit } = useMithril();
  const { language, dictionary } = useLanguage();
  const { currentProjectId } = useProject();

  const [originalText, setOriginalText] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [numParts, setNumParts] = useState<number>(8);
  const [selectedGenre, setSelectedGenre] = useState<string>("fantasy");
  const [guidelines, setGuidelines] = useState<string>(GENRE_PRESETS.fantasy);

  // Use state from context
  const { isLoading, error, result: splitResult } = storySplitter;

  // Load chapter from Firestore
  useEffect(() => {
    const loadChapter = async () => {
      if (!currentProjectId) {
        setIsInitialLoading(false);
        return;
      }

      try {
        const chapter = await getChapter(currentProjectId);
        if (chapter) {
          setOriginalText(chapter.content);
          setFileName(chapter.filename);
        }
      } catch (err) {
        console.error("Error loading chapter from Firestore:", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadChapter();
  }, [currentProjectId]);

  // Sync splitResult to stageResult when it changes
  useEffect(() => {
    if (!splitResult) return;
    setStageResult(2, splitResult);
  }, [splitResult, setStageResult]);

  const handleGenerate = useCallback(async () => {
    await startStorySplit(originalText, guidelines, numParts);
  }, [originalText, guidelines, numParts, startStorySplit]);

  const handleDownload = useCallback(async () => {
    if (!splitResult) return;

    const zip = new JSZip();
    splitResult.parts.forEach((part, index) => {
      const baseFileName = fileName.replace(".txt", "") || "script";
      const partFileName = `${baseFileName}_part_${index + 1}.txt`;
      zip.file(partFileName, part.text);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const zipFileName = `${fileName.replace(".txt", "") || "script"}_parts.zip`;
    saveAs(content, zipFileName);
  }, [splitResult, fileName]);

  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenre(genre);
    if (genre !== "custom") {
      setGuidelines(GENRE_PRESETS[genre]);
    } else {
      setGuidelines("");
    }
  }, []);

  // Show loading state while fetching initial data
  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#DB2777]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{phrase(dictionary, "storysplitter_title", language)}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {phrase(dictionary, "storysplitter_subtitle", language)}
        </p>
      </div>

      {/* Text Preview from Stage 1 */}
      {originalText ? (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fileName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {originalText.length.toLocaleString()} {phrase(dictionary, "chars", language)}
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto scrollbar-hide">
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
              {originalText.slice(0, 300)}
              {originalText.length > 300 && "..."}
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            {phrase(dictionary, "storysplitter_upload_file_first", language)}
          </p>
        </div>
      )}

      {/* Configuration Section */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="numParts"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {phrase(dictionary, "storysplitter_num_parts", language)}
          </label>
          <input
            type="number"
            id="numParts"
            min={2}
            max={50}
            value={numParts}
            onChange={(e) => setNumParts(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
            className="w-24 p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="guidelines"
            className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {phrase(dictionary, "storysplitter_ai_guidelines", language)}
          </label>

          {/* Genre Preset Tabs */}
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.keys(GENRE_PRESETS).map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => handleGenreChange(genre)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  selectedGenre === genre
                    ? "bg-[#DB2777] text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                }`}
              >
                {phrase(dictionary, `storysplitter_genre_${genre}`, language)}
              </button>
            ))}
          </div>

          <textarea
            id="guidelines"
            rows={8}
            value={guidelines}
            onChange={(e) => {
              setGuidelines(e.target.value);
              if (selectedGenre !== "custom") {
                setSelectedGenre("custom");
              }
            }}
            className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none scrollbar-hide"
            placeholder={phrase(dictionary, "storysplitter_guidelines_placeholder", language)}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !originalText}
          className="px-8 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? phrase(dictionary, "storysplitter_analyzing", language) : phrase(dictionary, "storysplitter_split_story", language)}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
          role="alert"
        >
          <strong className="font-bold">{phrase(dictionary, "storysplitter_error", language)} </strong>
          <span>{error}</span>
        </div>
      )}

      {/* Loader */}
      {isLoading && <Loader dictionary={dictionary} language={language} />}

      {/* Results */}
      {splitResult && !isLoading && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {phrase(dictionary, "storysplitter_cliffhanger_analysis", language)} ({splitResult.parts.length} {phrase(dictionary, "storysplitter_parts", language)})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{phrase(dictionary, "storysplitter_download_zip", language)}</span>
              </button>
              <button
                onClick={clearStorySplit}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{phrase(dictionary, "storysplitter_clear", language)}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
            {splitResult.parts.map((part, index) => (
              <div
                key={index}
                className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Part Header */}
                <div className="p-4 bg-gray-200 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center">
                  <h4 className="font-bold text-xl text-[#DB2777]">
                    {phrase(dictionary, "storysplitter_part", language)} {index + 1}
                  </h4>
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-300 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {part.cliffhangers?.length || 0} {phrase(dictionary, "storysplitter_key_points", language)}
                  </div>
                </div>

                {/* Cliffhanger Analysis */}
                <div className="p-5 grid gap-4">
                  {part.cliffhangers && part.cliffhangers.length > 0 ? (
                    part.cliffhangers.map((cliff, idx) => {
                      let positionLabel = `Point ${idx + 1}`;
                      let borderClass = "border-gray-400";
                      let titleColor = "text-gray-500";
                      let bgClass = "bg-gray-50 dark:bg-gray-700";

                      if (idx === 0) {
                        positionLabel = phrase(dictionary, "storysplitter_beginning", language);
                        borderClass = "border-blue-500";
                        titleColor = "text-blue-500";
                        bgClass = "bg-blue-50 dark:bg-blue-900/20";
                      } else if (idx === 1) {
                        positionLabel = phrase(dictionary, "storysplitter_middle", language);
                        borderClass = "border-yellow-500";
                        titleColor = "text-yellow-600 dark:text-yellow-400";
                        bgClass = "bg-yellow-50 dark:bg-yellow-900/20";
                      } else if (idx === 2) {
                        positionLabel = phrase(dictionary, "storysplitter_ending", language);
                        borderClass = "border-red-500";
                        titleColor = "text-red-500";
                        bgClass = "bg-red-50 dark:bg-red-900/20";
                      }

                      return (
                        <div
                          key={idx}
                          className={`${bgClass} p-4 rounded-lg border-l-4 ${borderClass}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-bold uppercase tracking-widest ${titleColor}`}>
                              {positionLabel}
                            </span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 font-medium text-base leading-relaxed mb-3 border-l-2 border-gray-300 dark:border-gray-600 pl-4 py-1 italic">
                            &ldquo;{cliff.sentence}&rdquo;
                          </p>
                          <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                            <span className="font-bold text-gray-500 dark:text-gray-500 block mb-1 uppercase text-[10px] tracking-wide">
                              {phrase(dictionary, "storysplitter_analysis_strategy", language)}
                            </span>
                            {cliff.reason}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-6">
                      <p>{phrase(dictionary, "storysplitter_no_analysis", language)}</p>
                      <p className="text-sm mt-1">{phrase(dictionary, "storysplitter_check_download", language)}</p>
                    </div>
                  )}
                </div>

                {/* Text Preview */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-2">
                      <span className="group-open:rotate-90 transition-transform">▶</span>
                      {phrase(dictionary, "storysplitter_view_text", language)} ({part.text.length.toLocaleString()} {phrase(dictionary, "chars", language)})
                    </summary>
                    <div className="mt-3 max-h-96 overflow-y-auto scrollbar-hide">
                      <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {part.text}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
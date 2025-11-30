"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useMithril } from "../../MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Dictionary, Language } from "@/components/Types";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  CloudUpload,
  Settings,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
} from "lucide-react";
import StoryboardTable from "./StoryboardTable";
import DriveSettings from "./DriveSettings";
import { uploadFileToDrive } from "../services";
import type { SplitResult } from "../types";

interface LoaderProps {
  dictionary: Dictionary;
  language: Language;
}

const Loader: React.FC<LoaderProps> = ({ dictionary, language }) => (
  <div className="flex flex-col items-center justify-center space-y-4 py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#DB2777]"></div>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {phrase(dictionary, "storyboard_ai_generating", language)}
    </p>
  </div>
);

export default function StoryboardGenerator() {
  const {
    setStageResult,
    getStageResult,
    storyboardGenerator,
    startStoryboardGeneration,
    clearStoryboardGeneration,
  } = useMithril();
  const { isGenerating, error, scenes, voicePrompts } = storyboardGenerator;
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();

  // Default conditions
  const defaultConditions = useMemo(
    () => ({
      story: `1. 원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.
2. 3분(180초) 분량에 맞춰 씬과 클립의 호흡을 조절한다.
3. 각 씬의 전환이 자연스럽게 이어지도록 구성한다.
4. 클립 당 1~2초의 짧은 호흡을 유지하여 역동적인 연출을 유도한다.`,
      image: `2. 캐릭터의 외형적 특징(머리색, 의상 등)을 고정한다.
5. 샷의 앵글과 구도는 Background ID의 지침을 따른다.
7. 주요 오브젝트나 소품, 군중의 옷을을 묘사할때, 웹소설 속 시대적 배경이나 장소의 분위기를 정확하게 반영한다.
8. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
10. 불필요한 텍스트나 워터마크를 포함하지 않는다.
11. 이미지의 비율은 16:9에 최적화된 구도로 묘사한다.
13. 날씨나 계절감을 시각적으로 표현한다.
14. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
15. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
18. 캐릭터 중심으로 클로즈업된 경우, 특수 감정이 최고조에 달한 경우에는 5개 클립 중 2개 비율로 다음 중1개를 추가로 이미지 프롬프트에 설정해줘.
1. Point of View Shot
2. Extreme Close-Up
3. Close-Up
4. Medium Shot
7. Two Shot / Group Shot
8. Shallow Depth of Field
9. Macro Shot

20. Never use the word 'frozen'. Avoid figurative expressions that could lead to misinterpretation and misgeneration. If a character is shocked, just say 'he is shocked', don't say 'he is frozen in shock', as frozen can induce generation of ice which is irrelevant.
21. 이미지 프롬프트 뒤에 항상 이 프롬프트 붙여줘 'No vfx or visual effects, no dust particles'
22. When there are multiple characters mentioned in a scene, Mention whose height is similar to who, and who is smaller/taller than who. (i.e. Rifana's height is the same as Pinellia, Kania is much smaller than Chena, etc)
23. 16:9 비율에 최적화된 이미지 프롬프트여야 한다.
24. 시각적 인물 수 제한 (Visual Constraint): 등장인물의 수는 화면 구성의 명확성을 위해 반드시 최대 5명 이하로 제한한다.
-변환 규칙: 원문에 다수(예: 20명, 군중, 학자들 전체)가 등장하더라도, 이미지 프롬프트 작성 시에는 가장 가까이 있는 3~5명의 인물로 축소하여 묘사한다.
-금지 사항: 'All 20 scholars', 'The crowd'와 같이 전체를 지칭하는 표현을 금지하고, '3 scholars', '5 people'과 같이 구체적인 숫자를 명시한다.
-예외: 대규모 전투씬(Battle scenes)은 이 규칙에서 제외한다.`,
      video: `1. 카메라 앵글과 동작 위주로 간결하게 구성한다.
2. 음향 중 캐릭터가 대사를 말하는 장면인 경우, 비디오 프롬프트에 애니메이션에서 말하는것처럼 말하는 묘사가 반드시 비디오 프롬프트에 포함되어야 한다 (i.e. character speaks, character talks, etc)
3. Don't use figurative words like 'delivers a warning', 'shoots an expression' , 'promises', 'expresses', etc. 대사가 있는 장면의 경우, figurative 하거나 동작이 애매한 프롬프트를 아예 제외하고, 확실히 말을 한다, 확실히 소리친다, 어떠한 톤으로 어떻게 말한다 이렇게 작관적으로만 표기해줘.
4. 이미지 조건과 다르게 비디오 조건에는 캐릭터 이름 대신 대명사같은걸로 대체되어야 해. 예를들어 Arel(이름)이 애기 캐릭터면 the baby, Chena가 시녀의 이름이라면 비디오 프롬프트에서는 the nanny 이런식으로 이름 아닌 descriptive 단어로 표기바람.
5. 손을 입으로 가리고 있는 등, 무언가가 인물의 입의 일부를 가리는 장면이 나와도 반드시 어떠한 형식으로든 말하고 있다는 키워드는 꼭 부여해줘.
6. 캐릭터가 질문을 하는 장면도, 그냥 speaking, yelling, shouting 등 직관적인 용어로 이미지 프롬팅에 키워드 부여해줘. 예를들어 He repeats his question은 말하고있는지 정확하지 않아. He speaks으로 하는게 더 유리해. Convert all keyword 'questions' to 'speaks' for video prompting
7. When a character is speaking, attach the prompt "(pronoun)'s head angle stays still" at the back to prevent the character from turning the head.`,
      sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 명확히 구분하여 생성됩니다.
2. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기한다.
3. 인물명 (대사) 형식을 준수한다.
4. 대사가 없는 구간은 대사 필드를 비워둔다.
5. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
    }),
    []
  );

  // State from Stage 3 (StorySplitter)
  const [splitParts, setSplitParts] = useState<string[]>([]);
  const [selectedPartIndex, setSelectedPartIndex] = useState<number>(0);

  // Conditions state
  const [storyCondition, setStoryCondition] = useState(defaultConditions.story);
  const [imageCondition, setImageCondition] = useState(defaultConditions.image);
  const [videoCondition, setVideoCondition] = useState(defaultConditions.video);
  const [soundCondition, setSoundCondition] = useState(defaultConditions.sound);
  const [imageGuide, setImageGuide] = useState("");
  const [videoGuide, setVideoGuide] = useState("");

  // Style prompt for scene image generation (used by NanoBanana integration)
  const [sceneStylePrompt, setSceneStylePrompt] = useState(
    "2D anime style, clean linework, soft cel shading, vibrant colors"
  );

  // Local UI state (not lifted to context)
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);

  // UI state
  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  // Load split parts from context on mount
  useEffect(() => {
    const contextResult = getStageResult(3) as SplitResult | undefined;
    if (contextResult?.parts && Array.isArray(contextResult.parts)) {
      setSplitParts(contextResult.parts);
    }

  }, [getStageResult]);

  // Sync context results to stage results for other components
  useEffect(() => {
    if (scenes.length === 0) return;
    setStageResult(5, { scenes, voicePrompts });
  }, [scenes, voicePrompts, setStageResult]);

  const handleGenerate = useCallback(async () => {
    if (splitParts.length === 0) {
      toast({
        variant: "destructive",
        title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
        description: phrase(dictionary, "storyboard_toast_no_parts", language),
      });
      return;
    }

    const sourceText = splitParts[selectedPartIndex];
    if (!sourceText) {
      toast({
        variant: "destructive",
        title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
        description: phrase(dictionary, "storyboard_toast_empty_part", language),
      });
      return;
    }

    await startStoryboardGeneration({
      sourceText,
      storyCondition,
      imageCondition,
      videoCondition,
      soundCondition,
      imageGuide,
      videoGuide,
    });

    // Show success toast if generation completed without error
    if (!storyboardGenerator.error && storyboardGenerator.scenes.length > 0) {
      toast({
        variant: "success",
        title: phrase(dictionary, "storyboard_toast_generated", language),
        description: `${storyboardGenerator.scenes.length} ${phrase(dictionary, "storyboard_toast_created_scenes", language)}`,
      });
    }
  }, [
    splitParts,
    selectedPartIndex,
    storyCondition,
    imageCondition,
    videoCondition,
    soundCondition,
    imageGuide,
    videoGuide,
    startStoryboardGeneration,
    storyboardGenerator,
    toast,
    dictionary,
    language,
  ]);

  const handleDownloadCSV = useCallback(() => {
    if (scenes.length === 0) return;

    const headers = [
      "Scene",
      "Clip",
      "Length",
      "Accumulated Time",
      "Background ID",
      "Background Prompt",
      "Story",
      "Image Prompt",
      "Video Prompt",
      "Sora Video Prompt",
      "Dialogue (Ko)",
      "Dialogue (En)",
      "SFX (Ko)",
      "SFX (En)",
      "BGM (Ko)",
      "BGM (En)",
    ];

    const csvContent = [
      headers.join(","),
      ...scenes.flatMap((scene, sceneIndex) =>
        scene.clips.map((clip, clipIndex) => {
          const row = [
            `Scene ${sceneIndex + 1}: ${scene.sceneTitle}`,
            `${sceneIndex + 1}-${clipIndex + 1}`,
            clip.length,
            clip.accumulatedTime,
            clip.backgroundId,
            `"${clip.backgroundPrompt.replace(/"/g, '""')}"`,
            `"${clip.story.replace(/"/g, '""')}"`,
            `"${clip.imagePrompt.replace(/"/g, '""')}"`,
            `"${clip.videoPrompt.replace(/"/g, '""')}"`,
            `"${clip.soraVideoPrompt.replace(/"/g, '""')}"`,
            `"${clip.dialogue.replace(/"/g, '""')}"`,
            `"${clip.dialogueEn.replace(/"/g, '""')}"`,
            `"${clip.sfx.replace(/"/g, '""')}"`,
            `"${clip.sfxEn.replace(/"/g, '""')}"`,
            `"${clip.bgm.replace(/"/g, '""')}"`,
            `"${clip.bgmEn.replace(/"/g, '""')}"`,
          ];
          return row.join(",");
        })
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `storyboard_part${selectedPartIndex + 1}.csv`;
    link.click();
  }, [scenes, selectedPartIndex]);

  const handleSaveToDrive = useCallback(async () => {
    if (scenes.length === 0) return;

    setIsSavingToDrive(true);
    try {
      const headers = [
        "Scene",
        "Clip",
        "Length",
        "Accumulated Time",
        "Background ID",
        "Background Prompt",
        "Story",
        "Image Prompt",
        "Video Prompt",
        "Sora Video Prompt",
        "Dialogue (Ko)",
        "Dialogue (En)",
        "SFX (Ko)",
        "SFX (En)",
        "BGM (Ko)",
        "BGM (En)",
      ];

      const csvContent = [
        headers.join(","),
        ...scenes.flatMap((scene, sceneIndex) =>
          scene.clips.map((clip, clipIndex) => {
            const row = [
              `Scene ${sceneIndex + 1}: ${scene.sceneTitle}`,
              `${sceneIndex + 1}-${clipIndex + 1}`,
              clip.length,
              clip.accumulatedTime,
              clip.backgroundId,
              `"${clip.backgroundPrompt.replace(/"/g, '""')}"`,
              `"${clip.story.replace(/"/g, '""')}"`,
              `"${clip.imagePrompt.replace(/"/g, '""')}"`,
              `"${clip.videoPrompt.replace(/"/g, '""')}"`,
              `"${clip.soraVideoPrompt.replace(/"/g, '""')}"`,
              `"${clip.dialogue.replace(/"/g, '""')}"`,
              `"${clip.dialogueEn.replace(/"/g, '""')}"`,
              `"${clip.sfx.replace(/"/g, '""')}"`,
              `"${clip.sfxEn.replace(/"/g, '""')}"`,
              `"${clip.bgm.replace(/"/g, '""')}"`,
              `"${clip.bgmEn.replace(/"/g, '""')}"`,
            ];
            return row.join(",");
          })
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const fileName = `storyboard_part${selectedPartIndex + 1}_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.csv`;

      await uploadFileToDrive(blob, fileName);
      toast({
        variant: "success",
        title: phrase(dictionary, "storyboard_toast_saved_drive", language),
        description: phrase(dictionary, "storyboard_toast_drive_success", language),
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast({
        variant: "destructive",
        title: phrase(dictionary, "storyboard_toast_drive_failed", language),
        description: errorMessage,
      });
      if (errorMessage.includes("has not been set")) {
        setShowDriveSettings(true);
      }
    } finally {
      setIsSavingToDrive(false);
    }
  }, [scenes, selectedPartIndex, toast, dictionary, language]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          {phrase(dictionary, "storyboard_title", language)}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {phrase(dictionary, "storyboard_subtitle", language)}
        </p>
      </div>

      {/* Part Selection */}
      {splitParts.length > 0 ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {phrase(dictionary, "storyboard_select_part", language)}
          </label>
          <div className="flex flex-wrap gap-2">
            {splitParts.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedPartIndex(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPartIndex === index
                    ? "bg-[#DB2777] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {phrase(dictionary, "storysplitter_part", language)} {index + 1}
              </button>
            ))}
          </div>

          {/* Selected Part Preview */}
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {phrase(dictionary, "storysplitter_part", language)} {selectedPartIndex + 1} {phrase(dictionary, "storyboard_part_preview", language)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {splitParts[selectedPartIndex]?.length.toLocaleString()}{" "}
                {phrase(dictionary, "chars", language)}
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto">
              <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                {splitParts[selectedPartIndex]?.slice(0, 300)}
                {splitParts[selectedPartIndex]?.length > 300 && "..."}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            {phrase(dictionary, "storyboard_no_parts", language)}
          </p>
        </div>
      )}

      {/* Collapsible Conditions Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowConditions(!showConditions)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {phrase(dictionary, "storyboard_generation_conditions", language)}
          </span>
          {showConditions ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showConditions && (
          <div className="p-4 space-y-4 bg-white dark:bg-gray-800">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {phrase(dictionary, "storyboard_story_conditions", language)}
              </label>
              <textarea
                rows={4}
                value={storyCondition}
                onChange={(e) => setStoryCondition(e.target.value)}
                className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {phrase(dictionary, "storyboard_image_conditions", language)}
              </label>
              <textarea
                rows={4}
                value={imageCondition}
                onChange={(e) => setImageCondition(e.target.value)}
                className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {phrase(dictionary, "storyboard_video_conditions", language)}
              </label>
              <textarea
                rows={4}
                value={videoCondition}
                onChange={(e) => setVideoCondition(e.target.value)}
                className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {phrase(dictionary, "storyboard_sound_conditions", language)}
              </label>
              <textarea
                rows={4}
                value={soundCondition}
                onChange={(e) => setSoundCondition(e.target.value)}
                className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
              />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">
                {phrase(dictionary, "storyboard_additional_guide", language)}
              </h4>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {phrase(dictionary, "storyboard_image_guide", language)}
                </label>
                <input
                  type="text"
                  value={imageGuide}
                  onChange={(e) => setImageGuide(e.target.value)}
                  className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
                  placeholder={phrase(dictionary, "storyboard_image_guide_placeholder", language)}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {phrase(dictionary, "storyboard_video_guide", language)}
                </label>
                <input
                  type="text"
                  value={videoGuide}
                  onChange={(e) => setVideoGuide(e.target.value)}
                  className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
                  placeholder={phrase(dictionary, "storyboard_video_guide_placeholder", language)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Scene Image Style Prompt */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {phrase(dictionary, "storyboard_scene_style", language) || "Scene Image Style Prompt"}
        </label>
        <textarea
          rows={2}
          value={sceneStylePrompt}
          onChange={(e) => setSceneStylePrompt(e.target.value)}
          placeholder={phrase(dictionary, "storyboard_scene_style_placeholder", language) || "e.g., 2D anime style, clean linework..."}
          className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {phrase(dictionary, "storyboard_scene_style_hint", language) || "This style will be combined with each clip's image prompt when generating scene images"}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || splitParts.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-[#DB2777] hover:bg-[#BE185D] text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          {isGenerating ? phrase(dictionary, "storyboard_generating", language) : phrase(dictionary, "storyboard_generate", language)}
        </button>

        <button
          onClick={() => setShowDriveSettings(!showDriveSettings)}
          className="flex items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          {phrase(dictionary, "storyboard_drive_settings", language)}
        </button>
      </div>

      {/* Drive Settings Panel */}
      {showDriveSettings && (
        <DriveSettings onClose={() => setShowDriveSettings(false)} />
      )}

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
      {isGenerating && <Loader dictionary={dictionary} language={language} />}

      {/* Results */}
      {scenes.length > 0 && !isGenerating && (
        <div className="space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {phrase(dictionary, "storyboard_generated", language)} ({scenes.length} {phrase(dictionary, "storyboard_scenes", language)},{" "}
              {scenes.reduce((acc, s) => acc + s.clips.length, 0)} {phrase(dictionary, "storyboard_clips", language)})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                {phrase(dictionary, "storyboard_csv_download", language)}
              </button>
              <button
                onClick={handleSaveToDrive}
                disabled={isSavingToDrive}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CloudUpload className="w-4 h-4" />
                {isSavingToDrive ? phrase(dictionary, "storyboard_saving", language) : phrase(dictionary, "storyboard_save_to_drive", language)}
              </button>
              {scenes.length > 0 && (
                <button
                  onClick={clearStoryboardGeneration}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  <Trash2 className="w-5 h-5" />
                  {phrase(dictionary, "storysplitter_clear", language)}
                </button>
              )}
            </div>
          </div>

          <StoryboardTable data={scenes} voicePrompts={voicePrompts} stylePrompt={sceneStylePrompt} />
        </div>
      )}
    </div>
  );
}

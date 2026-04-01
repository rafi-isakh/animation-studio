"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  FileJson,
  FileSpreadsheet,
  SplitSquareHorizontal,
  Upload,
  Clock,
  FileText,
  Ban,
  Video,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import StoryboardTable from "./StoryboardTable";
import DriveSettings from "./DriveSettings";
import GenrePresets, { type GenrePreset } from "./GenrePresets";
import { useGenrePresets } from "../hooks/useGenrePresets";
import { uploadFileToDrive } from "../services";
import { getChapter } from "../../services/firestore";
import { useProject } from "@/contexts/ProjectContext";
import type { SplitResult, Scene, Continuity } from "../types";

/**
 * Parse CSV text into a 2D array, handling quoted fields properly
 */
function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (current !== "" || row.length > 0) {
        row.push(current);
        result.push(row);
        row = [];
        current = "";
      }
      if (char === "\r" && nextChar === "\n") i++;
    } else {
      current += char;
    }
  }
  if (current !== "" || row.length > 0) {
    row.push(current);
    result.push(row);
  }
  return result;
}

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
    splitStartEndFrames,
    importStoryboard,
    clearStoryboardGeneration,
    isStageSkipped,
  } = useMithril();
  const { isGenerating, error, scenes, voicePrompts, characterIdSummary, genre } = storyboardGenerator;
  const { toast } = useToast();
  const { language, dictionary } = useLanguage();
  const { currentProjectId } = useProject();

  // File input refs for imports
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // File input refs for configuration file uploads
  const bgInstructionFileRef = useRef<HTMLInputElement>(null);
  const negativeInstructionFileRef = useRef<HTMLInputElement>(null);
  const videoInstructionFileRef = useRef<HTMLInputElement>(null);

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
-예외: 대규모 전투씬(Battle scenes)은 이 규칙에서 제외한다.
25. **[대문자 ID 표기 (UPPERCASE ID Convention)]**: imagePrompt에 등장하는 주요 캐릭터명과 고유 아이템/소품은 반드시 대문자(UPPERCASE)로 표기하십시오. 소유격('s)은 금지하고, 언더바(_)로 연결합니다.
- 예시: 'Princess Kania holds her sword' (X) → 'KANIA holds KANIA_SWORD' (O)
- 예시: 'Arel rides his horse' (X) → 'AREL rides AREL_HORSE' (O)
- 재질이나 속성은 ID에 통합: 'glass bottle' (X) → 'GLASS_BOTTLE' (O)
- 셀 수 없는 명사(juice, blood, fire)는 대문자 금지. 셀 수 있는 사물만 대문자 ID 적용.
- 일반 군중(crowd, people)은 대문자 금지.
- 직함이나 외형 묘사를 이름에 붙이지 마십시오: 'Princess KANIA' (X) → 'KANIA' (O)`,
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

  // Genre presets hook
  const {
    presets: genrePresets,
    addPreset: addGenrePreset,
    updatePreset: updateGenrePreset,
    renamePreset: renameGenrePreset,
    deletePreset: deleteGenrePreset,
  } = useGenrePresets();

  // Conditions state
  const [storyCondition, setStoryCondition] = useState(defaultConditions.story);
  const [imageCondition, setImageCondition] = useState(defaultConditions.image);
  const [videoCondition, setVideoCondition] = useState(defaultConditions.video);
  const [soundCondition, setSoundCondition] = useState(defaultConditions.sound);
  const [imageGuide, setImageGuide] = useState("");
  const [videoGuide, setVideoGuide] = useState("");

  // New configuration state (from reference)
  const [targetTime, setTargetTime] = useState("03:00");
  const [customInstruction, setCustomInstruction] = useState("");
  const [backgroundInstruction, setBackgroundInstruction] = useState("");
  const [negativeInstruction, setNegativeInstruction] = useState("");
  const [videoInstruction, setVideoInstruction] = useState("");

  // Local UI state (not lifted to context)
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);

  // UI state
  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  // Load split parts from context on mount
  // If Stage 2 is skipped (single chapter mode), load text from Firestore (Stage 1) directly
  useEffect(() => {
    const loadParts = async () => {
      if (isStageSkipped(2)) {
        // Stage 2 is skipped - load uploaded text from Firestore as a single part
        if (!currentProjectId) return;
        try {
          const chapter = await getChapter(currentProjectId);
          if (chapter?.content) {
            setSplitParts([chapter.content]);
          }
        } catch (err) {
          console.error("Failed to load chapter from Firestore:", err);
        }
      } else {
        // Normal flow - use split parts from Stage 2
        const contextResult = getStageResult(2) as { parts: Array<{ text: string } | string> } | undefined;
        if (contextResult?.parts && Array.isArray(contextResult.parts)) {
          // Handle both PartWithAnalysis objects and plain strings
          const texts = contextResult.parts.map((part) =>
            typeof part === "string" ? part : part.text
          );
          setSplitParts(texts);
        }
      }
    };
    loadParts();
  }, [getStageResult, isStageSkipped, currentProjectId]);

  // Sync context results to stage results for other components
  useEffect(() => {
    if (scenes.length === 0) return;
    setStageResult(4, { scenes, voicePrompts, characterIdSummary, genre });
  }, [scenes, voicePrompts, characterIdSummary, genre, setStageResult]);

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
      // New configuration parameters from reference
      targetTime,
      customInstruction,
      backgroundInstruction,
      negativeInstruction,
      videoInstruction,
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
    targetTime,
    customInstruction,
    backgroundInstruction,
    negativeInstruction,
    videoInstruction,
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
      "Image Prompt (Start)",
      "Image Prompt (End)",
      "Video Prompt",
      "Sora Video Prompt",
      "Veo Video Prompt",
      "Dialogue (Ko)",
      "Dialogue (En)",
      "Narration (Ko)",
      "Narration (En)",
      "SFX (Ko)",
      "SFX (En)",
      "BGM (Ko)",
      "BGM (En)",
    ];

    const clipRows = scenes.flatMap((scene, sceneIndex) =>
      scene.clips.map((clip, clipIndex) => {
        const row = [
          `Scene ${sceneIndex + 1}: ${scene.sceneTitle}`,
          `"${sceneIndex + 1}-${clipIndex + 1}"`,
          clip.length,
          clip.accumulatedTime,
          clip.backgroundId,
          `"${clip.backgroundPrompt.replace(/"/g, '""')}"`,
          `"${clip.story.replace(/"/g, '""')}"`,
          `"${clip.imagePrompt.replace(/"/g, '""')}"`,
          `"${(clip.imagePromptEnd || "").replace(/"/g, '""')}"`,
          `"${clip.videoPrompt.replace(/"/g, '""')}"`,
          `"${clip.soraVideoPrompt.replace(/"/g, '""')}"`,
          `"${clip.veoVideoPrompt.replace(/"/g, '""')}"`,
          `"${clip.dialogue.replace(/"/g, '""')}"`,
          `"${clip.dialogueEn.replace(/"/g, '""')}"`,
          `"${(clip.narration || "").replace(/"/g, '""')}"`,
          `"${(clip.narrationEn || "").replace(/"/g, '""')}"`,
          `"${clip.sfx.replace(/"/g, '""')}"`,
          `"${clip.sfxEn.replace(/"/g, '""')}"`,
          `"${clip.bgm.replace(/"/g, '""')}"`,
          `"${clip.bgmEn.replace(/"/g, '""')}"`,
        ];
        return row.join(",");
      })
    );

    // Append character ID summary and genre after an empty row
    const extraRows: string[] = [];
    if ((characterIdSummary && characterIdSummary.length > 0) || genre) {
      extraRows.push(""); // empty spacer row
      if (characterIdSummary && characterIdSummary.length > 0) {
        extraRows.push("Character ID,Description");
        for (const char of characterIdSummary) {
          extraRows.push(`"${char.characterId.replace(/"/g, '""')}","${char.description.replace(/"/g, '""')}"`);
        }
      }
      if (genre) {
        extraRows.push(""); // spacer before genre
        extraRows.push(`Genre,"${genre.replace(/"/g, '""')}"`);
      }
    }

    const csvContent = [headers.join(","), ...clipRows, ...extraRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `storyboard_part${selectedPartIndex + 1}.csv`;
    link.click();
  }, [scenes, selectedPartIndex, characterIdSummary, genre]);

  const handleApplyPreset = useCallback((preset: GenrePreset) => {
    setStoryCondition(preset.story);
    setImageCondition(preset.image);
    setVideoCondition(preset.video);
    setSoundCondition(preset.sound);
    const presetName = preset.isSystem && preset.nameKey
      ? phrase(dictionary, preset.nameKey, language)
      : preset.name || preset.id;
    toast({
      variant: "success",
      title: phrase(dictionary, "storyboard_preset_applied", language),
      description: presetName,
    });
  }, [toast, dictionary, language]);

  const handleSaveCurrentToPreset = useCallback((id: string) => {
    updateGenrePreset(id, {
      story: storyCondition,
      image: imageCondition,
      video: videoCondition,
      sound: soundCondition,
    });
    toast({
      variant: "success",
      title: phrase(dictionary, "preset_saved", language),
    });
  }, [updateGenrePreset, storyCondition, imageCondition, videoCondition, soundCondition, toast, dictionary, language]);

  const currentConditions = useMemo(() => ({
    story: storyCondition,
    image: imageCondition,
    video: videoCondition,
    sound: soundCondition,
  }), [storyCondition, imageCondition, videoCondition, soundCondition]);

  const handleDownloadJSON = useCallback(() => {
    if (scenes.length === 0) return;

    const exportData = {
      scenes,
      voicePrompts,
      characterIdSummary,
      genre,
      metadata: {
        exportedAt: new Date().toISOString(),
        partIndex: selectedPartIndex + 1,
        totalScenes: scenes.length,
        totalClips: scenes.reduce((acc, s) => acc + s.clips.length, 0),
      },
      conditions: {
        storyCondition,
        imageCondition,
        videoCondition,
        soundCondition,
        imageGuide,
        videoGuide,
      },
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `storyboard_part${selectedPartIndex + 1}.json`;
    link.click();

    toast({
      variant: "success",
      title: phrase(dictionary, "storyboard_toast_json_downloaded", language),
      description: `${scenes.length} ${phrase(dictionary, "storyboard_scenes", language)}, ${scenes.reduce((acc, s) => acc + s.clips.length, 0)} ${phrase(dictionary, "storyboard_clips", language)}`,
    });
  }, [
    scenes,
    voicePrompts,
    selectedPartIndex,
    storyCondition,
    imageCondition,
    videoCondition,
    soundCondition,
    imageGuide,
    videoGuide,
    toast,
    dictionary,
    language,
  ]);

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
        "Image Prompt (Start)",
        "Image Prompt (End)",
        "Video Prompt",
        "Sora Video Prompt",
        "Veo Video Prompt",
        "Dialogue (Ko)",
        "Dialogue (En)",
        "Narration (Ko)",
        "Narration (En)",
        "SFX (Ko)",
        "SFX (En)",
        "BGM (Ko)",
        "BGM (En)",
      ];

      const driveClipRows = scenes.flatMap((scene, sceneIndex) =>
        scene.clips.map((clip, clipIndex) => {
          const row = [
            `Scene ${sceneIndex + 1}: ${scene.sceneTitle}`,
            `"${sceneIndex + 1}-${clipIndex + 1}"`,
            clip.length,
            clip.accumulatedTime,
            clip.backgroundId,
            `"${clip.backgroundPrompt.replace(/"/g, '""')}"`,
            `"${clip.story.replace(/"/g, '""')}"`,
            `"${clip.imagePrompt.replace(/"/g, '""')}"`,
            `"${(clip.imagePromptEnd || "").replace(/"/g, '""')}"`,
            `"${clip.videoPrompt.replace(/"/g, '""')}"`,
            `"${clip.soraVideoPrompt.replace(/"/g, '""')}"`,
            `"${clip.veoVideoPrompt.replace(/"/g, '""')}"`,
            `"${clip.dialogue.replace(/"/g, '""')}"`,
            `"${clip.dialogueEn.replace(/"/g, '""')}"`,
            `"${(clip.narration || "").replace(/"/g, '""')}"`,
            `"${(clip.narrationEn || "").replace(/"/g, '""')}"`,
            `"${clip.sfx.replace(/"/g, '""')}"`,
            `"${clip.sfxEn.replace(/"/g, '""')}"`,
            `"${clip.bgm.replace(/"/g, '""')}"`,
            `"${clip.bgmEn.replace(/"/g, '""')}"`,
          ];
          return row.join(",");
        })
      );

      const driveExtraRows: string[] = [];
      if ((characterIdSummary && characterIdSummary.length > 0) || genre) {
        driveExtraRows.push("");
        if (characterIdSummary && characterIdSummary.length > 0) {
          driveExtraRows.push("Character ID,Description");
          for (const char of characterIdSummary) {
            driveExtraRows.push(`"${char.characterId.replace(/"/g, '""')}","${char.description.replace(/"/g, '""')}"`);
          }
        }
        if (genre) {
          driveExtraRows.push("");
          driveExtraRows.push(`Genre,"${genre.replace(/"/g, '""')}"`);
        }
      }

      const csvContent = [headers.join(","), ...driveClipRows, ...driveExtraRows].join("\n");

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

  const handleImportJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the JSON structure
        if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
          toast({
            variant: "destructive",
            title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
            description: phrase(dictionary, "storyboard_import_invalid", language),
          });
          return;
        }

        // Import the storyboard
        await importStoryboard(data.scenes, data.voicePrompts || [], data.characterIdSummary || [], data.genre);

        // Also restore conditions if available
        if (data.conditions) {
          if (data.conditions.storyCondition) setStoryCondition(data.conditions.storyCondition);
          if (data.conditions.imageCondition) setImageCondition(data.conditions.imageCondition);
          if (data.conditions.videoCondition) setVideoCondition(data.conditions.videoCondition);
          if (data.conditions.soundCondition) setSoundCondition(data.conditions.soundCondition);
          if (data.conditions.imageGuide) setImageGuide(data.conditions.imageGuide);
          if (data.conditions.videoGuide) setVideoGuide(data.conditions.videoGuide);
        }

        toast({
          variant: "success",
          title: phrase(dictionary, "storyboard_import_success", language),
          description: `${data.scenes.length} ${phrase(dictionary, "storyboard_scenes", language)}, ${data.scenes.reduce((acc: number, s: { clips: unknown[] }) => acc + s.clips.length, 0)} ${phrase(dictionary, "storyboard_clips", language)}`,
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
          description: phrase(dictionary, "storyboard_import_failed", language),
        });
      }
    };

    reader.readAsText(file);

    // Reset the file input so the same file can be imported again
    event.target.value = "";
  }, [importStoryboard, toast, dictionary, language]);

  const handleCSVImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;

        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast({
            variant: "destructive",
            title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
            description: phrase(dictionary, "storyboard_csv_import_invalid", language),
          });
          return;
        }

        const header = rows[0].map((h) => h.trim());

        // Find column indices by header name (supports both Korean and English)
        const findIdx = (names: string[]) => {
          let found = header.findIndex((h) => names.some((n) => h === n));
          if (found !== -1) return found;
          return header.findIndex((h) =>
            names.some((n) => h.toLowerCase().includes(n.toLowerCase()))
          );
        };

        const idx = {
          scene: findIdx(["Scene", "씬", "시나리오"]),
          clip: findIdx(["Clip", "클립", "번호"]),
          length: findIdx(["Length", "길이", "시간"]),
          accTime: findIdx(["Accumulated", "누적"]),
          bgId: findIdx(["Background ID", "배경 ID"]),
          bgPrompt: findIdx(["Background Prompt", "배경 프롬프트"]),
          story: findIdx(["Story", "스토리", "내용"]),
          imgStart: findIdx(["Image Prompt (Start)", "이미지 프롬프트 (Start)", "Image Prompt", "이미지 프롬프트"]),
          imgEnd: findIdx(["Image Prompt (End)", "이미지 프롬프트 (End)"]),
          video: findIdx(["Video Prompt", "비디오 프롬프트"]),
          sora: findIdx(["Sora", "소라", "Sora Video Prompt"]),
          veo: findIdx(["Veo", "Veo Video Prompt"]),
          dialogue: findIdx(["Dialogue (Ko)", "대사 (Ko)", "대사"]),
          dialogueEn: findIdx(["Dialogue (En)", "대사 (En)"]),
          narration: findIdx(["Narration (Ko)", "나레이션 (Ko)", "나레이션"]),
          narrationEn: findIdx(["Narration (En)", "나레이션 (En)"]),
          sfx: findIdx(["SFX (Ko)", "효과음 (Ko)", "효과음"]),
          sfxEn: findIdx(["SFX (En)", "효과음 (En)"]),
          bgm: findIdx(["BGM (Ko)", "배경음악 (Ko)", "배경음악"]),
          bgmEn: findIdx(["BGM (En)", "배경음악 (En)"]),
        };

        const parsedScenes: Scene[] = [];
        let currentScene: Scene | null = null;
        let lastSceneLabel = "";

        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i];
          if (cols.length < 2) continue;

          const getVal = (index: number) => {
            if (index < 0 || index >= cols.length) return "";
            return cols[index];
          };

          const sceneLabel = getVal(idx.scene);

          const clip: Continuity = {
            length: getVal(idx.length),
            accumulatedTime: getVal(idx.accTime),
            backgroundId: getVal(idx.bgId),
            backgroundPrompt: getVal(idx.bgPrompt),
            story: getVal(idx.story),
            imagePrompt: getVal(idx.imgStart),
            imagePromptEnd: getVal(idx.imgEnd) || undefined,
            videoPrompt: getVal(idx.video),
            soraVideoPrompt: getVal(idx.sora),
            veoVideoPrompt: getVal(idx.veo),
            pixAiPrompt: "",
            dialogue: getVal(idx.dialogue),
            dialogueEn: getVal(idx.dialogueEn),
            narration: getVal(idx.narration),
            narrationEn: getVal(idx.narrationEn),
            sfx: getVal(idx.sfx),
            sfxEn: getVal(idx.sfxEn),
            bgm: getVal(idx.bgm),
            bgmEn: getVal(idx.bgmEn),
          };

          if (!currentScene || (sceneLabel && sceneLabel !== lastSceneLabel)) {
            lastSceneLabel = sceneLabel;
            const label = sceneLabel || `Scene ${parsedScenes.length + 1}`;
            const sceneTitle = label.includes(": ") ? label.split(": ").slice(1).join(": ") : label;
            currentScene = {
              sceneTitle,
              clips: [clip],
            };
            parsedScenes.push(currentScene);
          } else {
            currentScene.clips.push(clip);
          }
        }

        if (parsedScenes.length > 0) {
          await importStoryboard(parsedScenes, []);
          const totalClips = parsedScenes.reduce((acc, s) => acc + s.clips.length, 0);
          toast({
            variant: "success",
            title: phrase(dictionary, "storyboard_import_success", language),
            description: `${parsedScenes.length} ${phrase(dictionary, "storyboard_scenes", language)}, ${totalClips} ${phrase(dictionary, "storyboard_clips", language)}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
            description: phrase(dictionary, "storyboard_csv_import_invalid", language),
          });
        }
      } catch (err) {
        toast({
          variant: "destructive",
          title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
          description: phrase(dictionary, "storyboard_import_failed", language),
        });
      }
    };

    reader.readAsText(file);

    // Reset the file input so the same file can be imported again
    event.target.value = "";
  }, [importStoryboard, toast, dictionary, language]);

  // Handler for configuration file uploads
  const handleConfigFileUpload = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string>>
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setter(content);
      };
      reader.readAsText(file);

      // Reset the file input so the same file can be uploaded again
      event.target.value = "";
    },
    []
  );

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
                {(splitParts[selectedPartIndex]?.length ?? 0).toLocaleString()}{" "}
                {phrase(dictionary, "chars", language)}
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto scrollbar-hide">
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
            {isStageSkipped(2)
              ? phrase(dictionary, "storyboard_no_upload", language)
              : phrase(dictionary, "storyboard_no_parts", language)}
          </p>
        </div>
      )}

      {/* Configuration Section (from reference) */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#DB2777]" />
          {phrase(dictionary, "storyboard_config_title", language) || "Generation Configuration"}
        </h3>

        {/* Row 1: Target Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 text-[#DB2777]" />
              {phrase(dictionary, "storyboard_target_time", language) || "Total Running Time"}
            </label>
            <input
              type="text"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              placeholder="03:00"
              className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {phrase(dictionary, "storyboard_target_time_hint", language) || "Format: MM:SS (e.g., 03:00 for 3 minutes)"}
            </p>
          </div>
        </div>

        {/* Row 2: Story Guide (Custom Instruction) */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <BookOpen className="w-4 h-4 text-[#DB2777]" />
            {phrase(dictionary, "storyboard_story_guide", language) || "Story Guide"}
          </label>
          <textarea
            rows={3}
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder={phrase(dictionary, "storyboard_story_guide_placeholder", language) || "What to emphasize, what to omit, what narrative to extend..."}
            className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none resize-none"
          />
        </div>

        {/* Row 3: File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Background ID Instruction */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <FileText className="w-4 h-4 text-blue-500" />
              {phrase(dictionary, "storyboard_bg_instruction", language) || "Background ID"}
            </label>
            <input
              type="file"
              ref={bgInstructionFileRef}
              accept=".txt"
              onChange={(e) => handleConfigFileUpload(e, setBackgroundInstruction)}
              className="hidden"
            />
            <button
              onClick={() => bgInstructionFileRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg border-2 border-dashed transition-all ${
                backgroundInstruction
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {backgroundInstruction ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {phrase(dictionary, "storyboard_file_loaded", language) || "Loaded"}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {phrase(dictionary, "storyboard_upload_txt", language) || "Upload .txt"}
                </>
              )}
            </button>
            {backgroundInstruction && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 truncate" title={backgroundInstruction.slice(0, 100)}>
                {backgroundInstruction.slice(0, 50)}...
              </p>
            )}
          </div>

          {/* Negative Prompt Instruction */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Ban className="w-4 h-4 text-red-500" />
              {phrase(dictionary, "storyboard_negative_instruction", language) || "Negative Prompt"}
            </label>
            <input
              type="file"
              ref={negativeInstructionFileRef}
              accept=".txt"
              onChange={(e) => handleConfigFileUpload(e, setNegativeInstruction)}
              className="hidden"
            />
            <button
              onClick={() => negativeInstructionFileRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg border-2 border-dashed transition-all ${
                negativeInstruction
                  ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-300"
                  : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-400 hover:text-red-600"
              }`}
            >
              {negativeInstruction ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {phrase(dictionary, "storyboard_file_loaded", language) || "Loaded"}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {phrase(dictionary, "storyboard_upload_txt", language) || "Upload .txt"}
                </>
              )}
            </button>
            {negativeInstruction && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate" title={negativeInstruction.slice(0, 100)}>
                {negativeInstruction.slice(0, 50)}...
              </p>
            )}
          </div>

          {/* Video Prompt Rule Instruction */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Video className="w-4 h-4 text-purple-500" />
              {phrase(dictionary, "storyboard_video_instruction", language) || "Video Prompt Rule"}
            </label>
            <input
              type="file"
              ref={videoInstructionFileRef}
              accept=".txt"
              onChange={(e) => handleConfigFileUpload(e, setVideoInstruction)}
              className="hidden"
            />
            <button
              onClick={() => videoInstructionFileRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg border-2 border-dashed transition-all ${
                videoInstruction
                  ? "bg-purple-50 dark:bg-purple-900/20 border-purple-400 text-purple-700 dark:text-purple-300"
                  : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              {videoInstruction ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {phrase(dictionary, "storyboard_file_loaded", language) || "Loaded"}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {phrase(dictionary, "storyboard_upload_txt", language) || "Upload .txt"}
                </>
              )}
            </button>
            {videoInstruction && (
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 truncate" title={videoInstruction.slice(0, 100)}>
                {videoInstruction.slice(0, 50)}...
              </p>
            )}
          </div>
        </div>
      </div>

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
            {/* Genre Presets */}
            <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
              <GenrePresets
                presets={genrePresets}
                onApply={handleApplyPreset}
                onSaveCurrent={handleSaveCurrentToPreset}
                onAddPreset={addGenrePreset}
                onUpdatePreset={updateGenrePreset}
                onRenamePreset={renameGenrePreset}
                onDeletePreset={deleteGenrePreset}
                currentConditions={currentConditions}
              />
            </div>

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

        {/* Hidden file input for JSON import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImportJSON}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileJson className="w-5 h-5" />
          {phrase(dictionary, "storyboard_json_import", language)}
        </button>

        {/* Hidden file input for CSV import */}
        <input
          type="file"
          ref={csvFileInputRef}
          accept=".csv"
          onChange={handleCSVImport}
          className="hidden"
        />
        <button
          onClick={() => csvFileInputRef.current?.click()}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileSpreadsheet className="w-5 h-5" />
          {phrase(dictionary, "storyboard_csv_import", language)}
        </button>

        {/* <button
          onClick={() => setShowDriveSettings(!showDriveSettings)}
          className="flex items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
          {phrase(dictionary, "storyboard_drive_settings", language)}
        </button> */}
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
                onClick={handleDownloadJSON}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <FileJson className="w-4 h-4" />
                {phrase(dictionary, "storyboard_json_download", language)}
              </button>
              <button
                onClick={async () => {
                  await splitStartEndFrames();
                  toast({
                    variant: "success",
                    title: phrase(dictionary, "storyboard_split_complete", language),
                    description: phrase(dictionary, "storyboard_split_description", language),
                  });
                }}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SplitSquareHorizontal className="w-4 h-4" />
                {phrase(dictionary, "storyboard_split_frames", language)}
              </button>
              {/* <button
                onClick={handleSaveToDrive}
                disabled={isSavingToDrive}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CloudUpload className="w-4 h-4" />
                {isSavingToDrive ? phrase(dictionary, "storyboard_saving", language) : phrase(dictionary, "storyboard_save_to_drive", language)}
              </button> */}
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

          <StoryboardTable 
            data={scenes} 
            voicePrompts={voicePrompts} 
            characterIdSummary={characterIdSummary}
            genre={genre}
          />
        </div>
      )}
    </div>
  );
}

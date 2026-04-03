"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { useMithril } from "../../MithrilContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Dictionary, Language } from "@/components/Types";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Trash2,
  FileJson,
  FileSpreadsheet,
  SplitSquareHorizontal,
  Upload,
  Hash,
  FileText,
  Ban,
  Video,
  BookOpen,
  CheckCircle,
  Image,
  Search,
  ArrowLeft,
} from "lucide-react";
import StoryboardTable from "../../StoryboardGenerator/components/StoryboardTable";
import DriveSettings from "../../StoryboardGenerator/components/DriveSettings";
import { getChapter } from "../../services/firestore";
import { useProject } from "@/contexts/ProjectContext";
import type { Scene, Continuity, TrailerOption } from "../../StoryboardGenerator/types";
import TrailerSurvey from "./TrailerSurvey";

// Default file instruction contents (from 02_작업에 필요한 파일)
const DEFAULT_BACKGROUND_INSTRUCTION = `Background ID Column:

'N' must be a number value based on the background location. 'N' must be same for same location.

Full shot, background/new scene introductory shot==N-1 (I.e. 1-1, 4-1-1, 3-1, etc)
Worm's eye wide angle shot / 2인샷 와이드뷰 ==N-2
Close up of character A (in a conversation of characters A and B, or A's monologue)==N-3
Close up of character B (in a conversation of characters A and B, or B's monologue)==N-4
Close up of character A/B in conversation or monologue, group shot, moving or witnessing a scene ==N-5
Bird's eye view==N-6 (I.e. 1-6, 4-6-1, 3-6, etc)
Over the shoulder POV of behind character A (as characer B speaks)==N-7 (I.e. 1-7, 4-7-1, 3-7, etc)
Over the shoulder POV of behind character A (as characer A speaks)==N-8
Close up of character's hand / Close up of character's foot / Close up of object on ground / Close up of object in sky==N-9
B-roll supplementary scene, or custom background, flat color background for emotional impact, flashback white blurry frame==N-N (i.e. 2-N, 4-N-1, 4-N-2, 8-1, etc)

MUST: 클립 연속으로 반복되지 않은, 다른 앵글 골고루 부여. 같은 Scene에서 같은 앵글이 나타나는경우 N-N-1 로 세번째 숫자 추가 (i.e. If two or more clips share the same 3-3 angle, make one 3-3 and one 3-3-1, 3-3-2, etc)`;

const DEFAULT_NEGATIVE_INSTRUCTION = `Length Column.
(Value less than 1 seconds, Value more than 5 seconds)

Image Prompt (Start) Column.
(Mention or descriptors of character, mention or descriptors of background or location, omit 'speaks/speaking' indicator prompt when there is dialogue in Dialogue (En) Column)

Background/배경 ID Column.
(Printing of the same background ID twice without adding third number to make each clips Background ID unique, Printing only single digits, Printing Miscellaneous N as the first value, location by alphabet, background ID's value second mismatching the camera angle value in image prompt i.e. N-6 wide angle shot, N-5 worm angle)

스토리 Column.
(Printing in English instead of Korean)

SFX (Ko) Column.
(Random rendering of.mp3 names, render english prompt instead of Korean translation)

SFX (En) Column.
(Random rendering of.mp3 names)

BGM (Ko) Column.
(Random rendering of.mp3 names, render english prompt instead of Korean translation)

BGM (En) Column.
(Random rendering of.mp3 names)

Dialogue (Ko) Column.
(Missing [emotion] tag before Korean line, non-Korean translation, omit who is saying the line, make up line not in the web novel txt)

Dialogue (En) Column.
(Missing [emotion] tag before line, omit who is saying the line, make up line not in the web novel txt)

Video Prompt Column.
(Missing prompt of "speaks/speaking" factor when there is a dialogue of character speaking)


Sora Video Prompt Column.
(Missing Dialogue (En), SFX (En). And BGM(En) in the bottom of prompt)`;

const DEFAULT_VIDEO_INSTRUCTION = `Video Prompt Column.

1. Character/object ID changes to one-word descriptor (the knight, the mage, the rogue, the archer, the squire, the awakened one, etc)
2. 모든 비디오 프롬프트의 가장 시작 부분에 반드시 카메라 워킹(Camera Movement)을 명시하십시오. (예: Still shot, Tracking shot, POV crane shot, Panning left, Panning right, Panning up, Panning down, Tilt up, Tilt down, Zoom in, Zoom out 등). 이는 어떠한 경우에도 생략해서는 안 되며, 최우선 문법 규칙으로 적용됩니다.
3. 강적 등장 장면: Low Angle + Backlighting 실루엣 (드래곤, 악마, 거대 적)
 이동/추격: Tracking 또는 Dynamic Follow (기사 추격, 기병 돌진)
 긴장 고조: Slow Push-In 또는 Snap Zoom-In (마법 폭발 직전, 적 등장 직전)
4. Always include word of (speaks / talks / yells / shouts), even when face partially covered by hand (i.e. The maid speaks softly) and always attach "(pronoun)'s head stays still" for less chaos
5. 전투 중 발화 장면 규칙
 구조: Speak moment → Quick camera reaction → Maintain head angle
 예: "the knight shouts during impact, the camera snap-zooms in, his head angle stays still"
 폭발·충돌 직전 발화: Low Angle → Backlighting → Shout → Head angle stays still`;

const DEFAULT_IMAGE_INSTRUCTION = `You are a director working like a camera man, projecting a scene from four different perspectives. Each Clip must contain 4 Types of the same scene, divided into Image Prompt A, Image Prompt B, Image Prompt C, and Image Prompt D. Each type has 5 variations (A1-A5, B1-B5, C1-C5, D1-D5). Understand the pattern within the example prompts.

A = attention_device, B = attention_action, C = attention_expression, D = attention_mood

Example Source Text:
It was raining outside, the cloud blocking off any hint of hope of sunlight despite being morning. ELISA_PAST threw the TELEPHONE on to the floor, breaking it to pieces. At this point, Tears were already flowing in her eyes, and there was no point of return.
There was only despair at this point.

**Image Prompt A (attention_device)** — centered around the key prop/object in the scene.
The first word must be camera-distance related (Full Shot, Wide Shot, Medium Close Up, Side Close Up, Back view, Bird's eye view), paired with Eye-level, low angle, or high angle.
Examples:
(A1) Eye-level Full Shot of ELISA_PAST holding her TELEPHONE close to her ear. Her eyes are widened, and tears are flowing from her eyes.
(A2) High angle Bird's eye view of ELISA_PAST holding her TELEPHONE close to her ear. Her eyes are widened, and tears are flowing from her eyes.
(A3) Low angle Side close-up of ELISA_PAST tossing her TELEPHONE onto the floor.
(A4) Medium Close Up of ELISA_PAST gripping the TELEPHONE with trembling hands.
(A5) Wide Shot of ELISA_PAST standing alone, TELEPHONE fragments scattered on the floor.

**Image Prompt B (attention_action)** — centered around the physical action of a character. Extreme close-up of hand, foot, or body movement. Should not be a person's face or expression.
Examples:
(B1) Extreme close-up shot of ELISA_PAST's foot on the floor, as the TELEPHONE hits the floor and shatters into pieces.
(B2) Extreme close-up of ELISA_PAST's hand tossing the TELEPHONE. The TELEPHONE is already inches away in the air, shallow depth of field.
(B3) Extreme close-up of ELISA_PAST's arm mid-swing, releasing the TELEPHONE.
(B4) Low angle close-up of the TELEPHONE shattering on impact, debris flying outward.
(B5) Extreme close-up of ELISA_PAST's clenched fist after throwing, knuckles white.

**Image Prompt C (attention_expression)** — centered around extreme close-up of face, eyes, or pupils to exaggerate emotion. Background uses solid color for impact.
Examples:
(C1) Extreme close-up of ELISA_PAST's eyes widening in fear, as tears start flowing. Background is rendered black.
(C2) Low angle close-up of ELISA_PAST's face turning pale as her eyes widen. Her eyes have no highlights. Background is rendered red.
(C3) Extreme close-up of a single tear rolling down ELISA_PAST's cheek. Background is rendered dark grey.
(C4) Side close-up of ELISA_PAST's trembling lips, eyes downcast. Background is rendered deep blue.
(C5) Extreme close-up of ELISA_PAST's pupil reflecting a broken phone. Background is rendered black.

**Image Prompt D (attention_mood)** — centered around the overall atmosphere/tone of the scene. Environment, lighting, color grading, weather as emotional device.
Examples:
(D1) Extreme close-up of puddle on the ground. It is raining, and the raindrops create ripples on the small body of water. Time of the day is morning, but cloudy and no sun.
(D2) Wide shot of grey overcast sky through a window, rain streaking down the glass pane.
(D3) Low angle shot of rain falling against dim interior light, silhouetting furniture.
(D4) Extreme close-up of raindrops hitting a windowsill, cold morning light diffused through clouds.
(D5) Bird's eye view of the empty room, broken phone on the floor, rain visible through the window.`;

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

export default function WebnovelTrailerStoryboardGenerator() {
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
  const imageInstructionFileRef = useRef<HTMLInputElement>(null);
  const imagePromptQAFileRef = useRef<HTMLInputElement>(null);

  // Trailer survey state
  const [currentView, setCurrentView] = useState<'survey' | 'editor'>('survey');
  const [selectedTrailerScript, setSelectedTrailerScript] = useState<TrailerOption | undefined>(undefined);
  const [trailerSourceText, setTrailerSourceText] = useState<string>("");

  // Image Prompt QA Package
  const [imagePromptQA, setImagePromptQA] = useState("");

  // Find & Replace
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // Default conditions
  const defaultConditions = useMemo(
    () => ({
      story: `클립별로 스토리를 표시하는게 아니라 클립의 유사성으로 (같은 씬인데 각도가 교차되는 느낌, 하나의 큰 스토리에 묶여있는 클립이면 또한 동일 스토리로 구분)묶고, Story 1: n, Story 2: n 이런식으로 반복 표기해줘. 그래도 어떤 캐릭터가 무슨 행동을 하는 어떤 장면인지 정도는 서술해야해.
콘티에서 스토리 칼럼은 한글로 표시한다.`,
      image: `[가장 중요한 규칙 1] 모든 이미지 프롬프트의 가장 시작 부분은 반드시 "[CameraAngle][ShotType] of [CHARACTER ID], [Action]." 형식의 문법 구조를 따라야 합니다.
[가장 중요한 규칙 2] 캐릭터가 등장하는 경우 오직 이름(CHARACTER ID)으로만 지칭하십시오. 외형적 묘사는 일절 언급하지 마십시오.
8. 색감(Color Palette)을 씬의 분위기에 맞게 조정한다.
10. 불필요한 텍스트나 워터마크를 포함하지 않는다.
13. 날씨나 계절감을 시각적으로 표현한다.
14. 렌즈 효과(Depth of field)를 활용하여 깊이감을 준다.
15. 동작의 역동성보다는 순간의 결정적 장면(Keyframe)을 포착한다.
20. Never use the word 'frozen'. If a character is shocked, just say 'he is shocked'.
21. 이미지 프롬프트 뒤에 항상 이 프롬프트 붙여줘 'No vfx or visual effects, no dust particles'
23. 16:9 비율에 최적화된 이미지 프롬프트여야 한다.
24. 시각적 인물 수 제한: 등장인물의 수는 반드시 최대 5명 이하로 제한한다.
25. imagePrompt에 등장하는 주요 캐릭터명과 고유 아이템/소품은 반드시 대문자(UPPERCASE)로 표기하십시오.`,
      video: `0. [가장 중요한 규칙] 모든 비디오 프롬프트의 가장 시작 부분에 반드시 카메라 워킹(Camera Movement)을 명시하십시오.
1. 카메라 앵글과 동작 위주로 간결하게 구성한다.
2. 대사가 있는 장면에는 반드시 "speaks / talks / yells / shouts" 등 직설적 발화 키워드를 포함한다.
3. 캐릭터 이름 대신 역할 기반 묘사 사용
4. 입이 반쯤 가려져 있어도 반드시 발화 키워드 포함
5. 질문 장면도 직관적 키워드 "speaks / yells / shouts / talks"로 통일
6. 말하는 장면에는 항상 "(pronoun)'s head angle stays still" 추가`,
      sound: `1. 음향은 **대사(Dialogue/Narration)**, **효과음(SFX)**, **배경음악(BGM)**으로 각자의 Column에 구분하여 따로 생성된다.
2. 효과음(SFX)에는 () 괄호 없이 생성하도록 한다.
3. '스토리' 열에 포함된 대사/속마음은 '대사' 열에 반드시 동일하게 표기한다.
4. 캐릭터 ID [감정](대사) 형식을 준수한다.
5. 대사가 없는 구간은 대사 필드를 비워둔다.
6. 효과음과 배경음악은 각자의 필드에 정확히 기입한다.`,
    }),
    []
  );

  // State from Stage 2 (StorySplitter)
  const [splitParts, setSplitParts] = useState<string[]>([]);
  const [selectedPartIndex, setSelectedPartIndex] = useState<number>(0);

  // Conditions state
  const [storyCondition, setStoryCondition] = useState(defaultConditions.story);
  const [imageCondition, setImageCondition] = useState(defaultConditions.image);
  const [videoCondition, setVideoCondition] = useState(defaultConditions.video);
  const [soundCondition, setSoundCondition] = useState(defaultConditions.sound);
  const [imageGuide, setImageGuide] = useState("");
  const [videoGuide, setVideoGuide] = useState("");

  // NSFW-specific configuration state
  const [clipCount, setClipCount] = useState("95");
  const [customInstruction, setCustomInstruction] = useState("");
  const [backgroundInstruction, setBackgroundInstruction] = useState(DEFAULT_BACKGROUND_INSTRUCTION);
  const [negativeInstruction, setNegativeInstruction] = useState(DEFAULT_NEGATIVE_INSTRUCTION);
  const [videoInstruction, setVideoInstruction] = useState(DEFAULT_VIDEO_INSTRUCTION);
  const [imageInstruction, setImageInstruction] = useState(DEFAULT_IMAGE_INSTRUCTION);

  // UI state
  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const [showConditions, setShowConditions] = useState(false);

  // Load split parts from context on mount
  useEffect(() => {
    const loadParts = async () => {
      if (isStageSkipped(2)) {
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
        const contextResult = getStageResult(2) as { parts: Array<{ text: string } | string> } | undefined;
        if (contextResult?.parts && Array.isArray(contextResult.parts)) {
          const texts = contextResult.parts.map((part) =>
            typeof part === "string" ? part : part.text
          );
          setSplitParts(texts);
        }
      }
    };
    loadParts();
  }, [getStageResult, isStageSkipped, currentProjectId]);

  // Sync context results to stage results for downstream stages
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

    const sourceText = trailerSourceText || splitParts[selectedPartIndex];
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
      customInstruction,
      backgroundInstruction,
      negativeInstruction,
      videoInstruction,
      imageInstruction,
      clipCount,
      imagePromptQA,
      selectedTrailerScript: selectedTrailerScript
        ? JSON.stringify(selectedTrailerScript.script)
        : "",
    });

    if (!storyboardGenerator.error && storyboardGenerator.scenes.length > 0) {
      toast({
        variant: "success",
        title: phrase(dictionary, "storyboard_toast_generated", language),
        description: `${storyboardGenerator.scenes.length} ${phrase(dictionary, "storyboard_toast_created_scenes", language)}`,
      });
    }
  }, [
    trailerSourceText,
    splitParts,
    selectedPartIndex,
    storyCondition,
    imageCondition,
    videoCondition,
    soundCondition,
    imageGuide,
    videoGuide,
    customInstruction,
    backgroundInstruction,
    negativeInstruction,
    videoInstruction,
    imageInstruction,
    clipCount,
    imagePromptQA,
    selectedTrailerScript,
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
      "attention_device(A)",
      "Image Prompt A1",
      "Image Prompt A2",
      "Image Prompt A3",
      "Image Prompt A4",
      "Image Prompt A5",
      "attention_action(B)",
      "Image Prompt B1",
      "Image Prompt B2",
      "Image Prompt B3",
      "Image Prompt B4",
      "Image Prompt B5",
      "attention_expression(C)",
      "Image Prompt C1",
      "Image Prompt C2",
      "Image Prompt C3",
      "Image Prompt C4",
      "Image Prompt C5",
      "attention_mood(D)",
      "Image Prompt D1",
      "Image Prompt D2",
      "Image Prompt D3",
      "Image Prompt D4",
      "Image Prompt D5",
      "Video Prompt",
      "Sora Video Prompt",
      "Veo Video Prompt",
      "PixAI Prompt",
      "Dialogue (Ko)",
      "Dialogue (En)",
      "Narration (Ko)",
      "Narration (En)",
      "SFX (Ko)",
      "SFX (En)",
      "BGM (Ko)",
      "BGM (En)",
      "Trailer Script (Ko)",
      "Trailer Script (En)",
    ];

    const q = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;

    const clipRows = scenes.flatMap((scene, sceneIndex) =>
      scene.clips.map((clip, clipIndex) => {
        const row = [
          q(`Scene ${sceneIndex + 1}: ${scene.sceneTitle}`),
          `${sceneIndex + 1}-${clipIndex + 1}`,
          clip.length,
          clip.accumulatedTime,
          clip.backgroundId,
          q(clip.backgroundPrompt),
          q(clip.story),
          q(clip.attentionDevice || ""),
          q(clip.imagePromptA1 || ""),
          q(clip.imagePromptA2 || ""),
          q(clip.imagePromptA3 || ""),
          q(clip.imagePromptA4 || ""),
          q(clip.imagePromptA5 || ""),
          q(clip.attentionAction || ""),
          q(clip.imagePromptB1 || ""),
          q(clip.imagePromptB2 || ""),
          q(clip.imagePromptB3 || ""),
          q(clip.imagePromptB4 || ""),
          q(clip.imagePromptB5 || ""),
          q(clip.attentionExpression || ""),
          q(clip.imagePromptC1 || ""),
          q(clip.imagePromptC2 || ""),
          q(clip.imagePromptC3 || ""),
          q(clip.imagePromptC4 || ""),
          q(clip.imagePromptC5 || ""),
          q(clip.attentionMood || ""),
          q(clip.imagePromptD1 || ""),
          q(clip.imagePromptD2 || ""),
          q(clip.imagePromptD3 || ""),
          q(clip.imagePromptD4 || ""),
          q(clip.imagePromptD5 || ""),
          q(clip.videoPrompt),
          q(clip.soraVideoPrompt),
          q(clip.veoVideoPrompt),
          q(clip.pixAiPrompt || ""),
          q(clip.dialogue),
          q(clip.dialogueEn),
          q(clip.narration || ""),
          q(clip.narrationEn || ""),
          q(clip.sfx),
          q(clip.sfxEn),
          q(clip.bgm),
          q(clip.bgmEn),
          q(clip.trailerScriptKo || ""),
          q(clip.trailerScriptEn || ""),
        ];
        return row.join(",");
      })
    );

    const extraRows: string[] = [];
    if ((characterIdSummary && characterIdSummary.length > 0) || genre) {
      extraRows.push("");
      if (characterIdSummary && characterIdSummary.length > 0) {
        extraRows.push("Character ID,Description");
        for (const char of characterIdSummary) {
          extraRows.push(`${q(char.characterId)},${q(char.description)}`);
        }
      }
      if (genre) {
        extraRows.push("");
        extraRows.push(`Genre,${q(genre)}`);
      }
    }

    const csvContent = [headers.join(","), ...clipRows, ...extraRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `storyboard_nsfw_part${selectedPartIndex + 1}.csv`;
    link.click();
  }, [scenes, selectedPartIndex, characterIdSummary, genre]);

  const handleDownloadXLSX = useCallback(() => {
    if (scenes.length === 0) return;

    const headers = [
      "Scene",
      "Clip",
      "Length",
      "Accumulated Time",
      "Background ID",
      "Background Prompt",
      "Story",
      "attention_device(A)",
      "Image Prompt A1",
      "Image Prompt A2",
      "Image Prompt A3",
      "Image Prompt A4",
      "Image Prompt A5",
      "attention_action(B)",
      "Image Prompt B1",
      "Image Prompt B2",
      "Image Prompt B3",
      "Image Prompt B4",
      "Image Prompt B5",
      "attention_expression(C)",
      "Image Prompt C1",
      "Image Prompt C2",
      "Image Prompt C3",
      "Image Prompt C4",
      "Image Prompt C5",
      "attention_mood(D)",
      "Image Prompt D1",
      "Image Prompt D2",
      "Image Prompt D3",
      "Image Prompt D4",
      "Image Prompt D5",
      "Video Prompt",
      "Sora Video Prompt",
      "Veo Video Prompt",
      "PixAI Prompt",
      "Dialogue (Ko)",
      "Dialogue (En)",
      "Narration (Ko)",
      "Narration (En)",
      "SFX (Ko)",
      "SFX (En)",
      "BGM (Ko)",
      "BGM (En)",
      "Trailer Script (Ko)",
      "Trailer Script (En)",
    ];

    const clipRows = scenes.flatMap((scene, sceneIndex) =>
      scene.clips.map((clip, clipIndex) => [
        `Scene ${sceneIndex + 1}: ${scene.sceneTitle}`,
        `${sceneIndex + 1}-${clipIndex + 1}`,
        clip.length,
        clip.accumulatedTime,
        clip.backgroundId,
        clip.backgroundPrompt,
        clip.story,
        clip.attentionDevice || "",
        clip.imagePromptA1 || "",
        clip.imagePromptA2 || "",
        clip.imagePromptA3 || "",
        clip.imagePromptA4 || "",
        clip.imagePromptA5 || "",
        clip.attentionAction || "",
        clip.imagePromptB1 || "",
        clip.imagePromptB2 || "",
        clip.imagePromptB3 || "",
        clip.imagePromptB4 || "",
        clip.imagePromptB5 || "",
        clip.attentionExpression || "",
        clip.imagePromptC1 || "",
        clip.imagePromptC2 || "",
        clip.imagePromptC3 || "",
        clip.imagePromptC4 || "",
        clip.imagePromptC5 || "",
        clip.attentionMood || "",
        clip.imagePromptD1 || "",
        clip.imagePromptD2 || "",
        clip.imagePromptD3 || "",
        clip.imagePromptD4 || "",
        clip.imagePromptD5 || "",
        clip.videoPrompt,
        clip.soraVideoPrompt,
        clip.veoVideoPrompt,
        clip.pixAiPrompt || "",
        clip.dialogue,
        clip.dialogueEn,
        clip.narration || "",
        clip.narrationEn || "",
        clip.sfx,
        clip.sfxEn,
        clip.bgm,
        clip.bgmEn,
        clip.trailerScriptKo || "",
        clip.trailerScriptEn || "",
      ])
    );

    const wsData: (string | number)[][] = [headers, ...clipRows];

    if ((characterIdSummary && characterIdSummary.length > 0) || genre) {
      wsData.push([]);
      if (characterIdSummary && characterIdSummary.length > 0) {
        wsData.push(["Character ID", "Description"]);
        for (const char of characterIdSummary) {
          wsData.push([char.characterId, char.description]);
        }
      }
      if (genre) {
        wsData.push([]);
        wsData.push(["Genre", genre]);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Storyboard");
    XLSX.writeFile(wb, `storyboard_nsfw_part${selectedPartIndex + 1}.xlsx`);
  }, [scenes, selectedPartIndex, characterIdSummary, genre]);

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
      trailerData: {
        selectedTrailerScript: selectedTrailerScript || null,
        imagePromptQA: imagePromptQA || "",
      },
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `storyboard_nsfw_part${selectedPartIndex + 1}.json`;
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
    selectedTrailerScript,
    imagePromptQA,
    characterIdSummary,
    genre,
    toast,
    dictionary,
    language,
  ]);

  const handleImportJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
          toast({
            variant: "destructive",
            title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
            description: phrase(dictionary, "storyboard_import_invalid", language),
          });
          return;
        }

        await importStoryboard(data.scenes, data.voicePrompts || [], data.characterIdSummary || [], data.genre);

        if (data.conditions) {
          if (data.conditions.storyCondition) setStoryCondition(data.conditions.storyCondition);
          if (data.conditions.imageCondition) setImageCondition(data.conditions.imageCondition);
          if (data.conditions.videoCondition) setVideoCondition(data.conditions.videoCondition);
          if (data.conditions.soundCondition) setSoundCondition(data.conditions.soundCondition);
          if (data.conditions.imageGuide) setImageGuide(data.conditions.imageGuide);
          if (data.conditions.videoGuide) setVideoGuide(data.conditions.videoGuide);
        }

        if (data.trailerData) {
          if (data.trailerData.selectedTrailerScript) setSelectedTrailerScript(data.trailerData.selectedTrailerScript);
          if (data.trailerData.imagePromptQA) setImagePromptQA(data.trailerData.imagePromptQA);
        }

        toast({
          variant: "success",
          title: phrase(dictionary, "storyboard_import_success", language),
          description: `${data.scenes.length} ${phrase(dictionary, "storyboard_scenes", language)}, ${data.scenes.reduce((acc: number, s: { clips: unknown[] }) => acc + s.clips.length, 0)} ${phrase(dictionary, "storyboard_clips", language)}`,
        });
      } catch {
        toast({
          variant: "destructive",
          title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
          description: phrase(dictionary, "storyboard_import_failed", language),
        });
      }
    };

    reader.readAsText(file);
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
          bgId: findIdx(["Background ID", "배경 ID", "BG ID"]),
          bgPrompt: findIdx(["Background Prompt", "배경 프롬프트", "BG Prompt"]),
          story: findIdx(["Story", "스토리", "내용"]),
          imgStart: findIdx(["Image Prompt (Start)", "이미지 프롬프트 (Start)", "Image Prompt", "이미지 프롬프트"]),
          imgEnd: findIdx(["Image Prompt (End)", "이미지 프롬프트 (End)"]),
          attentionDevice: findIdx(["attention_device(A)", "attention_device (A)", "attention_device"]),
          imgA1: findIdx(["Image Prompt A1"]),
          imgA2: findIdx(["Image Prompt A2"]),
          imgA3: findIdx(["Image Prompt A3"]),
          imgA4: findIdx(["Image Prompt A4"]),
          imgA5: findIdx(["Image Prompt A5"]),
          attentionAction: findIdx(["attention_action(B)", "attention_action (B)", "attention_action"]),
          imgB1: findIdx(["Image Prompt B1"]),
          imgB2: findIdx(["Image Prompt B2"]),
          imgB3: findIdx(["Image Prompt B3"]),
          imgB4: findIdx(["Image Prompt B4"]),
          imgB5: findIdx(["Image Prompt B5"]),
          attentionExpression: findIdx(["attention_expression(C)", "attention_expression (C)", "attention_expression"]),
          imgC1: findIdx(["Image Prompt C1"]),
          imgC2: findIdx(["Image Prompt C2"]),
          imgC3: findIdx(["Image Prompt C3"]),
          imgC4: findIdx(["Image Prompt C4"]),
          imgC5: findIdx(["Image Prompt C5"]),
          attentionMood: findIdx(["attention_mood(D)", "attention_mood (D)", "attention_mood"]),
          imgD1: findIdx(["Image Prompt D1"]),
          imgD2: findIdx(["Image Prompt D2"]),
          imgD3: findIdx(["Image Prompt D3"]),
          imgD4: findIdx(["Image Prompt D4"]),
          imgD5: findIdx(["Image Prompt D5"]),
          video: findIdx(["Video Prompt", "비디오 프롬프트"]),
          sora: findIdx(["Sora", "소라", "Sora Video Prompt"]),
          veo: findIdx(["Veo", "Veo Video Prompt"]),
          pixai: findIdx(["PixAI Prompt"]),
          dialogue: findIdx(["Dialogue (Ko)", "대사 (Ko)", "대사"]),
          dialogueEn: findIdx(["Dialogue (En)", "대사 (En)"]),
          narration: findIdx(["Narration (Ko)", "나레이션 (Ko)", "나레이션"]),
          narrationEn: findIdx(["Narration (En)", "나레이션 (En)"]),
          sfx: findIdx(["SFX (Ko)", "효과음 (Ko)", "효과음", "SFX"]),
          sfxEn: findIdx(["SFX (En)", "효과음 (En)"]),
          bgm: findIdx(["BGM (Ko)", "배경음악 (Ko)", "배경음악", "BGM"]),
          bgmEn: findIdx(["BGM (En)", "배경음악 (En)"]),
          trailerScriptKo: findIdx(["Trailer Script (Ko)", "트레일러 스크립트 (Ko)"]),
          trailerScriptEn: findIdx(["Trailer Script (En)", "트레일러 스크립트 (En)"]),
        };

        // Detect if this is the new A/B/C/D format
        const hasAbcdFormat = idx.imgA1 !== -1;

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
            imagePrompt: hasAbcdFormat ? getVal(idx.imgA1) : getVal(idx.imgStart),
            imagePromptEnd: getVal(idx.imgEnd) || undefined,
            attentionDevice: getVal(idx.attentionDevice) || undefined,
            imagePromptA1: getVal(idx.imgA1) || undefined,
            imagePromptA2: getVal(idx.imgA2) || undefined,
            imagePromptA3: getVal(idx.imgA3) || undefined,
            imagePromptA4: getVal(idx.imgA4) || undefined,
            imagePromptA5: getVal(idx.imgA5) || undefined,
            attentionAction: getVal(idx.attentionAction) || undefined,
            imagePromptB1: getVal(idx.imgB1) || undefined,
            imagePromptB2: getVal(idx.imgB2) || undefined,
            imagePromptB3: getVal(idx.imgB3) || undefined,
            imagePromptB4: getVal(idx.imgB4) || undefined,
            imagePromptB5: getVal(idx.imgB5) || undefined,
            attentionExpression: getVal(idx.attentionExpression) || undefined,
            imagePromptC1: getVal(idx.imgC1) || undefined,
            imagePromptC2: getVal(idx.imgC2) || undefined,
            imagePromptC3: getVal(idx.imgC3) || undefined,
            imagePromptC4: getVal(idx.imgC4) || undefined,
            imagePromptC5: getVal(idx.imgC5) || undefined,
            attentionMood: getVal(idx.attentionMood) || undefined,
            imagePromptD1: getVal(idx.imgD1) || undefined,
            imagePromptD2: getVal(idx.imgD2) || undefined,
            imagePromptD3: getVal(idx.imgD3) || undefined,
            imagePromptD4: getVal(idx.imgD4) || undefined,
            imagePromptD5: getVal(idx.imgD5) || undefined,
            videoPrompt: getVal(idx.video),
            soraVideoPrompt: getVal(idx.sora),
            veoVideoPrompt: getVal(idx.veo),
            pixAiPrompt: getVal(idx.pixai),
            dialogue: getVal(idx.dialogue),
            dialogueEn: getVal(idx.dialogueEn),
            narration: getVal(idx.narration),
            narrationEn: getVal(idx.narrationEn),
            sfx: getVal(idx.sfx),
            sfxEn: getVal(idx.sfxEn),
            bgm: getVal(idx.bgm),
            bgmEn: getVal(idx.bgmEn),
            trailerScriptKo: getVal(idx.trailerScriptKo) || undefined,
            trailerScriptEn: getVal(idx.trailerScriptEn) || undefined,
          };

          if (!currentScene || (sceneLabel && sceneLabel !== lastSceneLabel)) {
            lastSceneLabel = sceneLabel;
            const label = sceneLabel || `Scene ${parsedScenes.length + 1}`;
            const sceneTitle = label.includes(": ") ? label.split(": ").slice(1).join(": ") : label;
            currentScene = { sceneTitle, clips: [clip] };
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
      } catch {
        toast({
          variant: "destructive",
          title: phrase(dictionary, "storysplitter_error", language).replace(":", ""),
          description: phrase(dictionary, "storyboard_import_failed", language),
        });
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }, [importStoryboard, toast, dictionary, language]);

  const handleFindAndReplace = useCallback(() => {
    if (!findText || scenes.length === 0) return;
    const replace = (s: string) => s.replaceAll(findText, replaceText);
    const modifiedScenes = scenes.map((scene) => ({
      ...scene,
      sceneTitle: replace(scene.sceneTitle),
      clips: scene.clips.map((clip) => {
        const updated: Continuity = { ...clip };
        const stringKeys = Object.keys(updated) as (keyof Continuity)[];
        for (const key of stringKeys) {
          const val = updated[key];
          if (typeof val === "string") {
            (updated as unknown as Record<string, unknown>)[key] = replace(val);
          }
        }
        return updated;
      }),
    }));
    importStoryboard(modifiedScenes, voicePrompts, characterIdSummary, genre);
    toast({
      variant: "success",
      title: "Find & Replace 완료",
      description: `"${findText}" → "${replaceText}"`,
    });
  }, [findText, replaceText, scenes, voicePrompts, characterIdSummary, genre, importStoryboard, toast]);

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

      {/* View Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView('survey')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentView === 'survey'
              ? 'bg-[#DB2777] text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-[#DB2777]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          트레일러 서베이
        </button>
        <button
          onClick={() => setCurrentView('editor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            currentView === 'editor'
              ? 'bg-[#DB2777] text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-[#DB2777]'
          }`}
        >
          <Settings className="w-4 h-4" />
          스토리보드 편집기
        </button>
        {currentView === 'editor' && selectedTrailerScript && (
          <span className="text-xs text-[#DB2777] font-medium">
            ✓ Option {selectedTrailerScript.id}: {selectedTrailerScript.title}
          </span>
        )}
      </div>

      {/* TrailerSurvey view */}
      {currentView === 'survey' && (
        <TrailerSurvey
          initialSourceText={splitParts[selectedPartIndex]}
          onStart={(text, option) => {
            setTrailerSourceText(text);
            setSelectedTrailerScript(option);
            setCurrentView('editor');
          }}
        />
      )}

      {/* Editor view wrapper */}
      {currentView === 'editor' && (
        <>
        {/* Back to survey button */}
        <button
          onClick={() => setCurrentView('survey')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#DB2777] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          트레일러 서베이로 돌아가기
        </button>

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

          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {trailerSourceText
                  ? "트레일러 텍스트 미리보기"
                  : `${phrase(dictionary, "storysplitter_part", language)} ${selectedPartIndex + 1} ${phrase(dictionary, "storyboard_part_preview", language)}`}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {((trailerSourceText || splitParts[selectedPartIndex])?.length ?? 0).toLocaleString()}{" "}
                {phrase(dictionary, "chars", language)}
              </span>
            </div>
            <div className="max-h-24 overflow-y-auto scrollbar-hide">
              <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">
                {(trailerSourceText || splitParts[selectedPartIndex])?.slice(0, 300)}
                {(trailerSourceText || splitParts[selectedPartIndex])?.length > 300 && "..."}
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

      {/* Collapsible Conditions Section — now first */}
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

      {/* Configuration Section — now second */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#DB2777]" />
          {phrase(dictionary, "storyboard_config_title", language) || "Generation Configuration"}
        </h3>

        {/* Clip Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Hash className="w-4 h-4 text-[#DB2777]" />
              총 컷 갯수
            </label>
            <input
              type="number"
              min="1"
              value={clipCount}
              onChange={(e) => setClipCount(e.target.value)}
              placeholder="95"
              className="block w-full p-2.5 text-sm text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              누적 시간에 관계없이 정확히 이 수만큼 클립을 생성합니다
            </p>
          </div>
        </div>

        {/* Story Guide */}
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

        {/* File Uploads — 5 slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <><CheckCircle className="w-4 h-4" />{phrase(dictionary, "storyboard_file_loaded", language) || "Loaded"}</>
              ) : (
                <><Upload className="w-4 h-4" />{phrase(dictionary, "storyboard_upload_txt", language) || "Upload .txt"}</>
              )}
            </button>
            {backgroundInstruction && (
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 truncate">
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
                <><CheckCircle className="w-4 h-4" />{phrase(dictionary, "storyboard_file_loaded", language) || "Loaded"}</>
              ) : (
                <><Upload className="w-4 h-4" />{phrase(dictionary, "storyboard_upload_txt", language) || "Upload .txt"}</>
              )}
            </button>
            {negativeInstruction && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate">
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
                <><CheckCircle className="w-4 h-4" />{phrase(dictionary, "storyboard_file_loaded", language) || "Loaded"}</>
              ) : (
                <><Upload className="w-4 h-4" />{phrase(dictionary, "storyboard_upload_txt", language) || "Upload .txt"}</>
              )}
            </button>
            {videoInstruction && (
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 truncate">
                {videoInstruction.slice(0, 50)}...
              </p>
            )}
          </div>

          {/* Image Prompt Package Instruction (NSFW-specific, from reference) */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Image className="w-4 h-4 text-amber-500" />
              Image Prompt
            </label>
            <input
              type="file"
              ref={imageInstructionFileRef}
              accept=".txt"
              onChange={(e) => handleConfigFileUpload(e, setImageInstruction)}
              className="hidden"
            />
            <button
              onClick={() => imageInstructionFileRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg border-2 border-dashed transition-all ${
                imageInstruction
                  ? "bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-700 dark:text-amber-300"
                  : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-amber-400 hover:text-amber-600"
              }`}
            >
              {imageInstruction ? (
                <><CheckCircle className="w-4 h-4" />{phrase(dictionary, "storyboard_file_loaded", language) || "Loaded"}</>
              ) : (
                <><Upload className="w-4 h-4" />{phrase(dictionary, "storyboard_upload_txt", language) || "Upload .txt"}</>
              )}
            </button>
            {imageInstruction && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 truncate">
                {imageInstruction.slice(0, 50)}...
              </p>
            )}
          </div>

          {/* Image Prompt QA Package */}
          <div>
            <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Search className="w-4 h-4 text-green-500" />
              Image Prompt QA
            </label>
            <input
              type="file"
              ref={imagePromptQAFileRef}
              accept=".txt"
              onChange={(e) => handleConfigFileUpload(e, setImagePromptQA)}
              className="hidden"
            />
            <button
              onClick={() => imagePromptQAFileRef.current?.click()}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg border-2 border-dashed transition-all ${
                imagePromptQA
                  ? "bg-green-50 dark:bg-green-900/20 border-green-400 text-green-700 dark:text-green-300"
                  : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-400 hover:text-green-600"
              }`}
            >
              {imagePromptQA ? (
                <><CheckCircle className="w-4 h-4" />{phrase(dictionary, "storyboard_file_loaded", language) || "Loaded"}</>
              ) : (
                <><Upload className="w-4 h-4" />{phrase(dictionary, "storyboard_upload_txt", language) || "Upload .txt"}</>
              )}
            </button>
            {imagePromptQA && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400 truncate">
                {imagePromptQA.slice(0, 50)}...
              </p>
            )}
          </div>
        </div>
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
                onClick={handleDownloadXLSX}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                XLSX Download
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

          {/* Find & Replace Bar */}
          <div className="flex items-center gap-2 p-3 bg-[#211F21] border border-[#272727] rounded-lg">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="찾기..."
              className="flex-1 px-3 py-1.5 text-sm bg-[#0F0F0F] border border-[#272727] rounded-lg text-[#E8E8E8] focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
            />
            <span className="text-gray-500 text-sm shrink-0">→</span>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="바꾸기..."
              className="flex-1 px-3 py-1.5 text-sm bg-[#0F0F0F] border border-[#272727] rounded-lg text-[#E8E8E8] focus:ring-[#DB2777] focus:border-[#DB2777] focus:outline-none"
            />
            <button
              onClick={handleFindAndReplace}
              disabled={!findText}
              className="px-3 py-1.5 text-sm bg-[#DB2777] hover:bg-[#BE185D] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              모두 바꾸기
            </button>
          </div>

          <StoryboardTable
            data={scenes}
            voicePrompts={voicePrompts}
            characterIdSummary={characterIdSummary}
            genre={genre}
            showTrailerColumns={true}
          />
        </div>
      )}
        </>
      )}
    </div>
  );
}

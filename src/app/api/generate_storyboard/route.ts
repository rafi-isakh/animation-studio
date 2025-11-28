import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerationResult } from "@/components/Mithril/StoryboardGenerator";

interface StoryboardRequest {
  sourceText: string;
  storyCondition: string;
  imageCondition: string;
  videoCondition: string;
  soundCondition: string;
  imageGuide: string;
  videoGuide: string;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateStoryboardWithRetry(
  params: StoryboardRequest
): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const {
    sourceText,
    storyCondition,
    imageCondition,
    videoCondition,
    soundCondition,
    imageGuide,
    videoGuide,
  } = params;

  const prompt = `
    다음 원본 텍스트를 기반으로 총 5개의 '씬'과 반드시 100개의 클립으로 구성된, 정확히 3분(180초) 분량의 애니메이션 콘티를 제작해 주세요.
    각 '씬'에 포함될 클립의 수는 서사의 흐름에 따라 유동적으로 결정되어야 합니다. 어떤 씬은 20개보다 많을 수도, 적을 수도 있습니다. 각 클립은 1~2초 길이여야 합니다.

    **[가장 중요한 규칙]**
    - 하나의 클립은 반드시 하나의 단일 동작이나 정지된 장면만을 묘사해야 합니다. 'A가 문을 연다'와 'B가 방으로 들어온다'와 같은 연속적인 동작은 **절대로** 하나의 클립에 포함될 수 없으며, 반드시 별개의 클립으로 분리해야 합니다. 이를 위해 클립 길이를 1초로 설정하더라도 이 규칙을 준수해야 합니다.
    - 출력은 반드시 유효한 JSON 객체여야 하며, 'scenes'와 'voicePrompts'라는 두 개의 키를 가져야 합니다.
    - 'scenes' 키의 값은 각 객체가 단일 '씬'을 나타내는 객체 배열이어야 합니다. 각 '씬' 객체는 "sceneTitle"과 "clips" 키를 가져야 합니다.
    - 'clips' 키의 값은 각 객체가 단일 클립을 나타내는 객체 배열이어야 하며, 각 클립 객체는 "story", "imagePrompt", "videoPrompt", "soraVideoPrompt", "dialogue", "dialogueEn", "sfx", "sfxEn", "bgm", "bgmEn", "length", "accumulatedTime", "backgroundPrompt", "backgroundId" 키를 가져야 합니다.
    - 'voicePrompts' 키의 값은 주요 캐릭터들의 보이스 프롬프트가 포함된 객체 배열이어야 합니다. 각 객체는 'promptKo' (한국어 버전)와 'promptEn' (영어 버전) 키를 가져야 합니다. 이 프롬프트는 ElevenLabs에서 사용될 것이며, 각 캐릭터의 성격, 특성을 반영하고 참고할 만한 실제 인물의 목소리를 추천해야 합니다. **원문에서 언급된 모든 주요 캐릭터를 포함해야 합니다.** **참고 인물을 추천할 때, 'promptKo'에는 한국인을, 'promptEn'에는 미국인을 추천해야 합니다.**

    각 필드에 대해 다음의 구체적인 지침을 따라주세요:

    1.  **sceneTitle**:
        - 각 씬의 주요 내용을 요약하는 제목을 한국어로 작성합니다.

    2.  **story**:
        - 규칙: ${storyCondition}
        - **지침: 위의 '[가장 중요한 규칙]'에 따라, 원본 텍스트를 바탕으로 하나의 단일하고 구체적인 장면(1~2초)을 묘사합니다.**

    3.  **backgroundId**:
        - 형식: "#-#" (예: 1-1, 1-2, 2-1).
        - **첫 번째 숫자 (Background Number)**: 배경(backgroundPrompt)이 바뀔 때마다 1씩 증가합니다. 첫 번째 배경은 1로 시작합니다. 예: 첫 번째 장소(1-X), 두 번째 장소(2-X).
        - **두 번째 숫자 (Shot Type)**: 다음 1~9 중 하나를 선택하여 적용합니다. 씬 내에서 연속적으로 같은 번호를 사용하지 말고 다양하게 변주하세요.
          - **1**: Full shot (두 인물이 대화하거나 배경 소개. 인물이 있다면 측면/정면 랜덤)
          - **2**: Full shot from below (긴장감 강조. 인물이 있다면 측면/정면 랜덤)
          - **3**: Close-up (주요 캐릭터 A)
          - **4**: Close-up (주요 캐릭터 B)
          - **5**: Medium shot (제3자 무리 관전 혹은 2명 이상 이동 시)
          - **6**: Bird's eye view (배경 다양성 확보, 혹은 2명 이상 다양한 샷)
          - **7**: Over the shoulder shot from behind (캐릭터 A의 등 뒤에서 B를 봄, 긴장감)
          - **8**: Over the shoulder shot from behind (캐릭터 B의 등 뒤에서 A를 봄, 긴장감)
          - **9**: Close up of hand/feet (손/발/걸음 강조. 소매나 신발 묘사 포함)
        - **예외**: 배경이 보이지 않을 정도의 **Extreme close-up(눈만 보임 등)**이나 **Macro shot(물건 초접사)**인 경우, 이 필드를 빈 문자열 ""로 비워둡니다.

    4.  **imagePrompt**:
        - 반드시 영어로 작성해야 합니다.
        - **중요**: 이 프롬프트는 **backgroundId**의 두 번째 숫자에 해당하는 샷 키워드를 **반드시** 포함해야 합니다.
          - ID가 X-1이면: "Full shot..."
          - ID가 X-2이면: "Full shot from below..."
          - ID가 X-3/X-4이면: "Close-up of [CharacterName]..."
          - ID가 X-5이면: "Medium shot..."
          - ID가 X-6이면: "Bird's eye view..."
          - ID가 X-7/X-8이면: "Over the shoulder shot from behind [CharacterName]..."
          - ID가 X-9이면: "Close up of [hand/foot]..."
        - 규칙: ${imageCondition}
        - 통합할 가이드 프롬프트: ${imageGuide || "없음"}
        - **[필수 지침]**:
          **'story'에 묘사된 단일 장면을 나타내는 '하나의' 정지 이미지를 영어로 상세히 묘사합니다. 이 프롬프트는 '[Image N]'과 같은 분할 형식을 포함해서는 안 됩니다.**
          **각 프롬프트는 '캐릭터(인물)', '핵심 행동/표정/자세', '배경', '구도(카메라 앵글)'를 명확하고 구체적으로 포함해야 합니다. 캐릭터는 'Baby'나 'Mother'와 같은 일반적인 명칭이 아닌, 원본 텍스트에 나오는 실제 이름(예: Arel, Rifana)을 사용해야 합니다. 이 프롬프트는 나노바나나(gemini-2.5-flash-image) 모델에 최적화되어야 합니다.**

    5.  **videoPrompt**:
        - 반드시 영어로 작성해야 합니다.
        - 규칙: ${videoCondition}
        - 통합할 가이드 프롬프트: ${videoGuide || "없음"}
        - **지침: 'story'에 묘사된 단일 동작을 기반으로 한 비디오 클립을 영어로 묘사합니다. 'imagePrompt'와 달리, 캐릭터의 실제 이름 대신 'the baby', 'the nanny'와 같이 역할이나 상태를 나타내는 설명적인 명사구를 사용해야 합니다. 대사가 포함된 클립의 경우, 'the character speaks'와 같이 말하는 동작을 명확히 포함해야 합니다. 대사가 2초 이상 지속될 경우 'speaks continuously'와 같이 지속성을 표현해야 합니다. (예: "A door bursts open violently.")**

    6.  **soraVideoPrompt**:
        - 빈 문자열 ""로 남겨두세요. (이 필드는 후처리 과정에서 자동으로 생성됩니다.)

    7.  **dialogue**:
        - 한국어로 작성합니다.
        - **규칙**: ${soundCondition}
        - **지침**: 캐릭터의 **대사**나 **내레이션**이 있는 경우에만 작성합니다. 대사가 없는 클립은 반드시 빈 문자열 ""로 둡니다.
        - 형식: '캐릭터이름: [감정] "대사내용"' 또는 '내레이션: [어조] "내용"'. (예: '리파나: [놀라며] "이럴 수가!"')

    8.  **dialogueEn**:
        - 'dialogue' 필드의 영어 번역본입니다. 대사가 없으면 빈 문자열 ""로 둡니다.

    9.  **sfx**:
        - 한국어로 작성합니다.
        - **규칙**: ${soundCondition}
        - **지침**: **효과음(SFX)**만 작성합니다. 없으면 빈 문자열 ""로 둡니다.
        - 형식: (소리 묘사). (예: '(천둥 소리)', '(문이 닫히는 소리)')

    10. **sfxEn**:
        - 'sfx' 필드의 영어 번역본입니다. 없으면 빈 문자열 ""로 둡니다.

    11. **bgm**:
        - 한국어로 작성합니다.
        - **규칙**: ${soundCondition}
        - **지침**: **배경음악(BGM)**만 작성합니다. 없으면 빈 문자열 ""로 둡니다.
        - 형식: (분위기/장르). (예: '(긴장감 넘치는 음악)', '(평화로운 피아노 선율)')

    12. **bgmEn**:
        - 'bgm' 필드의 영어 번역본입니다. 없으면 빈 문자열 ""로 둡니다.

    13. **length**:
        - 클립의 길이를 "1초", "2초" 형식으로 표시합니다. (1~2초 사이)

    14. **accumulatedTime**:
        - 이전 클립까지의 누적 시간에 현재 클립의 길이를 더한 값을 "MM:SS" 형식으로 표시합니다. 예: "00:03", "00:07", "01:25"
        - **전체 누적 시간은 반드시 180초가 되어야 하며, 마지막 클립의 값은 "03:00"이어야 합니다.**

    15. **backgroundPrompt**:
        - 반드시 영어로 작성해야 합니다.
        - **지침: 클립의 정적 배경을 'imagePrompt'와는 별개로, 매우 상세하고 풍부하게 묘사합니다. 배경의 분위기, 주요 사물, 빛의 상태, 재질감 등 시각적 요소를 풍부하게 포함해야 합니다. 동일한 배경을 공유하는 연속적인 클립에는 동일한 \`backgroundPrompt\` 값을 사용해야 합니다. 씬 내에서 배경이 변경될 때만 이 프롬프트를 변경합니다.**
        - **예시: "A dimly lit, ornate Victorian-style bedroom with a large four-poster bed, a vintage wooden wardrobe, and flickering gas lamps. Dust motes visible in the sparse light."**

    원본 텍스트는 다음과 같습니다:
    ---
    ${sourceText}
    ---
  `;

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      scenes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneTitle: {
              type: Type.STRING,
              description: "The title of the scene in Korean.",
            },
            clips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  story: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  videoPrompt: { type: Type.STRING },
                  soraVideoPrompt: {
                    type: Type.STRING,
                    description: "Leave empty. Auto-generated.",
                  },
                  dialogue: {
                    type: Type.STRING,
                    description:
                      "Character dialogue or narration in Korean. Empty if none.",
                  },
                  dialogueEn: {
                    type: Type.STRING,
                    description:
                      "Character dialogue or narration in English. Empty if none.",
                  },
                  sfx: {
                    type: Type.STRING,
                    description: "Sound effects in Korean. Empty if none.",
                  },
                  sfxEn: {
                    type: Type.STRING,
                    description: "Sound effects in English. Empty if none.",
                  },
                  bgm: {
                    type: Type.STRING,
                    description:
                      "Background music description in Korean. Empty if none.",
                  },
                  bgmEn: {
                    type: Type.STRING,
                    description:
                      "Background music description in English. Empty if none.",
                  },
                  length: { type: Type.STRING },
                  accumulatedTime: { type: Type.STRING },
                  backgroundPrompt: { type: Type.STRING },
                  backgroundId: {
                    type: Type.STRING,
                    description:
                      'The ID # of the background and shot type, e.g. 1-2. Empty for extreme close-ups.',
                  },
                },
                required: [
                  "story",
                  "imagePrompt",
                  "videoPrompt",
                  "soraVideoPrompt",
                  "dialogue",
                  "dialogueEn",
                  "sfx",
                  "sfxEn",
                  "bgm",
                  "bgmEn",
                  "length",
                  "accumulatedTime",
                  "backgroundPrompt",
                  "backgroundId",
                ],
              },
            },
          },
          required: ["sceneTitle", "clips"],
        },
      },
      voicePrompts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            promptKo: { type: Type.STRING },
            promptEn: { type: Type.STRING },
          },
          required: ["promptKo", "promptEn"],
        },
      },
    },
    required: ["scenes", "voicePrompts"],
  };

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const jsonText = response.text?.trim();
      if (!jsonText) {
        throw new Error("Empty response from Gemini API");
      }

      const storyboardData = JSON.parse(jsonText) as GenerationResult;

      // Post-process to construct Sora Prompt and append Background ID to imagePrompt
      storyboardData.scenes.forEach((scene) => {
        scene.clips.forEach((clip) => {
          // 1. Construct Sora Video Prompt (using raw imagePrompt)
          const soraParts = [
            clip.imagePrompt,
            clip.videoPrompt,
            clip.dialogueEn,
            clip.sfxEn,
            clip.bgmEn,
          ].filter((part) => part && part.trim() !== "");

          clip.soraVideoPrompt = soraParts.join("\n");

          // 2. Append Background ID to imagePrompt (for UI/CSV)
          if (clip.backgroundId && clip.backgroundId.trim() !== "") {
            clip.imagePrompt = `${clip.imagePrompt}\n\nBackground ID: ${clip.backgroundId}`;
          }
        });
      });

      return storyboardData;
    } catch (error: unknown) {
      const errorMessage = String(error);

      // Check for transient errors that should be retried
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("overloaded") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("RESOURCE_EXHAUSTED")
      ) {
        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
          console.warn(
            `Attempt ${attempt} failed due to model overload. Retrying in ${delay}ms...`
          );
          await sleep(delay);
          continue;
        }
      }

      // Don't retry on non-transient errors
      throw error;
    }
  }

  throw new Error("API call failed after all retries.");
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryboardRequest = await request.json();
    const {
      sourceText,
      storyCondition,
      imageCondition,
      videoCondition,
      soundCondition,
      imageGuide,
      videoGuide,
    } = body;

    // Validation
    if (!sourceText || typeof sourceText !== "string") {
      return NextResponse.json(
        { error: "Source text is required and must be a string" },
        { status: 400 }
      );
    }

    const result = await generateStoryboardWithRetry({
      sourceText,
      storyCondition: storyCondition || "",
      imageCondition: imageCondition || "",
      videoCondition: videoCondition || "",
      soundCondition: soundCondition || "",
      imageGuide: imageGuide || "",
      videoGuide: videoGuide || "",
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in generate_storyboard API:", error);

    const errorMessage = String(error);

    if (
      errorMessage.includes("503") ||
      errorMessage.includes("overloaded") ||
      errorMessage.includes("UNAVAILABLE")
    ) {
      return NextResponse.json(
        {
          error:
            "The AI model is currently overloaded. Please try again in a few moments.",
        },
        { status: 503 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

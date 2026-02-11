import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { Scene } from "@/components/Mithril/StoryboardGenerator/types";

interface SplitRequest {
  scenes: Scene[];
  apiKey?: string;
}

interface SplitFrameResult {
  index: number;
  originalPrompt: string;
  startPrompt: string;
  endPrompt: string | null;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Splits existing image prompts into Start/End pairs for motion-heavy clips using Gemini.
 * This is optimized for Vidu video AI which uses start/end frames for video generation.
 */
async function splitStartEndFramesWithRetry(
  scenes: Scene[],
  clientApiKey?: string
): Promise<Scene[]> {
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Please provide an API key.");
  }

  const masterPrompt = `
    [마스터 프롬프트]
    다음 애니메이션 콘티의 이미지 프롬프트를 Vidu 영상 AI용 Start Frame과 End Frame으로 분리 및 재구성해줘.

    시간 흐름이 있는 장면(등장, 부상, 상승, 큰 동작 등)을 감지해서 분리하고, 정적인 장면이나 단순 대사 장면은 원래 프롬프트를 유지해.

    **[분리 규칙]**
    1. Start Frame: 아직 발생하지 않은 요소가 명확히 존재하지 않거나 시작 전 상태.
    2. End Frame: 해당 요소가 완전히 발생했거나 동작이 완료된 상태.
    3. 주어로 언급된 캐릭터 이름은 유지하되, 외모/의상 등 외적 묘사는 일절 삭제할 것 (디자인 유지 목적).
    4. Start -> End 사이의 변화가 논리적으로 연결되어야 함. 원래 프롬프트와 동일한 수준의 간결함 유지.
    5. 장소 및 배경(Location/Background)은 절대로 언급하지 말 것. 단, 앉아있거나 누워있는 큰 가구(bed, chair, table) 묘사는 허용.
    6. 반드시 영어 현재 시제(present tense)로 작성.
    7. **[카메라/구도 일치 필수]: End Frame은 Start Frame의 카메라 앵글, 구도, 촬영 방향을 반드시 동일하게 유지해야 합니다. 공간 정보가 일치해야 하므로 카메라가 갑자기 튀거나 회전하면 안 됩니다.**
    8. **[캐릭터 일관성]: Start Frame에 있던 캐릭터는 End Frame에도 있어야 하며, Start Frame에 없던 새로운 캐릭터가 End Frame에 갑자기 등장해서는 안 됩니다.**
    9. **[대문자 표기 및 일관성 (Capitalization & Consistency)]: Start와 End 프롬프트에 등장하는 주요 생명체(Characters, Mobs)와 아이템(Items)은 반드시 대문자(UPPERCASE)로 표기하십시오.**
       - **[Material Integration]:** 'glass BOTTLE' (X) -> 'GLASS_BOTTLE' (O).
       - **[Quantifiable Only]:** 셀 수 없는 명사(juice)는 대문자 금지. 셀 수 있는 사물만 대문자 ID 적용.
       - **[Crowd Exception]:** 일반 군중(crowd)은 대문자 금지.
       - **[No Punctuation]:** ID에 아포스트로피(')나 따옴표(") 금지.
    10. **[Naming Convention for Relations/Possessions]:** 소유격('s)을 사용하지 마십시오. 연관된 대상(무기, 탈것, 하인 등)은 언더바(_)를 사용하여 대문자로 표기하십시오. (예: KANIA'S SWORD -> KANIA_SWORD, AREL'S HORSE -> AREL_HORSE).
    11. **[No Visual Descriptors with Names]: Start/End 프롬프트에서 캐릭터 이름을 사용할 때, 외형적 묘사나 직함을 절대 붙이지 마십시오. (예: 'Princess KANIA' (X) -> 'KANIA' (O)).**
    12. **[Action Specifics]: 전투 시 무기 사용(KANIA swings KANIA_SWORD)이나 탑승(AREL rides AREL_HORSE) 등 구체적인 행위와 대상 ID를 명확히 유지하십시오.**

    **[제외 대상 (중요!)]**
    - 분리가 필요 없는 정적샷(Static shots), 클로즈업 대사 위주샷 등은 "startPrompt"에 원본을 **토씨 하나 바꾸지 말고 그대로** 전달하고 "endPrompt"는 null로 설정하세요.

    출력 형식은 반드시 유효한 JSON 배열이어야 하며, 각 객체는 "originalPrompt"와 "startPrompt", "endPrompt"를 가져야 합니다.
  `;

  const ai = new GoogleGenAI({ apiKey });

  // Flatten all clips' image prompts with indices for reliable matching
  const indexedPrompts: { index: number; prompt: string }[] = [];
  scenes.forEach((scene) => {
    scene.clips.forEach((clip) => {
      indexedPrompts.push({ index: indexedPrompts.length, prompt: clip.imagePrompt });
    });
  });

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        index: {
          type: Type.INTEGER,
          description: "The index of the prompt from the input array (0-based).",
        },
        originalPrompt: {
          type: Type.STRING,
          description: "The original image prompt (for verification).",
        },
        startPrompt: {
          type: Type.STRING,
          description:
            "The start frame prompt. For static shots, this is the original prompt unchanged.",
        },
        endPrompt: {
          type: Type.STRING,
          nullable: true,
          description:
            "The end frame prompt. Null for static shots that don't need splitting.",
        },
      },
      required: ["index", "originalPrompt", "startPrompt", "endPrompt"],
    },
  };

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const promptData = indexedPrompts.map((p) => ({ index: p.index, prompt: p.prompt }));
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${masterPrompt}\n\n**콘티 데이터 (index와 prompt 쌍):**\n${JSON.stringify(promptData)}\n\n각 항목의 index를 결과에 그대로 포함시켜 주세요.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const jsonText = response.text?.trim();
      if (!jsonText) {
        throw new Error("Empty response from Gemini API");
      }

      const splitResults: SplitFrameResult[] = JSON.parse(jsonText);

      // Create a map from index to split results
      const indexMap = new Map<number, SplitFrameResult>();
      splitResults.forEach((result) => {
        indexMap.set(result.index, result);
      });

      // Apply split results back to scenes using flat index
      let flatIndex = 0;
      const updatedScenes = scenes.map((scene) => ({
        ...scene,
        clips: scene.clips.map((clip) => {
          const currentIndex = flatIndex++;
          const splitResult = indexMap.get(currentIndex);
          if (splitResult) {
            return {
              ...clip,
              imagePrompt: splitResult.startPrompt,
              imagePromptEnd: splitResult.endPrompt || undefined,
            };
          }
          return clip;
        }),
      }));

      return updatedScenes;
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
    const body: SplitRequest = await request.json();
    const { scenes, apiKey } = body;

    // Validation
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: "Scenes array is required and must not be empty" },
        { status: 400 }
      );
    }

    const result = await splitStartEndFramesWithRetry(scenes, apiKey);

    return NextResponse.json({ scenes: result });
  } catch (error: unknown) {
    console.error("Error in split_start_end_frames API:", error);

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
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface Clip {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string;
  videoPrompt: string;
  soraVideoPrompt: string;
  dialogue: string;
  dialogueEn: string;
  sfx: string;
  sfxEn: string;
  bgm: string;
  bgmEn: string;
  length: string;
  accumulatedTime: string;
  backgroundPrompt: string;
  backgroundId: string;
  referenceImageIndex?: number;
  referenceImage?: string;
}

interface Scene {
  sceneTitle: string;
  clips: Clip[];
}

interface SplitRequest {
  scenes: Scene[];
  apiKey?: string;
}

interface SplitResult {
  originalPrompt: string;
  startPrompt: string;
  endPrompt: string | null;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

// Suffix to append to all image prompts
const IMAGE_PROMPT_SUFFIX = "No vfx or visual effects, no dust particles";

function appendSuffix(prompt: string): string {
  if (!prompt) return prompt;
  const trimmed = prompt.trim();
  const suffixLower = IMAGE_PROMPT_SUFFIX.toLowerCase();
  const promptLower = trimmed.toLowerCase();

  if (promptLower.endsWith(suffixLower) || promptLower.endsWith(suffixLower + '.')) {
    return trimmed;
  }

  const connector = (trimmed.endsWith('.') || trimmed.endsWith(',')) ? " " : ", ";
  return `${trimmed}${connector}${IMAGE_PROMPT_SUFFIX}`;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body: SplitRequest = await request.json();
    const { scenes, apiKey: customApiKey } = body;

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return NextResponse.json(
        { error: "scenes is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    const apiKey = customApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Collect all image prompts
    const allClips = scenes.flatMap((s) => s.clips);
    const promptList = allClips.map((c) => c.imagePrompt);

    // Build the master prompt (Korean)
    const masterPrompt = `
[마스터 프롬프트]
다음 애니메이션 콘티의 이미지 프롬프트를 Vidu 영상 AI용 Start Frame과 End Frame으로 분리 및 재구성해줘.

시간 흐름이 있는 장면을 감지해서 분리하고, 정적인 장면은 원래 프롬프트를 유지해.

**[핵심 분리 및 연결 규칙]**
1. 주어로 언급된 캐릭터 ID(대문자_언더바 형식)는 유지하되 외적 묘사(의상/색상)는 삭제.
2. Start와 End의 구도는 반드시 동일해야 함.
3. 캐릭터/아이템 ID 일관성 유지.
4. 동작이 있는 장면: Start는 동작 시작, End는 동작 완료 상태.
5. 정적인 장면: endPrompt는 null로 반환.

출력 형식: JSON 배열 (originalPrompt, startPrompt, endPrompt)
`;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalPrompt: { type: Type.STRING },
          startPrompt: { type: Type.STRING },
          endPrompt: { type: Type.STRING, nullable: true },
        },
        required: ["originalPrompt", "startPrompt", "endPrompt"],
      },
    };

    // Generate with retry logic
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `${masterPrompt}\n\n**콘티 데이터:**\n${JSON.stringify(promptList)}`,
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          },
        });

        const responseText = response.text?.trim();
        if (!responseText) {
          throw new Error("Empty response from Gemini API");
        }

        // Clean up markdown code blocks if present
        const jsonText = responseText.replace(/```json|```/g, "").trim();
        const splitData = JSON.parse(jsonText) as SplitResult[];

        // Apply split results to scenes
        const updatedScenes = JSON.parse(JSON.stringify(scenes)) as Scene[];
        let flatIdx = 0;

        for (let sIdx = 0; sIdx < updatedScenes.length; sIdx++) {
          for (let cIdx = 0; cIdx < updatedScenes[sIdx].clips.length; cIdx++) {
            if (splitData[flatIdx]) {
              const original = allClips[flatIdx].imagePrompt;
              const aiStart = splitData[flatIdx].startPrompt;
              const aiEnd = splitData[flatIdx].endPrompt;

              if (aiEnd) {
                // Has motion - use split prompts
                updatedScenes[sIdx].clips[cIdx].imagePrompt = appendSuffix(aiStart);
                updatedScenes[sIdx].clips[cIdx].imagePromptEnd = appendSuffix(aiEnd);
              } else {
                // Static scene - keep original, clear end
                updatedScenes[sIdx].clips[cIdx].imagePrompt = appendSuffix(original);
                updatedScenes[sIdx].clips[cIdx].imagePromptEnd = undefined;
              }
            }
            flatIdx++;
          }
        }

        return NextResponse.json({ scenes: updatedScenes });
      } catch (error: unknown) {
        const errorMessage = String(error);

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

        throw error;
      }
    }

    throw new Error("API call failed after all retries.");
  } catch (error: unknown) {
    console.error("Error in manga/split-start-end API:", error);

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

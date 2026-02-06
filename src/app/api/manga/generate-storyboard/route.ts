import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface MangaPanel {
  id: string;
  imageBase64: string; // Base64 encoded panel image
  label: string;
}

interface StoryboardRequest {
  panels: MangaPanel[];
  sourceText?: string; // Optional context text
  targetDuration: string; // MM:SS format
  storyCondition: string;
  imageCondition: string;
  videoCondition: string;
  soundCondition: string;
  imageGuide?: string;
  videoGuide?: string;
  apiKey?: string; // Optional custom API key
}

interface Part {
  inlineData?: { data: string; mimeType: string };
  text?: string;
}

interface Clip {
  story: string;
  imagePrompt: string;
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
  referenceImageIndex: number;
}

interface Scene {
  sceneTitle: string;
  clips: Clip[];
}

interface GenerationResult {
  scenes: Scene[];
  voicePrompts: { promptKo: string; promptEn: string }[];
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

// Suffix to append to all image prompts for cleaner generation
const IMAGE_PROMPT_SUFFIX = "No vfx or visual effects, no dust particles";

function appendImagePromptSuffix(prompt: string): string {
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

// Parse target duration string to seconds
function parseDuration(duration: string): number {
  const parts = duration.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  return 180; // Default 3 minutes
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryboardRequest = await request.json();
    const {
      panels,
      sourceText,
      targetDuration,
      storyCondition,
      imageCondition,
      videoCondition,
      soundCondition,
      imageGuide,
      videoGuide,
      apiKey: customApiKey,
    } = body;

    // Validation
    if (!panels || !Array.isArray(panels) || panels.length === 0) {
      return NextResponse.json(
        { error: "panels is required and must be a non-empty array" },
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
    const totalSeconds = parseDuration(targetDuration || "03:00");
    const totalPanels = panels.length;

    // Build parts array with images and prompt
    const parts: Part[] = [];

    // Add all panel images
    for (let i = 0; i < panels.length; i++) {
      parts.push({
        inlineData: {
          data: panels[i].imageBase64,
          mimeType: "image/jpeg",
        },
      });
    }

    // Build the prompt (Korean detailed prompt matching the reference implementation)
    const prompt = `
다음 원본 텍스트와 제공된 망가 패널 이미지들을 기반으로 총 5개의 '씬'으로 구성된, **정확히 ${formatTime(totalSeconds)} (${totalSeconds}초)** 분량의 애니메이션 콘티를 제작해 주세요.
전체 누적 시간이 반드시 ${formatTime(totalSeconds)}이 되도록 설계해야 합니다.

**[이미지 패널 활용 및 인물/사물 ID 규칙]**
1. 제공된 이미지들은 망가(만화) 패널들입니다. 총 ${totalPanels}개의 패널이 제공됩니다 (0-indexed로 referenceImageIndex 사용).
2. 각 이미지에서 캐릭터의 표정, 구도, 대사를 분석하세요.
3. **[반복 요소 및 캐릭터 ID 관리]**:
   - **모든 등장인물 식별**: 한 컷 이상 등장하는 모든 인물(엑스트라 포함)의 이름을 파악하여 고유 CHARACTER_ID를 부여하세요.
   - **의상 버전 관리**: 이벤트나 상황에 따라 캐릭터의 의상이 바뀌는 경우, 버전별로 구분된 ID를 부여하세요 (예: KANIA_BATTLE_ARMOR, KANIA_CASUAL, CHENA_NIGHTGOWN).
   - **ID 형식**: 반드시 모든 문자를 **대문자**로 작성하고, 공백 대신 **언더바(_)**를 사용하세요.
   - 이름이 명시된 경우 이름을 ID로 사용 (KANIA, CHENA).
   - 이름 없는 경우 특징을 요약하여 ID를 생성하세요 (예: VILLAGER_A, TOWN_GUARD_1).
   - 소유물 표현 시 따옴표/어포스트로피 절대 금지 (예: KANIA_SWORD).
   - 모든 필드(\`story\`, \`imagePrompt\` 등)에서 이 ID를 일관되게 사용하세요.
4. 분석된 내용을 콘티의 'dialogue', 'sfx', 'imagePrompt' 등에 적극적으로 반영하세요.

**[CRITICAL: 필드별 언어 및 내용 규칙]**
- **story**: 반드시 **한국어**로 작성하세요. 인물/사물 ID를 사용하여 상황을 설명하세요.
- **imagePrompt**: 영어로 작성하되, **캐릭터의 의상(clothing)이나 색상(colors)은 절대 묘사하지 마세요.** (ID를 통해 캐릭터 시트에서 관리됨). 오직 구도, 동작, 인물 ID 위주로만 설명하세요.
- **backgroundId**: 반드시 **숫자-숫자[-숫자]** 형식을 유지하세요 (예: 1-1, 4-2).
  - 첫 번째 숫자는 **장소(Location)** 고유 번호입니다. **반드시 1부터 시작**하여 새로운 장소가 나올 때마다 1씩 증가시키세요. 같은 장소라면 항상 같은 첫 번째 숫자를 사용하세요.
  - 두 번째 숫자는 **구도/앵글(Angle)** 번호입니다.
  - **CRITICAL: 동일한 '장소-앵글' 조합이 두 번 이상 등장할 경우, 반드시 세 번째 숫자를 추가하여 각 클립을 고유하게 식별해야 합니다.**
    - 예: 4-2 (첫 번째 등장) -> 4-2-1 (두 번째 등장) -> 4-2-2 (세 번째 등장) 등.
    - **절대 ID가 중복되지 않도록 하세요.** 배경 이미지가 같더라도 샷이 다르면 ID 뒤에 고유 번호를 붙여야 합니다.

**[CRITICAL: 대사(Dialogue) 형식 규칙]**
- ElevenLabs 감정 반영을 위해: **[감정] 대사내용**
- 감정은 대괄호 [] 안에 한두 단어의 핵심 단어로 요약.
- 예시: [조심스럽게] "여기가 제 방인가요...?", [cautiously] "Is this my room...?"

**[CRITICAL: 클립 길이 및 총 시간 규칙]**
- 모든 클립의 길이는 **절대로 4초를 넘을 수 없습니다.**
- 마지막 클립의 'accumulatedTime'은 반드시 **${formatTime(totalSeconds)}**이어야 합니다.

각 필드 가이드라인:
- **story**: 규칙: ${storyCondition || '원본 텍스트의 내용을 충실히 반영하되, 애니메이션의 특성에 맞게 시각적 서사를 강화한다.'}. (한국어 필수)
- **imagePrompt**: 규칙: ${imageCondition || '캐릭터의 외형적 특징을 고정한다. 샷의 앵글과 구도는 Background ID의 지침을 따른다.'}. 가이드: ${imageGuide || '없음'}. (의상/색상 묘사 금지)
- **videoPrompt**: 규칙: ${videoCondition || '카메라 앵글과 동작 위주로 간결하게 구성한다. 캐릭터 이름 대신 대명사를 사용하세요.'}. 가이드: ${videoGuide || '없음'}.
- **dialogue/sfx/bgm**: 규칙: ${soundCondition || '음향은 대사, 효과음, 배경음악으로 구분한다. 망가 패널의 텍스트가 있는 경우 이를 최우선으로 반영한다.'}.

${sourceText ? `원본 텍스트:\n---\n${sourceText}\n---` : '망가 패널 이미지를 기반으로 스토리를 구성하세요.'}
`;

    parts.push({ text: prompt });

    // Response schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneTitle: { type: Type.STRING },
              clips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    story: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                    videoPrompt: { type: Type.STRING },
                    soraVideoPrompt: { type: Type.STRING },
                    dialogue: { type: Type.STRING },
                    dialogueEn: { type: Type.STRING },
                    sfx: { type: Type.STRING },
                    sfxEn: { type: Type.STRING },
                    bgm: { type: Type.STRING },
                    bgmEn: { type: Type.STRING },
                    length: { type: Type.STRING },
                    accumulatedTime: { type: Type.STRING },
                    backgroundPrompt: { type: Type.STRING },
                    backgroundId: { type: Type.STRING },
                    referenceImageIndex: {
                      type: Type.NUMBER,
                      description: "0-indexed reference to source panel",
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
                    "referenceImageIndex",
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

    // Generate with retry logic
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            parts: parts,
          },
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
        const result = JSON.parse(jsonText) as GenerationResult;

        // Post-process: Append suffix to all imagePrompts
        result.scenes.forEach((scene) => {
          scene.clips.forEach((clip) => {
            clip.imagePrompt = appendImagePromptSuffix(clip.imagePrompt);
          });
        });

        return NextResponse.json(result);
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
  } catch (error: unknown) {
    console.error("Error in manga/generate-storyboard API:", error);

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

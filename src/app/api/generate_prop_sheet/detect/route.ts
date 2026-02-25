import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface Clip {
  story: string;
  imagePrompt: string;
  imagePromptEnd?: string;
  videoPrompt: string;
  dialogue: string;
  backgroundId: string;
}

interface Scene {
  sceneTitle?: string;
  clips: Clip[];
}

interface DetectRequest {
  scenes: Scene[];
  objectIds?: string[]; // Object IDs to analyze
  characterIds?: string[]; // Character IDs to analyze
  characterDescriptions?: Record<string, string>; // Character ID -> description from storyboard generator
  targetIds?: string[]; // Legacy: treated as objectIds for backward compatibility
  genre: string;
  customApiKey?: string;
}

const objectDetectionSchema = {
  type: Type.ARRAY,
  description: "Array of detected props/objects with their details",
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The UPPERCASE_ID exactly as provided in the target list",
      },
      description: {
        type: Type.STRING,
        description:
          "English visual description focusing on appearance, material, color, size. Use keywords and short phrases.",
      },
      descriptionKo: {
        type: Type.STRING,
        description:
          "Korean description of the object's purpose, role, and significance in the story.",
      },
      appearingClips: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array of clip IDs where this object appears (e.g., '1-1', '2-3')",
      },
      contextPrompts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            clipId: { type: Type.STRING, description: "Clip ID (e.g., '1-1')" },
            text: {
              type: Type.STRING,
              description:
                "Verbatim text snippet from the clip where the object appears. Copy exactly as written.",
            },
          },
          required: ["clipId", "text"],
        },
        description: "Context snippets showing how the object appears in each clip",
      },
      productSheetPrompt: {
        type: Type.STRING,
        description:
          "Image generation prompt for a product/design sheet. Format: '2d anime white background product sheet. Infer and maintain the object's exact visual features, shape, material, color palette, and overall art style from the provided reference images (manga panels). Include front view, side view, top view, detail close-ups, high quality, character design sheet style, shading detail, no text. Colors should match exact hexcolor. Object: [OBJECT NAME] in [GENRE] setting. [DETAILED VISUAL DESCRIPTION]'",
      },
    },
    required: [
      "name",
      "description",
      "descriptionKo",
      "appearingClips",
      "contextPrompts",
      "productSheetPrompt",
    ],
  },
};

const characterDetectionSchema = {
  type: Type.ARRAY,
  description: "Array of detected characters with their details",
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "The UPPERCASE_ID exactly as provided in the target list",
      },
      description: {
        type: Type.STRING,
        description:
          "English visual description focusing on KEY visual features only: hair color, hair style, eye color. Use concise keywords and short phrases (e.g., 'Silver long hair, golden eyes'). Exclude clothing and personality.",
      },
      descriptionKo: {
        type: Type.STRING,
        description:
          "Korean description of the character's personality, role in the story, and relationships with other characters.",
      },
      appearingClips: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Array of clip IDs where this character appears (e.g., '1-1', '2-3')",
      },
      contextPrompts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            clipId: { type: Type.STRING, description: "Clip ID (e.g., '1-1')" },
            text: {
              type: Type.STRING,
              description:
                "Verbatim text snippet from the clip where the character appears. Copy exactly as written.",
            },
          },
          required: ["clipId", "text"],
        },
        description: "Context snippets showing how the character appears in each clip",
      },
      characterSheetPrompt: {
        type: Type.STRING,
        description:
          "Image generation prompt for a character design sheet. Format: '2d anime white background character sheet. Infer and maintain the character's exact visual features, face, hair, outfit, color palette, and overall art style from the provided reference images (manga panels). Don't mistake strong manga shading on skin for innerwear. Include 1 full body close up, 1 full body back view, 1 face close up 3/4 view, hand close up (for hand design), high quality, character design sheet style, shading detail, no text. Hair color and eye colors should match exact hexcolor. Character: [CHARACTER NAME] in [GENRE] setting. [DETAILED VISUAL DESCRIPTION]'",
      },
      // Easy Mode metadata fields
      age: {
        type: Type.STRING,
        description: "Estimated age of the character as a number string (e.g., '25', '30')",
      },
      gender: {
        type: Type.STRING,
        description: "Gender of the character: 'Male' or 'Female'",
      },
      hairColor: {
        type: Type.STRING,
        description: "Hair color in 1-2 English words (e.g., 'Silver', 'Dark brown', 'Golden blonde', 'Black')",
      },
      hairStyle: {
        type: Type.STRING,
        description: "Hair style in 1-3 English words (e.g., 'Long straight', 'Short spiky', 'Wavy shoulder-length', 'Bob cut')",
      },
      eyeColor: {
        type: Type.STRING,
        description: "Eye color in 1-2 English words (e.g., 'Golden', 'Blue', 'Dark brown', 'Crimson red')",
      },
      personality: {
        type: Type.STRING,
        description: "Character personality in max 4 English words (e.g., 'Smart and calm', 'Brave and loyal')",
      },
      role: {
        type: Type.STRING,
        description: "Relationship to protagonist in English (e.g., 'Partner', 'Rival', 'Enemy', 'Sister', 'Mentor', 'Protagonist')",
      },
      // Variant detection fields
      isVariant: {
        type: Type.BOOLEAN,
        description: "True if this character is a variant/alternate version of another character (e.g., future self, dark mode, transformed state)",
      },
      variantDetails: {
        type: Type.STRING,
        nullable: true,
        description: "If isVariant is true, describe what kind of variant (e.g., 'Future version', 'Dark mode', 'Transformed state'). Null if not a variant.",
      },
      variantVisuals: {
        type: Type.STRING,
        nullable: true,
        description: "If isVariant is true, describe visual changes from the original (e.g., 'Longer hair, darker outfit, scar on face'). Null if not a variant.",
      },
    },
    required: [
      "name",
      "description",
      "descriptionKo",
      "appearingClips",
      "contextPrompts",
      "characterSheetPrompt",
      "age",
      "gender",
      "hairColor",
      "hairStyle",
      "eyeColor",
      "personality",
      "role",
      "isVariant",
    ],
  },
};

async function detectObjects(
  ai: GoogleGenAI,
  allClips: { clipId: string; story: string; imagePrompt: string }[],
  targetIds: string[],
  genre: string
) {
  const prompt = `
[오브젝트 감지 및 디자인 시트 마스터 프롬프트]
장르/시대 배경: ${genre || "Modern"}

다음 애니메이션 콘티 데이터를 분석하여, 아래 제공된 'Target Object IDs' 리스트에 있는 모든 오브젝트에 대한 상세 정보를 생성해줘.

**[필수 지시사항]**
1. **Target Object IDs 리스트에 포함된 모든 ID를 무조건 결과에 포함하십시오.**
2. **출력 필드 'name'은 반드시 해당 ID와 토씨 하나 틀리지 않고 동일해야 합니다.**
3. **문장 발췌 규칙:** 'contextPrompts'의 'text' 필드에는 해당 ID가 포함된 문장을 **원본 텍스트 그대로 토씨 하나 틀리지 않게(verbatim)** 발췌하십시오. 대문자로 표기된 ID와 문장 부호를 절대로 재해석하거나 요약하지 마십시오.
4. **묘사 스타일:** 'description' (영문 시각적 묘사)은 핵심 키워드와 구(phrase) 중심의 짧은 리스트 스타일로 작성하십시오.
5. **디자인 시트 형식:** "anime 2d style white background. 2d anime white product sheet of [OBJECT NAME] in ${genre || "Modern"} setting, [VISUAL DESCRIPTION], front view, side view, top view, high quality, character design sheet style, shading detail, no text"

결과는 반드시 JSON 배열 형태여야 합니다.

**Target Object IDs:** ${targetIds.join(", ")}

**콘티 데이터:**
${JSON.stringify(allClips, null, 2)}
  `;


  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: objectDetectionSchema,
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("No response text from AI for objects");
  }

  const jsonText = responseText.replace(/```json|```/g, "").trim();
  return JSON.parse(jsonText);
}

async function detectCharacters(
  ai: GoogleGenAI,
  allClips: { clipId: string; story: string; imagePrompt: string }[],
  targetIds: string[],
  genre: string,
  characterDescriptions?: Record<string, string>
) {
  // Build character description reference section if available
  const descriptionSection = characterDescriptions && Object.keys(characterDescriptions).length > 0
    ? `\n**[캐릭터 ID 설명 참조 - 반드시 준수]**
아래는 스토리보드 생성 단계에서 확정된 캐릭터 ID별 설명입니다. 'role' 필드를 결정할 때 반드시 이 설명을 기반으로 하십시오. AI가 임의로 관계를 추측하지 마십시오.
${Object.entries(characterDescriptions).map(([id, desc]) => `- **${id}**: ${desc}`).join("\n")}
`
    : "";

  const prompt = `
[캐릭터 감지 및 디자인 시트 마스터 프롬프트]
장르/시대 배경: ${genre || "Modern"}

다음 애니메이션 콘티 데이터를 분석하여, 아래 제공된 'Target Character IDs' 리스트에 있는 모든 캐릭터에 대한 상세 정보를 생성해줘.
${descriptionSection}
**[필수 지시사항]**
1. **Target Character IDs 리스트에 포함된 모든 ID를 무조건 결과에 포함하십시오.**
2. **출력 필드 'name'은 반드시 해당 ID와 동일해야 합니다.**
3. **문장 발췌 규칙:** 'contextPrompts'의 'text' 필드에는 해당 ID가 포함된 문장을 **원본 텍스트 그대로 토씨 하나 틀리지 않게(verbatim)** 발췌하십시오.
4. **묘사 스타일:** 'description' (영문 시각적 묘사)은 핵심 키워드와 구(phrase) 중심의 짧은 리스트 스타일로 작성하십시오.
5. **캐릭터 디자인 시트 형식 (중요):**
   "2d anime white background character sheet, [VISUAL DESCRIPTION] of [CHARACTER NAME] in ${genre || "Modern"} setting, 1 full body close up, 1 full body back view, 1 face close up 3/4 view, hand close up (for hand design), high quality, character design sheet style, shading detail, no text"

**[Easy Mode 데이터 추출 - 필수]**
나중에 'Easy Mode' 템플릿을 생성하기 위해 다음 정보를 추가로 분석하십시오:
- **role**: 주인공과의 관계. **위에 제공된 '캐릭터 ID 설명 참조'가 있다면 반드시 해당 설명에서 관계를 추출하십시오.** 예를 들어 설명에 "Protagonist's son"이 있으면 role은 "Son"이어야 합니다. 설명이 없는 경우에만 콘티에서 추론하십시오. 영어로 작성.
- **age**: 추정 나이 (숫자 문자열로, 예: "25", "30").
- **gender**: 성별 (Male 또는 Female).
- **personality**: 성격 묘사 (최대 4단어 영어, 예: "Smart and calm", "Brave and loyal").

**[변형(Variant) 캐릭터 감지]**
- **isVariant**: 이 캐릭터가 기존 캐릭터의 변형인지 여부를 판단하십시오 (과거/미래 자신, 흑화, 변신 상태 등). Boolean 값.
- **variantDetails**: 변형이라면 어떤 버전인가? (예: "Future version", "Dark mode", "Transformed state"). 일반이면 null.
- **variantVisuals**: 변형에 따른 외모 변경점 묘사 (영어, 예: "Longer hair, darker outfit, scar on face"). 일반이면 null.

결과는 반드시 JSON 배열 형태여야 합니다.

**Target Character IDs:** ${targetIds.join(", ")}

**콘티 데이터:**
${JSON.stringify(allClips, null, 2)}
  `;


  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: characterDetectionSchema,
    },
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("No response text from AI for characters");
  }

  const jsonText = responseText.replace(/```json|```/g, "").trim();
  return JSON.parse(jsonText);
}

export async function POST(request: NextRequest) {
  try {
    const body: DetectRequest = await request.json();
    const { scenes, objectIds, characterIds, characterDescriptions, targetIds, genre, customApiKey } = body;

    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json(
        { error: "scenes is required and must be an array" },
        { status: 400 }
      );
    }

    // Support both new format (objectIds/characterIds) and legacy format (targetIds)
    const finalObjectIds = objectIds || targetIds || [];
    const finalCharacterIds = characterIds || [];

    if (finalObjectIds.length === 0 && finalCharacterIds.length === 0) {
      return NextResponse.json(
        { error: "At least one of objectIds or characterIds must be provided" },
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

    // Prepare clip data for analysis (only story and imagePrompt, matching reference)
    const allClips = scenes.flatMap((scene, sIdx) =>
      scene.clips.map((clip, cIdx) => ({
        clipId: `${sIdx + 1}-${cIdx + 1}`,
        story: clip.story,
        imagePrompt: clip.imagePrompt,
      }))
    );

    // Run detection for objects and characters (in parallel if both exist)
    const results: { objects: unknown[]; characters: unknown[] } = {
      objects: [],
      characters: [],
    };

    const promises: Promise<void>[] = [];

    if (finalObjectIds.length > 0) {
      promises.push(
        detectObjects(ai, allClips, finalObjectIds, genre).then((objs) => {
          results.objects = objs;
        })
      );
    }

    if (finalCharacterIds.length > 0) {
      promises.push(
        detectCharacters(ai, allClips, finalCharacterIds, genre, characterDescriptions).then((chars) => {
          results.characters = chars;
        })
      );
    }

    await Promise.all(promises);

    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error("Error in generate_prop_sheet/detect API:", error);

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
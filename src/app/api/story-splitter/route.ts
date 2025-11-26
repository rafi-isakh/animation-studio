import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

interface StorySpitterRequest {
  text: string;
  guidelines: string;
  numParts: number;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.error?.message || `HTTP ${response.status}`;

        if (
          errorMessage.includes("503") ||
          errorMessage.includes("overloaded") ||
          errorMessage.includes("UNAVAILABLE")
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
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return text;
    } catch (error: unknown) {
      const errorMessage = String(error);
      // Only retry on transient errors
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("overloaded") ||
        errorMessage.includes("UNAVAILABLE")
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

async function splitTextWithCliffhangers(
  text: string,
  guidelines: string,
  numParts: number
): Promise<string[]> {
  const prompt = `
당신은 텍스트 분할을 위한 AI 분석 도구입니다. 당신의 임무는 주어진 텍스트에서 사용자가 요청한 파트의 개수(${numParts}개)에 맞춰, 각 파트(마지막 파트 제외)를 마무리할 **마지막 문장**을 찾아내는 것입니다.

**절대적인 규칙:**
1. 당신은 반드시 ${numParts - 1}개의 문장을 찾아야 합니다. 이 문장들은 각 파트의 끝을 장식할 클리프행어가 됩니다.
2. 반환하는 JSON 객체의 "cliffhangerSentences" 배열에는 **정확히 ${numParts - 1}개**의 문자열 요소가 포함되어야 합니다. 이 규칙은 다른 모든 지시사항보다 우선합니다.
3. 각 문장은 원본 텍스트에 있는 문장과 **정확히 일치**해야 합니다. 단어, 구두점, 띄어쓰기 등을 절대 변경하지 마십시오.

**부차적인 목표 (위의 규칙을 만족하는 선에서):**
1. 선택된 문장들을 기준으로 텍스트를 나눴을 때, 각 파트의 분량이 가능한 한 균등하도록 해주세요.
2. 선택된 각 문장은 그 자체로 다음 내용에 대한 궁금증을 강력하게 유발하는 훌륭한 클리프행어여야 합니다.

**출력 형식:**
다른 설명 없이, "cliffhangerSentences" 키 하나만을 가진 단일 JSON 객체만 반환해야 합니다. "cliffhangerSentences"의 값은 원본 텍스트에서 추출한 **정확히 ${numParts - 1}개**의 문장(문자열)을 담은 배열이어야 합니다.

사용자 가이드라인: ${guidelines || "추가 가이드라인 없음."}

다음 전체 스크립트를 ${numParts}개의 파트로 나눌 것입니다. 각 파트의 경계가 될 ${numParts - 1}개의 클리프행어 문장을 찾아주세요:

---
${text}
---
`;

  let responseText = (await callGeminiWithRetry(prompt)).trim();

  // Strip markdown code block if present (```json ... ```)
  if (responseText.startsWith("```")) {
    responseText = responseText
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (parseError: unknown) {
    console.error("JSON parsing error:", parseError);
    console.error("Malformed JSON string from API:", responseText);
    throw new Error(
      `AI 응답을 JSON으로 분석하는 데 실패했습니다. Error: ${(parseError as Error).message}`
    );
  }

  const cliffhangerSentences = result.cliffhangerSentences as string[];

  if (
    !Array.isArray(cliffhangerSentences) ||
    cliffhangerSentences.some((p) => typeof p !== "string")
  ) {
    throw new Error(
      "AI가 유효하지 않은 형식의 클리프행어를 반환했습니다. 문자열 배열이 필요합니다."
    );
  }

  if (cliffhangerSentences.length !== numParts - 1) {
    throw new Error(
      `AI가 요청된 클리프행어 문장 수를 생성하지 못했습니다. 요청: ${numParts - 1}개, 생성: ${cliffhangerSentences.length}개. 다시 시도해주세요.`
    );
  }

  const parts: string[] = [];
  let remainingText = text;

  for (const sentence of cliffhangerSentences) {
    const searchSentence = sentence.trim();
    const index = remainingText.indexOf(searchSentence);

    if (index === -1) {
      console.error(
        `Could not find cliffhanger: "${searchSentence}" in remaining text.`
      );
      throw new Error(
        `AI가 반환한 클리프행어 문장("${searchSentence.substring(0, 50)}...")을 원본 스크립트에서 찾을 수 없습니다. AI가 문장을 변경했을 수 있습니다. 다시 시도해주세요.`
      );
    }

    const splitPoint = index + searchSentence.length;
    const part = remainingText.substring(0, splitPoint);
    parts.push(part.trim());
    remainingText = remainingText.substring(splitPoint);
  }

  parts.push(remainingText.trim());

  if (parts.length !== numParts) {
    throw new Error(
      `최종 분할 후 파트 개수가 일치하지 않습니다. 예상: ${numParts}, 실제: ${parts.length}`
    );
  }

  return parts;
}

export async function POST(request: NextRequest) {
  try {
    const body: StorySpitterRequest = await request.json();
    const { text, guidelines, numParts } = body;

    // Validation
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    if (typeof numParts !== "number" || numParts < 2 || numParts > 10) {
      return NextResponse.json(
        { error: "numParts must be a number between 2 and 10" },
        { status: 400 }
      );
    }

    const parts = await splitTextWithCliffhangers(
      text,
      guidelines || "",
      numParts
    );

    return NextResponse.json({ parts });
  } catch (error: unknown) {
    console.error("Error in story-splitter API:", error);

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

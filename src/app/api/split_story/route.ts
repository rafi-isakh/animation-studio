import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface StorySpitterRequest {
  text: string;
  guidelines: string;
  numParts: number;
}

async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
  maxRetries = 3,
  initialDelay = 2000
): Promise<Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>> {
  let lastError: unknown;
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: unknown) {
      lastError = error;
      const errorMessage = String(error);
      // Only retry on specific, transient errors like 503.
      if (
        errorMessage.includes("503") ||
        errorMessage.includes("overloaded") ||
        errorMessage.includes("UNAVAILABLE")
      ) {
        if (i < maxRetries - 1) {
          console.warn(
            `Attempt ${i + 1} failed due to model overload. Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      } else {
        // Don't retry on non-transient errors (e.g., bad request, auth error)
        throw error;
      }
    }
  }
  console.error("All retry attempts failed.");
  throw lastError;
}

async function splitTextWithCliffhangers(
  text: string,
  guidelines: string,
  numParts: number
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
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
`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-pro",
      contents: `다음 전체 스크립트를 ${numParts}개의 파트로 나눌 것입니다. 각 파트의 경계가 될 ${numParts - 1}개의 클리프행어 문장을 찾아주세요:\n\n---\n${text}\n---`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cliffhangerSentences: {
              type: Type.ARRAY,
              description: `An array of exactly ${numParts - 1} strings. Each string is the last sentence of a part and must be an exact quote from the source text.`,
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ["cliffhangerSentences"],
        },
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError: unknown) {
      console.error("JSON parsing error:", parseError);
      console.error("Malformed JSON string from API:", responseText);
      throw new Error(
        `Failed to parse AI response into JSON. Error: ${(parseError as Error).message}`
      );
    }

    const cliffhangerSentences = result.cliffhangerSentences as string[];

    if (
      !Array.isArray(cliffhangerSentences) ||
      cliffhangerSentences.some((p) => typeof p !== "string")
    ) {
      throw new Error(
        "AI returned an invalid format for cliffhanger sentences. A string array is required."
      );
    }

    if (cliffhangerSentences.length !== numParts - 1) {
      throw new Error(
        `AI failed to generate the requested number of cliffhanger sentences. Requested: ${numParts - 1}, Generated: ${cliffhangerSentences.length}. Please try again.`
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
          `AI returned a cliffhanger sentence ("${searchSentence.substring(0, 50)}...") that could not be found in the original script. The AI may have altered the sentence. Please try again.`
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
        `The final number of parts after splitting does not match the expected count. Expected: ${numParts}, Actual: ${parts.length}`
      );
    }

    return parts;
  } catch (error: unknown) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = String(error);

    if (
      errorMessage.includes("503") ||
      errorMessage.includes("overloaded") ||
      errorMessage.includes("UNAVAILABLE")
    ) {
      throw new Error(
        "The AI model is currently overloaded. All retries have failed. Please try again in a few moments."
      );
    }

    if (error instanceof Error) {
      if (
        error.message.startsWith("Failed to parse AI") ||
        error.message.startsWith("AI") ||
        error.message.startsWith("The final")
      ) {
        throw error;
      }
    }
    throw new Error("An unexpected error occurred while communicating with the AI.");
  }
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

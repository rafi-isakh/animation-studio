import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface StorySpitterRequest {
  text: string;
  guidelines: string;
  numParts: number;
}

interface Cliffhanger {
  sentence: string;
  reason: string;
}

interface PartWithAnalysis {
  text: string;
  cliffhangers: Cliffhanger[];
}

interface SplitResponse {
  cliffhangerSentences: string[];
  partAnalysis: {
    cliffhangers: {
      sentence: string;
      reason: string;
    }[];
  }[];
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
): Promise<PartWithAnalysis[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
당신은 텍스트 분할 및 클리프행어 분석을 위한 AI 도구입니다. 당신의 임무는 두 가지입니다:

**임무 1: 텍스트 분할**
주어진 텍스트를 ${numParts}개의 파트로 나누기 위해, 각 파트(마지막 파트 제외)를 마무리할 **마지막 문장**을 찾아내세요.

**임무 2: 클리프행어 분석**
각 파트에서 3개의 핵심 클리프행어 포인트를 분석하세요:
1. BEGINNING (도입부 훅) - 파트 초반에서 독자를 끌어들이는 문장
2. MIDDLE (중반부) - 파트 중간에서 긴장감을 유지하는 문장
3. ENDING (절단면) - 파트 끝에서 다음 파트로 이어지는 클리프행어 문장

**절대적인 규칙:**
1. "cliffhangerSentences" 배열에는 **정확히 ${numParts - 1}개**의 문장이 포함되어야 합니다.
2. "partAnalysis" 배열에는 **정확히 ${numParts}개**의 파트 분석이 포함되어야 합니다.
3. 각 파트 분석에는 **정확히 3개**의 클리프행어가 포함되어야 합니다 (BEGINNING, MIDDLE, ENDING 순서).
4. 모든 문장은 원본 텍스트에 있는 문장과 **정확히 일치**해야 합니다. 단어, 구두점, 띄어쓰기 등을 절대 변경하지 마십시오.
5. 각 클리프행어의 "reason"은 왜 이 문장이 해당 위치에서 효과적인 클리프행어인지 한국어로 간결하게 설명해야 합니다.

**부차적인 목표:**
1. 각 파트의 분량이 가능한 한 균등하도록 해주세요.
2. 선택된 각 문장은 그 자체로 다음 내용에 대한 궁금증을 유발하는 훌륭한 클리프행어여야 합니다.

사용자 가이드라인: ${guidelines || "추가 가이드라인 없음."}
`;

  try {
    const response = await generateContentWithRetry(ai, {
      model: "gemini-2.5-pro",
      contents: `다음 전체 스크립트를 ${numParts}개의 파트로 나누고, 각 파트의 클리프행어를 분석해주세요:\n\n---\n${text}\n---`,
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
            partAnalysis: {
              type: Type.ARRAY,
              description: `An array of exactly ${numParts} part analyses. Each analysis contains 3 cliffhangers (BEGINNING, MIDDLE, ENDING).`,
              items: {
                type: Type.OBJECT,
                properties: {
                  cliffhangers: {
                    type: Type.ARRAY,
                    description: "Array of exactly 3 cliffhangers: BEGINNING, MIDDLE, ENDING in order.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        sentence: {
                          type: Type.STRING,
                          description: "The exact sentence from the source text.",
                        },
                        reason: {
                          type: Type.STRING,
                          description: "Korean explanation of why this sentence is an effective cliffhanger at this position.",
                        },
                      },
                      required: ["sentence", "reason"],
                    },
                  },
                },
                required: ["cliffhangers"],
              },
            },
          },
          required: ["cliffhangerSentences", "partAnalysis"],
        },
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    let result: SplitResponse;
    try {
      result = JSON.parse(responseText);
    } catch (parseError: unknown) {
      console.error("JSON parsing error:", parseError);
      console.error("Malformed JSON string from API:", responseText);
      throw new Error(
        `Failed to parse AI response into JSON. Error: ${(parseError as Error).message}`
      );
    }

    const cliffhangerSentences = result.cliffhangerSentences;
    const partAnalysis = result.partAnalysis;

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

    // Split the text into parts
    const textParts: string[] = [];
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
      textParts.push(part.trim());
      remainingText = remainingText.substring(splitPoint);
    }

    textParts.push(remainingText.trim());

    if (textParts.length !== numParts) {
      throw new Error(
        `The final number of parts after splitting does not match the expected count. Expected: ${numParts}, Actual: ${textParts.length}`
      );
    }

    // Combine text parts with analysis
    const partsWithAnalysis: PartWithAnalysis[] = textParts.map((text, index) => {
      const analysis = partAnalysis[index];
      return {
        text,
        cliffhangers: analysis?.cliffhangers || [],
      };
    });

    return partsWithAnalysis;
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
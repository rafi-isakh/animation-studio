import { NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000;
const API_CALL_DELAY = 1000;
const CHUNK_SIZE = 800000;

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
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;

        if (response.status === 503 || response.status === 500) {
          if (attempt < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
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
      if (attempt >= MAX_RETRIES) {
        console.error(`Gemini API call failed after ${attempt} attempts.`, error);
        throw error;
      }
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }
  throw new Error("API call failed after all retries.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { novelText, conditions, analysisType } = body;

    if (!novelText) {
      return NextResponse.json(
        { error: "Novel text cannot be empty." },
        { status: 400 }
      );
    }

    // Split text into chunks
    const chunks: string[] = [];
    for (let i = 0; i < novelText.length; i += CHUNK_SIZE) {
      chunks.push(novelText.substring(i, i + CHUNK_SIZE));
    }

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "File has no content." },
        { status: 400 }
      );
    }

    const intermediateSummaries: string[] = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const chunkPrompt = `
        당신은 웹소설 전문 편집자입니다. 다음은 긴 웹소설의 일부입니다.
        이 텍스트 조각에서 일어난 핵심 사건, 등장인물의 행동과 감정 변화, 그리고 앞으로의 전개를 암시하는 복선 등을 시간 순서대로 정리해주세요.
        만약 이 조각 내에 'n화', '제 n 화' 같은 회차 정보가 있다면, 요약의 시작 부분에 해당 회차 범위를 명시해주세요. (예: [15화 ~ 17화 요약])
        각색하거나 창작하지 말고, 원문 내용을 기반으로 객관적인 사실만 요약해야 합니다.
        ${conditions ? `추가적으로 다음 분석 조건들을 반드시 따라주세요: "${conditions}"` : ""}
        답변은 한국어로 작성해주세요.

        --- 소설 일부 ---
        ${chunk}
        ---
      `;

      const summary = await callGeminiWithRetry(chunkPrompt);
      intermediateSummaries.push(summary);
      await sleep(API_CALL_DELAY);
    }

    // Generate final report based on analysis type
    const plotPrompt = `
      당신은 천재적인 웹소설 편집자입니다. 다음은 한 웹소설의 핵심 사건들을 요약한 내용입니다. 각 요약에는 해당하는 회차 정보가 포함되어 있습니다.
      이 요약본들을 바탕으로 소설 전체의 구조를 심층적으로 분석해주세요.

      ${conditions ? `추가적으로 다음 분석 조건들을 반드시 따라주세요: "${conditions}"` : ""}

      분석 항목:

      1.  A-라인 (A-Line): 원고 내에서 차별화된 P(주인공 설정), O(장애물), **M(미션)**을 분석하고,"어떤 P가 어떤 O를 뚫고 어떤 M을 달성할 것인가?"를 한 문장으로 간결하게 요약하세요. 반드시 질문 형태여야 하며 평어체여야 합니다. 이어서 P, O, M을 아래와 같은 Markdown 테이블 형태로 정리하여 명시해주세요.

          | 구분 | 내용 |
          |---|---|
          | **P (주인공)** | [주인공 설정 요약] |
          | **O (장애물)** | [주요 장애물 요약] |
          | **M (미션)** | [핵심 미션 요약] |


      2.  B-라인 (B-Line) 분석: 독자에게 또 다른 관전 포인트를 제공하고, 반복적인 구조를 통해 이야기의 리듬과 입체감을 강화하는 서브 플롯(B-라인)을 모두 찾아 분석해주세요. B-라인은 단발성 사건이나 A-라인과 직접적인 관련이 없는 에피소드는 제외하며, 독자의 지속적인 궁금증과 기대감을 유발하는 장치여야 합니다. B-라인은 하나가 아닐 수 있습니다. 각 B-라인에 대해 소제목을 붙이고 어떤 내용인지 설명해주세요.
            형식: 각 B-라인은 [소제목] 아래 '내용'과 '분석'으로 나누어 작성합니다.
            내용: B-라인의 핵심 전개 과정을 2~3줄의 간결한 문장으로 압축하여 서술합니다.
            분석: 이 B-라인이 A-라인에 미치는 영향, 독자에게 제공하는 재미, 혹은 작중 역할 등을 2~3줄의 간결한 문장으로 압축하여 설명합니다.


      3.  주요 캐릭터 분석: 소설의 주요 캐릭터(특히 주인공)의 핵심 설정(배경, 능력, 성격 등), 성장 과정 및 주요 변화, 갈등 양상(내적/외적), 스토리 내에서 캐릭터가 가지는 의미와 역할, 그리고 독자가 캐릭터에게 느끼는 매력 포인트를 분석해주세요.


      4.  전체 기승전결: 소설 전체의 큰 흐름을 '기-승-전-결' 구조로 나누어 분석해주세요. 각 단계의 시작과 끝 회차를 반드시 명시해야 합니다. (예: 기 (Introduction) [1화~15화]: 핵심 내용 요약)


      5.  세부 기승전결: 전체 기승전결 내에 존재하는 작은 에피소드 단위의 기승전결 구조들을 모두 찾아내어 분석해주세요. 각 세부 기승전결의 시작과 끝 회차도 반드시 명시해야 합니다. (예: 튜토리얼 에피소드 [5화~10화] - 기: ..., 승: ..., 전: ..., 결: ...) 여러 개가 나올 수 있습니다.


      6.  재미 포인트: 독자들이 어떤 부분에서 재미를 느낄지, 그 이유는 무엇인지 구체적인 장면이나 설정을 예시로 들어 설명해주세요.

      **주의사항:**
      *   각색하거나 없는 내용을 만들지 마세요. 반드시 제공된 요약 내용에만 근거하여 분석해야 합니다.
      *   회차 정보는 제공된 요약본에 있는 내용을 기반으로 정확하게 기입해야 합니다.
      *   분석은 명확하고 이해하기 쉽게, 전문적인 편집자의 관점에서 작성해주세요.
      *   답변은 Markdown 형식을 사용하여 가독성을 높여주세요.
      *   답변 시 목록은 '-'나 '1.' 등의 기호를 사용하고, 강조는 꼭 필요한 곳에만 최소한으로 사용하여 깔끔한 가독성을 유지하세요.
      *   각 대분류 항목(예: 1. A-라인, 2. B-라인 등) 사이에는 두 줄 이상의 빈 줄을 넣어 충분한 시각적 구분을 해주세요.
      *   답변은 한국어로 작성해주세요.

      --- 웹소설 핵심 사건 요약 ---
      ${intermediateSummaries.join("\n\n")}
      ---
    `;

    const episodePrompt = `
      당신은 천재적인 웹소설 편집자입니다. 다음은 한 웹소설의 핵심 사건들을 요약한 내용입니다. 각 요약에는 해당하는 회차 정보가 포함되어 있을 수 있습니다.
      이 요약본들을 바탕으로 소설 전체를 심층적으로 분석해주세요.

      ${conditions ? `추가적으로 다음 분석 조건들을 반드시 따라주세요: "${conditions}"` : ""}

      **분석 항목:**

      1.  A-라인 (A-Line): 원고 내에서 차별화된 P(주인공 설정), O(장애물), **M(미션)**을 분석하고,"어떤 P가 어떤 O를 뚫고 어떤 M을 달성할 것인가?"를 한 문장으로 요약하세요. 반드시 질문 형태여야 하며 평어체여야 합니다. 이어서 P, O, M을 아래와 같은 Markdown 테이블 형태로 정리하여 명시해주세요.

          | 구분 | 내용 |
          |---|---|
          | **P (주인공)** | [주인공 설정 요약] |
          | **O (장애물)** | [주요 장애물 요약] |
          | **M (미션)** | [핵심 미션 요약] |


      2.  B-라인 (B-Line) 분석: 독자에게 또 다른 관전 포인트를 제공하고, 반복적인 구조를 통해 이야기의 리듬과 입체감을 강화하는 서브 플롯(B-라인)을 모두 찾아 분석해주세요. B-라인은 단발성 사건이나 A-라인과 직접적인 관련이 없는 에피소드는 제외하며, 독자의 지속적인 궁금증과 기대감을 유발하는 장치여야 합니다. B-라인은 하나가 아닐 수 있습니다. 각 B-라인에 대해 소제목을 붙이고 어떤 내용인지 설명해주세요.
            형식: 각 B-라인은 [소제목] 아래 '내용'과 '분석'으로 나누어 작성합니다.
            내용: B-라인의 핵심 전개 과정을 2~3줄의 간결한 문장으로 압축하여 서술합니다.
            분석: 이 B-라인이 A-라인에 미치는 영향, 독자에게 제공하는 재미, 혹은 작중 역할 등을 2~3줄의 간결한 문장으로 압축하여 설명합니다.


      3.  주요 캐릭터 분석: 소설의 주요 캐릭터(특히 주인공)의 핵심 설정(배경, 능력, 성격 등), 성장 과정 및 주요 변화, 갈등 양상(내적/외적), 스토리 내에서 캐릭터가 가지는 의미와 역할, 그리고 독자가 캐릭터에게 느끼는 매력 포인트를 분석해주세요.


      4.  에피소드별 핵심 요약: 제공된 요약본들을 의미 단위로 묶어 주요 에피소드별로 정리해주세요. 각 에피소드의 시작 회차와 끝 회차를 반드시 명시해야 합니다. 제공된 요약본에 회차 정보가 있으니 이를 기반으로 작성해주세요. 각 에피소드에는 적절한 소제목을 붙이고, 핵심 내용을 요약해주세요. (예시: ### 에피소드 1: 새로운 시작 [1화~10화])


      5.  재미 포인트: 독자들이 어떤 부분에서 재미를 느낄지, 그 이유는 무엇인지 구체적인 장면이나 설정을 예시로 들어 설명해주세요.

      **주의사항:**
      *   각색하거나 없는 내용을 만들지 마세요. 반드시 제공된 요약 내용에만 근거하여 분석해야 합니다.
      *   회차 정보는 제공된 요약본에 있는 내용을 기반으로 정확하게 기입해야 합니다.
      *   분석은 명확하고 이해하기 쉽게, 전문적인 편집자의 관점에서 작성해주세요.
      *   답변은 Markdown 형식을 사용하여 가독성을 높여주세요. (제목은 '##', 에피소드 소제목은 '###' 사용)
      *   답변 시 목록은 '-'나 '1.' 등의 기호를 사용하고, 강조는 꼭 필요한 곳에만 최소한으로 사용하여 깔끔한 가독성을 유지하세요.
      *   각 대분류 항목(예: 1. A-라인, 2. B-라인 등) 사이에는 두 줄 이상의 빈 줄을 넣어 충분한 시각적 구분을 해주세요.
      *   답변은 한국어로 작성해주세요.

      --- 웹소설 핵심 사건 요약 ---
      ${intermediateSummaries.join("\n\n")}
      ---
    `;

    const finalPrompt = analysisType === "plot" ? plotPrompt : episodePrompt;
    const finalReport = await callGeminiWithRetry(finalPrompt);

    return NextResponse.json({ result: finalReport });
  } catch (error) {
    console.error("Error in analyze_story:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface Variant {
  id: string;
  description: string;
  tags: string[];
}

interface Entity {
  name: string;
  type: 'CHARACTER' | 'ITEM' | 'LOCATION';
  variants: Variant[];
}

interface ConvertChunkRequest {
  textChunk: string;
  glossary: Entity[];
  previousContext?: string;
  apiKey?: string;
}

const MODEL_NAME = 'gemini-2.5-flash';

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
          delay *= 2;
        }
      } else {
        throw error;
      }
    }
  }
  console.error("All retry attempts failed.");
  throw lastError;
}

async function convertTextChunk(
  textChunk: string,
  glossary: Entity[],
  previousContext: string,
  apiKey: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const glossaryString = glossary.map(entity => {
    return `Entity: ${entity.name}\nVariants:\n` + entity.variants.map(v => `- ${v.id}: ${v.description}`).join('\n');
  }).join('\n---\n');

  const systemInstruction = `
Task: Translate the following Korean Webnovel text to English.

TRANSLATION STYLE GUIDELINES (PRIORITY):
1. Prioritize **natural, spoken English** over literal accuracy.
2. Keep the core meaning, plot facts, and emotional tone faithful, but you **MAY** restructure, combine, or split sentences to improve flow.
3. **Localize** any lines that would sound awkward if translated directly. Use phrasing a native English speaker would actually use.
4. **Dialogue**: Ensure it sounds like natural speech appropriate for the character's age and status. Use contractions (e.g., "don't", "can't") where appropriate. Avoid stiff/robotic wording unless the character is specifically meant to sound that way.
5. You may replace culturally specific idioms with equivalent English expressions if the intent remains the same.

SPECIFIC LOCALIZATION RULES:
1. **Family Honorifics**: In North American English, siblings call each other by name, not "Brother" or "Sister". Do not translate "형님", "오빠", "언니", "누나" as "Brother/Sister" in direct address or reference unless stylized. Use the Name.
   - "형님! 아센시오 형님!" -> "Asencio! Asencio!" (NOT "Brother! Brother Asencio!")
   - "아센시오 형님을 잃고" -> "lost Asencio" (NOT "lost Brother Asencio")
2. **Royal Terminology**:
   - 황후 -> **Empress**
   - 황비 -> **Imperial Consort** (Distinguish clearly from Empress. Consort is lower rank).
   - 1황비 -> **First Imperial Consort**

EXAMPLES OF CORRECT VS INCORRECT:
- Source: "그를 살리면, 1황비궁의 남은 화살이 어디로 향할 것 같으냐."
  - Bad: "If I had saved him, where do you think the First Empress's remaining arrows would be aimed next?"
  - Good: "If we spare him, where do you think the First Imperial Consort will aim her remaining arrows?"
- Source: "얼마나 오늘을 기다렸는지 모릅니다. 제니스를 잃고, 아센시오 형님을 잃고, 채드까지 잃어버린 뒤..."
  - Bad: "You have no idea how long I have waited for today. Ever since I lost Janice, since I lost Brother Asencio, and since I even lost Chad..."
  - Good: "You have no idea how long I have waited for today. Ever since I lost Janice, since I lost Asencio, and since I even lost Chad..."

CRITICAL INSTRUCTION - ID REPLACEMENT:
1. In narrative descriptions, stage directions, and action lines, you MUST replace names, pronouns (where unambiguous), and references to specific items with their corresponding IDs from the glossary below.
2. Infer the correct Variant ID based on the narrative context (time, appearance, mood).

CRITICAL INSTRUCTION - DIALOGUE PROTECTION:
1. **DO NOT** replace names or terms inside spoken dialogue (text within quotation marks).
2. Dialogue should remain natural English language.
3. Example:
   - CORRECT: ELISA_PRESENT walked into the room. "Hello, James," she said.
   - INCORRECT: ELISA_PRESENT walked into the room. "Hello, JAMES_SOLDIER," ELISA_PRESENT said.

GLOSSARY:
${glossaryString}

PREVIOUS CONTEXT (for continuity):
${previousContext}
`;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_NAME,
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemInstruction },
          { text: `TEXT TO TRANSLATE:\n${textChunk}` }
        ]
      }
    ]
  });

  return response.text || "";
}

export async function POST(request: NextRequest) {
  try {
    const body: ConvertChunkRequest = await request.json();
    const { textChunk, glossary, previousContext = "", apiKey } = body;

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: "API key is required. Please provide an API key or configure GEMINI_API_KEY." },
        { status: 400 }
      );
    }

    if (!textChunk || typeof textChunk !== "string") {
      return NextResponse.json(
        { error: "Text chunk is required and must be a string" },
        { status: 400 }
      );
    }

    if (!Array.isArray(glossary)) {
      return NextResponse.json(
        { error: "Glossary is required and must be an array" },
        { status: 400 }
      );
    }

    const translatedText = await convertTextChunk(
      textChunk,
      glossary,
      previousContext,
      effectiveApiKey
    );

    return NextResponse.json({ translatedText });
  } catch (error: unknown) {
    console.error("Error in convert-chunk API:", error);

    const errorMessage = String(error);
    if (
      errorMessage.includes("503") ||
      errorMessage.includes("overloaded") ||
      errorMessage.includes("UNAVAILABLE")
    ) {
      return NextResponse.json(
        { error: "The AI model is currently overloaded. Please try again later." },
        { status: 503 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

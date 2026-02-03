import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface AnalyzeGlossaryRequest {
  text?: string;
  fileUri?: string;
  apiKey?: string;
}

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

interface AnalysisResponse {
  entities: Entity[];
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

async function analyzeGlossary(
  input: { fileUri?: string; text?: string },
  apiKey: string
): Promise<Entity[]> {
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
You are a professional storyboard script analyzer for Webnovels.
Read the provided webnovel text/file.

Your goal is to identify:
1. Main Characters
2. Recurrent/Symbolic Items (e.g., specific weapons, artifacts like 'Crystal Ball')
3. Crucially, identify "Variants" of these characters/items based on time period, outfit, state (e.g., undead, child, before regression).

For each variant, assign a CAPITALIZED_SNAKE_CASE_ID.

CRITICAL INSTRUCTION:
The 'description' field for each variant MUST be written in KOREAN (Hangul).
Keep the Korean description concise and summarized (similar length to English summary).

Example:
- Character: Elisa
  - Variant: 30 years old, before death -> ELISA_BEFORE_30 (description: "30세, 처형 직전, 후회로 가득 찬 모습")
  - Variant: 20 years old, current time -> ELISA_PRESENT (description: "20세, 회귀 후, 결의에 찬 모습")

Return a JSON object containing a list of entities.
`;

  const parts: Array<{ text: string } | { fileData: { fileUri: string; mimeType: string } }> = [
    { text: systemInstruction }
  ];

  if (input.fileUri) {
    parts.push({ fileData: { fileUri: input.fileUri, mimeType: 'text/plain' } });
  } else if (input.text) {
    // Limit to ~800k characters to be safe (approx 200k tokens)
    parts.push({ text: `TEXT CONTENT:\n${input.text.substring(0, 800000)}` });
  } else {
    throw new Error("No input provided for analysis");
  }

  const response = await generateContentWithRetry(ai, {
    model: MODEL_NAME,
    contents: [{ role: 'user', parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          entities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['CHARACTER', 'ITEM', 'LOCATION'] },
                variants: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING, description: "Capitalized Unique ID like ELISA_PRESENT" },
                      description: { type: Type.STRING, description: "Description in Korean" },
                      tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['id', 'description']
                  }
                }
              },
              required: ['name', 'type', 'variants']
            }
          }
        },
        required: ['entities']
      }
    }
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("Empty response from Gemini API");
  }

  const result = JSON.parse(responseText) as AnalysisResponse;
  return result.entities || [];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeGlossaryRequest = await request.json();
    const { text, fileUri, apiKey } = body;

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: "API key is required. Please provide an API key or configure GEMINI_API_KEY." },
        { status: 400 }
      );
    }

    if (!text && !fileUri) {
      return NextResponse.json(
        { error: "Either text or fileUri is required" },
        { status: 400 }
      );
    }

    const entities = await analyzeGlossary({ text, fileUri }, effectiveApiKey);

    return NextResponse.json({ entities });
  } catch (error: unknown) {
    console.error("Error in analyze-glossary API:", error);

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

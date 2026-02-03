import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface AnalyzeEntityRequest {
  text: string;
  entityName: string;
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

async function analyzeSpecificEntity(
  text: string,
  entityName: string,
  apiKey: string
): Promise<Entity | null> {
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
Task: Search the provided Webnovel text for a SPECIFIC missing entity and analyze it.

Target Entity Name: "${entityName}"

1. Search the text for this character, item, or location.
2. Identify its type (CHARACTER, ITEM, or LOCATION).
3. Identify "Variants" based on time period, outfit, state, etc.
4. Assign CAPITALIZED_SNAKE_CASE_ID for each variant.
5. Write descriptions in KOREAN (Hangul), concise and summarized.

Return a JSON object containing the 'entity' details.
If the entity is not found in the text at all, return null for the entity field.
`;

  const response = await generateContentWithRetry(ai, {
    model: MODEL_NAME,
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemInstruction },
          { text: `TEXT CONTENT:\n${text.substring(0, 800000)}` }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          entity: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['CHARACTER', 'ITEM', 'LOCATION'] },
              variants: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
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
      }
    }
  });

  const responseText = response.text?.trim();
  if (!responseText) {
    throw new Error("Empty response from Gemini API");
  }

  const result = JSON.parse(responseText);
  return result.entity || null;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeEntityRequest = await request.json();
    const { text, entityName, apiKey } = body;

    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: "API key is required. Please provide an API key or configure GEMINI_API_KEY." },
        { status: 400 }
      );
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    if (!entityName || typeof entityName !== "string") {
      return NextResponse.json(
        { error: "Entity name is required and must be a string" },
        { status: 400 }
      );
    }

    const entity = await analyzeSpecificEntity(text, entityName, effectiveApiKey);

    return NextResponse.json({ entity });
  } catch (error: unknown) {
    console.error("Error in analyze-entity API:", error);

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

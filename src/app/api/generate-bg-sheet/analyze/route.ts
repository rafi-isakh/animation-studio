import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface AnalyzeRequest {
  text: string;
}

const analysisSchema = {
  type: "OBJECT",
  properties: {
    backgrounds: {
      type: "ARRAY",
      description: "List of all distinct settings/locations.",
      items: {
        type: "OBJECT",
        properties: {
          name: {
            type: "STRING",
            description: "Name of the location or setting.",
          },
          description: {
            type: "STRING",
            description: "Detailed description of the setting.",
          },
        },
        required: ["name", "description"],
      },
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const prompt = `
      You are a story analyst for a creative studio. Your task is to read the following novel text and extract structured information about settings for design purposes.

      Rules:
      1. Identify every distinct background where scenes, dialogues, or actions take place. The focus must be on the specific, physical spaces the characters occupy, particularly indoor locations.
      2. Be highly granular. If characters move between rooms or areas within a larger building (e.g., from a throne room to a corridor), each space must be a separate background entry.
      3. Instead of broad locations like 'a castle', identify specific rooms like 'The King's Study', 'The Grand Hall', or 'Arel's Nursery'.
      4. If a location is not explicitly described, **infer its appearance based on the context of the scene, the characters present, their social status, and the overall world-building.** Provide a rich, detailed description for each inferred or described location.
      5. Output the result in the specified JSON format. Do not include any text outside of the JSON structure.

      Novel Text:
      ---
      ${text.substring(0, 30000)}
      ---
      (Text truncated if too long)
    `;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!responseText) {
      throw new Error("No response text from AI");
    }

    // Clean up markdown code blocks if present
    const jsonText = responseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(jsonText);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error in generate-bg-sheet/analyze API:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

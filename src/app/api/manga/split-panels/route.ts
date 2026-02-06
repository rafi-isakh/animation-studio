import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface SplitPanelsRequest {
  image: string; // base64 encoded image
  readingDirection: 'rtl' | 'ltr';
  apiKey?: string; // Optional custom API key
}

interface Panel {
  box_2d: number[]; // [ymin, xmin, ymax, xmax] in 0-1000 scale
  label: string;
}

// Schema for structured output
const panelSchema = {
  type: Type.OBJECT,
  properties: {
    panels: {
      type: Type.ARRAY,
      description: "List of detected manga/comic panels in reading order",
      items: {
        type: Type.OBJECT,
        properties: {
          box_2d: {
            type: Type.ARRAY,
            description: "Bounding box coordinates [ymin, xmin, ymax, xmax] in 0-1000 scale",
            items: {
              type: Type.NUMBER,
            },
          },
          label: {
            type: Type.STRING,
            description: "Panel label (e.g., 'Panel 1', 'Panel 2')",
          },
        },
        required: ["box_2d", "label"],
      },
    },
  },
  required: ["panels"],
};

export async function POST(request: NextRequest) {
  try {
    const body: SplitPanelsRequest = await request.json();
    const { image, readingDirection, apiKey: customApiKey } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "image is required and must be a base64 string" },
        { status: 400 }
      );
    }

    if (!readingDirection || !['rtl', 'ltr'].includes(readingDirection)) {
      return NextResponse.json(
        { error: "readingDirection is required and must be 'rtl' or 'ltr'" },
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

    // Simple prompt matching the animation storyboard breakdown approach
    const directionLabel = readingDirection === 'rtl' ? 'Manga (RTL)' : 'Comic (LTR)';
    const prompt = `Analyze this page for animation storyboard breakdown. Direction: ${directionLabel}.
Detect scenery, characters, and action as separate panels. Return [ymin, xmin, ymax, xmax] in 0-1000 scale.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: image,
              mimeType: "image/jpeg",
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: panelSchema,
      },
    });

    const responseText = response.text?.trim();
    if (!responseText) {
      throw new Error("No response text from AI");
    }

    // Clean up markdown code blocks if present
    const jsonText = responseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(jsonText);

    // Validate and generate IDs for each panel
    const panels: Panel[] = (result.panels || []).map((panel: Panel, index: number) => ({
      id: `panel-${Date.now()}-${index}`,
      box_2d: panel.box_2d,
      label: panel.label || `Panel ${index + 1}`,
    }));

    return NextResponse.json({ panels });
  } catch (error: unknown) {
    console.error("Error in manga/split-panels API:", error);

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

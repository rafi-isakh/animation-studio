import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

interface MangaPanel {
  id: string;
  imageBase64: string; // Base64 encoded panel image
  label: string;
}

interface StoryboardRequest {
  panels: MangaPanel[];
  sourceText?: string; // Optional context text
  targetDuration: string; // MM:SS format
  storyCondition: string;
  imageCondition: string;
  videoCondition: string;
  soundCondition: string;
  apiKey?: string; // Optional custom API key
}

interface Part {
  inlineData?: { data: string; mimeType: string };
  text?: string;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Parse target duration string to seconds
function parseDuration(duration: string): number {
  const parts = duration.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    return minutes * 60 + seconds;
  }
  return 180; // Default 3 minutes
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: StoryboardRequest = await request.json();
    const {
      panels,
      sourceText,
      targetDuration,
      storyCondition,
      imageCondition,
      videoCondition,
      soundCondition,
      apiKey: customApiKey,
    } = body;

    // Validation
    if (!panels || !Array.isArray(panels) || panels.length === 0) {
      return NextResponse.json(
        { error: "panels is required and must be a non-empty array" },
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
    const totalSeconds = parseDuration(targetDuration || "03:00");
    const totalPanels = panels.length;

    // Build parts array with images and prompt
    const parts: Part[] = [];

    // Add all panel images
    for (let i = 0; i < panels.length; i++) {
      parts.push({
        inlineData: {
          data: panels[i].imageBase64,
          mimeType: "image/jpeg",
        },
      });
    }

    // Build the prompt
    const prompt = `You are an expert storyboard artist for anime production. You are given ${totalPanels} manga panels (images 1-${totalPanels} in order) and must create a detailed animation storyboard.

**TARGET DURATION**: ${formatTime(totalSeconds)} (${totalSeconds} seconds total)

**PANEL REFERENCE**: Each image is numbered from 1 to ${totalPanels}. Use 'referenceImageIndex' (0-indexed) to indicate which panel each clip is based on.

${sourceText ? `**SOURCE TEXT FOR CONTEXT**:\n---\n${sourceText}\n---\n` : ''}

**GENERATION CONDITIONS**:

1. **Story Condition**:
${storyCondition || 'Faithfully reflect the original panel content while enhancing visual narrative for animation.'}

2. **Image Condition**:
${imageCondition || 'Maintain consistent character appearances. Match shot angles with source panels.'}

3. **Video Condition**:
${videoCondition || 'Keep camera angles and movements concise. Include speaking animations for dialogue scenes.'}

4. **Sound Condition**:
${soundCondition || 'Categorize into dialogue, sound effects, and background music. Prioritize text from panels as dialogue.'}

**RULES**:
1. Create scenes that cover ALL ${totalPanels} panels
2. Each clip should be 1-4 seconds (max 4 seconds)
3. Total accumulated time must equal ${formatTime(totalSeconds)}
4. For each clip, specify 'referenceImageIndex' (0-indexed) to link back to source panel
5. Clips can reference the same panel multiple times (for longer scenes)
6. Dialogue should be extracted from text visible in panels when possible

**OUTPUT FORMAT**:
Generate a JSON object with:
- 'scenes': Array of scene objects, each with 'sceneTitle' and 'clips'
- 'voicePrompts': Array of character voice descriptions

**CLIP FIELDS**:
- story: Korean description of the scene action
- imagePrompt: English prompt for image generation (detailed, anime style)
- videoPrompt: English prompt for video/motion (camera moves, character actions)
- soraVideoPrompt: Full video prompt for Sora AI (no character names, only descriptions)
- dialogue: Korean dialogue with format "CharacterName: [emotion] \\"text\\""
- dialogueEn: English translation of dialogue
- sfx: Korean sound effects description
- sfxEn: English sound effects
- bgm: Korean BGM description
- bgmEn: English BGM description
- length: Duration string like "2초" (max "4초")
- accumulatedTime: Running total in MM:SS format
- backgroundPrompt: English description of background
- backgroundId: Shot type ID (e.g., "1-1", "1-2")
- referenceImageIndex: 0-indexed panel reference

Analyze the provided manga panels and create the storyboard now.`;

    parts.push({ text: prompt });

    // Response schema
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        scenes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sceneTitle: { type: Type.STRING },
              clips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    story: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
                    videoPrompt: { type: Type.STRING },
                    soraVideoPrompt: { type: Type.STRING },
                    dialogue: { type: Type.STRING },
                    dialogueEn: { type: Type.STRING },
                    sfx: { type: Type.STRING },
                    sfxEn: { type: Type.STRING },
                    bgm: { type: Type.STRING },
                    bgmEn: { type: Type.STRING },
                    length: { type: Type.STRING },
                    accumulatedTime: { type: Type.STRING },
                    backgroundPrompt: { type: Type.STRING },
                    backgroundId: { type: Type.STRING },
                    referenceImageIndex: {
                      type: Type.NUMBER,
                      description: "0-indexed reference to source panel",
                    },
                  },
                  required: [
                    "story",
                    "imagePrompt",
                    "videoPrompt",
                    "soraVideoPrompt",
                    "dialogue",
                    "dialogueEn",
                    "sfx",
                    "sfxEn",
                    "bgm",
                    "bgmEn",
                    "length",
                    "accumulatedTime",
                    "backgroundPrompt",
                    "backgroundId",
                    "referenceImageIndex",
                  ],
                },
              },
            },
            required: ["sceneTitle", "clips"],
          },
        },
        voicePrompts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              promptKo: { type: Type.STRING },
              promptEn: { type: Type.STRING },
            },
            required: ["promptKo", "promptEn"],
          },
        },
      },
      required: ["scenes", "voicePrompts"],
    };

    // Generate with retry logic
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            parts: parts,
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
          },
        });

        const responseText = response.text?.trim();
        if (!responseText) {
          throw new Error("Empty response from Gemini API");
        }

        // Clean up markdown code blocks if present
        const jsonText = responseText.replace(/```json|```/g, "").trim();
        const result = JSON.parse(jsonText);

        return NextResponse.json(result);
      } catch (error: unknown) {
        const errorMessage = String(error);

        // Check for transient errors that should be retried
        if (
          errorMessage.includes("503") ||
          errorMessage.includes("overloaded") ||
          errorMessage.includes("UNAVAILABLE") ||
          errorMessage.includes("RESOURCE_EXHAUSTED")
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
  } catch (error: unknown) {
    console.error("Error in manga/generate-storyboard API:", error);

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

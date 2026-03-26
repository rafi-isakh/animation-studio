import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ClipInput {
  clipId: string;
  imageUrl?: string;        // S3/CDN URL
  imageBase64?: string;     // data URL (e.g. "data:image/jpeg;base64,...")
  currentPrompt: string;
}

interface RefineResult {
  clipId: string;
  action: "kept" | "refined";
  originalPrompt: string;
  refinedPrompt: string;
  reason: string;
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/png";
  const mimeType = contentType.split(";")[0].trim();
  const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  return { base64, mimeType };
}

const systemInstruction = `You are a video prompt alignment specialist for animated story clips.

You will receive:
1. A reference image (the start frame for a video clip)
2. The current video generation prompt written for that clip

Your task:
- Analyze the reference image: identify the PRIMARY subject/focal point (character, object, landscape, etc.), composition, and mood.
- Compare with the text prompt's described subject and action.
- Decide: does the prompt's main subject match what is actually shown in the image?

MATCH criteria (keep prompt unchanged):
- The image shows the same type of subject described in the prompt (e.g., both reference a character, both reference a landscape)
- The composition roughly aligns
- Minor differences in background details are acceptable

MISMATCH criteria (rewrite prompt):
- The image is a B-roll/insert shot (landscape, object close-up, abstract) but the prompt describes a specific character performing an action
- The image shows Character A but the prompt describes Character B
- The image shows a wide establishing shot but the prompt describes an intimate close-up of a character
- A random subject/object would appear in the video because it's described in the prompt but not visible in the image

If MISMATCH, rewrite the prompt following these rules:
1. Describe what is ACTUALLY visible in the image as the subject
2. Preserve the mood, tone, and emotional atmosphere from the original prompt
3. Keep any camera movement instructions (pan, zoom, dolly, tracking shot, etc.) from the original prompt — they MUST appear at the start
4. Do NOT introduce characters, objects, or elements not visible in the image
5. Keep it concise: 1-3 sentences suitable for video generation

Respond with EXACTLY this JSON format (no markdown, no code fences):
{"action": "kept" | "refined", "refinedPrompt": "...", "reason": "..."}

If kept, set refinedPrompt to the exact original prompt text.
The reason should be one brief sentence explaining your decision.`;

export async function POST(req: NextRequest) {
  try {
    const { clips } = (await req.json()) as { clips: ClipInput[] };

    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json({ error: "Missing or empty clips array" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const results: RefineResult[] = [];

    for (const clip of clips) {
      try {
        if (!clip.imageUrl && !clip.imageBase64) {
          throw new Error("No image provided");
        }

        let base64: string;
        let mimeType: string;

        if (clip.imageBase64) {
          // data URL format: "data:<mimeType>;base64,<data>"
          const match = clip.imageBase64.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) throw new Error("Invalid imageBase64 format");
          mimeType = match[1];
          base64 = match[2];
        } else {
          ({ base64, mimeType } = await fetchImageAsBase64(clip.imageUrl!));
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-pro",
          config: { systemInstruction },
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: base64 } },
                {
                  text: `Current video prompt:\n"${clip.currentPrompt}"\n\nAnalyze the reference image above and determine if the prompt's main subject matches what is actually shown. If mismatched, rewrite the prompt to align with the image while preserving mood and camera movement.`,
                },
              ],
            },
          ],
        });

        const raw = (response.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
          .trim()
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "");
        const parsed = JSON.parse(raw);

        results.push({
          clipId: clip.clipId,
          action: parsed.action === "refined" ? "refined" : "kept",
          originalPrompt: clip.currentPrompt,
          refinedPrompt: parsed.refinedPrompt || clip.currentPrompt,
          reason: parsed.reason || "",
        });
      } catch (clipErr: any) {
        console.error(`[refine-prompts] clip ${clip.clipId}:`, clipErr.message);
        results.push({
          clipId: clip.clipId,
          action: "kept",
          originalPrompt: clip.currentPrompt,
          refinedPrompt: clip.currentPrompt,
          reason: `Error: ${clipErr.message}`,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[refine-prompts]", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

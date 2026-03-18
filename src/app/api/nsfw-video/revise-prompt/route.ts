import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface RequestBody {
  imageUrl: string;       // S3 URL of the finalized image
  currentPrompt: string;  // Video prompt written for Variant A
  variant: "B" | "C";
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/png";
  const mimeType = contentType.split(";")[0].trim();
  const base64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  return { base64, mimeType };
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { imageUrl, currentPrompt, variant } = body;

    if (!imageUrl || !currentPrompt || !variant) {
      return NextResponse.json({ error: "Missing imageUrl, currentPrompt, or variant" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are a video prompt revision specialist working on an animated story.

The story has multiple clips. Each clip has been illustrated from different perspectives:
- Variant A: the primary camera angle — the original video prompt was written for this view
- Variant B / C: the same story moment, but from a different camera angle, distance, or attention focus

Your task: Revise the original video prompt so it accurately describes the action visible in the provided image (Variant ${variant}), keeping the same story event, characters, and narrative moment.

Rules:
1. Keep the same core action and story event happening in the scene
2. Change the camera framing, angle, and subject focus to match exactly what is shown in the image (e.g., close-up, wide shot, POV, over-the-shoulder, aerial, etc.)
3. Be specific — describe what the camera sees, not just the story
4. Keep it concise: one to two sentences, suitable for direct use as a video generation prompt
5. Return ONLY the revised prompt text — no explanation, no quotes, no labels`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: { systemInstruction },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: base64 } },
            {
              text: `Original video prompt (written for Variant A):\n"${currentPrompt}"\n\nThe image above is Variant ${variant} — it depicts the same story moment but from a different perspective or with a different attention focus. Revise the video prompt to match this image while preserving the story action.`,
            },
          ],
        },
      ],
    });

    const revised = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    if (!revised) {
      return NextResponse.json({ error: "No revised prompt returned" }, { status: 500 });
    }

    return NextResponse.json({ revisedPrompt: revised });
  } catch (err: any) {
    console.error("[revise-prompt]", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

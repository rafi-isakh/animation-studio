import { NextRequest, NextResponse } from "next/server";

const MODELSLAB_T2I_URL = "https://modelslab.com/api/v6/images/text2img";
const MODEL_ID = "z-image-turbo";
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 24;

interface GenerateImageRequest {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  customApiKey?: string;
}

function aspectRatioToDimensions(aspectRatio: string): { width: number; height: number } {
  const map: Record<string, { width: number; height: number }> = {
    "1:1":  { width: 1024, height: 1024 },
    "16:9": { width: 1280, height: 720 },
    "9:16": { width: 720,  height: 1280 },
    "4:3":  { width: 1024, height: 768 },
    "3:4":  { width: 768,  height: 1024 },
  };
  return map[aspectRatio] ?? { width: 1280, height: 720 };
}

async function pollForResult(fetchUrl: string, apiKey: string): Promise<string> {
  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const resp = await fetch(fetchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey }),
    });

    const data = await resp.json();
    const status = data?.status;

    if (status === "success" && data.output) {
      return Array.isArray(data.output) ? data.output[0] : data.output;
    }
    if (status === "error") {
      throw new Error(`ModelsLab generation failed: ${data.message ?? JSON.stringify(data)}`);
    }
    // "processing" / "pending" → keep polling
  }
  throw new Error(`ModelsLab timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s`);
}

async function downloadAsBase64(url: string): Promise<string> {
  const MAX_ATTEMPTS = 8;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const resp = await fetch(url);
    if (resp.status === 404 && attempt < MAX_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      continue;
    }
    if (!resp.ok) throw new Error(`Failed to download image: ${resp.status}`);
    const buffer = await resp.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  }
  throw new Error(`Failed to download image after ${MAX_ATTEMPTS} attempts`);
}

export async function POST(request: NextRequest) {
  try {
    let body: GenerateImageRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid or empty request body" },
        { status: 400 }
      );
    }

    const { prompt, aspectRatio = "16:9" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.MODELSLAB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "MODELSLAB_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const { width, height } = aspectRatioToDimensions(aspectRatio);

    const payload = {
      key: apiKey,
      model_id: MODEL_ID,
      prompt,
      negative_prompt:
        "text, speech bubbles, word balloons, captions, watermarks, borders, panel borders, letterbox bars",
      width,
      height,
      samples: "1",
      num_inference_steps: "31",
      guidance_scale: 7.5,
      safety_checker: false,
      base64: false,
    };

    const resp = await fetch(MODELSLAB_T2I_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`ModelsLab API error ${resp.status}: ${text}`);
    }

    const data = await resp.json();
    const status = data?.status;

    if (status === "error") {
      throw new Error(`ModelsLab API error: ${data.message ?? JSON.stringify(data)}`);
    }

    let imageUrl: string;

    if (status === "success" && data.output) {
      imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    } else if (status === "processing") {
      const fetchUrl = data.fetch_result;
      if (!fetchUrl) throw new Error("ModelsLab returned 'processing' but no fetch_result URL");
      imageUrl = await pollForResult(fetchUrl, apiKey);
    } else {
      throw new Error(`Unexpected ModelsLab response: ${JSON.stringify(data)}`);
    }

    const imageBase64 = await downloadAsBase64(imageUrl);
    return NextResponse.json({ imageBase64 });
  } catch (error: unknown) {
    console.error("Error in generate_bg_sheet/generate-image API:", error);

    const errorMessage = String(error);
    if (
      errorMessage.includes("503") ||
      errorMessage.includes("overloaded") ||
      errorMessage.includes("UNAVAILABLE")
    ) {
      return NextResponse.json(
        { error: "The AI model is currently overloaded. Please try again in a few moments." },
        { status: 503 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
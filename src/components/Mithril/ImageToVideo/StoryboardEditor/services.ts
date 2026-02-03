import type { AspectRatio } from './types';

interface GenerateImageParams {
  prompt: string;
  referenceImage?: string;
  assetImages?: string[];
  aspectRatio?: AspectRatio;
  customApiKey?: string;
}

interface RemixImageParams {
  originalImage: string;
  remixPrompt: string;
  originalContext: string;
  assetImages?: string[];
  aspectRatio?: AspectRatio;
  customApiKey?: string;
}

/**
 * Generate an image using the Gemini API
 */
export async function generateImage(params: GenerateImageParams): Promise<string> {
  const response = await fetch('/api/storyboard-editor/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate image');
  }

  return data.imageBase64;
}

/**
 * Remix/modify an existing image
 */
export async function remixImage(params: RemixImageParams): Promise<string> {
  const response = await fetch('/api/storyboard-editor/remix-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to remix image');
  }

  return data.imageBase64;
}

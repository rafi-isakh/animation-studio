import type { AspectRatio, ImageProvider } from "./types";

export const DEFAULT_PROMPT =
  "Traditional hand-painted 2D anime background style, cel-shaded, flat colors, " +
  "Studio Ghibli style, Makoto Shinkai style, human-drawn illustration, " +
  "NO 3D elements, NO CGI, NO photorealism, highly detailed line art, vibrant anime colors";

export const GEMINI_API_KEY_STORAGE_KEY = "anime-bg-studio-gemini-key";
export const GROK_API_KEY_STORAGE_KEY = "anime-bg-studio-grok-key";

export const PROVIDERS: { label: string; value: ImageProvider }[] = [
  { label: "Gemini", value: "gemini" },
  { label: "Grok", value: "grok" },
];

export const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: "16:9 (Landscape)", value: "16:9" },
  { label: "9:16 (Portrait)", value: "9:16" },
  { label: "1:1 (Square)", value: "1:1" },
];

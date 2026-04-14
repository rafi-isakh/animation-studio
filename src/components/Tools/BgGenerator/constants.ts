import type { TimeOfDay } from "./types";

export const STYLE_PRESETS = [
  { value: "Makoto Shinkai", label: "Makoto Shinkai (Vibrant, Detailed)" },
  { value: "Studio Ghibli", label: "Studio Ghibli (Painterly, Natural)" },
  { value: "Cyberpunk Anime", label: "Cyberpunk (Neon, High Tech)" },
  { value: "Dark Fantasy", label: "Dark Fantasy (Grim, Atmospheric)" },
  { value: "Retro 90s Anime", label: "Retro 90s (Cel-shaded, Nostalgic)" },
  { value: "Watercolor", label: "Watercolor (Soft, Dreamy)" },
];

export const TIME_MODIFIERS: Record<TimeOfDay, string> = {
  morning:
    "early morning, cold color temperature, soft blue light, long shadows, sunrise atmosphere",
  day: "bright day, clear blue sky, neutral lighting",
  evening:
    "evening, sunset, golden hour, warm orange light, dramatic shadows",
  night:
    "night time, dark blue sky, moonlight, stars, city lights if applicable, cold atmosphere",
};

export const WORKSPACE_VERSION = "1.0.0";

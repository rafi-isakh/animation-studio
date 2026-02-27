export type GenerationStatus = "idle" | "generating-front" | "generating-back" | "done";

export type TimeOfDay = "morning" | "day" | "evening" | "night";

export type ModelProvider = "gemini" | "z-image";

export interface PromptSlot {
  text: string;
  image: string | null; // data URI
}

export interface ProjectItem {
  id: string;
  frontPrompt: string;
  frontImage: string | null; // data URI
  backPrompt: string | null;
  backImages: string[]; // 2 options for day back view
  selectedBackImageIndex: number;
  status: GenerationStatus;
  timeVariants: Record<TimeOfDay, { front: string | null; back: string | null }>;
  selectedTime: TimeOfDay;
}

export interface BgGeneratorWorkspace {
  version: string;
  timestamp: string;
  style: string;
  modelProvider: ModelProvider;
  prompts: PromptSlot[];
  items: ProjectItem[];
  frameworkGuide: string | null;
}

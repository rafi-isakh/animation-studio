export interface GeneratedImage {
  angle: string;
  prompt: string;
  imageBase64: string;
  isGenerating: boolean;
}

export interface Background {
  id: string;
  name: string;
  description: string;
  images: GeneratedImage[];
}

export interface BgSheetResult {
  backgrounds: Background[];
  styleKeyword: string;
  backgroundBasePrompt: string;
}

export interface AnalysisResult {
  backgrounds: Omit<Background, "id" | "images">[];
}

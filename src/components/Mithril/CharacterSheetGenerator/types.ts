export interface Character {
  id: string;
  name: string;
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;
  imagePrompt: string;
  imageBase64: string;  // For newly generated images (before S3 upload)
  imageUrl?: string;    // For S3 URLs (after upload or when loaded)
  isGenerating: boolean;
}

export interface CharacterMetadata {
  id: string;
  name: string;
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;
  imageId: string;
  imagePrompt: string;
}

export interface CharacterSheetResultMetadata {
  characters: CharacterMetadata[];
  styleKeyword: string;
  characterBasePrompt: string;
}

export interface AnalysisResult {
  characters: Omit<Character, "id" | "imagePrompt" | "imageBase64" | "isGenerating">[];
}

export interface Character {
  id: string;
  name: string;
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;
  imagePrompt: string;
  imageBase64: string;
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

// Mode/Variation for a character (outfit changes, age variations, etc.)
export interface Mode {
  id: string;
  name: string;           // e.g., "Battle Armor", "5 Years Later"
  description: string;    // What makes this mode different
  prompt: string;         // Visual prompt for generation
  imageBase64: string;    // For newly generated images
  imageUrl?: string;      // For S3 URLs
  isGenerating: boolean;
}

// Visual style reference slot
export interface StyleSlot {
  id: string;
  name: string;           // e.g., "Style A", "Style B"
  imageBase64: string;    // For local/uploaded images
  imageUrl?: string;      // For S3 URLs
}

export interface Character {
  id: string;
  name: string;

  // Role & Identity (new fields from v1.6)
  role: string;           // e.g., "protagonist", "antagonist", "supporting", "minor"
  isProtagonist: boolean; // Quick flag for protagonist detection
  age: string;            // e.g., "25", "early 20s", "teenager"
  gender: string;         // e.g., "male", "female", "non-binary"
  traits: string;         // Hair/eye color, physical features

  // Existing description fields
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;

  // Profile Image (1:1 headshot) - Generated first
  profilePrompt: string;
  profileImageBase64: string;
  profileImageUrl?: string;
  profileIsGenerating: boolean;

  // Master Sheet (16:9, 4 views) - Uses profile as reference
  masterSheetPrompt: string;
  masterSheetImageBase64: string;
  masterSheetImageUrl?: string;
  masterSheetIsGenerating: boolean;

  // Legacy fields for backward compatibility
  imagePrompt: string;      // Maps to masterSheetPrompt
  imageBase64: string;      // Maps to masterSheetImageBase64
  imageUrl?: string;        // Maps to masterSheetImageUrl
  isGenerating: boolean;    // Maps to masterSheetIsGenerating

  // Mode/Variations
  modes: Mode[];
}

// Metadata for Firestore persistence
export interface CharacterMetadata {
  id: string;
  name: string;

  // Role & Identity
  role: string;
  isProtagonist: boolean;
  age: string;
  gender: string;
  traits: string;

  // Description fields
  appearance: string;
  clothing: string;
  personality: string;
  backgroundStory: string;

  // Image references (S3 URLs)
  profileImageId: string;
  profileImagePrompt: string;
  masterSheetImageId: string;
  masterSheetImagePrompt: string;

  // Legacy field for backward compatibility
  imageId: string;          // Maps to masterSheetImageId
  imagePrompt: string;      // Maps to masterSheetImagePrompt
}

// Mode metadata for Firestore
export interface ModeMetadata {
  id: string;
  characterId: string;
  name: string;
  description: string;
  prompt: string;
  imageId: string;          // S3 URL
}

// Global settings result metadata
export interface CharacterSheetResultMetadata {
  characters: CharacterMetadata[];
  styleKeyword: string;
  characterBasePrompt: string;
  genre: string;
  styleSlots: StyleSlot[];
  activeStyleIndex: number | null;
}

// Analysis result from AI extraction
export interface AnalysisResult {
  characters: Array<{
    name: string;
    role: string;
    isProtagonist: boolean;
    age: string;
    gender: string;
    traits: string;
    appearance: string;
    clothing: string;
    personality: string;
    backgroundStory: string;
  }>;
}

// Helper to create a new character with defaults
export const createDefaultCharacter = (partial: Partial<Character> & { id: string; name: string }): Character => ({
  id: partial.id,
  name: partial.name,
  role: partial.role ?? "unknown",
  isProtagonist: partial.isProtagonist ?? false,
  age: partial.age ?? "",
  gender: partial.gender ?? "",
  traits: partial.traits ?? "",
  appearance: partial.appearance ?? "",
  clothing: partial.clothing ?? "",
  personality: partial.personality ?? "",
  backgroundStory: partial.backgroundStory ?? "",
  profilePrompt: partial.profilePrompt ?? "",
  profileImageBase64: partial.profileImageBase64 ?? "",
  profileImageUrl: partial.profileImageUrl,
  profileIsGenerating: partial.profileIsGenerating ?? false,
  masterSheetPrompt: partial.masterSheetPrompt ?? "",
  masterSheetImageBase64: partial.masterSheetImageBase64 ?? "",
  masterSheetImageUrl: partial.masterSheetImageUrl,
  masterSheetIsGenerating: partial.masterSheetIsGenerating ?? false,
  imagePrompt: partial.imagePrompt ?? partial.masterSheetPrompt ?? "",
  imageBase64: partial.imageBase64 ?? partial.masterSheetImageBase64 ?? "",
  imageUrl: partial.imageUrl ?? partial.masterSheetImageUrl,
  isGenerating: partial.isGenerating ?? partial.masterSheetIsGenerating ?? false,
  modes: partial.modes ?? [],
});

// Helper to migrate old character data to new format
export const migrateCharacter = (oldChar: Partial<Character> & { id: string; name: string }): Character => {
  return createDefaultCharacter({
    ...oldChar,
    // Map legacy image fields to master sheet if not already set
    masterSheetPrompt: oldChar.masterSheetPrompt ?? oldChar.imagePrompt ?? "",
    masterSheetImageBase64: oldChar.masterSheetImageBase64 ?? oldChar.imageBase64 ?? "",
    masterSheetImageUrl: oldChar.masterSheetImageUrl ?? oldChar.imageUrl,
    masterSheetIsGenerating: oldChar.masterSheetIsGenerating ?? oldChar.isGenerating ?? false,
  });
};
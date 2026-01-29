/**
 * PropDesigner Types
 *
 * Types for the Prop Designer stage (Stage 5) which detects and manages
 * recurring props/objects from storyboard data.
 */

// Category for detected IDs
export type PropCategory = 'character' | 'object';

// Context where a prop appears in the storyboard
export interface PropContext {
  clipId: string; // e.g., "1-1", "2-3"
  text: string; // The text snippet where the ID appears
}

// Detected ID from storyboard text (before full prop analysis)
export interface DetectedId {
  id: string; // The UPPERCASE_ID (e.g., "GOLDEN_SWORD", "MAGIC_AMULET")
  category: PropCategory;
  clipIds: string[]; // Where it appears (e.g., ["1-1", "2-3"])
  contexts: PropContext[];
  occurrences: number; // Total count across all clips
}

// Full prop definition after AI analysis
export interface Prop {
  id: string;
  name: string; // Display name (e.g., "Golden Sword")
  category: PropCategory;

  // Descriptions
  description: string; // English visual description
  descriptionKo: string; // Korean purpose/context description

  // Appearance tracking
  appearingClips: string[]; // Clip IDs where prop appears
  contextPrompts: PropContext[]; // Context snippets from storyboard

  // Design sheet generation
  designSheetPrompt: string;
  designSheetImageBase64?: string; // For newly generated images
  designSheetImageUrl?: string; // S3 URL for persisted images
  isGenerating: boolean;

  // Reference image support (user can upload) - supports multiple images
  referenceImageBase64?: string; // Legacy: single image
  referenceImageUrl?: string; // Legacy: single URL
  referenceImages?: string[]; // NEW: Array of base64 or URLs for multiple references

  // Character metadata (for Easy Mode)
  age?: string;
  gender?: string;
  personality?: string;
  role?: string; // Relationship to protagonist (Partner, Rival, Enemy, etc.)

  // Variant detection
  isVariant?: boolean;
  variantDetails?: string; // e.g., "Future version", "Dark mode"
  variantVisuals?: string; // e.g., "Longer hair, darker outfit"
}

// Metadata stored in context for navigation persistence
export interface PropMetadata {
  id: string;
  name: string;
  category: PropCategory;
  description: string;
  descriptionKo: string;
  appearingClips: string[];
  designSheetPrompt: string;
  designSheetImageRef: string; // S3 URL
  referenceImageRef?: string; // S3 URL (legacy single)
  referenceImageRefs?: string[]; // S3 URLs (multiple references)

  // Character metadata
  age?: string;
  gender?: string;
  personality?: string;
  role?: string;

  // Variant info
  isVariant?: boolean;
  variantDetails?: string;
  variantVisuals?: string;
}

// Settings for the PropDesigner stage
export interface PropDesignerSettings {
  styleKeyword: string;
  propBasePrompt: string;
  genre: string;
}

// Complete result metadata for context
export interface PropDesignerResultMetadata {
  props: PropMetadata[];
  settings: PropDesignerSettings;
  detectedIds: DetectedId[];
}

// State managed in MithrilContext
export interface PropDesignerState {
  isAnalyzing: boolean;
  error: string | null;
  props: Prop[];
  detectedIds: DetectedId[];
  settings: PropDesignerSettings;
}

// Character keywords for auto-categorization
export const CHARACTER_KEYWORDS = [
  'AREL',
  'DAMAN',
  'KANIA',
  'MIRA',
  'ELARA',
  'THORIN',
  'SOLDIER',
  'GUARD',
  'KING',
  'QUEEN',
  'PRINCE',
  'PRINCESS',
  'VILLAGER',
  'HORSE',
  'DOG',
  'CAT',
  'BIRD',
  'ANIMAL',
  'MONSTER',
  'CREATURE',
  'BOY',
  'GIRL',
  'MAN',
  'WOMAN',
  'HERO',
  'VILLAIN',
  'PROTAGONIST',
  'ANTAGONIST',
] as const;

// ID detection regex pattern
export const ID_PATTERN = /\b[A-Z][A-Z0-9_]{2,}\b/g;

// Helper function to categorize an ID based on keywords
export function categorizeId(id: string, characterKeywords: string[] = CHARACTER_KEYWORDS as unknown as string[]): PropCategory {
  const isCharacter = characterKeywords.some((kw) => id.includes(kw));
  return isCharacter ? 'character' : 'object';
}

// Design sheet prompt templates
export function getObjectDesignSheetPrompt(
  prop: { name: string; description: string },
  genre: string,
  styleKeyword: string
): string {
  return `anime 2d style white background. 2d anime white product sheet of ${prop.name} in ${genre} setting, ${prop.description}, front view, side view, top view, high quality, character design sheet style, shading detail, no text. Style: ${styleKeyword}. No vfx or visual effects, no dust particles`;
}

export function getCharacterDesignSheetPrompt(
  prop: { name: string; description: string },
  genre: string,
  styleKeyword: string
): string {
  return `2d anime white background character sheet, ${prop.description} of ${prop.name} in ${genre} setting, 1 full body close up, 1 full body back view, 1 face close up 3/4 view, hand close up (for hand design), high quality, character design sheet style, shading detail, no text. Style: ${styleKeyword}. No vfx or visual effects, no dust particles`;
}

// Easy Mode template for character design sheet
export function getEasyModeCharacterPrompt(
  prop: {
    name: string;
    description: string;
    age?: string;
    gender?: string;
    personality?: string;
    role?: string;
  }
): string {
  const age = prop.age || "20";
  const gender = prop.gender || "Female";
  const personality = prop.personality || "Smart and calm";
  const relationship = prop.role || "Companion";
  const description = prop.description || "";

  return `make 2d anime white background character sheet of who would be ${relationship} of this character, ${age}-year old ${gender}. ${personality}. ${description} Maintain 1 full body front view, 1 face close up front view, 1 hands close up template. No vfx or visual effects, no dust particles`;
}

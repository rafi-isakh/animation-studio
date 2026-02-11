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
  csvDescription?: string; // Description from CSV Character ID List

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
  hairColor?: string; // e.g., 'Silver', 'Dark brown'
  hairStyle?: string; // e.g., 'Long straight', 'Short spiky'
  eyeColor?: string; // e.g., 'Golden', 'Blue'
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
  csvDescription?: string;
  appearingClips: string[];
  designSheetPrompt: string;
  designSheetImageRef: string; // S3 URL
  referenceImageRef?: string; // S3 URL (legacy single)
  referenceImageRefs?: string[]; // S3 URLs (multiple references)

  // Character metadata
  age?: string;
  gender?: string;
  hairColor?: string;
  hairStyle?: string;
  eyeColor?: string;
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
  prop: { name: string; description: string; csvDescription?: string },
  genre: string,
  styleKeyword: string
): string {
  // Helper to ensure text ends with period
  const ensurePeriod = (text: string): string => {
    const trimmed = text.trim();
    return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  };

  // If we have CSV description, use it with visual description
  if (prop.csvDescription && prop.csvDescription.trim()) {
    const csvDesc = ensurePeriod(prop.csvDescription);
    const visualDesc = prop.description ? ensurePeriod(prop.description) : '';
    return `Make 2d anime white background character sheet of who would be ${csvDesc} ${visualDesc} Maintain 1 full body front view, 1 face closeup view, 1 hands close up template. ${genre}.`;
  }

  // Otherwise use just the visual description
  const visualDesc = ensurePeriod(prop.description);
  return `Make 2d anime white background character sheet of who would be ${visualDesc} Maintain 1 full body front view, 1 face closeup view, 1 hands close up template. ${genre}.`;
}

// Easy Mode template for character design sheet
export function getEasyModeCharacterPrompt(
  prop: {
    name: string;
    description: string;
    csvDescription?: string;
    age?: string;
    gender?: string;
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    personality?: string;
    role?: string;
  },
  genre?: string
): string {
  const genreText = genre || "Modern";

  // Helper to ensure text ends with period
  const ensurePeriod = (text: string): string => {
    const trimmed = text.trim();
    return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  };

  // If we have CSV description, use it with visual description
  if (prop.csvDescription && prop.csvDescription.trim()) {
    const csvDesc = ensurePeriod(prop.csvDescription);
    const visualDesc = prop.description ? ensurePeriod(prop.description) : '';
    
    // Format: CSV description + Visual description + Template + Genre
    return `Make 2d anime white background character sheet of who would be ${csvDesc} ${visualDesc} Maintain 1 full body front view, 1 face closeup view, 1 hands close up template. ${genreText}.`;
  }

  // Otherwise build from Easy Mode metadata
  const age = prop.age || "20";
  const gender = prop.gender || "Female";
  const hairColor = prop.hairColor || "black";
  const hairStyle = prop.hairStyle || "medium length";
  const eyeColor = prop.eyeColor || "brown";
  const personality = prop.personality || "Smart and calm";
  const role = prop.role || "Companion";
  const description = prop.description || "";

  // Build relationship phrase correctly based on the role
  let relationshipPhrase = "";
  const lowerRole = role.toLowerCase();
  
  if (lowerRole === "protagonist" || lowerRole === "main character") {
    relationshipPhrase = "the protagonist";
  } else if (lowerRole.includes("son") || lowerRole.includes("daughter") || 
             lowerRole.includes("child") || lowerRole.includes("offspring")) {
    relationshipPhrase = `the protagonist's ${role.toLowerCase()}`;
  } else if (lowerRole.includes("father") || lowerRole.includes("mother") || 
             lowerRole.includes("parent") || lowerRole.includes("dad") || lowerRole.includes("mom")) {
    relationshipPhrase = `the protagonist's ${role.toLowerCase()}`;
  } else if (lowerRole.includes("brother") || lowerRole.includes("sister") || lowerRole.includes("sibling")) {
    relationshipPhrase = `the protagonist's ${role.toLowerCase()}`;
  } else if (lowerRole.includes("wife") || lowerRole.includes("husband") || 
             lowerRole.includes("spouse") || lowerRole.includes("partner")) {
    relationshipPhrase = `the protagonist's ${role.toLowerCase()}`;
  } else if (lowerRole.includes("friend") || lowerRole.includes("ally") || 
             lowerRole.includes("companion") || lowerRole.includes("comrade")) {
    relationshipPhrase = `a ${role.toLowerCase()} of the protagonist`;
  } else if (lowerRole.includes("mentor") || lowerRole.includes("teacher") || 
             lowerRole.includes("master") || lowerRole.includes("guide")) {
    relationshipPhrase = `the protagonist's ${role.toLowerCase()}`;
  } else if (lowerRole.includes("student") || lowerRole.includes("disciple") || 
             lowerRole.includes("apprentice") || lowerRole.includes("pupil")) {
    relationshipPhrase = `the protagonist's ${role.toLowerCase()}`;
  } else if (lowerRole.includes("rival") || lowerRole.includes("enemy") || 
             lowerRole.includes("antagonist") || lowerRole.includes("opponent")) {
    relationshipPhrase = `the protagonist's ${role.toLowerCase()}`;
  } else if (lowerRole.includes("younger") || lowerRole.includes("past") || 
             lowerRole.includes("childhood") || lowerRole.includes("young")) {
    relationshipPhrase = `the protagonist (${role.toLowerCase()})`;
  } else {
    relationshipPhrase = `the protagonist's ${role.toLowerCase()}`;
  }

  // Build visual features string
  const visualFeatures = `${hairColor} ${hairStyle} hair, ${eyeColor} eyes`;
  
  return `Make 2d anime white background character sheet of who would be ${relationshipPhrase}, ${age}-year old ${gender}. ${visualFeatures}. ${personality}. ${description} Maintain 1 full body front view, 1 face closeup view, 1 hands close up template. ${genreText}.`;
}

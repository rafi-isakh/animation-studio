"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { Scene, VoicePrompt } from "./StoryboardGenerator/types";
import type { BgSheetResultMetadata } from "./BgSheetGenerator/types";
import type { CharacterSheetResultMetadata, Character } from "./CharacterSheetGenerator/types";
import { useProject } from "@/contexts/ProjectContext";

// Firestore services
import {
  getMetadata,
  updateCurrentStage as updateCurrentStageFirestore,
  updateCustomApiKey as updateCustomApiKeyFirestore,
  getStorySplits,
  saveStorySplits,
  deleteStorySplits,
  getCharacterSheetSettings,
  getCharacters,
  saveCharacterSheetSettings,
  saveCharacter,
  clearCharacterSheet,
  getBgSheetSettings,
  getBackgrounds,
  saveBgSheetSettings,
  saveBackground,
  clearBgSheet,
  getStoryboardMeta,
  getScenes,
  getClips,
  getVoicePrompts,
  saveStoryboardMeta,
  saveScene,
  saveClip,
  saveVoicePrompts,
  updateClipField as updateClipFieldFirestore,
  clearStoryboard,
} from "./services/firestore";

const TOTAL_STAGES = 7;

// Editable clip field type (shared across components)
export type EditableClipField = 'imagePrompt' | 'imagePromptEnd' | 'videoPrompt' | 'dialogue' | 'dialogueEn' | 'sfx' | 'sfxEn' | 'bgm' | 'bgmEn';

// Types for Story Splitter
interface Cliffhanger {
  sentence: string;
  reason: string;
}

interface PartWithAnalysis {
  text: string;
  cliffhangers: Cliffhanger[];
}

interface SplitResult {
  parts: PartWithAnalysis[];
}

interface StorySplitterState {
  isLoading: boolean;
  error: string | null;
  result: SplitResult | null;
}

// Types for Storyboard Generator
interface StoryboardGeneratorState {
  isGenerating: boolean;
  error: string | null;
  scenes: Scene[];
  voicePrompts: VoicePrompt[];
}

// Types for BgSheet Generator
interface BgSheetGeneratorState {
  isAnalyzing: boolean;
  error: string | null;
  result: BgSheetResultMetadata | null;
}

// Types for Character Sheet Generator
interface CharacterSheetGeneratorState {
  isAnalyzing: boolean;
  error: string | null;
  result: CharacterSheetResultMetadata | null;
}

interface BgSheetBackground {
  id: string;
  name: string;
  description: string;
  images: {
    angle: string;
    prompt: string;
    imageBase64: string;
    imageUrl?: string;  // S3 URL after upload
    isGenerating: boolean;
  }[];
}

const BACKGROUND_ANGLES = [
  "Front View",
  "Side View (Left)",
  "Side View (Right)",
  "Rear View",
  "Low Angle",
  "High Angle",
  "Wide Shot",
  "Close-up Detail",
];

interface GenerateStoryboardParams {
  sourceText: string;
  storyCondition: string;
  imageCondition: string;
  videoCondition: string;
  soundCondition: string;
  imageGuide: string;
  videoGuide: string;
}

// Types for shared state
interface MithrilContextProps {
  // Loading state
  isLoading: boolean;

  // Current project ID
  currentProjectId: string | null;

  // Navigation
  currentStage: number;
  setCurrentStage: (stage: number) => void;
  goToNextStage: () => void;
  goToPreviousStage: () => void;

  // File management (Stage 1 - Upload Manager)
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  addFile: (file: File) => void;
  removeFile: (index: number) => void;

  // Stage results (outputs that become inputs for other stages)
  stageResults: Record<number, unknown>;
  setStageResult: (stage: number, result: unknown) => void;
  getStageResult: (stage: number) => unknown;

  // Custom API Key for image generation (to avoid rate limits)
  customApiKey: string;
  setCustomApiKey: (key: string) => void;

  // Story Splitter (Stage 2)
  storySplitter: StorySplitterState;
  startStorySplit: (text: string, guidelines: string, numParts: number) => Promise<void>;
  clearStorySplit: () => void;

  // Storyboard Generator (Stage 5)
  storyboardGenerator: StoryboardGeneratorState;
  startStoryboardGeneration: (params: GenerateStoryboardParams) => Promise<void>;
  splitStartEndFrames: () => Promise<void>;
  importStoryboard: (scenes: Scene[], voicePrompts: VoicePrompt[]) => Promise<void>;
  clearStoryboardGeneration: () => void;
  updateClipPrompt: (sceneIndex: number, clipIndex: number, field: EditableClipField, value: string) => void;
  updateClipImageRef: (sceneIndex: number, clipIndex: number, imageRef: string) => void;
  getOriginalClipPrompt: (sceneIndex: number, clipIndex: number, field: EditableClipField) => string | null;

  // BgSheet Generator (Stage 4)
  bgSheetGenerator: BgSheetGeneratorState;
  startBgSheetAnalysis: (text: string, styleKeyword: string, backgroundBasePrompt: string) => Promise<BgSheetBackground[]>;
  clearBgSheetAnalysis: () => void;
  setBgSheetResult: (result: BgSheetResultMetadata) => void;

  // Character Sheet Generator (Stage 3)
  characterSheetGenerator: CharacterSheetGeneratorState;
  startCharacterSheetAnalysis: (text: string, styleKeyword: string, characterBasePrompt: string) => Promise<Character[]>;
  clearCharacterSheetAnalysis: () => void;
  setCharacterSheetResult: (result: CharacterSheetResultMetadata) => void;

  // Reload data from Firestore
  reloadFromFirestore: () => Promise<void>;
}

const MithrilContext = createContext<MithrilContextProps | undefined>(undefined);

export const MithrilProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentProjectId } = useProject();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Navigation state
  const [currentStage, setCurrentStageState] = useState(1);

  // Custom API Key state
  const [customApiKey, setCustomApiKeyState] = useState<string>("");

  // File management state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Stage results state
  const [stageResults, setStageResults] = useState<Record<number, unknown>>({});

  // Story Splitter state (Stage 2)
  const [storySplitter, setStorySplitter] = useState<StorySplitterState>({
    isLoading: false,
    error: null,
    result: null,
  });

  // Storyboard Generator state (Stage 5)
  const [storyboardGenerator, setStoryboardGenerator] = useState<StoryboardGeneratorState>({
    isGenerating: false,
    error: null,
    scenes: [],
    voicePrompts: [],
  });

  // Original storyboard for reset functionality
  const [originalStoryboard, setOriginalStoryboard] = useState<{ scenes: Scene[]; voicePrompts: VoicePrompt[] } | null>(null);

  // BgSheet Generator state (Stage 4)
  const [bgSheetGenerator, setBgSheetGenerator] = useState<BgSheetGeneratorState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  // Character Sheet Generator state (Stage 3)
  const [characterSheetGenerator, setCharacterSheetGenerator] = useState<CharacterSheetGeneratorState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  // Load data from Firestore when projectId changes
  const loadFromFirestore = useCallback(async () => {
    if (!currentProjectId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      // Load project metadata (currentStage, customApiKey)
      const metadata = await getMetadata(currentProjectId);
      if (metadata) {
        setCurrentStageState(metadata.currentStage || 1);
        setCustomApiKeyState(metadata.customApiKey || "");
      }

      // Load story splitter data
      const storySplitsData = await getStorySplits(currentProjectId);
      if (storySplitsData && storySplitsData.parts) {
        // Handle backward compatibility: old format was string[], new format is PartWithAnalysis[]
        // Cast to unknown first to handle both formats
        const rawParts = storySplitsData.parts as unknown as (string | PartWithAnalysis)[];
        const normalizedParts = rawParts.map((part) => {
          // If part is a string (old format), convert to new format
          if (typeof part === 'string') {
            return { text: part, cliffhangers: [] };
          }
          // If part is already in new format, ensure cliffhangers array exists
          return {
            text: part.text || '',
            cliffhangers: part.cliffhangers || [],
          };
        });
        const splitResult = { parts: normalizedParts };
        setStorySplitter(prev => ({
          ...prev,
          result: splitResult,
        }));
        // Also set stageResult for components that read from it
        setStageResults(prev => ({ ...prev, 2: splitResult }));
      }

      // Load character sheet data
      const charSettings = await getCharacterSheetSettings(currentProjectId);
      const characters = await getCharacters(currentProjectId);
      if (charSettings || characters.length > 0) {
        const metadata: CharacterSheetResultMetadata = {
          styleKeyword: charSettings?.styleKeyword || "",
          characterBasePrompt: charSettings?.characterBasePrompt || "",
          characters: characters.map(char => ({
            id: char.id,
            name: char.name,
            appearance: char.appearance,
            clothing: char.clothing,
            personality: char.personality,
            backgroundStory: char.backgroundStory,
            imageId: char.imageRef, // Use imageRef as imageId for compatibility
            imagePrompt: char.imagePrompt,
          })),
        };
        setCharacterSheetGenerator(prev => ({ ...prev, result: metadata }));
        // Also set stageResult for components that read from it (e.g., useReferenceImages)
        setStageResults(prev => ({ ...prev, 3: metadata }));
      }

      // Load background sheet data
      const bgSettings = await getBgSheetSettings(currentProjectId);
      const backgrounds = await getBackgrounds(currentProjectId);
      if (bgSettings || backgrounds.length > 0) {
        const metadata: BgSheetResultMetadata = {
          styleKeyword: bgSettings?.styleKeyword || "",
          backgroundBasePrompt: bgSettings?.backgroundBasePrompt || "",
          backgrounds: backgrounds.map(bg => ({
            id: bg.id,
            name: bg.name,
            description: bg.description,
            images: bg.angles.map(angle => ({
              angle: angle.angle,
              prompt: angle.prompt,
              imageId: angle.imageRef, // Use imageRef as imageId for compatibility
            })),
          })),
        };
        setBgSheetGenerator(prev => ({ ...prev, result: metadata }));
        // Also set stageResult for components that read from it (e.g., useReferenceImages)
        setStageResults(prev => ({ ...prev, 4: metadata }));
      }

      // Load storyboard data
      const storyboardMeta = await getStoryboardMeta(currentProjectId);
      if (storyboardMeta) {
        const scenes = await getScenes(currentProjectId);
        const voicePrompts = await getVoicePrompts(currentProjectId);

        // Load clips for each scene
        const scenesWithClips: Scene[] = await Promise.all(
          scenes.map(async (scene) => {
            const clips = await getClips(currentProjectId, scene.sceneIndex);
            return {
              sceneTitle: scene.sceneTitle,
              clips: clips.map(clip => ({
                story: clip.story,
                imagePrompt: clip.imagePrompt,
                imagePromptEnd: clip.imagePromptEnd,
                videoPrompt: clip.videoPrompt,
                soraVideoPrompt: clip.soraVideoPrompt,
                backgroundPrompt: clip.backgroundPrompt,
                backgroundId: clip.backgroundId,
                dialogue: clip.dialogue,
                dialogueEn: clip.dialogueEn,
                sfx: clip.sfx,
                sfxEn: clip.sfxEn,
                bgm: clip.bgm,
                bgmEn: clip.bgmEn,
                length: clip.length,
                accumulatedTime: clip.accumulatedTime,
                imageRef: clip.imageRef, // S3 URL for storyboard image
              })),
            };
          })
        );

        const storyboardData = {
          scenes: scenesWithClips,
          voicePrompts: voicePrompts.map(vp => ({
            promptKo: vp.promptKo,
            promptEn: vp.promptEn,
          })),
        };

        setStoryboardGenerator(prev => ({
          ...prev,
          scenes: scenesWithClips,
          voicePrompts: storyboardData.voicePrompts,
        }));

        // Also set stageResult for components that read from it (e.g., SoraVideoGenerator)
        setStageResults(prev => ({ ...prev, 5: storyboardData }));

        // Store original for reset functionality
        setOriginalStoryboard(storyboardData);
      }
    } catch (error) {
      console.error("Error loading data from Firestore:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentProjectId]);

  // Load data when projectId changes
  useEffect(() => {
    loadFromFirestore();
  }, [loadFromFirestore]);

  // Wrapper for setCurrentStage that also updates Firestore
  const setCurrentStage = useCallback(async (stage: number) => {
    setCurrentStageState(stage);
    if (currentProjectId) {
      try {
        await updateCurrentStageFirestore(currentProjectId, stage);
      } catch (error) {
        console.error("Error updating current stage in Firestore:", error);
      }
    }
  }, [currentProjectId]);

  // Wrapper for setCustomApiKey that also updates Firestore
  const setCustomApiKey = useCallback(async (key: string) => {
    setCustomApiKeyState(key);
    if (currentProjectId) {
      try {
        await updateCustomApiKeyFirestore(currentProjectId, key);
      } catch (error) {
        console.error("Error updating custom API key in Firestore:", error);
      }
    }
  }, [currentProjectId]);

  // Helper to clear specific stage results
  const clearStageResult = useCallback((stage: number) => {
    setStageResults(prev => {
      const next = { ...prev };
      delete next[stage];
      return next;
    });
  }, []);

  // Story Splitter methods
  const startStorySplit = useCallback(async (text: string, guidelines: string, numParts: number) => {
    if (!text) {
      setStorySplitter(prev => ({
        ...prev,
        error: "No script found. Please upload a file in Stage 1 first.",
      }));
      return;
    }

    setStorySplitter({
      isLoading: true,
      error: null,
      result: null,
    });

    try {
      const response = await fetch("/api/split_story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          guidelines,
          numParts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "API request failed");
      }

      const result = { parts: data.parts };

      // Save to Firestore
      if (currentProjectId) {
        await saveStorySplits(currentProjectId, {
          guidelines,
          parts: data.parts,
        });
      }

      setStorySplitter({
        isLoading: false,
        error: null,
        result,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setStorySplitter(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [currentProjectId]);

  const clearStorySplit = useCallback(async () => {
    setStorySplitter({
      isLoading: false,
      error: null,
      result: null,
    });

    if (currentProjectId) {
      try {
        await deleteStorySplits(currentProjectId);
      } catch (error) {
        console.error("Error deleting story splits from Firestore:", error);
      }
    }

    clearStageResult(2);
  }, [currentProjectId, clearStageResult]);

  // Storyboard Generator methods
  const startStoryboardGeneration = useCallback(async (params: GenerateStoryboardParams) => {
    if (!params.sourceText) {
      setStoryboardGenerator(prev => ({
        ...prev,
        error: "No source text provided. Please select a part from Stage 3.",
      }));
      return;
    }

    setStoryboardGenerator({
      isGenerating: true,
      error: null,
      scenes: [],
      voicePrompts: [],
    });

    try {
      const response = await fetch("/api/generate_storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      const result = { scenes: data.scenes, voicePrompts: data.voicePrompts };

      // Save to Firestore
      if (currentProjectId) {
        await saveStoryboardMeta(currentProjectId);

        // Save voice prompts
        await saveVoicePrompts(currentProjectId, data.voicePrompts);

        // Save scenes and clips
        for (let sceneIndex = 0; sceneIndex < data.scenes.length; sceneIndex++) {
          const scene = data.scenes[sceneIndex];
          await saveScene(currentProjectId, sceneIndex, { sceneTitle: scene.sceneTitle });

          for (let clipIndex = 0; clipIndex < scene.clips.length; clipIndex++) {
            const clip = scene.clips[clipIndex];
            await saveClip(currentProjectId, sceneIndex, clipIndex, {
              story: clip.story || "",
              imagePrompt: clip.imagePrompt || "",
              videoPrompt: clip.videoPrompt || "",
              soraVideoPrompt: clip.soraVideoPrompt || "",
              backgroundPrompt: clip.backgroundPrompt || "",
              backgroundId: clip.backgroundId || "",
              dialogue: clip.dialogue || "",
              dialogueEn: clip.dialogueEn || "",
              sfx: clip.sfx || "",
              sfxEn: clip.sfxEn || "",
              bgm: clip.bgm || "",
              bgmEn: clip.bgmEn || "",
              length: clip.length || "",
              accumulatedTime: clip.accumulatedTime || "",
            });
          }
        }
      }

      // Store original for reset functionality
      setOriginalStoryboard(result);

      setStoryboardGenerator({
        isGenerating: false,
        error: null,
        scenes: data.scenes,
        voicePrompts: data.voicePrompts,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setStoryboardGenerator(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
    }
  }, [currentProjectId]);

  // Split image prompts into Start/End frames for Vidu video AI
  const splitStartEndFrames = useCallback(async () => {
    if (storyboardGenerator.scenes.length === 0) {
      setStoryboardGenerator(prev => ({
        ...prev,
        error: "No storyboard data available. Please generate a storyboard first.",
      }));
      return;
    }

    setStoryboardGenerator(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
    }));

    try {
      const response = await fetch("/api/split_start_end_frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes: storyboardGenerator.scenes }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      // Update Firestore with new imagePrompt and imagePromptEnd values
      if (currentProjectId) {
        for (let sceneIndex = 0; sceneIndex < data.scenes.length; sceneIndex++) {
          const scene = data.scenes[sceneIndex];
          for (let clipIndex = 0; clipIndex < scene.clips.length; clipIndex++) {
            const clip = scene.clips[clipIndex];
            await updateClipFieldFirestore(currentProjectId, sceneIndex, clipIndex, 'imagePrompt', clip.imagePrompt || "");
            if (clip.imagePromptEnd) {
              await updateClipFieldFirestore(currentProjectId, sceneIndex, clipIndex, 'imagePromptEnd', clip.imagePromptEnd);
            }
          }
        }
      }

      setStoryboardGenerator(prev => ({
        ...prev,
        isGenerating: false,
        scenes: data.scenes,
      }));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setStoryboardGenerator(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
    }
  }, [storyboardGenerator.scenes, currentProjectId]);

  // Import storyboard from JSON file
  const importStoryboard = useCallback(async (scenes: Scene[], voicePrompts: VoicePrompt[]) => {
    if (!scenes || scenes.length === 0) {
      setStoryboardGenerator(prev => ({
        ...prev,
        error: "Invalid import data: no scenes found.",
      }));
      return;
    }

    // Clear existing storyboard first
    if (currentProjectId) {
      try {
        await clearStoryboard(currentProjectId);
      } catch (error) {
        console.error("Error clearing existing storyboard:", error);
      }
    }

    // Save imported data to Firestore
    if (currentProjectId) {
      try {
        await saveStoryboardMeta(currentProjectId);
        await saveVoicePrompts(currentProjectId, voicePrompts);

        for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
          const scene = scenes[sceneIndex];
          await saveScene(currentProjectId, sceneIndex, { sceneTitle: scene.sceneTitle });

          for (let clipIndex = 0; clipIndex < scene.clips.length; clipIndex++) {
            const clip = scene.clips[clipIndex];
            await saveClip(currentProjectId, sceneIndex, clipIndex, {
              story: clip.story || "",
              imagePrompt: clip.imagePrompt || "",
              imagePromptEnd: clip.imagePromptEnd || "",
              videoPrompt: clip.videoPrompt || "",
              soraVideoPrompt: clip.soraVideoPrompt || "",
              backgroundPrompt: clip.backgroundPrompt || "",
              backgroundId: clip.backgroundId || "",
              dialogue: clip.dialogue || "",
              dialogueEn: clip.dialogueEn || "",
              sfx: clip.sfx || "",
              sfxEn: clip.sfxEn || "",
              bgm: clip.bgm || "",
              bgmEn: clip.bgmEn || "",
              length: clip.length || "",
              accumulatedTime: clip.accumulatedTime || "",
            });
          }
        }
      } catch (error) {
        console.error("Error saving imported storyboard to Firestore:", error);
      }
    }

    // Update state
    setStoryboardGenerator({
      isGenerating: false,
      error: null,
      scenes,
      voicePrompts,
    });

    // Store as original for reset functionality
    setOriginalStoryboard({ scenes, voicePrompts });
  }, [currentProjectId]);

  const clearStoryboardGeneration = useCallback(async () => {
    setStoryboardGenerator({
      isGenerating: false,
      error: null,
      scenes: [],
      voicePrompts: [],
    });
    setOriginalStoryboard(null);

    if (currentProjectId) {
      try {
        await clearStoryboard(currentProjectId);
      } catch (error) {
        console.error("Error clearing storyboard from Firestore:", error);
      }
    }

    clearStageResult(5);
  }, [currentProjectId, clearStageResult]);

  // Update a specific clip's prompt field
  const updateClipPrompt = useCallback((
    sceneIndex: number,
    clipIndex: number,
    field: EditableClipField,
    value: string
  ) => {
    setStoryboardGenerator(prev => {
      const newScenes = [...prev.scenes];
      const scene = { ...newScenes[sceneIndex] };
      const clips = [...scene.clips];
      const clip = { ...clips[clipIndex], [field]: value };

      // Recalculate soraVideoPrompt (combination of imagePrompt, videoPrompt, dialogueEn, sfxEn, bgmEn)
      const soraParts = [
        clip.imagePrompt,
        clip.videoPrompt,
        clip.dialogueEn,
        clip.sfxEn,
        clip.bgmEn,
      ].filter((part) => part && part.trim() !== "");
      clip.soraVideoPrompt = soraParts.join("\n");

      clips[clipIndex] = clip;
      scene.clips = clips;
      newScenes[sceneIndex] = scene;

      // Persist to Firestore
      if (currentProjectId) {
        updateClipFieldFirestore(currentProjectId, sceneIndex, clipIndex, field, value)
          .catch(error => console.error("Error updating clip in Firestore:", error));

        // Also update soraVideoPrompt
        updateClipFieldFirestore(currentProjectId, sceneIndex, clipIndex, 'soraVideoPrompt', clip.soraVideoPrompt)
          .catch(error => console.error("Error updating soraVideoPrompt in Firestore:", error));
      }

      return { ...prev, scenes: newScenes };
    });
  }, [currentProjectId]);

  // Update a specific clip's imageRef (S3 URL) and sync to stageResults
  const updateClipImageRef = useCallback((
    sceneIndex: number,
    clipIndex: number,
    imageRef: string
  ) => {
    setStoryboardGenerator(prev => {
      const newScenes = [...prev.scenes];
      const scene = { ...newScenes[sceneIndex] };
      const clips = [...scene.clips];
      clips[clipIndex] = { ...clips[clipIndex], imageRef };
      scene.clips = clips;
      newScenes[sceneIndex] = scene;

      // Also update stageResults so Stage 6 can access the images immediately
      setStageResults(prevResults => ({
        ...prevResults,
        5: { scenes: newScenes, voicePrompts: prev.voicePrompts }
      }));

      return { ...prev, scenes: newScenes };
    });
  }, []);

  // Get the original AI-generated prompt value for reset functionality
  const getOriginalClipPrompt = useCallback((
    sceneIndex: number,
    clipIndex: number,
    field: EditableClipField
  ): string | null => {
    if (!originalStoryboard) return null;

    const scene = originalStoryboard.scenes?.[sceneIndex];
    const clip = scene?.clips?.[clipIndex];
    return clip?.[field] ?? null;
  }, [originalStoryboard]);

  // BgSheet Generator methods
  const startBgSheetAnalysis = useCallback(async (text: string, styleKeyword: string, backgroundBasePrompt: string): Promise<BgSheetBackground[]> => {
    if (!text) {
      setBgSheetGenerator(prev => ({
        ...prev,
        error: "No script found. Please upload a file in Stage 1 first.",
      }));
      return [];
    }

    setBgSheetGenerator({
      isAnalyzing: true,
      error: null,
      result: null,
    });

    try {
      const response = await fetch("/api/generate_bg_sheet/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      // Create backgrounds without IDs first
      const backgroundsFromApi = data.backgrounds.map((b: { name: string; description: string }) => ({
        ...b,
        images: BACKGROUND_ANGLES.map((angle) => ({
          angle,
          prompt: "",
          imageBase64: "",
          isGenerating: false,
        })),
      }));

      // Save to Firestore and get back the Firestore document IDs
      let backgroundsWithImages: BgSheetBackground[] = [];
      if (currentProjectId) {
        await saveBgSheetSettings(currentProjectId, {
          styleKeyword,
          backgroundBasePrompt,
        });

        // Save each background and capture the Firestore ID
        backgroundsWithImages = await Promise.all(
          backgroundsFromApi.map(async (bg: Omit<BgSheetBackground, 'id'>) => {
            const firestoreId = await saveBackground(currentProjectId, {
              name: bg.name,
              description: bg.description,
              angles: [],
            });
            return { ...bg, id: firestoreId };
          })
        );
      } else {
        // Fallback to client-side UUIDs if no project (shouldn't happen)
        backgroundsWithImages = backgroundsFromApi.map((bg: Omit<BgSheetBackground, 'id'>) => ({
          ...bg,
          id: crypto.randomUUID(),
        }));
      }

      const metadata: BgSheetResultMetadata = {
        backgrounds: backgroundsWithImages.map((bg) => ({
          id: bg.id,
          name: bg.name,
          description: bg.description,
          images: bg.images.map((img) => ({
            angle: img.angle,
            prompt: img.prompt,
            imageId: "",
          })),
        })),
        styleKeyword,
        backgroundBasePrompt,
      };

      setBgSheetGenerator({
        isAnalyzing: false,
        error: null,
        result: metadata,
      });

      return backgroundsWithImages;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setBgSheetGenerator(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));
      return [];
    }
  }, [currentProjectId]);

  const clearBgSheetAnalysis = useCallback(async () => {
    setBgSheetGenerator({
      isAnalyzing: false,
      error: null,
      result: null,
    });

    if (currentProjectId) {
      try {
        await clearBgSheet(currentProjectId);
      } catch (error) {
        console.error("Error clearing bg sheet from Firestore:", error);
      }
    }

    clearStageResult(4);
  }, [currentProjectId, clearStageResult]);

  const setBgSheetResult = useCallback((result: BgSheetResultMetadata) => {
    setBgSheetGenerator(prev => ({ ...prev, result }));
  }, []);

  // Character Sheet Generator methods
  const startCharacterSheetAnalysis = useCallback(async (text: string, styleKeyword: string, characterBasePrompt: string): Promise<Character[]> => {
    if (!text) {
      setCharacterSheetGenerator(prev => ({
        ...prev,
        error: "No script found. Please upload a file in Stage 1 first.",
      }));
      return [];
    }

    setCharacterSheetGenerator({
      isAnalyzing: true,
      error: null,
      result: null,
    });

    try {
      const response = await fetch("/api/generate_character_sheet/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      // Create characters without IDs first
      const charactersFromApi = data.characters.map((c: { name: string; appearance: string; clothing: string; personality: string; backgroundStory: string }) => ({
        ...c,
        imagePrompt: "",
        imageBase64: "",
        isGenerating: false,
      }));

      // Save to Firestore and get back the Firestore document IDs
      let charactersWithImages: Character[] = [];
      if (currentProjectId) {
        await saveCharacterSheetSettings(currentProjectId, {
          styleKeyword,
          characterBasePrompt,
        });

        // Save each character and capture the Firestore ID
        charactersWithImages = await Promise.all(
          charactersFromApi.map(async (char: Omit<Character, 'id'>) => {
            const firestoreId = await saveCharacter(currentProjectId, {
              name: char.name,
              appearance: char.appearance,
              clothing: char.clothing,
              personality: char.personality,
              backgroundStory: char.backgroundStory,
              imageRef: "",
              imagePrompt: "",
            });
            return { ...char, id: firestoreId };
          })
        );
      } else {
        // Fallback to client-side UUIDs if no project (shouldn't happen)
        charactersWithImages = charactersFromApi.map((c: Omit<Character, 'id'>) => ({
          ...c,
          id: crypto.randomUUID(),
        }));
      }

      const metadata: CharacterSheetResultMetadata = {
        characters: charactersWithImages.map((char) => ({
          id: char.id,
          name: char.name,
          appearance: char.appearance,
          clothing: char.clothing,
          personality: char.personality,
          backgroundStory: char.backgroundStory,
          imageId: "",
          imagePrompt: "",
        })),
        styleKeyword,
        characterBasePrompt,
      };

      setCharacterSheetGenerator({
        isAnalyzing: false,
        error: null,
        result: metadata,
      });

      return charactersWithImages;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setCharacterSheetGenerator(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
      }));
      return [];
    }
  }, [currentProjectId]);

  const clearCharacterSheetAnalysis = useCallback(async () => {
    setCharacterSheetGenerator({
      isAnalyzing: false,
      error: null,
      result: null,
    });

    if (currentProjectId) {
      try {
        await clearCharacterSheet(currentProjectId);
      } catch (error) {
        console.error("Error clearing character sheet from Firestore:", error);
      }
    }

    clearStageResult(3);
  }, [currentProjectId, clearStageResult]);

  const setCharacterSheetResult = useCallback((result: CharacterSheetResultMetadata) => {
    setCharacterSheetGenerator(prev => ({ ...prev, result }));
  }, []);

  // Navigation methods
  const goToNextStage = useCallback(() => {
    if (currentStage < TOTAL_STAGES) {
      setCurrentStage(currentStage + 1);
    }
  }, [currentStage, setCurrentStage]);

  const goToPreviousStage = useCallback(() => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  }, [currentStage, setCurrentStage]);

  // File management methods
  const addFile = (file: File) => {
    setUploadedFiles((prev) => [...prev, file]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Stage results methods
  const setStageResult = useCallback((stage: number, result: unknown) => {
    setStageResults((prev) => ({ ...prev, [stage]: result }));
  }, []);

  const getStageResult = useCallback((stage: number) => {
    return stageResults[stage];
  }, [stageResults]);

  // Reload data from Firestore
  const reloadFromFirestore = useCallback(async () => {
    await loadFromFirestore();
  }, [loadFromFirestore]);

  return (
    <MithrilContext.Provider
      value={{
        // Loading state
        isLoading,
        // Current project ID
        currentProjectId,
        // Navigation
        currentStage,
        setCurrentStage,
        goToNextStage,
        goToPreviousStage,
        // File management
        uploadedFiles,
        setUploadedFiles,
        addFile,
        removeFile,
        // Stage results
        stageResults,
        setStageResult,
        getStageResult,
        // Custom API Key
        customApiKey,
        setCustomApiKey,
        // Story Splitter
        storySplitter,
        startStorySplit,
        clearStorySplit,
        // Storyboard Generator
        storyboardGenerator,
        startStoryboardGeneration,
        splitStartEndFrames,
        importStoryboard,
        clearStoryboardGeneration,
        updateClipPrompt,
        updateClipImageRef,
        getOriginalClipPrompt,
        // BgSheet Generator
        bgSheetGenerator,
        startBgSheetAnalysis,
        clearBgSheetAnalysis,
        setBgSheetResult,
        // Character Sheet Generator
        characterSheetGenerator,
        startCharacterSheetAnalysis,
        clearCharacterSheetAnalysis,
        setCharacterSheetResult,
        // Reload
        reloadFromFirestore,
      }}
    >
      {children}
    </MithrilContext.Provider>
  );
};

export const useMithril = () => {
  const context = useContext(MithrilContext);
  if (!context) {
    throw new Error("useMithril must be used within a MithrilProvider");
  }
  return context;
};
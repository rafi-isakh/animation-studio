"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { Scene, VoicePrompt } from "./StoryboardGenerator/types";
import type { BgSheetResultMetadata } from "./BgSheetGenerator/types";
import type { CharacterSheetResultMetadata, Character } from "./CharacterSheetGenerator/types";
import { clearBgImagesOnly, clearCharacterImagesOnly, clearStoryboardSceneImagesOnly } from "./services/mithrilIndexedDB";

const TOTAL_STAGES = 7;

// Editable clip field type (shared across components)
export type EditableClipField = 'imagePrompt' | 'videoPrompt' | 'dialogue' | 'dialogueEn' | 'sfx' | 'sfxEn' | 'bgm' | 'bgmEn';

// Types for Story Analyzer
// interface StoryAnalyzerState {
//   isLoading: boolean;
//   error: string | null;
//   progressMessage: string;
//   summary: string;
// }

// Types for Story Splitter
interface SplitResult {
  parts: string[];
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

  // Story Analyzer (Stage 2)
  // storyAnalyzer: StoryAnalyzerState;
  // startStoryAnalysis: (conditions: string, analysisType: "plot" | "episode") => Promise<void>;
  // clearStoryAnalysis: () => void;

  // Story Splitter (Stage 2)
  storySplitter: StorySplitterState;
  startStorySplit: (text: string, guidelines: string, numParts: number) => Promise<void>;
  clearStorySplit: () => void;

  // Storyboard Generator (Stage 5)
  storyboardGenerator: StoryboardGeneratorState;
  startStoryboardGeneration: (params: GenerateStoryboardParams) => Promise<void>;
  clearStoryboardGeneration: () => void;
  updateClipPrompt: (sceneIndex: number, clipIndex: number, field: EditableClipField, value: string) => void;
  getOriginalClipPrompt: (sceneIndex: number, clipIndex: number, field: EditableClipField) => string | null;

  // BgSheet Generator (Stage 5)
  bgSheetGenerator: BgSheetGeneratorState;
  startBgSheetAnalysis: (text: string, styleKeyword: string, backgroundBasePrompt: string) => Promise<BgSheetBackground[]>;
  clearBgSheetAnalysis: () => void;
  setBgSheetResult: (result: BgSheetResultMetadata) => void;

  // Character Sheet Generator (Stage 4)
  characterSheetGenerator: CharacterSheetGeneratorState;
  startCharacterSheetAnalysis: (text: string, styleKeyword: string, characterBasePrompt: string) => Promise<Character[]>;
  clearCharacterSheetAnalysis: () => void;
  setCharacterSheetResult: (result: CharacterSheetResultMetadata) => void;
}

const MithrilContext = createContext<MithrilContextProps | undefined>(undefined);

export const MithrilProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation state
  const [currentStage, setCurrentStage] = useState(1);

  // Restore stage from sessionStorage after S3 load reload
  useEffect(() => {
    const savedStage = sessionStorage.getItem("mithril_restore_stage");
    if (savedStage) {
      sessionStorage.removeItem("mithril_restore_stage");
      setCurrentStage(parseInt(savedStage, 10));
    }
  }, []);

  // Custom API Key state (persisted to localStorage)
  const [customApiKey, setCustomApiKeyState] = useState<string>("");

  // Hydrate customApiKey from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("mithril_custom_api_key");
    if (savedApiKey) {
      setCustomApiKeyState(savedApiKey);
    }
  }, []);

  // Wrapper to persist API key to localStorage
  const setCustomApiKey = useCallback((key: string) => {
    setCustomApiKeyState(key);
    if (key) {
      localStorage.setItem("mithril_custom_api_key", key);
    } else {
      localStorage.removeItem("mithril_custom_api_key");
    }
  }, []);

  // File management state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Stage results state
  const [stageResults, setStageResults] = useState<Record<number, unknown>>({});

  // Story Analyzer state (Stage 2)
  // const [storyAnalyzer, setStoryAnalyzer] = useState<StoryAnalyzerState>({
  //   isLoading: false,
  //   error: null,
  //   progressMessage: "",
  //   summary: "",
  // });

  // Story Splitter state (Stage 2)
  const [storySplitter, setStorySplitter] = useState<StorySplitterState>({
    isLoading: false,
    error: null,
    result: null,
  });

  // Hydrate storySplitter from localStorage on mount
  useEffect(() => {
    const savedResult = localStorage.getItem("story_splitter_result");
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        setStorySplitter(prev => ({ ...prev, result: parsed }));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Storyboard Generator state (Stage 5)
  const [storyboardGenerator, setStoryboardGenerator] = useState<StoryboardGeneratorState>({
    isGenerating: false,
    error: null,
    scenes: [],
    voicePrompts: [],
  });

  // Hydrate storyboardGenerator from localStorage on mount
  useEffect(() => {
    const savedResult = localStorage.getItem("storyboard_result");
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        setStoryboardGenerator(prev => ({
          ...prev,
          scenes: parsed.scenes || [],
          voicePrompts: parsed.voicePrompts || [],
        }));

        // If no original exists yet, save the current as original (for reset functionality)
        const savedOriginal = localStorage.getItem("storyboard_result_original");
        if (!savedOriginal) {
          localStorage.setItem("storyboard_result_original", savedResult);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Helper to clear specific stage results
  const clearStageResult = useCallback((stage: number) => {
    setStageResults(prev => {
      const next = { ...prev };
      delete next[stage];
      return next;
    });
  }, []);

  // Story Analyzer methods
  // const startStoryAnalysis = useCallback(async (conditions: string, analysisType: "plot" | "episode") => {
  //   const fileContent = localStorage.getItem("chapter");

  //   if (!fileContent) {
  //     setStoryAnalyzer(prev => ({
  //       ...prev,
  //       error: "Please upload a text file in Stage 1 first.",
  //     }));
  //     return;
  //   }

  //   setStoryAnalyzer({
  //     isLoading: true,
  //     error: null,
  //     progressMessage: "Analyzing story...",
  //     summary: "",
  //   });

  //   try {
  //     const response = await fetch("/api/analyze_story", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         novelText: fileContent,
  //         conditions,
  //         analysisType,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.error || "Failed to analyze story");
  //     }

  //     // Save to localStorage
  //     localStorage.setItem("story_analysis", data.result);

  //     setStoryAnalyzer({
  //       isLoading: false,
  //       error: null,
  //       progressMessage: "",
  //       summary: data.result,
  //     });
  //   } catch (e) {
  //     setStoryAnalyzer(prev => ({
  //       ...prev,
  //       isLoading: false,
  //       progressMessage: "",
  //       error: e instanceof Error ? e.message : "An unknown error occurred.",
  //     }));
  //   }
  // }, []);

  // const clearStoryAnalysis = useCallback(() => {
  //   localStorage.removeItem("story_analysis");
  //   setStoryAnalyzer({
  //     isLoading: false,
  //     error: null,
  //     progressMessage: "",
  //     summary: "",
  //   });
  //   clearStageResult(2);
  // }, [clearStageResult]);

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

    localStorage.removeItem("story_splitter_result");

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

      // Save to localStorage
      localStorage.setItem("story_splitter_result", JSON.stringify(result));

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
  }, []);

  const clearStorySplit = useCallback(() => {
    localStorage.removeItem("story_splitter_result");
    setStorySplitter({
      isLoading: false,
      error: null,
      result: null,
    });
    clearStageResult(2);
  }, [clearStageResult]);

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

    localStorage.removeItem("storyboard_result");

    try {
      const response = await fetch("/api/generate_storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      const result = { scenes: data.scenes, voicePrompts: data.voicePrompts };

      // Save to localStorage (both current and original for reset functionality)
      localStorage.setItem("storyboard_result", JSON.stringify(result));
      localStorage.setItem("storyboard_result_original", JSON.stringify(result));

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
  }, []);

  const clearStoryboardGeneration = useCallback(async () => {
    localStorage.removeItem("storyboard_result");
    localStorage.removeItem("storyboard_result_original");
    localStorage.removeItem("storyboard_scene_images_metadata");
    setStoryboardGenerator({
      isGenerating: false,
      error: null,
      scenes: [],
      voicePrompts: [],
    });
    await clearStoryboardSceneImagesOnly();
    clearStageResult(5);
  }, [clearStageResult]);

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

      // Persist to localStorage
      localStorage.setItem("storyboard_result", JSON.stringify({
        scenes: newScenes,
        voicePrompts: prev.voicePrompts,
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
    const savedOriginal = localStorage.getItem("storyboard_result_original");
    if (!savedOriginal) return null;

    try {
      const parsed = JSON.parse(savedOriginal);
      const scene = parsed.scenes?.[sceneIndex];
      const clip = scene?.clips?.[clipIndex];
      return clip?.[field] ?? null;
    } catch {
      return null;
    }
  }, []);

  // BgSheet Generator state (Stage 4)
  const [bgSheetGenerator, setBgSheetGenerator] = useState<BgSheetGeneratorState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  // Hydrate bgSheetGenerator from localStorage on mount
  useEffect(() => {
    const savedResult = localStorage.getItem("bg_sheet_result");
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        setBgSheetGenerator(prev => ({ ...prev, result: parsed }));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

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

      const backgroundsWithImages: BgSheetBackground[] = data.backgrounds.map((b: { name: string; description: string }) => ({
        ...b,
        id: crypto.randomUUID(),
        images: BACKGROUND_ANGLES.map((angle) => ({
          angle,
          prompt: "",
          imageBase64: "",
          isGenerating: false,
        })),
      }));

      // Auto-save to localStorage
      const metadata = {
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
      localStorage.setItem("bg_sheet_result", JSON.stringify(metadata));

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
  }, []);

  const clearBgSheetAnalysis = useCallback(async () => {
    setBgSheetGenerator({
      isAnalyzing: false,
      error: null,
      result: null,
    });
    localStorage.removeItem("bg_sheet_result");
    await clearBgImagesOnly();
    clearStageResult(4);
  }, [clearStageResult]);

  const setBgSheetResult = useCallback((result: BgSheetResultMetadata) => {
    setBgSheetGenerator(prev => ({ ...prev, result }));
  }, []);

  // Character Sheet Generator state (Stage 4)
  const [characterSheetGenerator, setCharacterSheetGenerator] = useState<CharacterSheetGeneratorState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  // Hydrate characterSheetGenerator from localStorage on mount
  useEffect(() => {
    const savedResult = localStorage.getItem("character_sheet_result");
    if (savedResult) {
      try {
        const parsed = JSON.parse(savedResult);
        setCharacterSheetGenerator(prev => ({ ...prev, result: parsed }));
      } catch {
        // Ignore parse errors
      }
    }
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

      const charactersWithImages: Character[] = data.characters.map((c: { name: string; appearance: string; clothing: string; personality: string; backgroundStory: string }) => ({
        ...c,
        id: crypto.randomUUID(),
        imagePrompt: "",
        imageBase64: "",
        isGenerating: false,
      }));

      // Auto-save to localStorage
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
      localStorage.setItem("character_sheet_result", JSON.stringify(metadata));

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
  }, []);

  const clearCharacterSheetAnalysis = useCallback(async () => {
    setCharacterSheetGenerator({
      isAnalyzing: false,
      error: null,
      result: null,
    });
    localStorage.removeItem("character_sheet_result");
    await clearCharacterImagesOnly();
    clearStageResult(3);
  }, [clearStageResult]);

  const setCharacterSheetResult = useCallback((result: CharacterSheetResultMetadata) => {
    setCharacterSheetGenerator(prev => ({ ...prev, result }));
  }, []);

  // Navigation methods
  const goToNextStage = () => {
    if (currentStage < TOTAL_STAGES) {
      setCurrentStage(currentStage + 1);
    }
  };

  const goToPreviousStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

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

  return (
    <MithrilContext.Provider
      value={{
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
        // Story Analyzer
        // storyAnalyzer,
        // startStoryAnalysis,
        // clearStoryAnalysis,
        // Story Splitter
        storySplitter,
        startStorySplit,
        clearStorySplit,
        // Storyboard Generator
        storyboardGenerator,
        startStoryboardGeneration,
        clearStoryboardGeneration,
        updateClipPrompt,
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

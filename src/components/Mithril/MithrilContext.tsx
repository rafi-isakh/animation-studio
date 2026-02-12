"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Scene, VoicePrompt, CharacterIdSummary } from "./StoryboardGenerator/types";
import type { BgSheetResultMetadata } from "./BgSheetGenerator/types";
import type { CharacterSheetResultMetadata, Character } from "./CharacterSheetGenerator/types";
import type { PropDesignerResultMetadata, Prop, DetectedId, PropDesignerSettings } from "./PropDesigner/types";
import { useProject } from "@/contexts/ProjectContext";
import { ProjectType, getTotalStages, isValidStage, getDefaultProjectType, getPipelineStages, isPipelineStage, getStageConfig } from "./config/projectTypes";

// Story Splitter orchestrator
import {
  subscribeToProjectStorySplitterJobs,
  mapStorySplitterJobToUpdate,
  JobQueueDocument,
  StorySplitterJobUpdate,
  // Storyboard orchestrator
  subscribeToProjectStoryboardJobs,
  mapStoryboardJobToUpdate,
  StoryboardJobUpdate,
} from "./services/firestore/jobQueue";

// Firestore services
import {
  getMetadata,
  updateCurrentStage as updateCurrentStageFirestore,
  updateCustomApiKey as updateCustomApiKeyFirestore,
  updateVideoApiKey as updateVideoApiKeyFirestore,
  getChapter,
  getStorySplits,
  saveStorySplits,
  deleteStorySplits,
  updateStorySplitsJobId,
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
  // ImageGen (Stage 7)
  getImageGenMeta,
  getImageGenFrames,
  // PropDesigner (Stage 5)
  getPropDesignerSettings,
  getProps,
  getDetectedIds,
  savePropDesignerSettings,
  saveProp,
  saveDetectedIds,
  clearPropDesigner,
  // Image-to-Video: Stage 1 - ImageSplitter
  getImageSplitterMeta,
  getMangaPages,
  getMangaPanels,
} from "./services/firestore";
import type { UploadType } from "./services/firestore/types";

const TOTAL_STAGES = 8;

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
  characterIdSummary?: CharacterIdSummary[];
  genre?: string;
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

// Types for Prop Designer Generator (Stage 5)
interface PropDesignerGeneratorState {
  isAnalyzing: boolean;
  error: string | null;
  result: PropDesignerResultMetadata | null;
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
  // New configuration parameters (from reference)
  targetTime?: string;
  customInstruction?: string;
  backgroundInstruction?: string;
  negativeInstruction?: string;
  videoInstruction?: string;
}

// Types for shared state
interface MithrilContextProps {
  // Loading state
  isLoading: boolean;

  // Current project ID
  currentProjectId: string | null;

  // Project type
  projectType: ProjectType;
  totalStages: number;

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

  // Video API Key for video generation (separate from image gen)
  videoApiKey: string;
  setVideoApiKey: (key: string) => void;

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

  // Prop Designer Generator (Stage 5)
  propDesignerGenerator: PropDesignerGeneratorState;
  setPropDesignerResult: (result: PropDesignerResultMetadata) => void;
  clearPropDesignerData: () => void;

  // Upload Type (novel vs chapter)
  uploadType: UploadType;
  setUploadType: (type: UploadType) => void;
  isStageSkipped: (stage: number) => boolean;

  // Reload data from Firestore
  reloadFromFirestore: () => Promise<void>;
}

const MithrilContext = createContext<MithrilContextProps | undefined>(undefined);

export const MithrilProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentProject, currentProjectId } = useProject();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Project type state (loaded from project metadata)
  const [projectType, setProjectType] = useState<ProjectType>(getDefaultProjectType());

  // Calculate total stages based on project type
  const totalStages = useMemo(() => getTotalStages(projectType), [projectType]);

  // Helper: normalize a tool-only stage to a pipeline stage (e.g., stage 3 → stage 5)
  // Declared early because it's used by useEffects below.
  const normalizeStageForPipeline = useCallback((stage: number): number => {
    const stageConfig = getStageConfig(projectType, stage);
    // If stage exists but is tool-only, redirect to stage 5 (PropDesigner)
    if (stageConfig && !isPipelineStage(stageConfig)) {
      return 5;
    }
    return stage;
  }, [projectType]);

  // Navigation state
  const [currentStage, setCurrentStageState] = useState(1);

  // Track if we've initialized from URL to avoid overwriting with Firestore value
  const initializedFromUrl = useRef(false);

  // Track if we're programmatically changing the URL (to avoid infinite loops)
  const isUpdatingUrl = useRef(false);

  // Sync project type from currentProject
  useEffect(() => {
    if (currentProject?.projectType) {
      setProjectType(currentProject.projectType);
    }
  }, [currentProject?.projectType]);

  // Initialize stage from URL on mount
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam) {
      const stage = parseInt(stageParam, 10);
      if (!isNaN(stage) && isValidStage(projectType, stage)) {
        initializedFromUrl.current = true;
        // Normalize tool-only stages to a pipeline stage (e.g., stage 3 → 5)
        const normalized = normalizeStageForPipeline(stage);
        setCurrentStageState(normalized);
      }
    }
  }, [projectType, normalizeStageForPipeline]); // Re-run when projectType changes

  // Sync stage when URL changes (browser back/forward)
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    if (stageParam && !isUpdatingUrl.current) {
      const stage = parseInt(stageParam, 10);
      if (!isNaN(stage) && isValidStage(projectType, stage)) {
        // Normalize tool-only stages to a pipeline stage
        const normalized = normalizeStageForPipeline(stage);
        if (normalized !== currentStage) {
          setCurrentStageState(normalized);
          // Also update Firestore
          if (currentProjectId) {
            updateCurrentStageFirestore(currentProjectId, normalized).catch(error => {
              console.error("Error updating current stage in Firestore:", error);
            });
          }
        }
      }
    }
  }, [searchParams, currentProjectId, projectType, normalizeStageForPipeline]); // Note: currentStage intentionally omitted to avoid loops

  // Custom API Key state
  const [customApiKey, setCustomApiKeyState] = useState<string>("");

  // Video API Key state (separate from image gen)
  const [videoApiKey, setVideoApiKeyState] = useState<string>("");

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
  const [storySplitterJobId, setStorySplitterJobId] = useState<string | null>(null);
  const storySplitterJobIdRef = useRef<string | null>(null);

  // Storyboard Generator state (Stage 5)
  const [storyboardGenerator, setStoryboardGenerator] = useState<StoryboardGeneratorState>({
    isGenerating: false,
    error: null,
    scenes: [],
    voicePrompts: [],
    characterIdSummary: [],
    genre: undefined,
  });
  const [storyboardJobId, setStoryboardJobId] = useState<string | null>(null);
  const storyboardJobIdRef = useRef<string | null>(null);
  const storyboardInitialSnapshotRef = useRef(true);
  const storyboardProcessedJobIdsRef = useRef<Set<string>>(new Set());

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

  // Prop Designer Generator state (Stage 5)
  const [propDesignerGenerator, setPropDesignerGenerator] = useState<PropDesignerGeneratorState>({
    isAnalyzing: false,
    error: null,
    result: null,
  });

  // Upload Type state (novel vs chapter - determines if Stage 2 is skipped)
  const [uploadType, setUploadTypeState] = useState<UploadType>('novel');

  // Setter for upload type (used by UploadManager when file is processed)
  const setUploadType = useCallback((type: UploadType) => {
    setUploadTypeState(type);
  }, []);

  // Check if a stage should be skipped based on upload type
  const isStageSkipped = useCallback((stage: number): boolean => {
    // Stage 2 (Story Splitter) is skipped when upload type is 'chapter'
    return stage === 2 && uploadType === 'chapter';
  }, [uploadType]);

  // Compute ordered list of pipeline stage IDs (excluding tool-only), respecting skipped stages
  const pipelineStageIds = useMemo(() => {
    return getPipelineStages(projectType)
      .map(s => s.id)
      .filter(id => !isStageSkipped(id));
  }, [projectType, isStageSkipped]);

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
        // Only set stage from Firestore if URL didn't specify one
        if (!initializedFromUrl.current) {
          // Normalize tool-only stages (e.g., stage 3 → 5)
          const normalized = normalizeStageForPipeline(metadata.currentStage || 1);
          setCurrentStageState(normalized);
        }
        setCustomApiKeyState(metadata.customApiKey || "");
        setVideoApiKeyState(metadata.videoApiKey || "");
      }

      // Load chapter data (including uploadType)
      const chapterData = await getChapter(currentProjectId);
      if (chapterData) {
        // Load uploadType from chapter document (defaults to 'novel' for backward compatibility)
        setUploadTypeState(chapterData.uploadType || 'novel');
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
      } else if (storySplitsData?.jobId) {
        // No results yet but there's an active job - restore tracking state
        console.log("[MithrilContext] Restoring story splitter job tracking:", storySplitsData.jobId);
        storySplitterJobIdRef.current = storySplitsData.jobId;
        setStorySplitterJobId(storySplitsData.jobId);
        setStorySplitter(prev => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        // Manually fetch job status to handle the race condition where
        // the Firestore subscription fired before we restored the jobId
        try {
          const response = await fetch(`/api/story-splitter/orchestrator/status?jobId=${storySplitsData.jobId}`);
          const jobStatus = await response.json();
          console.log("[MithrilContext] Fetched story splitter job status on mount:", jobStatus);

          if (jobStatus.status === "completed" && jobStatus.parts) {
            // Job completed while we were away - update state with results
            storySplitterJobIdRef.current = null;
            setStorySplitterJobId(null);
            setStorySplitter({
              isLoading: false,
              error: null,
              result: { parts: jobStatus.parts },
            });
            setStageResults(prev => ({ ...prev, 2: { parts: jobStatus.parts } }));
          } else if (jobStatus.status === "failed") {
            // Job failed while we were away
            storySplitterJobIdRef.current = null;
            setStorySplitterJobId(null);
            setStorySplitter(prev => ({
              ...prev,
              isLoading: false,
              error: jobStatus.error || "Story splitting failed",
            }));
          }
          // If status is pending/generating, keep loading state - subscription will handle updates
        } catch (statusErr) {
          console.error("[MithrilContext] Error fetching story splitter job status:", statusErr);
          // Job might not exist anymore - clear loading state
          storySplitterJobIdRef.current = null;
          setStorySplitterJobId(null);
          setStorySplitter(prev => ({
            ...prev,
            isLoading: false,
            error: null,
          }));
        }
      }

      // Load character sheet data
      const charSettings = await getCharacterSheetSettings(currentProjectId);
      const characters = await getCharacters(currentProjectId);
      if (charSettings || characters.length > 0) {
        const metadata: CharacterSheetResultMetadata = {
          styleKeyword: charSettings?.styleKeyword || "",
          characterBasePrompt: charSettings?.characterBasePrompt || "",
          genre: charSettings?.genre || "fantasy",
          styleSlots: charSettings?.styleSlots?.map(slot => ({
            id: slot.id,
            name: slot.name,
            imageBase64: "",
            imageUrl: slot.imageRef,
          })) || [],
          activeStyleIndex: charSettings?.activeStyleIndex ?? null,
          characters: characters.map(char => ({
            id: char.id,
            name: char.name,
            role: char.role || "unknown",
            isProtagonist: char.isProtagonist || false,
            age: char.age || "",
            gender: char.gender || "",
            traits: char.traits || "",
            appearance: char.appearance,
            clothing: char.clothing,
            personality: char.personality,
            backgroundStory: char.backgroundStory,
            profileImageId: char.profileImageRef || "",
            profileImagePrompt: char.profileImagePrompt || "",
            masterSheetImageId: char.masterSheetImageRef || char.imageRef || "",
            masterSheetImagePrompt: char.masterSheetImagePrompt || char.imagePrompt || "",
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
        setStageResults(prev => ({ ...prev, 6: metadata }));
      }

      // Load storyboard data
      console.log("[MithrilContext:loadFromFirestore] Loading storyboard data for project:", currentProjectId);
      const storyboardMeta = await getStoryboardMeta(currentProjectId);
      console.log("[MithrilContext:loadFromFirestore] Storyboard meta:", {
        hasMeta: !!storyboardMeta,
        jobId: storyboardMeta?.jobId,
        generatedAt: storyboardMeta?.generatedAt,
      });

      if (storyboardMeta) {
        const scenes = await getScenes(currentProjectId);
        const voicePrompts = await getVoicePrompts(currentProjectId);
        console.log("[MithrilContext:loadFromFirestore] Loaded scenes and voicePrompts:", {
          sceneCount: scenes.length,
          voicePromptCount: voicePrompts.length,
        });

        // Check if there are existing results or an active job
        if (scenes.length > 0) {
          console.log("[MithrilContext:loadFromFirestore] Has existing scenes - loading clips...");
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
                  characterInfo: clip.characterInfo,
                dialogue: clip.dialogue,
                  dialogueEn: clip.dialogueEn,
                  narration: clip.narration || "",
                  narrationEn: clip.narrationEn || "",
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
          setStageResults(prev => ({ ...prev, 4: storyboardData }));

          // Store original for reset functionality
          setOriginalStoryboard(storyboardData);
          console.log("[MithrilContext:loadFromFirestore] Scenes loaded successfully:", {
            totalScenes: scenesWithClips.length,
            totalClips: scenesWithClips.reduce((acc, s) => acc + s.clips.length, 0),
          });
        } else if (storyboardMeta.jobId) {
          // No results yet but there's an active job - restore tracking state
          console.log("[MithrilContext:loadFromFirestore] No scenes but has jobId - restoring job tracking:", storyboardMeta.jobId);
          console.log("[MithrilContext:loadFromFirestore] Setting storyboardJobIdRef and state...");
          storyboardJobIdRef.current = storyboardMeta.jobId;
          setStoryboardJobId(storyboardMeta.jobId);
          console.log("[MithrilContext:loadFromFirestore] storyboardJobIdRef.current is now:", storyboardJobIdRef.current);

          setStoryboardGenerator(prev => ({
            ...prev,
            isGenerating: true,
            error: null,
          }));

          // Manually fetch job status to handle the race condition where
          // the Firestore subscription fired before we restored the jobId
          console.log("[MithrilContext:loadFromFirestore] Fetching job status from API...");
          try {
            const response = await fetch(`/api/storyboard/orchestrator/status?jobId=${storyboardMeta.jobId}`);
            const jobStatus = await response.json();
            console.log("[MithrilContext:loadFromFirestore] API job status response:", {
              status: jobStatus.status,
              hasScenes: !!jobStatus.scenes,
              sceneCount: jobStatus.scenes?.length,
              error: jobStatus.error,
            });

            if (jobStatus.status === "completed" && jobStatus.scenes) {
              console.log("[MithrilContext:loadFromFirestore] Job was completed - applying results");
              // Job completed while we were away - update state with results
              storyboardJobIdRef.current = null;
              setStoryboardJobId(null);

              // Normalize scenes to ensure optional fields have default values
              const normalizedScenes: Scene[] = jobStatus.scenes.map((scene: { sceneTitle: string; clips: Array<{ story: string; imagePrompt: string; imagePromptEnd?: string; videoPrompt: string; soraVideoPrompt: string; backgroundPrompt: string; backgroundId: string; dialogue: string; dialogueEn: string; narration?: string; narrationEn?: string; sfx: string; sfxEn: string; bgm: string; bgmEn: string; length: string; accumulatedTime: string; }> }) => ({
                sceneTitle: scene.sceneTitle,
                clips: scene.clips.map(clip => ({
                  story: clip.story,
                  imagePrompt: clip.imagePrompt,
                  imagePromptEnd: clip.imagePromptEnd,
                  videoPrompt: clip.videoPrompt,
                  soraVideoPrompt: clip.soraVideoPrompt,
                  backgroundPrompt: clip.backgroundPrompt,
                  backgroundId: clip.backgroundId,
                  dialogue: clip.dialogue,
                  dialogueEn: clip.dialogueEn,
                  narration: clip.narration || "",
                  narrationEn: clip.narrationEn || "",
                  sfx: clip.sfx,
                  sfxEn: clip.sfxEn,
                  bgm: clip.bgm,
                  bgmEn: clip.bgmEn,
                  length: clip.length,
                  accumulatedTime: clip.accumulatedTime,
                })),
              }));

              const normalizedVoicePrompts: VoicePrompt[] = (jobStatus.voicePrompts || []).map((vp: { promptKo: string; promptEn: string }) => ({
                promptKo: vp.promptKo,
                promptEn: vp.promptEn,
              }));

              const result = { scenes: normalizedScenes, voicePrompts: normalizedVoicePrompts };
              setOriginalStoryboard(result);

              setStoryboardGenerator({
                isGenerating: false,
                error: null,
                scenes: normalizedScenes,
                voicePrompts: normalizedVoicePrompts,
              });
              setStageResults(prev => ({ ...prev, 4: result }));
            } else if (jobStatus.status === "failed") {
              // Job failed while we were away
              storyboardJobIdRef.current = null;
              setStoryboardJobId(null);
              setStoryboardGenerator(prev => ({
                ...prev,
                isGenerating: false,
                error: jobStatus.error || "Storyboard generation failed",
              }));
            }
            // If status is pending/generating, keep loading state - subscription will handle updates
          } catch (statusErr) {
            console.error("[MithrilContext] Error fetching storyboard job status:", statusErr);
            // Job might not exist anymore - clear loading state
            storyboardJobIdRef.current = null;
            setStoryboardJobId(null);
            setStoryboardGenerator(prev => ({
              ...prev,
              isGenerating: false,
              error: null,
            }));
          }
        }
      }

      // Load PropDesigner data (Stage 5)
      const propSettings = await getPropDesignerSettings(currentProjectId);
      const props = await getProps(currentProjectId);
      const detectedIds = await getDetectedIds(currentProjectId);
      if (propSettings || props.length > 0) {
        const propMetadata: PropDesignerResultMetadata = {
          settings: {
            styleKeyword: propSettings?.styleKeyword || "",
            propBasePrompt: propSettings?.propBasePrompt || "",
            genre: propSettings?.genre || "Modern",
          },
          props: props.map(prop => ({
            id: prop.id,
            name: prop.name,
            category: prop.category,
            description: prop.description,
            descriptionKo: prop.descriptionKo,
            appearingClips: prop.appearingClips,
            designSheetPrompt: prop.designSheetPrompt,
            designSheetImageRef: prop.designSheetImageRef,
            referenceImageRef: prop.referenceImageRef,
          })),
          detectedIds: detectedIds.map(d => ({
            id: d.id,
            category: d.category,
            clipIds: d.clipIds,
            contexts: d.contexts,
            occurrences: d.occurrences,
          })),
        };
        setPropDesignerGenerator(prev => ({ ...prev, result: propMetadata }));
      }

      // Load ImageGen data (Stage 7)
      const imageGenMeta = await getImageGenMeta(currentProjectId);
      const imageGenFrames = await getImageGenFrames(currentProjectId);
      // Load if meta exists OR frames exist (frames can be saved without meta)
      if (imageGenMeta || imageGenFrames.length > 0) {
        const imageGenData = {
          settings: {
            stylePrompt: imageGenMeta?.stylePrompt || "",
            aspectRatio: imageGenMeta?.aspectRatio || "16:9",
          },
          frames: imageGenFrames.map(frame => ({
            id: frame.id,
            sceneIndex: frame.sceneIndex,
            clipIndex: frame.clipIndex,
            frameLabel: frame.frameLabel,
            frameNumber: frame.frameNumber,
            shotGroup: frame.shotGroup,
            prompt: frame.prompt,
            backgroundId: frame.backgroundId,
            refFrame: frame.refFrame,
            imageRef: frame.imageRef,
            status: frame.status,
            remixPrompt: frame.remixPrompt,
            remixImageRef: frame.remixImageRef,
            editedImageRef: frame.editedImageRef,
          })),
          createdAt: imageGenMeta?.generatedAt?.toMillis() || Date.now(),
        };
        setStageResults(prev => ({ ...prev, 7: imageGenData }));
      }

      // Load ImageSplitter data (Image-to-Video Stage 1)
      // This is separate from the Text-to-Video pipeline stages
      const imageSplitterMeta = await getImageSplitterMeta(currentProjectId);
      if (imageSplitterMeta) {
        const firestorePages = await getMangaPages(currentProjectId);
        const loadedPages = [];

        for (const page of firestorePages) {
          const firestorePanels = await getMangaPanels(currentProjectId, page.pageIndex);
          const panels = firestorePanels.map((p) => ({
            id: p.id,
            box_2d: p.box_2d,
            label: p.label,
            imageUrl: p.imageRef || '', // S3 URL
          }));

          loadedPages.push({
            id: page.originalPageId || page.id,
            pageIndex: page.pageIndex,
            previewUrl: page.imageRef,
            fileName: page.fileName,
            panels,
            status: page.status,
            readingDirection: page.readingDirection,
          });
        }

        if (loadedPages.length > 0) {
          // Set stage result for completed pages (for ImageToScriptWriter to consume)
          const completedPages = loadedPages.filter((p) => p.status === 'completed');
          setStageResults(prev => ({ ...prev, 1: { pages: completedPages } }));
        }
      }
    } catch (error) {
      console.error("Error loading data from Firestore:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentProjectId, normalizeStageForPipeline]);

  // Load data when projectId changes
  useEffect(() => {
    loadFromFirestore();
  }, [loadFromFirestore]);

  // Wrapper for setCurrentStage that also updates Firestore and URL
  const setCurrentStage = useCallback(async (stage: number) => {
    setCurrentStageState(stage);

    // Update URL with new stage (using router.push for browser history)
    const projectId = searchParams.get('project');
    if (projectId) {
      isUpdatingUrl.current = true;
      router.push(`/mithril?project=${projectId}&stage=${stage}`, { scroll: false });
      // Reset flag after a short delay to allow the URL update to complete
      setTimeout(() => {
        isUpdatingUrl.current = false;
      }, 100);
    }

    if (currentProjectId) {
      try {
        await updateCurrentStageFirestore(currentProjectId, stage);
      } catch (error) {
        console.error("Error updating current stage in Firestore:", error);
      }
    }
  }, [currentProjectId, router, searchParams]);

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

  // Wrapper for setVideoApiKey that also updates Firestore
  const setVideoApiKey = useCallback(async (key: string) => {
    setVideoApiKeyState(key);
    if (currentProjectId) {
      try {
        await updateVideoApiKeyFirestore(currentProjectId, key);
      } catch (error) {
        console.error("Error updating video API key in Firestore:", error);
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

  // Story Splitter job subscription
  useEffect(() => {
    if (!currentProjectId) return;

    const unsubscribe = subscribeToProjectStorySplitterJobs(currentProjectId, (jobs: JobQueueDocument[]) => {
      jobs.forEach((job) => {
        const update = mapStorySplitterJobToUpdate(job);
        const currentJobId = storySplitterJobIdRef.current;

        // Only process updates for the current job
        if (!currentJobId || update.jobId !== currentJobId) {
          return;
        }

        console.log("[MithrilContext] Story splitter job update:", update);

        if (update.status === "completed" && update.parts) {
          // Job completed - update state with results
          storySplitterJobIdRef.current = null;
          setStorySplitterJobId(null);
          setStorySplitter({
            isLoading: false,
            error: null,
            result: { parts: update.parts },
          });
        } else if (update.status === "failed") {
          // Job failed
          storySplitterJobIdRef.current = null;
          setStorySplitterJobId(null);
          setStorySplitter(prev => ({
            ...prev,
            isLoading: false,
            error: update.error || "Story splitting failed",
          }));
        } else if (update.status === "generating") {
          // Job is processing
          setStorySplitter(prev => ({
            ...prev,
            isLoading: true,
            error: null,
          }));
        }
      });
    });

    return () => unsubscribe();
  }, [currentProjectId]);

  // Storyboard job subscription
  useEffect(() => {
    if (!currentProjectId) return;

    // Reset initial snapshot tracking on project change
    storyboardInitialSnapshotRef.current = true;
    storyboardProcessedJobIdsRef.current = new Set();

    console.log("[MithrilContext:StoryboardSubscription] Setting up subscription for project:", currentProjectId);

    const processStoryboardUpdate = (update: ReturnType<typeof mapStoryboardJobToUpdate>, isInitialSnapshot: boolean = false) => {
      // Skip already-processed jobs
      if (storyboardProcessedJobIdsRef.current.has(update.jobId)) return;

      if (update.status === "completed" && update.scenes) {
        console.log("[MithrilContext:StoryboardSubscription] JOB COMPLETED - processing results:", {
          sceneCount: update.scenes.length,
          voicePromptCount: update.voicePrompts?.length || 0,
        });

        storyboardProcessedJobIdsRef.current.add(update.jobId);

        // Job completed - update state with results
        storyboardJobIdRef.current = null;
        setStoryboardJobId(null);

        // Normalize scenes to ensure optional fields have default values
        const normalizedScenes: Scene[] = update.scenes.map(scene => ({
          sceneTitle: scene.sceneTitle,
          clips: scene.clips.map(clip => ({
            story: clip.story,
            imagePrompt: clip.imagePrompt,
            imagePromptEnd: clip.imagePromptEnd,
            videoPrompt: clip.videoPrompt,
            soraVideoPrompt: clip.soraVideoPrompt,
            backgroundPrompt: clip.backgroundPrompt,
            backgroundId: clip.backgroundId,
            dialogue: clip.dialogue,
            dialogueEn: clip.dialogueEn,
            narration: clip.narration || "",
            narrationEn: clip.narrationEn || "",
            sfx: clip.sfx,
            sfxEn: clip.sfxEn,
            bgm: clip.bgm,
            bgmEn: clip.bgmEn,
            length: clip.length,
            accumulatedTime: clip.accumulatedTime,
          })),
        }));

        const normalizedVoicePrompts: VoicePrompt[] = (update.voicePrompts || []).map(vp => ({
          promptKo: vp.promptKo,
          promptEn: vp.promptEn,
        }));

        const result = { scenes: normalizedScenes, voicePrompts: normalizedVoicePrompts };

        // Store original for reset functionality
        setOriginalStoryboard(result);

        setStoryboardGenerator({
          isGenerating: false,
          error: null,
          scenes: normalizedScenes,
          voicePrompts: normalizedVoicePrompts,
        });

        // Save to Firestore only for NEW completions, not initial snapshot replays.
        // On page refresh, the initial snapshot replays already-completed jobs. If we
        // re-save here, clearStoryboard() races against loadFromFirestore and
        // ImageGenerator's direct Firestore reads, causing them to find 0 scenes.
        if (!isInitialSnapshot) {
          (async () => {
            try {
              console.log("[MithrilContext:StoryboardSave] Starting save — projectId=", currentProjectId, "sceneCount=", update.scenes!.length);
              await clearStoryboard(currentProjectId);
              await saveStoryboardMeta(currentProjectId);
              await saveVoicePrompts(currentProjectId, update.voicePrompts || []);

              for (let sceneIndex = 0; sceneIndex < update.scenes!.length; sceneIndex++) {
                const scene = update.scenes![sceneIndex];
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
                    narration: clip.narration || "",
                    narrationEn: clip.narrationEn || "",
                    sfx: clip.sfx || "",
                    sfxEn: clip.sfxEn || "",
                    bgm: clip.bgm || "",
                    bgmEn: clip.bgmEn || "",
                    length: clip.length || "",
                    accumulatedTime: clip.accumulatedTime || "",
                  });
                }
              }
              console.log("[MithrilContext:StoryboardSave] COMPLETE — sceneCount=", update.scenes!.length);
            } catch (saveErr) {
              console.error("[MithrilContext:StoryboardSave] ERROR saving storyboard:", saveErr);
            }
          })();
        } else {
          console.log("[MithrilContext:StoryboardSubscription] Skipping Firestore save for initial snapshot replay — data already persisted");
        }
      } else if (update.status === "failed") {
        storyboardProcessedJobIdsRef.current.add(update.jobId);
        storyboardJobIdRef.current = null;
        setStoryboardJobId(null);
        setStoryboardGenerator(prev => ({
          ...prev,
          isGenerating: false,
          error: update.error || "Storyboard generation failed",
        }));
      } else if (update.status === "generating") {
        // Job is processing - only update if this is our tracked job
        const currentJobId = storyboardJobIdRef.current;
        if (currentJobId && update.jobId === currentJobId) {
          setStoryboardGenerator(prev => ({
            ...prev,
            isGenerating: true,
            error: null,
          }));
        }
      }
    };

    const unsubscribe = subscribeToProjectStoryboardJobs(currentProjectId, (jobs: JobQueueDocument[]) => {
      const currentJobId = storyboardJobIdRef.current;
      const isInitial = storyboardInitialSnapshotRef.current;
      storyboardInitialSnapshotRef.current = false;

      console.log("[MithrilContext:StoryboardSubscription] Received jobs update:", {
        jobCount: jobs.length,
        currentTrackedJobId: currentJobId,
        isInitialSnapshot: isInitial,
      });

      if (isInitial && !currentJobId) {
        // Initial snapshot fired before loadFromFirestore restored the jobId.
        // Re-track any in-flight jobs and queue completed ones.
        jobs.forEach((job) => {
          const update = mapStoryboardJobToUpdate(job);
          const isInFlight = update.status === "generating" || update.status === "pending";
          const isTerminal = update.status === "completed" || update.status === "failed";

          if (isInFlight) {
            // Re-track the in-flight job
            console.log("[MithrilContext:StoryboardSubscription] Initial snapshot - re-tracking in-flight job:", update.jobId);
            storyboardJobIdRef.current = update.jobId;
            setStoryboardJobId(update.jobId);
            setStoryboardGenerator(prev => ({
              ...prev,
              isGenerating: true,
              error: null,
            }));
          } else if (isTerminal) {
            // Queue terminal job for processing — loadFromFirestore will handle it
            // via the status API, but process it here too as a fallback
            console.log("[MithrilContext:StoryboardSubscription] Initial snapshot - processing terminal job:", update.jobId, update.status);
            processStoryboardUpdate(update, true);
          }
        });
        return;
      }

      jobs.forEach((job) => {
        const update = mapStoryboardJobToUpdate(job);

        // Only process updates for the current tracked job
        if (!currentJobId || update.jobId !== currentJobId) {
          return;
        }

        processStoryboardUpdate(update);
      });
    });

    return () => {
      console.log("[MithrilContext:StoryboardSubscription] Cleaning up subscription for project:", currentProjectId);
      unsubscribe();
    };
  }, [currentProjectId]);

  // Story Splitter methods
  const startStorySplit = useCallback(async (text: string, guidelines: string, numParts: number) => {
    if (!text) {
      setStorySplitter(prev => ({
        ...prev,
        error: "No script found. Please upload a file in Stage 1 first.",
      }));
      return;
    }

    if (!currentProjectId) {
      setStorySplitter(prev => ({
        ...prev,
        error: "No project selected.",
      }));
      return;
    }

    setStorySplitter({
      isLoading: true,
      error: null,
      result: null,
    });

    try {
      // Submit job to orchestrator
      // Special case: if numParts is 1, don't call API - just create a single part
      if (numParts === 1) {
        const singlePart = {
          text,
          cliffhangers: [], // No cliffhangers for single part
        };

        const result = { parts: [singlePart] };

        // Save to Firestore
        if (currentProjectId) {
          await saveStorySplits(currentProjectId, {
            guidelines,
            parts: [singlePart],
          });
        }

        setStorySplitter({
          isLoading: false,
          error: null,
          result,
        });
        return;
      }

      const response = await fetch("/api/story-splitter/orchestrator/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: currentProjectId,
          text,
          guidelines,
          numParts,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit story splitter job");
      }

      // Store job ID for tracking (both ref and state)
      storySplitterJobIdRef.current = data.jobId || null;
      setStorySplitterJobId(data.jobId || null);
      console.log("[MithrilContext] Story splitter job submitted:", data.jobId);

      // Save jobId to Firestore so it persists across page navigations
      if (data.jobId) {
        await updateStorySplitsJobId(currentProjectId, data.jobId);
      }

      // Job is now running in background - UI will update via Firestore subscription
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      setStorySplitter(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [currentProjectId, customApiKey]);

  const clearStorySplit = useCallback(async () => {
    // Clear job tracking
    storySplitterJobIdRef.current = null;
    setStorySplitterJobId(null);

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
    console.log("[MithrilContext:startStoryboardGeneration] Starting with params:", {
      sourceTextLength: params.sourceText?.length,
      targetTime: params.targetTime,
      hasCustomInstruction: !!params.customInstruction,
      projectId: currentProjectId,
    });

    if (!params.sourceText) {
      console.log("[MithrilContext:startStoryboardGeneration] ERROR: No source text");
      setStoryboardGenerator(prev => ({
        ...prev,
        error: "No source text provided. Please select a part from Stage 2.",
      }));
      return;
    }

    if (!currentProjectId) {
      console.log("[MithrilContext:startStoryboardGeneration] ERROR: No project ID");
      setStoryboardGenerator(prev => ({
        ...prev,
        error: "No project selected.",
      }));
      return;
    }

    console.log("[MithrilContext:startStoryboardGeneration] Setting initial generating state");
    setStoryboardGenerator({
      isGenerating: true,
      error: null,
      scenes: [],
      voicePrompts: [],
      characterIdSummary: [],
      genre: undefined,
    });

    try {
      console.log("[MithrilContext:startStoryboardGeneration] Submitting job to orchestrator...");
      // Submit job to orchestrator
      const response = await fetch("/api/storyboard/orchestrator/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: currentProjectId,
          sourceText: params.sourceText,
          // Conditions
          storyCondition: params.storyCondition,
          imageCondition: params.imageCondition,
          videoCondition: params.videoCondition,
          soundCondition: params.soundCondition,
          // Guides
          imageGuide: params.imageGuide,
          videoGuide: params.videoGuide,
          // New configuration
          targetTime: params.targetTime,
          customInstruction: params.customInstruction,
          backgroundInstruction: params.backgroundInstruction,
          negativeInstruction: params.negativeInstruction,
          videoInstruction: params.videoInstruction,
          // API key
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "API request failed");

      console.log("[MithrilContext:startStoryboardGeneration] Orchestrator response:", {
        ok: response.ok,
        status: response.status,
        jobId: data.jobId,
      });

      // Store job ID for tracking (both ref and state)
      console.log("[MithrilContext:startStoryboardGeneration] Setting job ID refs:", {
        jobId: data.jobId,
        previousRefValue: storyboardJobIdRef.current,
      });
      storyboardJobIdRef.current = data.jobId || null;
      setStoryboardJobId(data.jobId || null);
      console.log("[MithrilContext:startStoryboardGeneration] Job ID set - ref now:", storyboardJobIdRef.current);

      // Save jobId to Firestore so it persists across page navigations
      if (data.jobId) {
        console.log("[MithrilContext:startStoryboardGeneration] Saving jobId to Firestore meta...");
        await saveStoryboardMeta(currentProjectId, data.jobId);
        console.log("[MithrilContext:startStoryboardGeneration] Firestore meta saved");
      }

      // Job is now running in background - UI will update via Firestore subscription
      console.log("[MithrilContext:startStoryboardGeneration] Job submitted successfully, waiting for subscription updates");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      console.log("[MithrilContext:startStoryboardGeneration] ERROR:", errorMessage);
      setStoryboardGenerator(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
    }
  }, [currentProjectId, customApiKey]);

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
        body: JSON.stringify({ scenes: storyboardGenerator.scenes, apiKey: customApiKey }),
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
            // Always write imagePromptEnd — empty string clears stale values from previous splits
            await updateClipFieldFirestore(currentProjectId, sceneIndex, clipIndex, 'imagePromptEnd', clip.imagePromptEnd || "");
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
        await saveVoicePrompts(currentProjectId, voicePrompts || []);

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
              characterInfo: clip.characterInfo || "",
              dialogue: clip.dialogue || "",
              dialogueEn: clip.dialogueEn || "",
              narration: clip.narration || "",
              narrationEn: clip.narrationEn || "",
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
    console.log("[MithrilContext:clearStoryboardGeneration] Clearing storyboard state:", {
      previousJobIdRef: storyboardJobIdRef.current,
      previousSceneCount: storyboardGenerator.scenes.length,
    });

    // Clear job tracking
    storyboardJobIdRef.current = null;
    setStoryboardJobId(null);

    setStoryboardGenerator({
      isGenerating: false,
      error: null,
      scenes: [],
      voicePrompts: [],
      characterIdSummary: [],
      genre: undefined,
    });
    setOriginalStoryboard(null);

    if (currentProjectId) {
      try {
        console.log("[MithrilContext:clearStoryboardGeneration] Clearing Firestore storyboard...");
        await clearStoryboard(currentProjectId);
        console.log("[MithrilContext:clearStoryboardGeneration] Firestore cleared");
      } catch (error) {
        console.error("Error clearing storyboard from Firestore:", error);
      }
    }

    clearStageResult(5);
    console.log("[MithrilContext:clearStoryboardGeneration] Clear complete");
  }, [currentProjectId, clearStageResult, storyboardGenerator.scenes.length]);

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

      // Also update stageResults so Stage 7 can access the images immediately
      setStageResults(prevResults => ({
        ...prevResults,
        4: { scenes: newScenes, voicePrompts: prev.voicePrompts }
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
      // Clear old backgrounds first to avoid stale data persisting
      let backgroundsWithImages: BgSheetBackground[] = [];
      if (currentProjectId) {
        await clearBgSheet(currentProjectId);
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
              // Role & Identity fields
              role: char.role || "unknown",
              isProtagonist: char.isProtagonist || false,
              age: char.age || "",
              gender: char.gender || "",
              traits: char.traits || "",
              // Description fields
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
          role: char.role || "unknown",
          isProtagonist: char.isProtagonist || false,
          age: char.age || "",
          gender: char.gender || "",
          traits: char.traits || "",
          appearance: char.appearance,
          clothing: char.clothing,
          personality: char.personality,
          backgroundStory: char.backgroundStory,
          profileImageId: "",
          profileImagePrompt: "",
          masterSheetImageId: "",
          masterSheetImagePrompt: "",
          imageId: "",
          imagePrompt: "",
        })),
        styleKeyword,
        characterBasePrompt,
        genre: "fantasy",
        styleSlots: [],
        activeStyleIndex: null,
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

  // Prop Designer methods
  const setPropDesignerResult = useCallback((result: PropDesignerResultMetadata) => {
    setPropDesignerGenerator(prev => ({ ...prev, result }));
  }, []);

  const clearPropDesignerData = useCallback(async () => {
    setPropDesignerGenerator({
      isAnalyzing: false,
      error: null,
      result: null,
    });

    if (currentProjectId) {
      try {
        await clearPropDesigner(currentProjectId);
      } catch (error) {
        console.error("Error clearing prop designer from Firestore:", error);
      }
    }
  }, [currentProjectId]);

  // Navigation methods (follow pipeline order, skipping tool-only and skipped stages)
  const goToNextStage = useCallback(() => {
    const idx = pipelineStageIds.indexOf(currentStage);
    if (idx !== -1 && idx < pipelineStageIds.length - 1) {
      setCurrentStage(pipelineStageIds[idx + 1]);
    }
  }, [currentStage, pipelineStageIds, setCurrentStage]);

  const goToPreviousStage = useCallback(() => {
    const idx = pipelineStageIds.indexOf(currentStage);
    if (idx > 0) {
      setCurrentStage(pipelineStageIds[idx - 1]);
    }
  }, [currentStage, pipelineStageIds, setCurrentStage]);

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
        // Project type
        projectType,
        totalStages,
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
        // Custom API Key (for image generation)
        customApiKey,
        setCustomApiKey,
        // Video API Key (for video generation)
        videoApiKey,
        setVideoApiKey,
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
        // Prop Designer Generator
        propDesignerGenerator,
        setPropDesignerResult,
        clearPropDesignerData,
        // Upload Type (novel vs chapter)
        uploadType,
        setUploadType,
        isStageSkipped,
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
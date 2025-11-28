"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const TOTAL_STAGES = 6;

// Types for Story Analyzer
interface StoryAnalyzerState {
  isLoading: boolean;
  error: string | null;
  progressMessage: string;
  summary: string;
}

// Types for Story Splitter
interface SplitResult {
  parts: string[];
}

interface StorySplitterState {
  isLoading: boolean;
  error: string | null;
  result: SplitResult | null;
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

  // Story Analyzer (Stage 2)
  storyAnalyzer: StoryAnalyzerState;
  startStoryAnalysis: (conditions: string, analysisType: "plot" | "episode") => Promise<void>;
  clearStoryAnalysis: () => void;

  // Story Splitter (Stage 3)
  storySplitter: StorySplitterState;
  startStorySplit: (text: string, guidelines: string, numParts: number) => Promise<void>;
  clearStorySplit: () => void;
}

const MithrilContext = createContext<MithrilContextProps | undefined>(undefined);

export const MithrilProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation state
  const [currentStage, setCurrentStage] = useState(1);

  // File management state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Stage results state
  const [stageResults, setStageResults] = useState<Record<number, unknown>>({});

  // Story Analyzer state (Stage 2)
  const [storyAnalyzer, setStoryAnalyzer] = useState<StoryAnalyzerState>({
    isLoading: false,
    error: null,
    progressMessage: "",
    summary: "",
  });

  // Story Splitter state (Stage 3)
  const [storySplitter, setStorySplitter] = useState<StorySplitterState>({
    isLoading: false,
    error: null,
    result: null,
  });

  // Story Analyzer methods
  const startStoryAnalysis = useCallback(async (conditions: string, analysisType: "plot" | "episode") => {
    const fileContent = localStorage.getItem("chapter");

    if (!fileContent) {
      setStoryAnalyzer(prev => ({
        ...prev,
        error: "Please upload a text file in Stage 1 first.",
      }));
      return;
    }

    setStoryAnalyzer({
      isLoading: true,
      error: null,
      progressMessage: "Analyzing story...",
      summary: "",
    });

    try {
      const response = await fetch("/api/analyze_story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          novelText: fileContent,
          conditions,
          analysisType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze story");
      }

      // Save to localStorage
      localStorage.setItem("story_analysis", data.result);

      setStoryAnalyzer({
        isLoading: false,
        error: null,
        progressMessage: "",
        summary: data.result,
      });
    } catch (e) {
      setStoryAnalyzer(prev => ({
        ...prev,
        isLoading: false,
        progressMessage: "",
        error: e instanceof Error ? e.message : "An unknown error occurred.",
      }));
    }
  }, []);

  const clearStoryAnalysis = useCallback(() => {
    localStorage.removeItem("story_analysis");
    setStoryAnalyzer({
      isLoading: false,
      error: null,
      progressMessage: "",
      summary: "",
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
  const setStageResult = (stage: number, result: unknown) => {
    setStageResults((prev) => ({ ...prev, [stage]: result }));
  };

  const getStageResult = (stage: number) => {
    return stageResults[stage];
  };

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
        // Story Analyzer
        storyAnalyzer,
        startStoryAnalysis,
        clearStoryAnalysis,
        // Story Splitter
        storySplitter,
        startStorySplit,
        clearStorySplit,
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

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

const TOTAL_STAGES = 6;

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
}

const MithrilContext = createContext<MithrilContextProps | undefined>(undefined);

export const MithrilProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation state
  const [currentStage, setCurrentStage] = useState(1);

  // File management state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Stage results state
  const [stageResults, setStageResults] = useState<Record<number, unknown>>({});

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

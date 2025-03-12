import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ImageOrVideo } from '@/components/Types';

// Define the type for the context data
interface CreateMediaContextType {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
  savedPrompt: string;
  setSavedPrompt: (savedPrompt: string) => void;
  prompts: string[];
  setPrompts: (prompts: string[]) => void;
  pictures: string[];
  setPictures: (pictures: string[]) => void;
  webnovel_id: string;
  chapter_id: string;
  draggableNodeRef: React.RefObject<HTMLDivElement>;
  openDialog: boolean;
  setOpenDialog: (openDialog: boolean) => void;
  selection: string;
  setSelection: (selection: string) => void;
  position: { x: number; y: number; width?: number; height?: number };
  setPosition: (position: { x: number; y: number; width?: number; height?: number }) => void;
  promotionBannerRef: React.MutableRefObject<React.JSX.Element>;
  source: 'webnovel' | 'chapter';
  narrations: string[];
  setNarrations: (narrations: string[]) => void;
  videoFileName: string | null;
  setVideoFileName: (videoFileName: string | null) => void;
  showShareAsPostModal: boolean;
  setShowShareAsPostModal: (showShareAsPostModal: boolean) => void;
  loadingVideoGeneration: boolean;
  setLoadingVideoGeneration: (loadingVideoGeneration: boolean) => void;
  makeSlideshow: () => Promise<void>;
  makeVideo: () => Promise<void>;
}

// Create context with default values
const CreateMediaContext = createContext<CreateMediaContextType | undefined>(undefined);

// Provider props
interface CreateMediaProviderProps {
  children: ReactNode;
  initialValues?: Partial<CreateMediaContextType>;
}

// Create the provider component
export function CreateMediaProvider({ children }: CreateMediaProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedPrompt, setSavedPrompt] = useState('');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [pictures, setPictures] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [narrations, setNarrations] = useState<string[]>([]);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);
  const [loadingVideoGeneration, setLoadingVideoGeneration] = useState(false);
  const [webnovel_id, setWebnovelId] = useState<string>("");
  const [chapter_id, setChapterId] = useState<string>("");

  // Default refs - these would typically be initialized properly in the component using the context
  const defaultDraggableNodeRef = React.useRef<HTMLDivElement>(null);
  const defaultPromotionBannerRef = React.useRef<React.JSX.Element>(<></>);
  const [selection, setSelection] = useState<string>("");
  const [position, setPosition] = useState<{ x: number; y: number; width?: number; height?: number }>({ x: 0, y: 0 });


  // These functions would typically contain the implementation from CreateMediaArea
  const makeSlideshow = async () => {
    // Implementation would go here
    console.log("makeSlideshow called from context");
  };

  const makeVideo = async () => {
    // Implementation would go here
    console.log("makeVideo called from context");
  };

  const value: CreateMediaContextType = {
    isLoading,
    setIsLoading,
    progress,
    setProgress,
    savedPrompt,
    setSavedPrompt,
    prompts,
    setPrompts,
    pictures,
    setPictures,
    webnovel_id,
    chapter_id,
    draggableNodeRef: defaultDraggableNodeRef,
    openDialog,
    setOpenDialog,
    selection,
    setSelection,
    position,
    setPosition,
    promotionBannerRef: defaultPromotionBannerRef,
    source: 'chapter',
    narrations,
    setNarrations,
    videoFileName,
    setVideoFileName,
    showShareAsPostModal,
    setShowShareAsPostModal,
    loadingVideoGeneration,
    setLoadingVideoGeneration,
    makeSlideshow,
    makeVideo,
  };

  return <CreateMediaContext.Provider value={value}>{children}</CreateMediaContext.Provider>;
}

// Custom hook for using the context
export function useCreateMedia() {
  const context = useContext(CreateMediaContext);
  if (context === undefined) {
    throw new Error('useCreateMedia must be used within a CreateMediaProvider');
  }
  return context;
}

// Export the context and provider
export default CreateMediaContext;
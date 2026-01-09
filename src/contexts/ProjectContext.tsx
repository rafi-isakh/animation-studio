"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import { ProjectMetadata } from '@/components/Mithril/services/firestore';

interface ProjectContextProps {
  currentProjectId: string | null;
  currentProject: ProjectMetadata | null;
  setCurrentProject: (project: ProjectMetadata | null) => void;
  clearCurrentProject: () => void;
}

const projectContext = createContext<ProjectContextProps | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProjectState] = useState<ProjectMetadata | null>(null);

  function setCurrentProject(project: ProjectMetadata | null) {
    setCurrentProjectId(project?.id || null);
    setCurrentProjectState(project);
  }

  function clearCurrentProject() {
    setCurrentProjectId(null);
    setCurrentProjectState(null);
  }

  return (
    <projectContext.Provider
      value={{
        currentProjectId,
        currentProject,
        setCurrentProject,
        clearCurrentProject,
      }}
    >
      {children}
    </projectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(projectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
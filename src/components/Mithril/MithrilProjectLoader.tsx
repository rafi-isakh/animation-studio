"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/contexts/ProjectContext';
import { getProject } from './services/firestore';
import { Loader2 } from 'lucide-react';

interface MithrilProjectLoaderProps {
  projectId?: string;
  children: ReactNode;
}

export default function MithrilProjectLoader({
  projectId,
  children,
}: MithrilProjectLoaderProps) {
  const router = useRouter();
  const { currentProject, setCurrentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      // No projectId provided - redirect to projects page
      if (!projectId) {
        router.replace('/projects');
        return;
      }

      // Project already loaded in context
      if (currentProject?.id === projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const project = await getProject(projectId);

        if (!project) {
          setError('Project not found');
          return;
        }

        setCurrentProject(project);
      } catch (err) {
        console.error('Failed to load project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [projectId, currentProject?.id, setCurrentProject, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-500 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={() => router.push('/projects')}
            className="text-primary hover:underline"
          >
            Go to Projects
          </button>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return null;
  }

  return <>{children}</>;
}
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/shadcnUI/Dialog';
import { Button } from '@/components/shadcnUI/Button';
import { Input } from '@/components/shadcnUI/Input';
import { Label } from '@/components/shadcnUI/Label';
import { createProject, getProject, ProjectMetadata } from './services/firestore';
import { Loader2, FileText, Images } from 'lucide-react';
import {
  ProjectType,
  getAvailableProjectTypes,
  getProjectTypeConfig,
  getDefaultProjectType
} from './config/projectTypes';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: ProjectMetadata) => void;
}

// Icon mapping for project types
const PROJECT_TYPE_ICONS: Record<ProjectType, React.ReactNode> = {
  'text-to-video': <FileText className="w-8 h-8" />,
  'image-to-video': <Images className="w-8 h-8" />,
};

export default function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>(getDefaultProjectType());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTypes = getAvailableProjectTypes();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const projectId = await createProject({ name: name.trim(), projectType });
      const newProject = await getProject(projectId);

      if (newProject) {
        onProjectCreated(newProject);
        setName('');
        setProjectType(getDefaultProjectType());
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setName('');
      setProjectType(getDefaultProjectType());
      setError(null);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Choose a project type and give it a name
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Project Type Selection */}
            <div className="grid gap-3">
              <Label>Project Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {availableTypes.map((type) => {
                  const config = getProjectTypeConfig(type);
                  const isSelected = projectType === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setProjectType(type)}
                      disabled={loading}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                        ${isSelected
                          ? 'border-[#DB2777] bg-[#DB2777]/10 text-[#DB2777]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className={isSelected ? 'text-[#DB2777]' : 'text-gray-500 dark:text-gray-400'}>
                        {PROJECT_TYPE_ICONS[type]}
                      </div>
                      <div className="text-center">
                        <div className={`font-medium text-sm ${isSelected ? 'text-[#DB2777]' : ''}`}>
                          {type === 'text-to-video' ? 'Novel to Video' : 'Manga to Anime'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {type === 'text-to-video'
                            ? 'Convert stories to animated videos'
                            : 'Convert manga panels to videos'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Project Name Input */}
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., My Story Chapter 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
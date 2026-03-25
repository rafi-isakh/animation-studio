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
import { useMithrilAuth } from './auth/MithrilAuthContext';
import { Loader2, FileText, BookOpen, Palette, BookText } from 'lucide-react';
import {
  ProjectType,
  getDefaultProjectType,
} from './config/projectTypes';

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: ProjectMetadata) => void;
}

// Groups define the creation UI structure
interface ProjectTypeOption {
  type: ProjectType;
  label: string;
  description: string;
  isNsfw: boolean;
  icon: React.ReactNode;
}

interface ProjectTypeGroup {
  groupLabel: string;
  options: ProjectTypeOption[];
}

const PROJECT_TYPE_GROUPS: ProjectTypeGroup[] = [
  {
    groupLabel: 'Novel to Video',
    options: [
      {
        type: 'text-to-video',
        label: 'General',
        description: 'Convert stories to animated videos',
        isNsfw: false,
        icon: <FileText className="w-6 h-6" />,
      },
      {
        type: 'text-to-video-nsfw',
        label: 'NSFW',
        description: 'Adult content — age-restricted',
        isNsfw: true,
        icon: <FileText className="w-6 h-6" />,
      },
      {
        type: 'text-to-video-anime-bg',
        label: 'General (3D BG)',
        description: 'Animated videos with 3D background studio',
        isNsfw: false,
        icon: <FileText className="w-6 h-6" />,
      },
      {
        type: 'text-to-video-nsfw-anime-bg',
        label: 'NSFW (3D BG)',
        description: 'Adult content with 3D background studio',
        isNsfw: true,
        icon: <FileText className="w-6 h-6" />,
      },
    ],
  },
  {
    groupLabel: 'Manga to Video',
    options: [
      {
        type: 'manga-to-video',
        label: 'General',
        description: 'Convert B&W manga panels to videos',
        isNsfw: false,
        icon: <BookOpen className="w-6 h-6" />,
      },
      {
        type: 'manga-to-video-nsfw',
        label: 'NSFW',
        description: 'Adult content — age-restricted',
        isNsfw: true,
        icon: <BookOpen className="w-6 h-6" />,
      },
    ],
  },
  {
    groupLabel: 'Webtoon to Video',
    options: [
      {
        type: 'webtoon-to-video',
        label: 'General',
        description: 'Convert colored webtoon panels to videos',
        isNsfw: false,
        icon: <Palette className="w-6 h-6" />,
      },
      {
        type: 'webtoon-to-video-nsfw',
        label: 'NSFW',
        description: 'Adult content — age-restricted',
        isNsfw: true,
        icon: <Palette className="w-6 h-6" />,
      },
    ],
  },
  {
    groupLabel: 'Webnovel Trailer',
    options: [
      {
        type: 'webnovel-trailer',
        label: 'General',
        description: 'Create trailers from webnovel panels',
        isNsfw: false,
        icon: <BookText className="w-6 h-6" />,
      },
      {
        type: 'webnovel-trailer-nsfw',
        label: 'NSFW',
        description: 'Adult content — age-restricted',
        isNsfw: true,
        icon: <BookText className="w-6 h-6" />,
      },
    ],
  },
];

export default function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
}: CreateProjectModalProps) {
  const { user } = useMithrilAuth();
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>(getDefaultProjectType());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!user) {
      setError('You must be logged in to create a project');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const projectId = await createProject({ name: name.trim(), projectType, ownerId: user.id });
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Choose a project type and give it a name
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {/* Project Type Selection */}
            <div className="grid gap-4">
              <Label>Project Type</Label>
              {PROJECT_TYPE_GROUPS.map((group) => (
                <div key={group.groupLabel} className="grid gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {group.groupLabel}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((option) => {
                      const isSelected = projectType === option.type;
                      return (
                        <button
                          key={option.type}
                          type="button"
                          onClick={() => setProjectType(option.type)}
                          disabled={loading}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left
                            ${isSelected
                              ? 'border-[#DB2777] bg-[#DB2777]/10'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <div className={isSelected ? 'text-[#DB2777]' : 'text-gray-500 dark:text-gray-400'}>
                            {option.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium text-sm ${isSelected ? 'text-[#DB2777]' : ''}`}>
                                {option.label}
                              </span>
                              {option.isNsfw && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 leading-none">
                                  18+
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {option.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
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
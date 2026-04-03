"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/shadcnUI/Button';
import { Plus, Folder, Trash2, Pencil, FileText, BookOpen, Palette, Copy, BookText, ArrowLeft, LayoutGrid, LayoutList, Hash, Scissors, User, Film, Box, Image, Video, SplitSquareHorizontal, PanelLeft, ScrollText, Layers, Wand2, Clapperboard } from 'lucide-react';
import MithrilHeader from './MithrilHeader';
import { listProjects, deleteProject, copyProject, ProjectMetadata } from './services/firestore';
import { clearAllProjectFiles, copyAllProjectFiles } from './services/s3';
import CreateProjectModal from './CreateProjectModal';
import RenameProjectModal from './RenameProjectModal';
import CopyProjectModal from './CopyProjectModal';
import { useProject } from '@/contexts/ProjectContext';
import { useMithrilAuth } from './auth/MithrilAuthContext';
import { ProjectType, getStageConfig } from './config/projectTypes';
import { useToast } from '@/hooks/use-toast';

export type TypeCategory = 'novel-to-video' | 'manga-to-video' | 'webtoon-to-video' | 'webnovel-trailer';
type ViewMode = 'list' | 'grid';
const VIEW_MODE_KEY = 'mithril_projects_view_mode';

export const TYPE_CATEGORY_MAP: Partial<Record<ProjectType, TypeCategory>> = {
  'text-to-video': 'novel-to-video',
  'text-to-video-nsfw': 'novel-to-video',
  'text-to-video-anime-bg': 'novel-to-video',
  'text-to-video-nsfw-anime-bg': 'novel-to-video',
  'manga-to-video': 'manga-to-video',
  'manga-to-video-nsfw': 'manga-to-video',
  'image-to-video': 'manga-to-video',
  'webtoon-to-video': 'webtoon-to-video',
  'webtoon-to-video-nsfw': 'webtoon-to-video',
  'webnovel-trailer': 'webnovel-trailer',
  'webnovel-trailer-nsfw': 'webnovel-trailer',
};

interface CategoryConfig {
  label: string;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
}

export const CATEGORY_CONFIG: Record<TypeCategory, CategoryConfig> = {
  'novel-to-video': {
    label: 'Novel to Video (T2A)',
    icon: <FileText className="w-8 h-8" />,
    accent: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  'manga-to-video': {
    label: 'Manga to Video (M2A)',
    icon: <BookOpen className="w-8 h-8" />,
    accent: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
  },
  'webtoon-to-video': {
    label: 'Webtoon to Video (W2A)',
    icon: <Palette className="w-8 h-8" />,
    accent: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10',
  },
  'webnovel-trailer': {
    label: 'Webnovel Trailer',
    icon: <BookText className="w-8 h-8" />,
    accent: 'text-teal-400',
    iconBg: 'bg-teal-500/10',
  },
};

const CATEGORY_ORDER: TypeCategory[] = ['novel-to-video', 'manga-to-video', 'webtoon-to-video', 'webnovel-trailer'];

const STAGE_ICON_MAP: Record<string, React.ReactNode> = {
  'mithril_stage_id_converter': <Hash className="w-6 h-6" />,
  'mithril_stage2':             <Scissors className="w-6 h-6" />,
  'mithril_stage3':             <User className="w-6 h-6" />,
  'mithril_stage4':             <Film className="w-6 h-6" />,
  'mithril_stage5_prop':        <Box className="w-6 h-6" />,
  'mithril_stage5':             <Image className="w-6 h-6" />,
  'mithril_stage5_3d_bg':       <Layers className="w-6 h-6" />,
  'mithril_stage6':             <Wand2 className="w-6 h-6" />,
  'mithril_stage7':             <Video className="w-6 h-6" />,
  'mithril_i2v_stage1':                   <SplitSquareHorizontal className="w-6 h-6" />,
  'mithril_i2v_stage2':                   <PanelLeft className="w-6 h-6" />,
  'mithril_i2v_stage2_colorizer':         <Palette className="w-6 h-6" />,
  'mithril_i2v_stage3':                   <ScrollText className="w-6 h-6" />,
  'mithril_i2v_stage4':                   <Clapperboard className="w-6 h-6" />,
  'mithril_i2v_stage_style_converter':    <Wand2 className="w-6 h-6" />,
  'mithril_i2v_stage5':                   <Video className="w-6 h-6" />,
};

export default function ProjectListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentProject } = useProject();
  const { user } = useMithrilAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TypeCategory | null>(
    (searchParams.get('category') as TypeCategory) ?? null
  );

  function handleCategorySelect(cat: TypeCategory | null) {
    setSelectedCategory(cat);
    router.replace(cat ? `/projects?category=${cat}` : '/projects');
  }
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState<ProjectMetadata | null>(null);
  const [projectToCopy, setProjectToCopy] = useState<ProjectMetadata | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (saved === 'grid' || saved === 'list') setViewMode(saved);
  }, []);

  function toggleViewMode(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }

  async function loadProjects() {
    if (!user) return;
    try {
      setLoading(true);
      const data = await listProjects({ id: user.id, role: user.role });
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  const projectCountByCategory = useMemo(() => {
    const counts: Record<TypeCategory, number> = {
      'novel-to-video': 0,
      'manga-to-video': 0,
      'webtoon-to-video': 0,
      'webnovel-trailer': 0,
    };
    projects.forEach((p) => {
      const cat = TYPE_CATEGORY_MAP[p.projectType];
      if (cat) counts[cat]++;
    });
    return counts;
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (!selectedCategory) return projects;
    return projects.filter((p) => TYPE_CATEGORY_MAP[p.projectType] === selectedCategory);
  }, [projects, selectedCategory]);

  function handleProjectClick(project: ProjectMetadata) {
    setCurrentProject(project);
    const stage = project.currentStage || 1;
    router.push(`/mithril?project=${project.id}&stage=${stage}`);
  }

  async function handleDeleteProject(e: React.MouseEvent, projectId: string) {
    e.stopPropagation();
    if (!user) return;
    if (!confirm('Are you sure you want to delete this project? This will permanently delete all data including images and videos.')) {
      return;
    }
    try {
      setDeletingId(projectId);
      try {
        await clearAllProjectFiles(projectId);
      } catch (s3Error) {
        console.error('Failed to delete S3 files:', s3Error);
      }
      await deleteProject(projectId, { id: user.id, role: user.role });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleProjectCreated(newProject: ProjectMetadata) {
    setProjects((prev) => [newProject, ...prev]);
    setIsCreateModalOpen(false);
    const cat = TYPE_CATEGORY_MAP[newProject.projectType];
    if (cat) handleCategorySelect(cat);
  }

  function handleRenameClick(e: React.MouseEvent, project: ProjectMetadata) {
    e.stopPropagation();
    setProjectToRename(project);
    setIsRenameModalOpen(true);
  }

  function handleProjectRenamed(renamedProject: ProjectMetadata) {
    setProjects((prev) => prev.map((p) => (p.id === renamedProject.id ? renamedProject : p)));
    setIsRenameModalOpen(false);
    setProjectToRename(null);
  }

  function handleCopyClick(e: React.MouseEvent, project: ProjectMetadata) {
    e.stopPropagation();
    setProjectToCopy(project);
    setIsCopyModalOpen(true);
  }

  async function handleProjectCopied(newName: string) {
    if (!user || !projectToCopy) return;
    const sourceProjectId = projectToCopy.id;
    try {
      setCopyingId(sourceProjectId);
      const copiedProject = await copyProject(sourceProjectId, newName, { id: user.id, role: user.role });
      try {
        await copyAllProjectFiles(sourceProjectId, copiedProject.id);
      } catch (s3Error) {
        console.error('Failed to copy S3 files:', s3Error);
        await clearAllProjectFiles(copiedProject.id).catch(() => {});
        await deleteProject(copiedProject.id, { id: user.id, role: user.role }).catch(() => {});
        throw new Error('Failed to copy project files. Copy was rolled back.');
      }
      setProjects((prev) => [copiedProject, ...prev]);
      setIsCopyModalOpen(false);
      setProjectToCopy(null);
      toast({ variant: 'success', title: 'Project copied', description: `"${copiedProject.name}" is ready.` });
    } catch (error) {
      console.error('Failed to copy project:', error);
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: error instanceof Error ? error.message : 'Failed to copy project. Please try again.',
      });
    } finally {
      setCopyingId(null);
    }
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getStageLabel(projectType: ProjectType, stageId: number): string {
    const stageConfig = getStageConfig(projectType, stageId);
    if (!stageConfig) return `Stage ${stageId}`;
    const labelMap: Record<string, string> = {
      'mithril_stage1': 'Upload',
      'mithril_stage_id_converter': 'ID Converter',
      'mithril_stage2': 'Story Split',
      'mithril_stage3': 'Characters',
      'mithril_stage4': 'Storyboard',
      'mithril_stage5_prop': 'Assets',
      'mithril_stage5': 'Backgrounds',
      'mithril_stage5_3d_bg': '3D BG Studio',
      'mithril_stage6': 'Image Clips',
      'mithril_stage7': 'Videos',
      'mithril_i2v_stage1': 'Panel Splitter',
      'mithril_i2v_stage2': 'Panel Editor',
      'mithril_i2v_stage2_colorizer': 'Panel Colorizer',
      'mithril_i2v_stage3': 'Script Writer',
      'mithril_i2v_stage4': 'Storyboard Editor',
      'mithril_i2v_stage_style_converter': 'Style Converter',
      'mithril_i2v_stage5': 'Video Generation',
    };
    return labelMap[stageConfig.labelKey] || `Stage ${stageId}`;
  }

  function getStageIcon(projectType: ProjectType, stageId: number): React.ReactNode {
    const stageConfig = getStageConfig(projectType, stageId);
    if (!stageConfig) return <Folder className="w-6 h-6" />;
    return STAGE_ICON_MAP[stageConfig.labelKey] ?? <Folder className="w-6 h-6" />;
  }

  // ── Category Cards (Level 1) ──────────────────────────────────────────────

  function renderCategoryCards() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-[#211F21] border border-[#272727] rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORY_ORDER.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const count = projectCountByCategory[cat];
          return (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className="flex flex-col items-start gap-4 p-6 bg-[#211F21] border border-[#272727] rounded-xl hover:border-[#DB2777] transition-colors text-left group"
            >
              <div className={`p-3 rounded-lg ${config.iconBg} ${config.accent}`}>
                {config.icon}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-[#E8E8E8] group-hover:text-white transition-colors">
                  {config.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {count} {count === 1 ? 'project' : 'projects'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Project List Rows (Level 2) ───────────────────────────────────────────

  function renderProjectList() {
    if (loading) {
      return (
        <div className="bg-[#211F21] border border-[#272727] rounded-xl overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-4 border-b border-[#272727] last:border-0 animate-pulse">
              <div className="w-4 h-4 bg-[#272727] rounded" />
              <div className="h-4 bg-[#272727] rounded flex-1" />
              <div className="h-4 bg-[#272727] rounded w-28" />
            </div>
          ))}
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-20 bg-[#211F21] border border-[#272727] rounded-xl">
          <Folder className="w-12 h-12 text-gray-600" />
          <p className="text-gray-500 text-sm">No projects in this category</p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-[#DB2777] hover:bg-[#BE185D] text-white mt-2">
            <Plus className="w-6 h-6" />
            New Project
          </Button>
        </div>
      );
    }

    return (
      <div className="bg-[#211F21] border border-[#272727] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[#272727] bg-[#1A1A1C]">
          <div className="w-4 flex-shrink-0" />
          <span className="flex-1 text-xs font-medium text-gray-500 uppercase tracking-widest">Name</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest flex-shrink-0 mr-4 hidden sm:block">Stage</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest flex-shrink-0 w-28 text-right hidden lg:block">Created</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest flex-shrink-0 w-28 text-right hidden md:block">Last Updated</span>
          <div className="w-[82px] flex-shrink-0" />
        </div>
        {filteredProjects.map((project, idx) => (
          <div
            key={project.id}
            onClick={() => handleProjectClick(project)}
            className={`flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-[#1A1A1C] transition-colors group ${idx < filteredProjects.length - 1 ? 'border-b border-[#272727]' : ''}`}
          >
            <Folder className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="flex-1 text-[14px] text-[#E8E8E8] truncate">{project.name}</span>
            <span className="text-xs text-gray-500 flex-shrink-0 mr-4 hidden sm:block">
              {getStageLabel(project.projectType, project.currentStage)}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0 w-28 text-right hidden lg:block">
              {formatDate(project.createdAt)}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0 w-28 text-right hidden md:block">
              {formatDate(project.updatedAt)}
            </span>
            {/* Hover actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
              <button
                onClick={(e) => handleRenameClick(e, project)}
                className="p-1.5 rounded text-gray-500 hover:text-[#E8E8E8] hover:bg-[#272727] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleCopyClick(e, project)}
                disabled={copyingId === project.id}
                className="p-1.5 rounded text-gray-500 hover:text-[#E8E8E8] hover:bg-[#272727] transition-colors disabled:opacity-40"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => handleDeleteProject(e, project.id)}
                disabled={deletingId === project.id}
                className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Project Grid Cards (Level 2 alternate) ───────────────────────────────

  function renderProjectGrid() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-[#211F21] border border-[#272727] rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-20 bg-[#211F21] border border-[#272727] rounded-xl">
          <Folder className="w-12 h-12 text-gray-600" />
          <p className="text-gray-500 text-sm">No projects in this category</p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 bg-[#DB2777] hover:bg-[#BE185D] text-white mt-2">
            <Plus className="w-6 h-6" />
            New Project
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const cat = TYPE_CATEGORY_MAP[project.projectType];
          const config = cat ? CATEGORY_CONFIG[cat] : null;
          return (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project)}
              className="relative flex flex-col gap-3 p-5 bg-[#211F21] border border-[#272727] rounded-xl cursor-pointer hover:border-[#DB2777] transition-colors group"
            >
              <div className={`p-2 rounded-lg w-fit ${config?.iconBg ?? 'bg-gray-500/10'} ${config?.accent ?? 'text-gray-400'}`}>
                {getStageIcon(project.projectType, project.currentStage)}
              </div>
              <p className="text-[14px] font-semibold text-[#E8E8E8] truncate">{project.name}</p>
              <p className="text-xs text-gray-500">Created {formatDate(project.createdAt)}</p>
              <p className="text-xs text-gray-500">Updated {formatDate(project.updatedAt)}</p>
              <div className="mt-auto pt-3 border-t border-[#272727] flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-600">Stage: {getStageLabel(project.projectType, project.currentStage)}</span>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleRenameClick(e, project)}
                  className="p-1.5 rounded text-gray-500 hover:text-[#E8E8E8] hover:bg-[#272727] transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleCopyClick(e, project)}
                  disabled={copyingId === project.id}
                  className="p-1.5 rounded text-gray-500 hover:text-[#E8E8E8] hover:bg-[#272727] transition-colors disabled:opacity-40"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  disabled={deletingId === project.id}
                  className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const currentCategoryConfig = selectedCategory ? CATEGORY_CONFIG[selectedCategory] : null;

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E8E8E8]">
      <MithrilHeader />
      <div className="w-full px-4 sm:px-8 lg:px-12 py-6 pt-20">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            {selectedCategory && (
              <button
                onClick={() => handleCategorySelect(null)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-[#E8E8E8] hover:bg-[#211F21] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedCategory ? currentCategoryConfig!.label : 'Mithril Projects'}
              </h1>
              {!selectedCategory && (
                <p className="text-gray-500 text-sm mt-1">
                  Create and manage your story-to-video projects
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCategory && (
              <div className="flex items-center gap-1 bg-[#211F21] border border-[#272727] rounded-lg p-1">
                <button
                  onClick={() => toggleViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-[#272727] text-[#E8E8E8]' : 'text-gray-500 hover:text-[#E8E8E8]'}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-[#272727] text-[#E8E8E8]' : 'text-gray-500 hover:text-[#E8E8E8]'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            )}
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2 bg-[#DB2777] hover:bg-[#BE185D] text-white"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Content */}
        {selectedCategory
          ? (viewMode === 'grid' ? renderProjectGrid() : renderProjectList())
          : renderCategoryCards()}

      </div>

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onProjectCreated={handleProjectCreated}
      />
      <RenameProjectModal
        open={isRenameModalOpen}
        onOpenChange={setIsRenameModalOpen}
        project={projectToRename}
        onProjectRenamed={handleProjectRenamed}
      />
      <CopyProjectModal
        open={isCopyModalOpen}
        onOpenChange={setIsCopyModalOpen}
        project={projectToCopy}
        loading={!!copyingId}
        onConfirm={handleProjectCopied}
      />
    </div>
  );
}
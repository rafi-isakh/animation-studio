"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcnUI/Card';
import { Button } from '@/components/shadcnUI/Button';
import { Plus, Folder, Trash2, Calendar, LogOut } from 'lucide-react';
import { listProjects, deleteProject, ProjectMetadata } from './services/firestore';
import { clearAllProjectFiles } from './services/s3';
import CreateProjectModal from './CreateProjectModal';
import { useProject } from '@/contexts/ProjectContext';
import { useMithrilAuth } from './auth/MithrilAuthContext';

export default function ProjectListPage() {
  const router = useRouter();
  const { setCurrentProject } = useProject();
  const { user, logout } = useMithrilAuth();
  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push('/mithril/login');
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      const data = await listProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleProjectClick(project: ProjectMetadata) {
    setCurrentProject(project);
    const stage = project.currentStage || 1;
    router.push(`/mithril?project=${project.id}&stage=${stage}`);
  }

  async function handleDeleteProject(e: React.MouseEvent, projectId: string) {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this project? This will permanently delete all data including images and videos.')) {
      return;
    }

    try {
      setDeletingId(projectId);

      // 1. Delete all S3 files (images and videos)
      try {
        const deletedCount = await clearAllProjectFiles(projectId);
        console.log(`Deleted ${deletedCount} S3 files for project ${projectId}`);
      } catch (s3Error) {
        console.error('Failed to delete S3 files:', s3Error);
        // Continue with Firestore deletion even if S3 cleanup fails
      }

      // 2. Delete Firestore data (project + subcollections)
      await deleteProject(projectId);

      setProjects(projects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  function handleProjectCreated(newProject: ProjectMetadata) {
    setProjects([newProject, ...projects]);
    setIsCreateModalOpen(false);
  }

  function formatDate(timestamp: any) {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const stageLabels: Record<number, string> = {
    1: 'Upload',
    2: 'Story Split',
    3: 'Characters',
    4: 'Storyboard',
    5: 'Backgrounds',
    6: 'Image Clips',
    7: 'Videos',
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mithril Projects</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and manage your story-to-video projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </span>
          )}
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <Folder className="w-16 h-16 text-gray-400" />
            <h2 className="text-xl font-semibold">No projects yet</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Create your first project to start converting stories into videos
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 mt-4">
              <Plus className="w-4 h-4" />
              Create First Project
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:border-primary transition-colors group"
              onClick={() => handleProjectClick(project)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate pr-2">
                    {project.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={(e) => handleDeleteProject(e, project.id)}
                    disabled={deletingId === project.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(project.updatedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Stage:
                  </span>
                  <span className="text-sm font-medium px-2 py-0.5 bg-primary/10 text-primary rounded">
                    {stageLabels[project.currentStage] || `Stage ${project.currentStage}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
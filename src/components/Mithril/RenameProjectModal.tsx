"use client";

import { useState, useEffect } from 'react';
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
import { updateProject, ProjectMetadata } from './services/firestore';
import { useMithrilAuth } from './auth/MithrilAuthContext';
import { Loader2 } from 'lucide-react';

interface RenameProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectMetadata | null;
  onProjectRenamed: (project: ProjectMetadata) => void;
}

export default function RenameProjectModal({
  open,
  onOpenChange,
  project,
  onProjectRenamed,
}: RenameProjectModalProps) {
  const { user } = useMithrilAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
    }
  }, [project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!project || !user) {
      return;
    }

    if (name.trim() === project.name) {
      handleClose();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateProject(project.id, { name: name.trim() }, { id: user.id, role: user.role });

      onProjectRenamed({
        ...project,
        name: name.trim(),
      });
    } catch (err) {
      console.error('Failed to rename project:', err);
      setError('Failed to rename project. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setName(project?.name || '');
      setError(null);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Enter a new name for your project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-name">Project Name</Label>
              <Input
                id="rename-name"
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
                  Renaming...
                </>
              ) : (
                'Rename'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
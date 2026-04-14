"use client";

import { useEffect, useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import type { ProjectMetadata } from './services/firestore';

interface CopyProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectMetadata | null;
  loading: boolean;
  onConfirm: (name: string) => Promise<void>;
}

export default function CopyProjectModal({
  open,
  onOpenChange,
  project,
  loading,
  onConfirm,
}: CopyProjectModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(`${project.name} - Copy`);
      setError(null);
    }
  }, [project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setError(null);
    await onConfirm(name.trim());
  }

  function handleClose() {
    if (!loading) {
      setName(project ? `${project.name} - Copy` : '');
      setError(null);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Project</DialogTitle>
          <DialogDescription>
            Duplicate this project with all current inputs and generated outputs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="copy-name">New Project Name</Label>
              <Input
                id="copy-name"
                placeholder="e.g., My Story - Copy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoFocus
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Copying...
                </>
              ) : (
                'Copy Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

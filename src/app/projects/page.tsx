import { Suspense } from 'react';
import ProjectListPage from '@/components/Mithril/ProjectListPage';
import { MithrilAuthGate } from '@/components/Mithril/auth';

export default function ProjectsPage() {
  return (
    <MithrilAuthGate>
      <Suspense fallback={<div className="p-8">Loading projects...</div>}>
        <ProjectListPage />
      </Suspense>
    </MithrilAuthGate>
  );
}
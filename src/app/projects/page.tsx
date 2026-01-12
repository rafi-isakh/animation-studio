import { Suspense } from 'react';
import ProjectListPage from '@/components/Mithril/ProjectListPage';
import PasscodeGate from '@/components/Mithril/PasscodeGate';

export default function ProjectsPage() {
  return (
    <PasscodeGate>
      <Suspense fallback={<div className="p-8">Loading projects...</div>}>
        <ProjectListPage />
      </Suspense>
    </PasscodeGate>
  );
}
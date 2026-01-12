import Mithril from '@/components/Mithril/Mithril';
import { MithrilAuthGate } from '@/components/Mithril/auth';
import MithrilProjectLoader from '@/components/Mithril/MithrilProjectLoader';
import { Suspense } from 'react';

interface MithrilPageProps {
    searchParams: Promise<{ project?: string }>;
}

const MithrilPage = async ({ searchParams }: MithrilPageProps) => {
    const params = await searchParams;
    const projectId = params.project;

    return (
        <MithrilAuthGate>
            <Suspense fallback={<div className="p-8">Loading...</div>}>
                <MithrilProjectLoader projectId={projectId}>
                    <Mithril />
                </MithrilProjectLoader>
            </Suspense>
        </MithrilAuthGate>
    );
};

export default MithrilPage;

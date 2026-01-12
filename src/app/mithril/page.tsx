import Mithril from '@/components/Mithril/Mithril';
import PasscodeGate from '@/components/Mithril/PasscodeGate';
import MithrilProjectLoader from '@/components/Mithril/MithrilProjectLoader';
import { Suspense } from 'react';

interface MithrilPageProps {
    searchParams: Promise<{ project?: string }>;
}

const MithrilPage = async ({ searchParams }: MithrilPageProps) => {
    const params = await searchParams;
    const projectId = params.project;

    return (
        <PasscodeGate>
            <Suspense fallback={<div className="p-8">Loading...</div>}>
                <MithrilProjectLoader projectId={projectId}>
                    <Mithril />
                </MithrilProjectLoader>
            </Suspense>
        </PasscodeGate>
    );
};

export default MithrilPage;

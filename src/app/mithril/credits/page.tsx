import { MithrilAuthGate } from '@/components/Mithril/auth';
import { Suspense } from 'react';
import CreditsPage from '@/components/Mithril/CreditsPage';

const CreditsTrackerPage = () => {
  return (
    <MithrilAuthGate>
      <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
        <CreditsPage />
      </Suspense>
    </MithrilAuthGate>
  );
};

export default CreditsTrackerPage;

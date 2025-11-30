import Mithril from '@/components/Mithril/Mithril';
import PasscodeGate from '@/components/Mithril/PasscodeGate';
import { Suspense } from 'react';

const MithrilPage = () => {
    return (
        <PasscodeGate>
            <Suspense>
                <Mithril />
            </Suspense>
        </PasscodeGate>
    );
};

export default MithrilPage;

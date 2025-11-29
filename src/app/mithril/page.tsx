import Mithril from '@/components/Mithril/Mithril';
import { Suspense } from 'react';

const MithrilPage = () => {
    return (
        <Suspense>
            <Mithril />
        </Suspense>
    );
};

export default MithrilPage;

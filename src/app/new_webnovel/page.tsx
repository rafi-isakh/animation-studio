import Mithril from '@/components/Mithril/Mithril';
import { Suspense } from 'react';

const NewNovel = () => {
    return (
        <Suspense>
            <Mithril />
        </Suspense>
    );
};

export default NewNovel;
import AddWebnovelComponent from '@/components/AddWebnovelComponent';
import { Suspense } from 'react';

const NewNovel = () => {
    return (
        <Suspense>
        <AddWebnovelComponent/>
        </Suspense>
    );
};

export default NewNovel;
import { auth } from '@/auth';
import AddWebnovelComponent from '@/components/AddWebnovelComponent';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

const NewNovel = async () => {
    return (
        <Suspense>
            <AddWebnovelComponent />
        </Suspense>
    );
};

export default NewNovel;
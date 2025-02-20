import { auth } from '@/auth';
import AddWebnovelComponent from '@/components/AddWebnovelComponent';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

async function getWebnovels() {
    const session = await auth();
    const email = session?.user.email;
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_by_email?email=${email}`);

    if (!session) {
        redirect('/signin');
    }
    
    if (!response.ok) {
        throw new Error(`User ${email} not found`);
    }
    const data = await response.json();
    return data;
}

const NewNovel = async () => {
    return (
        <Suspense>
            <AddWebnovelComponent webnovels={await getWebnovels()} />
        </Suspense>
    );
};

export default NewNovel;
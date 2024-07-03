"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from "@/components/AuthContext"
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import WebNovelInfoAndPictureComponent from '@/components/WebnovelInfoAndPictureComponent';
import ListOfChaptersComponent from '@/components/ListOfChaptersComponent';

const MyWebnovelsComponent = () => {

    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { email, username } = useAuth();
    const router = useRouter();

    useEffect(() => {
        fetch(`http://localhost:5000/api/get_webnovel_byuser?user_email=${email}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    setWebnovels(data)
                }
            })
    }, [email]);

    const handleNewChapter = () => {
        router.push(`/new_chapter?id=${id}`);
    }

    const getWebnovel = () => {
        return webnovels.find(w => w.id.toString() == id)
    }

    if (webnovels.length > 0) {
        return (
            <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
                <AuthorAndWebnovelsAsideComponent webnovels={webnovels} username={username} referrer="author"/>
                <div className='w-3/4'>
                    <WebNovelInfoAndPictureComponent webnovel={getWebnovel()}/>
                    <div>
                        <button onClick={handleNewChapter} className="mt-4 text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">새 글 업로드</button>
                    </div>
                    <ListOfChaptersComponent webnovel={getWebnovel()}/>
                </div>
            </div >
        )
    }

    else {
        return (
            <div></div>
        )
    }
};

export default MyWebnovelsComponent;


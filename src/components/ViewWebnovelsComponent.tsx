"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import WebNovelInfoAndPictureComponent from '@/components/WebnovelInfoAndPictureComponent';
import ListOfChaptersComponent from '@/components/ListOfChaptersComponent';
import { useUser } from '@/contexts/UserContext';
import '@/styles/globals.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'

const ViewWebnovelsComponent = ({ searchParams, webnovel, userWebnovels, email }: { searchParams: { [key: string]: string | string[] | undefined }, 
    webnovel: Webnovel | null, userWebnovels: Webnovel[] | null, email: string | undefined }) => {
    const [loading, setLoading] = useState(true);
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [atLeastOneWebnovel, setAtLeastOneWebnovel] = useState(false);
    const id = searchParams.id;
    const [refreshKey, setRefreshKey] = useState(0);
    const { language, dictionary } = useLanguage();
    const nickname = webnovel?.user.nickname;
    const author_email = webnovel?.user.email;

    if (typeof id === 'string') {
    } else if (Array.isArray(id)) {
        throw new Error("there should be only one id param")
    } else {
    }
    const router = useRouter();

    useEffect(() => {
        if (webnovel) {
            setAtLeastOneWebnovel(true);
        } else {
            setAtLeastOneWebnovel(false);
        }
        if (userWebnovels) {
            setAtLeastOneWebnovel(true);
            setWebnovels(userWebnovels);
        }
        console.log('atLeastOneWebnovel', atLeastOneWebnovel);
        setLoading(false);
    });

    const handleNewChapter = () => {
        router.push(`/new_chapter?id=${id}`);
    }

    const handleDelete = async () => {
        try {
            const response = await fetch(`/api/delete-webnovel?id=${id}`);
            if (!response.ok) {
                console.error("Delete webnovel failed");
                return;
            }
            const webnovels_after_deletion = webnovels.filter((w: Webnovel) => w.id.toString() != id)
            setWebnovels(webnovels_after_deletion)
            const ids = webnovels_after_deletion.map((w: Webnovel) => w.id);
            const first = Math.min(...ids);
            if (ids.length > 0) {
                router.push(`/view_webnovels?id=${first.toString()}`)
            } else {
                router.push('/view_webnovels')
                router.refresh();
            }
        } catch (error) {
            console.error(`Couldn't delete webnovel ${id}`, error)
        }
    }

    const handleAIEditor = () => {
        
    }

    const getWebnovel = () => {
        return webnovels.find(w => w.id.toString() == id)
    }

    if (!loading) {
        if (atLeastOneWebnovel) {
            return (
                <div className='max-w-screen-md flex md:flex-row flex-col justify-center mx-auto'>
                    <div className='w-full md:w-1/4'>
                        <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname} />
                        <hr className='block md:hidden mt-4 mb-4 bg-[#142448] h-1' />
                    </div>
                    <div className='w-full md:w-3/4'>
                        <WebNovelInfoAndPictureComponent webnovel={getWebnovel()} />
                        <div className="mt-4">
                            {
                                (author_email == email) &&
                                <div className='flex flex-col w-32'>
                                    <button onClick={handleAIEditor} className="button-style mb-2">
                                        {phrase(dictionary, "aieditor", language)}
                                    </button>
                                    <button onClick={handleNewChapter} className="button-style mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                                        {phrase(dictionary, "uploadNewChapter", language)}
                                    </button>
                                    <button onClick={handleDelete} className="button-style mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                                        {phrase(dictionary, "deleteWebnovel", language)}
                                    </button>
                                </div>
                            }
                        </div>
                        <ListOfChaptersComponent webnovel={getWebnovel()} />
                    </div>
                </div >
            )
        }
        else {
            return (
                <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
                    {phrase(dictionary, "noWebnovelsFound", language)}
                </div>
            )
        }
    }
    else {
        return (
            <div role="status" className={`w-16 absolute top-1/2 left-1/2 -translate-y-8 -translate-x-8`}>
                {/*Spinny*/}
                <svg aria-hidden="true" className="text-gray-200 animate-spin dark:text-gray-600 fill-pink-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        )
    }
};

export default ViewWebnovelsComponent;


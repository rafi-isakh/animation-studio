"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthorAndWebnovelsAsideComponent from './AuthorAndWebnovelsAsideComponent';
import WebNovelInfoAndPictureComponent from './WebnovelInfoAndPictureComponent';
import ListOfChaptersComponent from './ListOfChaptersComponent';
import { Suspense } from 'react'


const ViewWebnovelsComponent = () => {
    const [loading, setLoading] = useState("Loading");
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();

    useEffect(() => {
        fetch(`http://localhost:5000/api/get_webnovel_byid?id=${id}`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                const webnovel: Webnovel = data;
                const email = webnovel.user.email;
                const name = webnovel.user.name;
                if (email) {
                    setEmail(email);
                }
                if (name) {
                    setUsername(name);
                }
                if (email) {
                    fetch(`http://localhost:5000/api/get_webnovel_byuser?user_email=${email}`)
                        .then(response => response.json())
                        .then(data => {
                            console.log(data)
                            // check if data is empty object
                            // only set if it isn't, because webnovels should be [] otherwise
                            if (data != "{}") {
                                setWebnovels(data)
                            }
                        })
                }
            })
        setLoading("Loaded");
    }, []);

    const handleNewChapter = () => {
        router.push(`/new_chapter?id=${id}`);
    }
    const getWebnovel = () => {
        return webnovels.find(w => w.id.toString() == id)
    }

    if (loading == "Loaded") {
        if (webnovels.length > 0) {
            return (
                <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
                    <AuthorAndWebnovelsAsideComponent webnovels={webnovels} username={username} />
                    <div className='w-3/4'>
                        <WebNovelInfoAndPictureComponent webnovel={getWebnovel()} />
                        <div>
                            <button onClick={handleNewChapter} className="mt-4 text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">새 글 업로드</button>
                        </div>
                        <ListOfChaptersComponent webnovel={getWebnovel()} />
                    </div>
                </div >
            )
        }
        else {
            return (
                <div className='max-w-screen-md w-full flex flex-row justify-center mx-auto'>
                    웹소설이 없습니다.
                </div>
            )
        }
    }
    else {
        return (
            <div></div>
        )
    }
};

const ViewWebnovelsComponentWrapper = () => {
    return (
        <Suspense>
            <ViewWebnovelsComponent />
        </Suspense>
    )
}

export default ViewWebnovelsComponentWrapper;


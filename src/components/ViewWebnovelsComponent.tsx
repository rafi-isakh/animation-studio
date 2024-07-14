"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthorAndWebnovelsAsideComponent from './AuthorAndWebnovelsAsideComponent';
import WebNovelInfoAndPictureComponent from './WebnovelInfoAndPictureComponent';
import ListOfChaptersComponent from './ListOfChaptersComponent';

const ViewWebnovelsComponent = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const [loading, setLoading] = useState("Loading");
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const id = searchParams.id;

    if (typeof id === 'string') {
    } else if (Array.isArray(id)) {
        throw new Error("there should be only one id param")
    } else {
    }
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const webnovelResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_byid?id=${id}`);
                const webnovelData = await webnovelResponse.json();

                if (Object.keys(webnovelData).length === 0) {
                    setLoading("No data");
                    return;
                }

                const webnovel : Webnovel = webnovelData;
                const { email: user_email, nickname: user_nickname } = webnovel.user;

                if (user_nickname) setNickname(user_nickname);
                if (user_email) {
                    setEmail(user_email);
                    const userWebnovelsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_byuser?user_email=${user_email}`);
                    const userWebnovelsData = await userWebnovelsResponse.json();

                    if (Object.keys(userWebnovelsData).length !== 0) {
                        setWebnovels(userWebnovelsData);
                    }
                }

                setLoading("Loaded");
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading("Error");
            }
        }

        fetchData();
    }, [id]); // Add id to dependency array if it's expected to change

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
                    <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname} />
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

export default ViewWebnovelsComponent;


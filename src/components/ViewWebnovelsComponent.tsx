"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthorAndWebnovelsAsideComponent from './AuthorAndWebnovelsAsideComponent';
import WebNovelInfoAndPictureComponent from './WebnovelInfoAndPictureComponent';
import ListOfChaptersComponent from './ListOfChaptersComponent';
import { useUser } from '@/contexts/UserContext';
import '@/styles/globals.css';


const ViewWebnovelsComponent = ({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) => {
    const [loading, setLoading] = useState("Loading");
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [nickname, setNickname] = useState("");
    const [authorEmail, setAuthorEmail] = useState("");
    const { email } = useUser();
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
                    setLoading("Loaded");
                    return;
                }

                const webnovel: Webnovel = webnovelData;
                const { email: author_email, nickname: user_nickname } = webnovel.user;

                if (user_nickname) setNickname(user_nickname);
                if (author_email) {
                    setAuthorEmail(author_email);
                    const userWebnovelsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels_byemail?email=${author_email}`);
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

        // my_webnovels passes in id only if there's at least one webnovel by logged in user
        if (id) fetchData();
        else setLoading("Loaded")
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
                <div className='max-w-screen-md flex md:flex-row flex-col justify-center mx-auto'>
                    <div className='w-full md:w-1/4'>
                        <AuthorAndWebnovelsAsideComponent webnovels={webnovels} nickname={nickname} />
                        <hr className='block md:hidden mt-4 mb-4 bg-black h-1'/>
                    </div>
                    <div className='w-full md:w-3/4'>
                        <WebNovelInfoAndPictureComponent webnovel={getWebnovel()} />
                        <div>
                            {
                                (authorEmail == email) ?
                                    <button onClick={handleNewChapter} className="button-style px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">새 글 업로드</button>
                                    :
                                    <div></div>
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


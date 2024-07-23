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
    const [loading, setLoading] = useState(true);
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [nickname, setNickname] = useState("");
    const [authorEmail, setAuthorEmail] = useState("");
    const { email } = useUser();
    const [atLeastOneWebnovel, setAtLeastOneWebnovel] = useState(false);
    const id = searchParams.id;
    const [refreshKey, setRefreshKey] = useState(0);

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
                if (!webnovelResponse.ok) {
                    if (webnovelResponse.status == 404) {
                        setAtLeastOneWebnovel(false);
                        setLoading(false);
                    }
                } else {
                    setAtLeastOneWebnovel(true);
                }
                const webnovelData = await webnovelResponse.json();
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
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        // my_webnovels passes in id only if there's at least one webnovel by logged in user
        if (id) fetchData();
        else setLoading(false)
    }, [id, refreshKey]); // Add id to dependency array if it's expected to change

    const handleNewChapter = () => {
        router.push(`/new_chapter?id=${id}`);
    }

    const handleDelete = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/delete_webnovel?id=${id}`);
            router.push('/my_webnovels');
            setRefreshKey(prevKey => prevKey + 1);
        } catch (error) {
            console.log(`Couldn't delete webnovel ${id}`, error)
        }
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
                        <hr className='block md:hidden mt-4 mb-4 bg-black h-1' />
                    </div>
                    <div className='w-full md:w-3/4'>
                        <WebNovelInfoAndPictureComponent webnovel={getWebnovel()} />
                        <div>
                            {
                                (authorEmail == email) &&
                                <div className='flex flex-col w-32'>
                                    <button onClick={handleNewChapter} className="button-style me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                                        새 글 업로드
                                    </button>
                                    <button onClick={handleDelete} className="button-style me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                                        삭제
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


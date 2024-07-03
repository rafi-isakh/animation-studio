"use client"
import { Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from "@/components/AuthContext"

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
                setWebnovels(data)
                if (data.length > 0) {
                    const ids = data.map((w: Webnovel) => w.id);
                    const first = Math.min(...ids)
                    window.history.pushState(null, '', `?id=${first}`)
                }
            })
    }, [email]);

    const getGenre = () => {
        const webnovel = getWebnovel();
        return webnovel?.genre
    }

    const getTitle = () => {
        const webnovel = getWebnovel();
        return webnovel?.title
    }

    const getUpvotes = () => {
        const webnovel = getWebnovel();
        return webnovel?.upvotes
    }

    const handleNewChapter = () => {
        router.push(`/new_chapter?id=${id}`);
    }

    const getCoverArt = () => {
        const webnovel = getWebnovel();
        return webnovel?.cover_art
    }
    const getWebnovel = () => {
        return webnovels.find(w => w.id.toString() == id)
    }

    if (webnovels.length > 0) {
        return (
            <div className='max-w-screen-xl w-full flex flex-row justify-center mx-auto'>
                {/* Aside component, titles of webnovels*/}
                <div className="flex flex-col space-y-4 w-1/3">
                    <p className="text-2xl">{username}님의 작품</p>
                    <div className="flex flex-col space-y-4">
                        {webnovels.map(webnovel => (
                            <Link href={`/my_webnovels?id=${webnovel.id}`} className="text-md hover:text-pink-600">{webnovel.title}</Link>
                        ))}
                    </div>
                </div>
                <div className='ml-20 w-2/3'>
                    {/* Top component, webnovel information and picture*/}
                    <div className='flex flex-row justify-between'>
                        <div className="flex flex-col space-y-4">
                            <p className="text-sm">{getGenre()}</p>
                            <p className="text-xl">{getTitle()}</p>
                            <p className="text-sm">{username}</p>
                            <p className='mt-10 text-sm'><i className="fa-regular fa-heart"></i> {getUpvotes()}</p>
                        </div>
                        <div>
                            <Image src={`/upload/${getCoverArt()}`} alt={getCoverArt()} width={120} height={200} />
                        </div>
                    </div>
                    {/* Upload new chapter component */}
                    <div>
                        <button onClick={handleNewChapter} className="mt-4 text-white bg-black hover:text-pink-600 font-medium text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">새 글 업로드</button>
                    </div>
                    {/* Bottom component, list of chapters*/}
                    <div className="relative overflow-x-auto mt-4">
                        <table className="w-full text-sm text-left rtl:text-right text-white">
                            <thead className="text-xs text-white uppercase bg-black">
                                <tr>
                                    <th scope="col" className="px-6 py-3">
                                        회차
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        작품명
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        작품등록일
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        조회
                                    </th>
                                    <th scope="col" className="px-6 py-3">
                                        좋아요
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const webnovel = getWebnovel();
                                    const chapters = webnovel?.chapters;
                                    return (
                                        chapters?.map((chapter) => (
                                            <tr className="bg-white">
                                                <th scope="row" className="px-6 py-4 font-medium text-black whitespace-nowrap hover:text-pink-600">
                                                    <p>{chapter.id}</p>
                                                </th>
                                                <th scope="row" className="px-6 py-4 font-medium text-black whitespace-nowrap hover:text-pink-600">
                                                    <Link href={`/chapter_view/${chapter.id}`} className="text-md">{chapter.title}</Link>
                                                </th>
                                            </tr>
                                        ))
                                    )
                                })()}

                            </tbody>
                        </table>
                    </div>
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


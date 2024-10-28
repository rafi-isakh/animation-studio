"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState } from 'react';
import WebnovelComponentSquare from "@/components/WebnovelComponentSquare"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import moment from 'moment';
import Image from 'next/image';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsListByEditor = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])

    useEffect(() => {
        for (const novel of webnovels) {
            novel.version = premium.includes(novel.id) ? "premium" : "free";
        }
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy))

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre]);


    const text = sortBy === 'views' ? 'popularWebnovels' :
                 sortBy === 'likes' ? 'likedWebnovels' :
                 sortBy === 'date' ? 'latestWebnovels' : '';

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }


    return (
        <div className='w-full max-w-screen-xl mx-auto flex flex-col mb-10'>
            <div className='flex flex-col md:flex-row'>
                <div className='md:w-[1/2] py-6 px-3 flex flex-col items-center justify-center '>
                    {/* {(webnovels.length > 0) ?
                        phrase(dictionary, text, language) : <></>
                    } */}

                    <h1 className='text-xl md:text-xl p-2 font-bold flex items-center gap-3'>
                      <div className="flex justify-center items-center">   
                        <Image
                            src="/N_Logo.png"
                            alt="Toonyz Logo"
                            width={35}
                            height={35}
                            sizes="100vh"
                            className='rounded-[25%] border border-gray-200'
                            /> 
                        </div>
                        <p>투니즈 에디터가 핸드 픽한 작품!</p>
                    </h1>

                    <p className='text-sm'> 투니즈 에디터가 한땀 한땀 핸드 픽한 작품들을 만나보세요. </p>
                    <button className='bg-pink-600 text-white font-extrabold px-6 py-3 rounded-xl text-md mt-5'>Explore more</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    {webnovelsToShow
                        .sort(sortByFn)
                        .map((item, index) => (
                            <div className=" " key={index}>
                                <WebnovelComponentSquare webnovel={item} index={index} ranking={true} />
                            </div>
                        ))}
                </div>
            </div>
        </div>
    )
};

export default WebnovelsListByEditor;
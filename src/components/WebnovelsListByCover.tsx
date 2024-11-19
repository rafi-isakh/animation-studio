"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelComponentPicture from "@/components/WebnovelComponentPicture"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import moment from 'moment';
import { ChevronLeft, ChevronRight } from "lucide-react"
import { scroll } from '@/utils/scroll'
import useMediaQuery from '@mui/material/useMediaQuery';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsListByCover = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

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
        <div className='relative md:max-w-screen-xl max-w-screen-80 mx-auto group'>
            {/* Left Arrow */}
            {/* <button 
                onClick={() => scroll('left', scrollRef)}
                className="absolute md:left-0 left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1/2 hidden md:block"
            >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
            */}
             <div className='md:px-5 px-2'>
                  {/* {(webnovels.length > 0) ?
                    phrase(dictionary, text, language) : <></>
                 } */}
                  <h1 className='flex flex-row justify-between text-left text-xl font-extrabold mb-7'>
                   {/* 실시간 인기작 추천 */}
                   {phrase(dictionary, "popularWebnovels", language)}
                    <span className="text-gray-400 text-[14px] md:block hidden">
                        {phrase(dictionary, "more", language)}
                    </span>

                  </h1>

                  <div 
                    ref={scrollRef}
                    className="flex overflow-x-auto no-scrollbar scroll-smooth md:gap-4 gap-0"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                     >
                    {webnovelsToShow
                        .sort((a, b) => sortByFn(a, b, sortBy))
                        .map((item, index) => (
                            <div key={index}>
                                <WebnovelComponentPicture webnovel={item} index={index} ranking={true} />
                            </div>
                        ))}
                   </div>
              </div>
            {/* Right Arrow */}
            {!isMobile && (
                <button
                    onClick={() => scroll('right', scrollRef)}
                    className="group-hover:opacity-100 transition-opacity duration-300 absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md opacity-0"
                >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
            )}
        </div>
    )
};

export default WebnovelsListByCover;
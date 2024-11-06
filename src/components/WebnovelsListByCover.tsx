"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelComponentPicture from "@/components/WebnovelComponentPicture"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import moment from 'moment';
import { ChevronLeft, ChevronRight } from "lucide-react"

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsListByCover = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200 * (direction === 'left' ? -1 : 1);
            scrollRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

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
        <div className='relative max-w-screen-xl mx-auto group m-10'>
            {/* Left Arrow */}
            <button 
                onClick={() => scroll('left')}
                className="absolute md:left-0 left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1/2 hidden md:block"
            >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
           
             <div className='md:px-1 px-2'>
                  {/* {(webnovels.length > 0) ?
                    phrase(dictionary, text, language) : <></>
                 } */}
                  <h1 className='text-left text-xl md:text-xl font-extrabold'>
                   {/* 실시간 인기작 추천 */}
                   {phrase(dictionary, "popularWebnovels", language)}
                 </h1>

            </div>
           
            <div 
                ref={scrollRef}
                className="flex overflow-x-auto no-scrollbar scroll-smooth gap-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {webnovelsToShow
                    .sort((a, b) => sortByFn(a, b, sortBy))
                    .map((item, index) => (
                        <div className="" key={index}>
                            <WebnovelComponentPicture webnovel={item} index={index} ranking={true} />
                        </div>
                    ))}
            </div>
            {/* Right Arrow */}
            <button 
                onClick={() => scroll('right')}
                className="absolute md:right-0 right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1/2 "
            >
                <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>

        </div>
    )
};

export default WebnovelsListByCover;
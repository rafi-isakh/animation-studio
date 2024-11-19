"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMediaQuery } from '@mui/material';
import { getColumnLayout, calculateIndex } from '@/utils/webnovelUtils';
import { scroll } from '@/utils/scroll'

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsList = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const [columns, setColumns] = useState<Webnovel[][]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [mobileGrid, setMobileGrid] = useState('');

    useEffect(() => {
        for (const novel of webnovels) {
            novel.version = premium.includes(novel.id) ? "premium" : "free";
        }
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy));

        setWebnovelsToShow(_webnovelsToShow);
        setColumns(getColumnLayout(_webnovelsToShow, 3, isMobile));
        const divider = Math.ceil(_webnovelsToShow.length / 3)
        const _mobileGrid = `grid-cols-${divider.toString()}`
        setMobileGrid(_mobileGrid)
    }, [version, genre, sortBy, webnovels]);


    const text = sortBy === 'views' ? 'popularWebnovels' :
                 sortBy === 'likes' ? 'likedWebnovels' :
                 sortBy === 'date' ? 'latestWebnovels' : '';

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    return (
        <div className='relative md:w-full w-full max-w-screen-xl mx-auto group'>
            {/* Left Arrow */}
            <button
                onClick={() => scroll('left', scrollRef)}
                className="absolute md:left-0 left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1/2 hidden md:block"
                >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>

            <div className='md:px-5 px-2 m-5 mb-10'>
                <h1 className="flex flex-row justify-between text-xl font-extrabold mb-7">
                    {/* {(webnovels.length > 0) ?
                        phrase(dictionary, text, language) : <></>
                    } */}

                    <span className='bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-400 inline-block text-transparent bg-clip-text'>
                    { language === 'ko' ? <>{phrase(dictionary, "ranking", language)} 🚀</> : "Toonyz's Top Series 🚀" }
                    </span>
                  
                   <span className="text-gray-400 text-[14px] md:block hidden">
                            {phrase(dictionary, "more", language)}
                   </span>
                </h1>
                <div className="overflow-x-auto no-scrollbar" ref={scrollRef}>
                    <div className={`grid ${mobileGrid} md:grid-cols-3 gap-2 min-w-max`}>
                        {columns.map((column, colIndex) => (
                            <div key={colIndex} className="space-y-4">
                                {column.map((item, rowIndex) => (
                                    <div key={rowIndex}>
                                        <WebnovelComponent webnovel={item} index={calculateIndex(rowIndex, colIndex, columns)} ranking={true} />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Arrow */}
            <button
                onClick={() => scroll('right', scrollRef)}
                className="absolute md:right-0 right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1/2 "
            >
                <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
        </div>
    )
};

export default WebnovelsList;
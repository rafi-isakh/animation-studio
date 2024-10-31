"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelComponentListForm from "@/components/WebnovelComponentListForm"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import { ChevronRight } from "lucide-react"
import Link from 'next/link';
import { getColumnLayout, calculateIndex } from '@/utils/webnovelUtils';
import useMediaQuery from '@mui/material/useMediaQuery';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsByTrends = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const [genreWebnovels, setGenreWebnovels] = useState<Webnovel[]>([])
    const [columns, setColumns] = useState<Webnovel[][]>([])
    const isMobile = useMediaQuery('(max-width: 768px)');

    const newAndTrendingRef = useRef<HTMLDivElement>(null);
    const readByGenreRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'right', containerRef: React.RefObject<HTMLDivElement>) => {
        const container = containerRef.current;
        if (container) {
            const scrollAmount = 200 * (direction === 'right' ? 1 : -1);
            container.scrollBy({
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
            .reverse()

        setWebnovelsToShow(_webnovelsToShow);

        setColumns(getColumnLayout(_webnovelsToShow, 3, isMobile));

        const genreRows = [];
        for (let i = 0; i < _webnovelsToShow.length; i += 3) {
            genreRows.push(_webnovelsToShow.slice(i, i + 3));
        }
        setGenreWebnovels(genreRows.flat());

    }, [version, genre, webnovels, sortBy]);

    return (
        <div className='relative max-w-screen-xl mx-auto px-4'>
            <div className="overflow-x-auto no-scrollbar flex md:flex-row flex-col justify-between gap-5 mt-10">
                {/* New and Trending List */}
                <div className='w-full'>
                    <h1 className='flex flex-row justify-between text-xl md:text-xl p-2 font-extrabold'>
                        {(webnovels.length > 0) ? phrase(dictionary, "newAndTrending", language) : <></>}
                        <span className='text-gray-400 text-[14px]'>더 보기</span>
                    </h1>
                    <div className="relative group">
                        <div className="grid grid-cols-3 md:grid-cols-1 gap-2 min-w-max overflow-x-auto" ref={newAndTrendingRef}>
                            {columns.map((column, colIndex) => (
                                <div key={colIndex} className="space-y-4">
                                    {column.map((item, rowIndex) => (
                                        <div key={rowIndex}>
                                            <WebnovelComponentListForm webnovel={item} index={calculateIndex(rowIndex, colIndex, columns)} ranking={true} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => scroll('right', newAndTrendingRef)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1/2 md:hidden"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>
                </div>

                {/* "Read by Genre" Section */}
                <div className='w-full'>
                    <h1 className='flex flex-row justify-between text-xl md:text-xl p-2 font-extrabold'>
                        요일별 인기작 <span className='text-gray-400 text-[14px]'>더보기</span>
                    </h1>
                    <div className="relative group">
                        <div className="grid grid-cols-3 md:grid-cols-1 gap-2 min-w-max overflow-x-auto" ref={readByGenreRef}>
                            {columns.map((column, colIndex) => (
                                <div key={colIndex} className="space-y-4">
                                    {column.map((item, rowIndex) => (
                                        <div key={rowIndex}>
                                            <WebnovelComponentListForm webnovel={item} index={calculateIndex(rowIndex, colIndex, columns)} ranking={true} />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => scroll('right', readByGenreRef)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1/2 md:hidden"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-700" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default WebnovelsByTrends
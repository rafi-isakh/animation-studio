"use client"
import { SortBy, Webnovel } from '@/components/Types';
import { useEffect, useState, useRef } from 'react';
import WebnovelComponentByRanking from "@/components/WebnovelComponentByRanking";
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import { ChevronRight } from "lucide-react";
import useMediaQuery from '@mui/material/useMediaQuery';
import { scroll } from '@/utils/scroll'

export const premium = [23, 19, 21, 22, 20, 24];
export const free = [29, 28, 25];

const WebnovelsByTrends = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const newAndTrendingRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        for (const novel of webnovels) {
            novel.version = premium.includes(novel.id) ? "premium" : "free";
        }
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy))
            .reverse();

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);

    return (
        <div className="group relative max-w-screen-xl mx-auto">
            <div className="no-scrollbar flex flex-col">
            
                <div className="md:px-5 px-2">
                    <h1 className="flex flex-row justify-between text-xl md:text-xl font-extrabold mb-7"> 
                        
                        {webnovels.length > 0 ? phrase(dictionary, "newAndTrending", language) : <></>}
                       
                        <span className="text-gray-400 text-[14px] md:block hidden">
                            {phrase(dictionary, "more", language)}
                        </span>
                    </h1>
                    <div className="relative">
                        <div 
                            ref={newAndTrendingRef} 
                            className="flex flex-row overflow-x-auto no-scrollbar"
                        >
                            {webnovelsToShow.map((item, index) => (
                                <div key={item.id} className="flex-none md:w-64">
                                    <WebnovelComponentByRanking 
                                        webnovel={item} 
                                        index={index + 1} 
                                        ranking={true}
                                    />
                                </div>
                            ))}
                        </div>
                        {!isMobile && (
                            <button
                                onClick={() => scroll('right', newAndTrendingRef)}
                                className="group-hover:opacity-100 transition-opacity duration-300 absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 shadow-md opacity-0"
                            >
                                <ChevronRight className="w-6 h-6 text-gray-700" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebnovelsByTrends;
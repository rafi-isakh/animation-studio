"use client"
import RankingGrid from "@/components/UI/RankingGrid";
import { SortBy, Webnovel } from '@/components/Types';
import { useEffect, useState, useRef } from 'react';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useWebnovels } from "@/contexts/WebnovelsContext";

export const premium = [23, 19, 21, 22, 20, 24];
export const free = [29, 28, 25];

export default function WebnovelsByRank({ searchParams, sortBy, title }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, title: string }) {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { webnovels } = useWebnovels();
    

    useEffect(() => {
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy))
            .slice(0, 7)

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);

    return (
        <div className='md:w-max-screen-xl w-full mx-auto h-full no-scrollbar'>
            <RankingGrid webnovels={webnovelsToShow} isMobile={isMobile} title={title}/>
        </div>
    )
}
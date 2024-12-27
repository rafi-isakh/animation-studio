"use client"
import { SortBy, Webnovel } from '@/components/Types';
import { useEffect, useState, useRef } from 'react';
import WebnovelPictureComponent from "@/components/WebnovelPictureComponent";
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import useMediaQuery from '@mui/material/useMediaQuery';
import WebnovelsCardList from '@/components/WebnovelsCardList';

export const premium = [23, 19, 21, 22, 20, 24];
export const free = [29, 28, 25];

const WebnovelsCardListByTrends = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const newAndTrendingRef = useRef<HTMLDivElement>(null);
    

    useEffect(() => {
        const _webnovels = webnovels.map(novel => ({
            ...novel,
            version: premium.includes(novel.id) ? "premium" : "free",
        }));

        const _webnovelsToShow = _webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy))

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);


    return (
        <WebnovelsCardList
            title={phrase(dictionary, "newAndTrends", language)}
            subtitle={phrase(dictionary, "more", language)}
            webnovels={webnovelsToShow}
            scrollRef={newAndTrendingRef}
            isMobile={isMobile}
            renderItem={(item: Webnovel, index: number) => (
                <WebnovelPictureComponent
                    webnovel={item} 
                    index={index + 1} 
                    ranking={true} 
                    details={true}
                    up={false}
                    isOriginal={false}
                />
            )}
        />
    );
};

export default WebnovelsCardListByTrends;
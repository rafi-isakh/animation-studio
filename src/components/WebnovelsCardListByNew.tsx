"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelPictureComponent from "@/components/WebnovelPictureComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import useMediaQuery from '@mui/material/useMediaQuery';
import WebnovelsCardList from '@/components/WebnovelsCardList';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsCardListByNew = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
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

    const sortedWebnovels = webnovelsToShow
    .sort((a, b) => sortByFn(a, b, sortBy));

        return (
            <WebnovelsCardList
                title={phrase(dictionary, "popularWebnovels", language)}
                subtitle={phrase(dictionary, "more", language)}
                webnovels={sortedWebnovels}
                scrollRef={scrollRef}
                isMobile={isMobile}
                renderItem={(item: Webnovel, index: number) => (
                    <WebnovelPictureComponent 
                        webnovel={item} 
                        index={index + 1} 
                        ranking={true} 
                        details={false}
                    />
            )}
        />
        )
    };

export default WebnovelsCardListByNew;
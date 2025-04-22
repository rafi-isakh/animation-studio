"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef, useMemo } from 'react';
import WebnovelPictureComponent from "@/components/WebnovelPictureComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import useMediaQuery from '@mui/material/useMediaQuery';
import WebnovelsCardList from '@/components/WebnovelsCardList';
import { useWebnovels } from '@/contexts/WebnovelsContext';

const WebnovelsCardListByCategory = ({ searchParams, genre, sortBy, title, version = 'premium' }: 
    { searchParams: { [key: string]: string | string[] | undefined }, genre: string | undefined, sortBy: SortBy, title: string, version?: string }) => {
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { webnovels } = useWebnovels();

    useEffect(() => {
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .filter(item => item.chapters_length > 0)
            .sort((a, b) => sortByFn(a, b, sortBy))

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    if (webnovelsToShow.length === 0) {
        return <></>
    }

    return (
        <>
        <WebnovelsCardList
            title={phrase(dictionary, title, language)}
            subtitle={phrase(dictionary, "more", language)}
            webnovels={webnovelsToShow}
            scrollRef={scrollRef}
            isMobile={isMobile}
            renderItem={(item: Webnovel) => (
                <WebnovelPictureComponent
                    webnovel={item}
                />
            )}
        />
        <div className='md:h-[2rem] h-[1rem]' />
        </>
    )
};

export default WebnovelsCardListByCategory;
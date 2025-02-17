"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef, useMemo } from 'react';
import WebnovelPictureComponent from "@/components/WebnovelPictureComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import useMediaQuery from '@mui/material/useMediaQuery';
import WebnovelsCardList from '@/components/WebnovelsCardList';

const WebnovelsCardListByNew = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    useEffect(() => {
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy))
            .slice(0, 6)

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    return (
        <WebnovelsCardList
            //New Releases
            title={phrase(dictionary, "newReleasesWebnovels", language)}
            subtitle={phrase(dictionary, "more", language)}
            webnovels={webnovelsToShow}
            scrollRef={scrollRef}
            isMobile={isMobile}
            renderItem={(item: Webnovel, index: number) => (
                <WebnovelPictureComponent
                    webnovel={item}
                    index={index + 1}
                    ranking={false}
                    details={false}
                    up={false}
                    isOriginal={false}
                />
            )}
        />
    )
};

export default WebnovelsCardListByNew;
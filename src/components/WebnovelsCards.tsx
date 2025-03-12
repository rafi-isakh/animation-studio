"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef, useMemo } from 'react';
import WebnovelPictureCardWrapper from "@/components/UI/WebnovelPictureCardWrapper"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import WebnovelsAllCardWrapper from '@/components/UI/WebnovelsAllCardWrapper';
import { filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import { filter_by_genre } from '@/utils/webnovelUtils';
import { useWebnovels } from '@/contexts/WebnovelsContext';

const WebnovelsCardListByNew = ({ searchParams, sortBy }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { webnovels } = useWebnovels();
    // const currentSort = searchParams.get('sort') || 'latest';

    useEffect(() => {
        console.log("webnovels cardlist by new before filter", webnovels);
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy))
            .slice(0, 27)

        setWebnovelsToShow(_webnovelsToShow);
        console.log("webnovels cardlist by new", _webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    return (
        <div className='relative md:max-w-screen-xl group font-pretendard'>
            <WebnovelsAllCardWrapper
                title={phrase(dictionary, "recommended", language)}
                webnovels={webnovelsToShow}
                scrollRef={scrollRef}
                renderItem={(item: Webnovel, index: number) => (
                    <WebnovelPictureCardWrapper
                        webnovel={item}
                        index={index + 1}
                        ranking={false}
                        details={false}
                        up={false}
                        isOriginal={false}
                    />
                )}
            />
        </div>
    )
};

export default WebnovelsCardListByNew;
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

const WebnovelsCardListByNew = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    // const currentSort = searchParams.get('sort') || 'latest';

    useEffect(() => {
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy))
            .slice(0, 27)

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    return (
        <div className='relative w-screen mx-auto group font-pretendard'>
            <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                <span className='text-black dark:text-white'>
                    {phrase(dictionary, "recommended", language)}
                </span>
            </h1>
            <WebnovelsAllCardWrapper
                title={''}
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
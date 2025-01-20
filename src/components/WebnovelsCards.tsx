"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef, useMemo } from 'react';
import WebnovelPicture from "@/components/WebnovelPicture"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import Link from 'next/link';
import WebnovelsAllCardWrapper from '@/components/UI/WebnovelsAllCardWrapper';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsCardListByNew = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    // const currentSort = searchParams.get('sort') || 'latest';

    useEffect(() => {
        const _webnovels = webnovels.map(novel => ({
            ...novel,
            version: premium.includes(novel.id) ? "premium" : "free",
        }));
        const _webnovelsToShow = _webnovels

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    return (
        <>
        <div className='md:max-w-screen-lg w-full mx-auto flex flex-row justify-end'> 
            <ul className="font-pretendard flex flex-row text-[12px]">
                <li>
                    <Link href='/' className="px-2">
                        {/* 최신순 */}
                        {phrase(dictionary, "latest", language)}
                    </Link>
                </li>
                <li className="border-l border-gray-300 dark:border-gray-600">
                    <Link href='/' className="px-2">
                        {/* 좋아요순	 */}
                        {phrase(dictionary, "mostLiked", language)}
                    </Link>
                </li>
                <li className="border-l border-gray-300 dark:border-gray-600">
                    <Link href='/' className="px-2">
                        {/* 구독순	 */}
                        {phrase(dictionary, "mostSubscribed", language)}
                    </Link>
                </li>
            </ul>
        </div>
            <WebnovelsAllCardWrapper
                title={''}
                webnovels={webnovelsToShow}
                scrollRef={scrollRef}
                renderItem={(item: Webnovel, index: number) => (
                    <WebnovelPicture
                        webnovel={item}
                        index={index + 1}
                        ranking={false}
                        details={false}
                        up={false}
                        isOriginal={false}
                    />
                )}
            />
        </>
    )
};

export default WebnovelsCardListByNew;
"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelPictureCardWrapper from "@/components/UI/WebnovelPictureCardWrapper"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import useMediaQuery from '@mui/material/useMediaQuery';
import WebnovelsAllCardWrapper from '@/components/UI/WebnovelsAllCardWrapper';
import { filter_by_genre, filter_by_version, sortByFn, filter_by_adult_material } from '@/utils/webnovelUtils';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { useUser } from '@/contexts/UserContext';

const WebnovelsCardListByNew = ({ searchParams, sortBy, title, genre, is_adult_material = false, mode = 'sub_page', version = 'premium' }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, title: string, genre?: string, is_adult_material?: boolean, mode?: 'main_page' | 'sub_page', version?: string }) => {
    // const genre = searchParams.genre as string | undefined;
    //const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { webnovels } = useWebnovels();
    const { genres } = useUser();
    // const currentSort = searchParams.get('sort') || 'latest';

    useEffect(() => {
        let _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .filter(item => filter_by_adult_material(item, is_adult_material))
            .filter(item => item.chapters_length > 0)
            .sort((a, b) => sortByFn(a, b, sortBy, genres))

        if (isMobile) {
            if (mode === 'main_page') {
                _webnovelsToShow = _webnovelsToShow.slice(0, 9)
            } else {
                _webnovelsToShow = _webnovelsToShow.slice(0, 24)
            }
        } else {
            if (mode === 'main_page') {
                _webnovelsToShow = _webnovelsToShow.slice(0, 12)
            } else {
                _webnovelsToShow = _webnovelsToShow.slice(0, 30)
            }
        }

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre, webnovels, sortBy]);

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    return (
        <div className='relative md:max-w-screen-xl group font-pretendard'>
            <WebnovelsAllCardWrapper
                title={phrase(dictionary, title, language)}
                webnovels={webnovelsToShow}
                scrollRef={scrollRef}
                isMobile={isMobile}
                renderItem={(item: Webnovel) => (
                    <WebnovelPictureCardWrapper
                        webnovel={item}
                    />
                )}
            />
        </div>
    )
};

export default WebnovelsCardListByNew;
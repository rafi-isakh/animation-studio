"use client"

import { Webnovel, SortBy } from '@/components/Types'
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'
import WebnovelsCards from '@/components/WebnovelsCards';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import WebnovelPictureCardWrapper from '@/components/UI/WebnovelPictureCardWrapper';
import WebnovelsAllCardWrapper from '@/components/UI/WebnovelsAllCardWrapper';
import GenresList from '@/components/GenresList';

const ExplorePage = ({ sortBy }: { sortBy: SortBy }) => { //{ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [allWebnovels, setAllWebnovels] = useState<Webnovel[]>([]);
    const genre = searchParams.get('genre') || undefined;
    const version = searchParams.get('version') || undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { webnovels } = useWebnovels();
    // const currentSort = searchParams.get('sort') || 'latest';

    useEffect(() => {
        const fetchAllWebnovels = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/get_webnovels_metadata');
                if (!response.ok) {
                    throw new Error('Failed to fetch webnovels');
                }
                const data = await response.json();
                setAllWebnovels(data);
            } catch (error) {
                console.error('Error fetching webnovels:', error);
                setAllWebnovels([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllWebnovels();
    }, []);


    // useEffect(() => {
    //     console.log("webnovels cardlist by new before filter", webnovels);
    //     const _webnovelsToShow = webnovels
    //         .filter(item => filter_by_genre(item, genre))
    //         .filter(item => filter_by_version(item, version))
    //         .sort((a, b) => sortByFn(a, b, sortBy))
    //         .slice(0, 27)

    //     setWebnovelsToShow(_webnovelsToShow);
    //     console.log("webnovels cardlist by new", _webnovelsToShow);
    // }, [version, genre, webnovels, sortBy]);

    // if (typeof genre === 'string') {
    // } else if (Array.isArray(genre)) {
    //     throw new Error("there should be only one genre param")
    // } else {
    // }

    return (
        <div className='relative md:max-w-screen-xl w-full mx-auto font-pretendard'>
            <div className="flex flex-row justify-between text-xl font-extrabold mb-3">
                <GenresList />
            </div>
            <WebnovelsAllCardWrapper
                title={''}
                webnovels={allWebnovels}
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

export default ExplorePage;
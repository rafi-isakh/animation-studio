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
import {
        GenresTabs,
        AllGenres,
        RomanceGenres,
        FantasyGenres,
        SciFiGenres,
        BLGenres,
        DramaGenres,
        RomanceFantasyGenres,
        LoveComedyGenres
} from '@/components/UI/GenresTabs';

const ExplorePage = () => {
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

    const getCarouselItems = (webnovels: Webnovel[]) => {
        //
    }

    const tabsConfig = [
        {
            label: "All Genres",
            genre: "allGenres",
            Component: () => (
                <AllGenres>
                    {/* <CarouselComponentReactSlick items={items} slidesToShow={1} showDots={true} centerPadding={{ desktop: '10px', mobile: '24px' }} /> */}
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
                </AllGenres>
            ),
            color: "#F9B294"
        },
        {
            label: "Romance",
            genre: "romance",
            Component: () => (
                <RomanceGenres webnovels={allWebnovels} />
            ),
            color: "#F2727F"
        },
        {
            label: "Fantasy",
            genre: "fantasy",
            Component: () => (
                <FantasyGenres webnovels={allWebnovels} />
            ),
            color: "#F89E8D"
        },
        {
            label: "Sci-Fi",
            genre: "sf",
            Component: () => (
                <SciFiGenres webnovels={allWebnovels} />
            ),
            color: "#F78A86"
        },
        {
            label: "BL",
            genre: "bl",
            Component: () => (
                <BLGenres webnovels={allWebnovels} />
            ),
            color: "#F2727F"
        },
        {
            label: "Drama",
            genre: "drama",
            Component: () => (
                <DramaGenres webnovels={allWebnovels} />
            ),
            color: "#0C34F0"
        },
        {
            label: "Romance Fantasy",
            genre: "romanceFantasy",
            Component: () => (
                <RomanceFantasyGenres webnovels={allWebnovels}/>
            ),
            color: "#F0BA18"
        },
        {
            label: "Love Comedy",
            genre: "loveComedy",
            Component: () => (
                <LoveComedyGenres webnovels={allWebnovels}/>
            ),
            color: "#F0183C"
        },
    ];

    return (
        <div className='relative md:max-w-screen-xl w-full mx-auto font-pretendard'>
            <div className='relative w-full mx-auto'>
                <GenresTabs tabs={tabsConfig} type="tabs" orientation="horizontal" />
            </div>
        </div>
    )
};

export default ExplorePage;
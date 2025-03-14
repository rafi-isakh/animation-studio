"use client"

import { Webnovel } from '@/components/Types'
import { useWebnovels } from '@/contexts/WebnovelsContext';
import {  temporarilyUnpublished } from '@/utils/webnovelUtils';
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
import { useRef } from 'react';

const ExplorePage = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    let { webnovels } = useWebnovels();
    webnovels = webnovels.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));

    const tabsConfig = [
        {
            label: "All Genres",
            genre: "allgenres",
            Component: () => (
                <AllGenres>
                    {/* <CarouselComponentReactSlick items={items} slidesToShow={1} showDots={true} centerPadding={{ desktop: '10px', mobile: '24px' }} /> */}
                    <WebnovelsAllCardWrapper
                        title={''}
                        webnovels={webnovels}
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
                <RomanceGenres webnovels={webnovels} />
            ),
            color: "#F2727F"
        },
        {
            label: "Fantasy",
            genre: "fantasy",
            Component: () => (
                <FantasyGenres webnovels={webnovels} />
            ),
            color: "#F89E8D"
        },
        {
            label: "Sci-Fi",
            genre: "sf",
            Component: () => (
                <SciFiGenres webnovels={webnovels} />
            ),
            color: "#F78A86"
        },
        {
            label: "BL",
            genre: "bl",
            Component: () => (
                <BLGenres webnovels={webnovels} />
            ),
            color: "#F2727F"
        },
        {
            label: "Drama",
            genre: "drama",
            Component: () => (
                <DramaGenres webnovels={webnovels} />
            ),
            color: "#0C34F0"
        },
        {
            label: "Romance Fantasy",
            genre: "romanceFantasy",
            Component: () => (
                <RomanceFantasyGenres webnovels={webnovels}/>
            ),
            color: "#F0BA18"
        },
        {
            label: "Love Comedy",
            genre: "loveComedy",
            Component: () => (
                <LoveComedyGenres webnovels={webnovels}/>
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
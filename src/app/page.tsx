import WebnovelsList from '@/components/WebnovelsList'
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
import BookmarkButton from '@/components/BookmarkButton';
import WebnovelsCardListByNew from '@/components/WebnovelsCardListByNew';
import WebnovelsCardListByRank from '@/components/WebnovelsCardListByRank';
import CarouselComponent from '@/components/CarouselComponent';
import Preloader from '@/components/Preloader';
import ApplyCreatorBanner from '@/components/ApplyCreatorBanner';
import PromotionBannerComponent from '@/components/PromotionBannerComponent';
import TrailerCardComponent from '@/components/TrailerCardComponent';
import MenuItemsComponent from '@/components/MenuItemsComponent';
import { cookies } from 'next/headers';
import WebnovelsCards from '@/components/WebnovelsCards';
import WebnovelsByRank from '@/components/WebnovelsByRank';
import PromotionModalWrapper from '@/components/UI/PromotionModalWrapper';
import { useEffect } from 'react';
import { Webnovel } from '@/components/Types';
import LanguageSetter from '@/components/LanguageSetter';

async function getCarouselItems() {
    const start = performance.now()
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_carousel_items`)
    if (!response.ok) {
        throw new Error("Failed to fetch carousel items", { cause: response.status });
    }
    const end = performance.now()
    console.log('getCarouselItems', end - start)
    return response.json();
}

async function getWebnovelsMetadata() {
    const start = performance.now()
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webnovels_metadata`)
    if (!response.ok) {
        throw new Error("Failed to fetch webnovels", { cause: response.status });
    }
    const end = performance.now()
    console.log('getWebnovelsMetadata', end - start)
    return response.json();
}



const temporarilyUnpublished = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79];

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    
    let items = await getCarouselItems();
    let webnovels = await getWebnovelsMetadata();
    // webnovels = webnovels.filter((novel: Webnovel) => !premium.includes(novel.id));
    if (searchParams.version === 'free') {
        // items = items.filter((item: any) => !webnovels.find((novel: Webnovel) => novel.id === item.webnovel_id).premium);
        webnovels = webnovels.filter((novel: Webnovel) => !novel.premium);
    } else if (searchParams.version === 'premium') {
        // items = items.filter((item: any) => webnovels.find((novel: Webnovel) => novel.id === item.webnovel_id).premium);
        webnovels = webnovels.filter((novel: Webnovel) => novel.premium);
    }
    webnovels = webnovels.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));
    const carouselFilter = [22, 24, 19]
    items = items.filter((item: any) => !carouselFilter.includes(item.webnovel_id));

    const largeGap = () => {
        return (
            <div className='md:h-[3rem] h-[2rem]' />
        )
    }

    const smallGap = () => {
        return (
            <div className='md:h-[2rem] h-[1rem]' />
        )
    }

    return (
        <div>
            <LanguageSetter />
            <PromotionModalWrapper />
            <ApplyCreatorBanner />  
            {/* gap and padding settings md:gap-[5rem] gap-[3rem] */}
            <div className='flex flex-col md:justify-start md:items-start md:px-0'>
                <CarouselComponentReactSlick items={items} slidesToShow={1} showDots={true} centerPadding={{ desktop: '300px', mobile: '24px' }}  />
                {smallGap()}
               <div className='px-4 md:px-0 w-full mx-auto'>
                    <MenuItemsComponent />
                    {smallGap()}
                    <WebnovelsCards searchParams={searchParams} webnovels={webnovels} sortBy="recommendation" />    
                    {smallGap()}
                    <WebnovelsCardListByNew searchParams={searchParams} webnovels={webnovels} sortBy='date' />
                    {largeGap()}
                    <WebnovelsByRank searchParams={searchParams} webnovels={webnovels} sortBy='views'/>
                    {largeGap()}
                </div>
                <div className='px-4 w-full mx-auto'>
                    <CarouselComponent items={items} searchParams={searchParams} webnovels={webnovels} />
                </div>
                {/* {largeGap()}
                <TrailerCardComponent /> */}
                {largeGap()}
                <PromotionBannerComponent />
            </div>
            <Footer/>
        </div>
    );
}

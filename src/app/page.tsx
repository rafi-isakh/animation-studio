"use client"
import WebnovelsList from '@/components/WebnovelsList'
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
import BookmarkButton from '@/components/BookmarkButton';
import WebnovelsCardListByNew from '@/components/WebnovelsCardListByNew';
import Promotion from '@/components/Promotion';
import WebnovelsCardListByTrends from '@/components/WebnovelsCardListByTrends';
import CarouselComponent from '@/components/CarouselComponent';
import Preloader from '@/components/Preloader';
import ApplyCreatorBanner from '@/components/ApplyCreatorBanner';
import PromotionBannerComponent from '@/components/PromotionBannerComponent';
import CircularMenuItemsComponent from '@/components/CircularMenuItemsComponent';
import { useEffect, useState } from 'react';
import { SlickCarouselItem, Webtoon } from '@/components/Types';
import { Webnovel } from '@/components/Types';

async function getCarouselItems() {
    const start = performance.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_carousel_items`)
    const data = await response.json()
    const end = performance.now();
    console.log(`getCarouselItems took ${end - start} milliseconds`)
    return data;
}

async function getWebnovels() {
    const start = performance.now();
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels`) 
    const data = await response.json();
    const end = performance.now();
    console.log(`getWebnovels took ${end - start} milliseconds`)
    return data;
}

export default function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {

    const [items, setItems] = useState<SlickCarouselItem[]>([]);
    const [webnovels, setWebnovels] = useState<Webnovel[]>([]);
    const [showPreloader, setShowPreloader] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const didSelectLanguage = localStorage.getItem('didSelectLanguage')
        if (didSelectLanguage) {
            setShowPreloader(false)
        }
        const fetchData = async () => {
            const _items = await getCarouselItems();
            const _webnovels = await getWebnovels();
            setItems(_items);
            setWebnovels(_webnovels);
            setLoading(false)
        }
        fetchData();
    }, [])

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
            {showPreloader && <Preloader />}

            <ApplyCreatorBanner />
            {/* gap and padding settings  md:gap-[5rem] gap-[3rem] */}
            <div className='flex flex-col md:justify-start md:items-start px-4 md:px-0'>
                <CarouselComponentReactSlick items={items} slidesToShow={1} indicator={true} centerPadding={{ desktop: '50px', mobile: '14px' }}  />
                {smallGap()}
                <CircularMenuItemsComponent />
                {smallGap()}
                <WebnovelsCardListByNew searchParams={searchParams} webnovels={webnovels} sortBy='date' />
                {largeGap()}
                <WebnovelsCardListByTrends searchParams={searchParams} webnovels={webnovels} sortBy='views' />
                {largeGap()}
                <div className='w-full mx-auto'>
                    <CarouselComponent items={items} searchParams={searchParams} webnovels={webnovels} />
                </div>
                {largeGap()}
                <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='views' />
                {largeGap()}
                <PromotionBannerComponent />
            </div>

            <Footer />
            {/* Bookmark button : Only displys in mobile screen */}
            <BookmarkButton />
        </div>
    );
}

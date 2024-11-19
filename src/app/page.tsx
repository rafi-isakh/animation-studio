import WebnovelsList from '@/components/WebnovelsList'
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
import BookmarkButton from '@/components/BookmarkButton';
import WebnovelsListByCover from '@/components/WebnovelsListByCover';
import Promotion from '@/components/Promotion';
import WebnovelsByTrends from '@/components/WebnovelsByTrends';
import CarouselComponent from '@/components/CarouselComponent';

import Preloader from '@/components/Preloader';
import { cookies } from 'next/headers'
import ApplyCreatorBanner from '@/components/ApplyCreatorBanner';
// import ThemeToggle from '@/components/ThemeToggle'   
import PromotionBannerComponent from '@/components/PromotionBannerComponent';
async function getCarouselItems() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_carousel_items`)
    const data = await response.json()
    return data;
}

async function getWebnovels() {
    const response = fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels`)
    const data = (await response).json();
    return data;

}

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const cookieStore = cookies()
    const didSelectLanguage = cookieStore.get('didSelectLanguage')
    const showPreloader = !didSelectLanguage

    const items = await getCarouselItems();
    const webnovels = await getWebnovels();

    return (
        <div>
            {showPreloader && <Preloader />}    
            {/* 0. Top banner : applying a creator */}
            <ApplyCreatorBanner />
            <div className='flex flex-col justify-start  md:gap-[5rem] gap-[3rem]'>
                {/* 1. Carousel */}
                <CarouselComponentReactSlick items={items} searchParams={searchParams} webnovels={webnovels} />
                {/* 2. Real Time Popular Webnovels */}
                <WebnovelsListByCover searchParams={searchParams} webnovels={webnovels} sortBy='views' />
                {/* 3. Webnovels by new trends */}
                <WebnovelsByTrends searchParams={searchParams} webnovels={webnovels} sortBy='views' />
                {/* 4. webnovels list by ranking */}
                <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='views' />  
                {/* 5. only Toonyz : Carousel */}
                <div className='bg-black w-full mx-auto '>
                    <CarouselComponent items={items} searchParams={searchParams} webnovels={webnovels} />
                </div>
                {/* 6. Event promotion part */}
                {/* <Promotion /> */}
                {/* 7. Footer Banner : instagram promotion image */}
                <PromotionBannerComponent />
                </div>
            {/* 8. Footer */}
            <Footer />
            {/* Bookmark button : Only displys mobile screen */}
            <BookmarkButton />
        </div>
    );
}

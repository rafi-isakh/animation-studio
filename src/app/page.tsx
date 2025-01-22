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
import { useEffect } from 'react';
import { Webnovel } from '@/components/Types';

async function getCarouselItems() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_carousel_items`)
    if (!response.ok) {
        throw new Error("Failed to fetch carousel items", { cause: response.status });
    }
    return response.json();
}

async function getWebnovels() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webnovels`)
    if (!response.ok) {
        throw new Error("Failed to fetch webnovels", { cause: response.status });
    }
    return response.json();
}
export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const cookieStore = cookies()
    const didSelectLanguage = cookieStore.get('didSelectLanguage')
    const showPreloader = !didSelectLanguage
    let items = await getCarouselItems();
    const premiumCarousel = [97, 98]
    items = items.filter((item: any) => !premiumCarousel.includes(item.id));
    console.log(items)
    const premium = [23, 19, 21, 22, 20, 24];
    let webnovels = await getWebnovels();
    webnovels = webnovels.filter((novel: Webnovel) => !premium.includes(novel.id));


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
            {/* gap and padding settings md:gap-[5rem] gap-[3rem] */}
            <div className='flex flex-col md:justify-start md:items-start md:px-0'>
                <CarouselComponentReactSlick items={items} slidesToShow={1} showDots={true} centerPadding={{ desktop: '300px', mobile: '24px' }}  />
                {smallGap()}
               <div className='px-4 md:px-0 w-full mx-auto'>
                    <MenuItemsComponent />
                    {smallGap()}
                    <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy="date" />
                    {smallGap()}
                    <WebnovelsCards searchParams={searchParams} webnovels={webnovels} sortBy="date" />    
                    {smallGap()}
                    <WebnovelsCardListByNew searchParams={searchParams} webnovels={webnovels} sortBy='date' />
                    {largeGap()}
                    <WebnovelsByRank searchParams={searchParams} webnovels={webnovels} sortBy='views'/>
                    {/* <WebnovelsCardListByRank searchParams={searchParams} webnovels={webnovels} sortBy='views' /> */}
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

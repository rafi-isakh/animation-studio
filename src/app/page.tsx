import WebnovelsList from '@/components/WebnovelsList'
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
import BookmarkButton from '@/components/BookmarkButton';
import WebnovelsCardListByNew from '@/components/WebnovelsCardListByNew';
import Promotion from '@/components/Promotion';
import WebnovelsCardListByTrends from '@/components/WebnovelsCardListByTrends';
import CarouselComponent from '@/components/CarouselComponent';
import Preloader from '@/components/Preloader';
import { cookies } from 'next/headers'
import ApplyCreatorBanner from '@/components/ApplyCreatorBanner';
import PromotionBannerComponent from '@/components/PromotionBannerComponent';
import CircularMenuItemsComponent from '@/components/CircularMenuItemsComponent';
import TrailerCardComponent from '@/components/TrailerCardComponent';

async function getCarouselItems() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_carousel_items`)
    const data = await response.json()
    return data;
}

async function getWebnovels() {
    const response = fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovels`) // probably should get rid of this function
    const data = (await response).json();
    return data;

}

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const cookieStore = cookies()
    const didSelectLanguage = cookieStore.get('didSelectLanguage')
    const showPreloader = !didSelectLanguage
    const items = await getCarouselItems();
    const webnovels = await getWebnovels();

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
                <CarouselComponentReactSlick items={items} searchParams={searchParams} webnovels={webnovels} slidesToShow={1} indicator={true} centerPadding={{ desktop: '50px', mobile: '14px' }}  />
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
                <TrailerCardComponent />
                {largeGap()}
                <PromotionBannerComponent />
            </div>

            <Footer />
            {/* Bookmark button : Only displys in mobile screen */}
            <BookmarkButton />
        </div>
    );
}

import WebnovelsList from '@/components/WebnovelsList'
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
import BookmarkButton from '@/components/BookmarkButton';
import WebnovelsCardListByNew from '@/components/WebnovelsCardListByNew';
import WebnovelsCardListByTrends from '@/components/WebnovelsCardListByTrends';
import CarouselComponent from '@/components/CarouselComponent';
import Preloader from '@/components/Preloader';
import ApplyCreatorBanner from '@/components/ApplyCreatorBanner';
import PromotionBannerComponent from '@/components/PromotionBannerComponent';
import CircularMenuItemsComponent from '@/components/CircularMenuItemsComponent';
import { cookies } from 'next/headers';

async function getCarouselItems() {
    const response = await fetch('/api/get_carousel_items')
    if (!response.ok) {
        throw new Error("Failed to fetch carousel items", { cause: response.status });
    }
    return response.json();
}

async function getWebnovels() {
    const response = await fetch('/api/get_webnovels')
    if (!response.ok) {
        throw new Error("Failed to fetch webnovels", { cause: response.status });
    }
    return response.json();
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

import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
import WebnovelsCardListByNew from '@/components/WebnovelsCardListByNew';
import CarouselComponent from '@/components/CarouselComponent';
import Preloader from '@/components/Preloader';
import ApplyCreatorBanner from '@/components/ApplyCreatorBanner';
import PromotionBannerComponent from '@/components/PromotionBannerComponent';
import MenuItemsComponent from '@/components/MenuItemsComponent';
import { cookies } from 'next/headers';
import WebnovelsCards from '@/components/WebnovelsCards';
import WebnovelsByRank from '@/components/WebnovelsByRank';
import PromotionModalWrapper from '@/components/UI/PromotionModalWrapper';
import { Webnovel } from '@/components/Types';
import { auth } from '@/auth';
import MyReadingListComponent from '@/components/MyReadingListComponent';

async function getCarouselItems() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_carousel_items`)
    if (!response.ok) {
        throw new Error("Failed to fetch carousel items", { cause: response.status });
    }
    return response.json();
}

async function getLibrary() {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
        return [];
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_library?email=${email}`,{
        cache: 'no-store',
        headers: {
            'Cookie': cookies().toString(),
        }
    }
    )
    if (!response.ok) {
        console.error("Failed to fetch library", response.status);
    }
    const data = await response.json();
    return data.library;
}

const temporarilyUnpublished = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79];

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    let items = await getCarouselItems();
    let library = await getLibrary() || [];
    library = library.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));
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
        <div className='relative flex flex-col justify-center items-center w-full'>
            <div className='flex-1 w-full md:max-w-screen-xl overflow-hidden'>
                {/*    The side bar width is 72px  md:pl-[72px]  */}
                {/* Side bar/Bottom Navigation are in layout.tsx */}
                <CarouselComponentReactSlick items={items} slidesToShow={1} showDots={true} centerPadding={{ desktop: '10px', mobile: '24px' }} />
                {smallGap()}
                <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                    {/* justify-center items-center w-full mx-auto for putting the contents in the center */}
                    {smallGap()}
                    <MyReadingListComponent library={library} />
                    {smallGap()}
                    <WebnovelsCards searchParams={searchParams} sortBy="recommendation" />    
                    {smallGap()}
                    <WebnovelsCardListByNew searchParams={searchParams} sortBy='date' />
                    {largeGap()}
                    <WebnovelsByRank searchParams={searchParams} sortBy='views' />
                    {largeGap()}
                    <CarouselComponent items={items} searchParams={searchParams} />
                    {largeGap()}
                    <PromotionBannerComponent />
                </div>
            </div>
            <Footer />
        </div>
    );
}

import Footer from '@/components/Footer';
import WebnovelsCardListByNew from '@/components/WebnovelsCardListByNew';
import CarouselComponentShadcn from '@/components/UI/CarouselComponentShadcn';
import PromotionBannerComponent from '@/components/PromotionBannerComponent';
import { cookies } from 'next/headers';
import WebnovelsCards from '@/components/WebnovelsCards';
import WebnovelsByRank from '@/components/WebnovelsByRank';
import { Webnovel } from '@/components/Types';
import { auth } from '@/auth';
import MyReadingListComponent from '@/components/MyReadingListComponent';
import { temporarilyUnpublished } from '@/utils/webnovelUtils';
import { ToonyzPostCards } from '@/components/UI/CollectionGrid';
import { Suspense } from 'react';

// Create a loading component for each section
const SectionLoading = () => (
    <div className="animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
);

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
                {/* <CarouselComponentReactSlick items={items} centerMode={true} centerPadding={{ desktop: '10px', mobile: '30px' }} /> */}
                <Suspense fallback={<SectionLoading />}>
                    <CarouselComponentShadcn items={items} />
                </Suspense>
                {smallGap()}
                <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                    {/* justify-center items-center w-full mx-auto for putting the contents in the center */}
                    {smallGap()}
                    <Suspense fallback={<SectionLoading />}>
                        <MyReadingListComponent library={library} />
                    </Suspense>
                    {smallGap()}
                    <Suspense fallback={<SectionLoading />}>
                        <ToonyzPostCards />
                    </Suspense>
                    {smallGap()}
                    <Suspense fallback={<SectionLoading />}>
                        <WebnovelsCards searchParams={searchParams} sortBy="recommendation" />    
                    </Suspense>
                    {smallGap()}
                    <Suspense fallback={<SectionLoading />}>
                        <WebnovelsCardListByNew searchParams={searchParams} sortBy='date' />
                    </Suspense>
                    {smallGap()}
                    <Suspense fallback={<SectionLoading />}>
                        <WebnovelsByRank searchParams={searchParams} sortBy='views' />
                    </Suspense>
                    {smallGap()}
                </div>
            </div>
            <Footer />
        </div>
    );
}

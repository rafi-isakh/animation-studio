import Footer from '@/components/Footer';
import WebnovelsCardListByCategory from '@/components/WebnovelsCardListByCategory';
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

async function getCarouselItems() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_carousel_items`)
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_library?email=${email}`,{
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

async function getToonyzPosts() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_toonyz_posts`)
    if (!response.ok) {
        throw new Error("Failed to fetch toonyz posts", { cause: response.status });
    }
    return response.json();
}

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    let items = await getCarouselItems();
    let library = await getLibrary() || [];
    const posts = await getToonyzPosts();
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
                <CarouselComponentShadcn items={items} />
                {smallGap()}
                <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                    {/* justify-center items-center w-full mx-auto for putting the contents in the center */}
                    {smallGap()}
                    <MyReadingListComponent library={library} />
                    {smallGap()}
                    <WebnovelsCardListByCategory searchParams={searchParams} sortBy='date' title="newReleasesWebnovels" />
                    {smallGap()}
                    <WebnovelsCards searchParams={searchParams} sortBy="recommendation" title="recommended" />
                    {largeGap()}
                    <WebnovelsByRank searchParams={searchParams} sortBy='views' />
                    {smallGap()}
                    <WebnovelsCardListByCategory searchParams={{ genre: "romance" }} sortBy='date' title="romanceWebnovels" />
                    {smallGap()}
                    <WebnovelsCardListByCategory searchParams={{ genre: "fantasy" }} sortBy='date' title="fantasyWebnovels" />
                    {smallGap()}
                    <WebnovelsCardListByCategory searchParams={{ genre: "bl" }} sortBy='date' title="BLWebnovels" />
                    {smallGap()}
                    <WebnovelsCardListByCategory searchParams={{ genre: "orientalFantasy" }} sortBy='date' title="orientalFantasyWebnovels" />
                    {smallGap()}
                    <WebnovelsCardListByCategory searchParams={{ genre: "romanceFantasy" }} sortBy='date' title="romanceFantasyWebnovels" />
                    {smallGap()}
                    <ToonyzPostCards posts={posts} />
                    {smallGap()}
                </div>
            </div>
            <Footer />
        </div>
    );
}

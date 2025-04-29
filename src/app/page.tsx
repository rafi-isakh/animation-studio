import Footer from '@/components/Footer';
import WebnovelsCardListByCategory from '@/components/WebnovelsCardListByCategory';
import CarouselComponentShadcn from '@/components/UI/CarouselComponentShadcn';
import { cookies } from 'next/headers';
import WebnovelsCards from '@/components/WebnovelsCards';
import WebnovelsByRank from '@/components/WebnovelsByRank';
import { auth } from '@/auth';
import { ToonyzPostCards } from '@/components/UI/CollectionGrid';

async function getCarouselItems() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_webnovel_carousel_items`, {
        next: { tags: ['carousel'] } 
    })
    const data = await response.json();
    if (!response.ok) {
        throw new Error("Failed to fetch carousel items", { cause: response.status });
    }
    return data;
}

async function getLibrary() {
    const session = await auth();
    if (!session) {
        return [];
    }
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_library`, {
        headers: {
            'Cookie': cookies().toString(),
            'Authorization': `Bearer ${session?.accessToken}`,
            'Provider': session?.provider
        }
    }
    )
    if (!response.ok) {
        console.error("Failed to fetch library", response.status);
    }
    const data = await response.json();
    console.log(data)
    return data;
}

async function getToonyzPosts() {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND}/api/get_toonyz_posts`)
    if (!response.ok) {
        const error = await response.text();
        console.error("Failed to fetch toonyz posts", error);
        throw new Error("Failed to fetch toonyz posts", { cause: response.status });
    }
    return response.json();
}

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    let items = await getCarouselItems();
    //let library = await getLibrary() || [];
    // let posts = await getToonyzPosts();
    //library = library.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));

    const LargeGap = () => {
        return (
            <div className='md:h-[3rem] h-[2rem]' />
        )
    }

    const SmallGap = () => {
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
                <SmallGap />
                <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                    {/* justify-center items-center w-full mx-auto for putting the contents in the center */}
                    {/*{smallGap()}*/}
                    {/*<MyReadingListComponent library={library} />*/}
                    {/*smallGap()/*}
                    {/*WebnovelsCardListByCategory has smallGap in the bottom*/} 
                    <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='date' title="newReleasesWebnovels" />
                    <WebnovelsCards searchParams={searchParams} sortBy="recommendation" title="recommendedWebnovels" />
                    <LargeGap />
                    <WebnovelsByRank searchParams={searchParams} sortBy='views' title="TOP_SEVEN_WEBNOVELS" />
                    <SmallGap />
                    <WebnovelsCardListByCategory searchParams={searchParams} genre="romance" sortBy='date' title="romanceWebnovels" />
                    <WebnovelsCardListByCategory searchParams={searchParams} genre="fantasy" sortBy='date' title="fantasyWebnovels" />
                    <WebnovelsCardListByCategory searchParams={searchParams} genre="bl" sortBy='date' title="BLWebnovels" />
                    <WebnovelsCardListByCategory searchParams={searchParams} genre="orientalFantasy" sortBy='date' title="orientalFantasyWebnovels" />
                    <WebnovelsCardListByCategory searchParams={searchParams} genre="romanceFantasy" sortBy='date' title="romanceFantasyWebnovels" />
                    <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='views' title="communityWebnovels" version="community"/>
                    <ToonyzPostCards />
                    <SmallGap />
                </div>
            </div>
            <Footer />
        </div>
    );
}

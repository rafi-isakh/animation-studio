import Footer from '@/components/Footer';
import WebnovelsCardListByCategory from '@/components/WebnovelsCardListByCategory';
import CarouselComponentShadcn from '@/components/UI/CarouselComponentShadcn';
import { cookies } from 'next/headers';
import WebnovelsCards from '@/components/WebnovelsCards';
import WebnovelsByRank from '@/components/WebnovelsByRank';
import { auth } from '@/auth';
import { ToonyzPostCards } from '@/components/UI/CollectionGrid';
import MainPageWrapper from '@/components/UI/MainPageWrapper';

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
    items = items.reverse();
    //let library = await getLibrary() || [];
    // let posts = await getToonyzPosts();
    //library = library.filter((novel: Webnovel) => !temporarilyUnpublished.includes(novel.id));

    return (
        <div className='relative flex flex-col justify-center items-center w-full'>
            <MainPageWrapper searchParams={searchParams} items={items} />
            <Footer />
        </div>
    );
}

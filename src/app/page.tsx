import WebnovelsList from '@/components/WebnovelsList'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
import BookmarkButton from '@/components/BookmarkButton';
import Link from 'next/link';
import Image from 'next/image';
import ApplyCreatorBanner from '@/components/ApplyCreatorBanner';
import WebnovelsListByEditor from '@/components/WebnovelsListByEditor'
import WebnovelsListByRecommendation from '@/components/WebnovelsListByRecommendation';
import WebnovelsListByCover from '@/components/WebnovelsListByCover';
import Promotion from '@/components/Promotion';
import KeywordsComponent from '@/components/KeywordsComponent';
import WebnovelsByTrends from '@/components/WebnovelsByTrends';
import GenresList from '@/components/GenresList';
import CarouselComponent from '@/components/CarouselComponent';

import Preloader from '@/components/Preloader';
import { cookies } from 'next/headers'

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
            
            {/* Top banner : applying a creator */}
            {/* <ApplyCreatorBanner /> */}
            {/* <div className='bg-black w-full mx-auto h-[480px] pt-5'> */}
              <CarouselComponentReactSlick items={items} searchParams={searchParams} webnovels={webnovels} />
            {/* </div> */}
            {/* Popular Webnovels */}
            <WebnovelsListByCover searchParams={searchParams} webnovels={webnovels} sortBy='views' />
            {/* Webnovels by trends */}
            <WebnovelsByTrends searchParams={searchParams} webnovels={webnovels} sortBy='views' />


           
             {/* webnovels list by ranking */}
            <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='views' />  
           
           
              {/* only Toonyz */}
            <div className='bg-black w-full mx-auto'>  {/* bg-black */}
                <CarouselComponent items={items} searchParams={searchParams} webnovels={webnovels} />
               
            </div>
            
          
         
            {/* Event promotion part */}
            <Promotion />
            {/* Footer Banner : instagram promotion image */}
           
            {/* Footer */}            
            <Footer />
            {/* Bookmark button : it only displys mobile screen */}
            <BookmarkButton />
        </div>
    );
}

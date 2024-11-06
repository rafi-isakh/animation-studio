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
            <ApplyCreatorBanner />
            <CarouselComponentReactSlick items={items} searchParams={searchParams} webnovels={webnovels} />
            {/* keywords list */}
            <div className='relative max-w-screen-xl mx-auto px-4 mt-6 mb-20'>
                <div className='flex flex-row justify-between text-xl md:text-xl p-2 font-extrabold'>
                        <h1> 키워드 별로 보기 </h1>
                        <span className='text-gray-400 text-[14px]'>더 보기</span>
                </div>
                <KeywordsComponent />
            </div>
        
            {/* webnovels list by ranking */}
            <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='views' />
         
       
            <WebnovelsByTrends searchParams={searchParams} webnovels={webnovels} sortBy='date' />

            <div className='mt-10'>
            <WebnovelsListByRecommendation searchParams={searchParams} webnovels={webnovels} sortBy='views' />
            </div>
            
           

            <WebnovelsListByCover searchParams={searchParams} webnovels={webnovels} sortBy='views' />

            {/* Editor picks part */}
            <WebnovelsListByEditor searchParams={searchParams} webnovels={webnovels} sortBy='views' />
           
            {/* Event promotion part */}
            <Promotion />

            {/* Footer Banner : instagram promotion image */}
            <div className='flex justify-center self-center'>
                <Link href='https://www.instagram.com/stelland_official/'>
                <Image 
                    src='/footer_banner.svg' 
                    alt='Toonyz event banner'
                    sizes="cover"
                    width={0}
                    height={0}
                    className='md:block lg:block hidden hover:opacity-[0.8]'
                    style={{
                        width: '1280px',
                        height: 'auto'
                    }}
                    />
                <Image 
                    src='/footer_banner_mobile.svg' 
                    alt='Toonyz event banner'
                    sizes="cover"
                    width={0}
                    height={0}
                    className='md:hidden lg:hidden hover:opacity-[0.8]'
                    style={{
                        width: '1280px',
                        height: 'auto'
                    }}
                    />
                </Link>
                </div>
           
             {/* genres list */}
             {/* <GenresList />            */}
           
            {/* Footer */}
            
            <Footer />
            {/* Bookmark button : it only displys mobile screen */}
            <BookmarkButton />
        </div>
    );
}

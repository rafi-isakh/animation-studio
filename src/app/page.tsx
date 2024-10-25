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
import WebnovelsByDates from '@/components/WebnovelsByDates';

import { AnimatePresence } from 'framer-motion' // Framer Motion for animations
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
            <KeywordsComponent />
        
            {/* webnovels list by ranking */}
            <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='views' />
            <WebnovelsByDates searchParams={searchParams} webnovels={webnovels} sortBy='date' />
   
            <div className='mt-10'>
            <WebnovelsListByRecommendation searchParams={searchParams} webnovels={webnovels} sortBy='views' />
            </div>
            {/* promotion part */}
            <Promotion />

            <WebnovelsListByCover searchParams={searchParams} webnovels={webnovels} sortBy='views' />

            {/* Editor picks part */}
            <WebnovelsListByEditor searchParams={searchParams} webnovels={webnovels} sortBy='views' />
    
            {/* Footer Banner : instagram promotion image */}
            <div className='flex justify-center self-center'>
                <Link href=''>
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
            {/* Footer */}
            <Footer />
            {/* Bookmark button : it only displys mobile screen */}
            <BookmarkButton />
        </div>
    );
}

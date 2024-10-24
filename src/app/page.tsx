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

import { AnimatePresence } from 'framer-motion' // Framer Motion for animations
import Preloader from '@/components/Preloader';

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
    
    const items = await getCarouselItems();
    const webnovels = await getWebnovels();
    return (
        <div>
            {/* applying a creator banner */}
           <ApplyCreatorBanner />
           <CarouselComponentReactSlick items={items} searchParams={searchParams} webnovels={webnovels} />
         

         <AnimatePresence mode='wait'>
            <Preloader />
            {/* {isLoading && <Preloader />} */}
        </AnimatePresence>

            <CarouselComponentReactSlick items={items} searchParams={searchParams} webnovels={webnovels} />
            <div className='mt-4'>
                <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='views' />
                <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='date' />
            </div>
            <GenresComponent />
            {/*  */}
            <WebnovelsListByRecommendation searchParams={searchParams} webnovels={webnovels} sortBy='views' />
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

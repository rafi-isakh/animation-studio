import WebnovelsList from '@/components/WebnovelsList'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
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
            <Footer />
        </div>
    );
}

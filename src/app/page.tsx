import WebnovelsList from '@/components/WebnovelsList'
import GenresComponent from '@/components/GenresComponent';
import CarouselComponentReactSlick from '@/components/CarouselComponentReactSlick';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import WebnovelsListByEditor from '@/components/WebnovelsListByEditor'

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
            <CarouselComponentReactSlick items={items} searchParams={searchParams} webnovels={webnovels} />
            <div className='mt-4'>
                <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='views' />
                <WebnovelsList searchParams={searchParams} webnovels={webnovels} sortBy='date' />
            </div>
            
            <GenresComponent />


            
            <div className='w-full max-w-screen-xl mx-auto flex flex-col'>
            <h1 className='text-left font-extrabold'>오직 튜니즈에서만!</h1>
            </div>
            

            <WebnovelsListByEditor searchParams={searchParams} webnovels={webnovels} sortBy='views' />
            {/* 
                <div className='w-full max-w-screen-xl mx-auto flex flex-col'>
                </div> 
            */}

            {/* Footer Banner : instagram promotion image */}
            <div className='flex justify-center self-center'>
                <Link href='' >
                <Image 
                    src='/Footer_banner.svg' 
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
                    src='/Footer_banner_mobile.svg' 
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

            <Footer />
        </div>
    );
}

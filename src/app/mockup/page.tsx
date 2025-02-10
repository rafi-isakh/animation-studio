import { Button } from "@mui/material"
import { Sidebar } from "./components/Sidebar"
import WebnovelsCardListByNew from "@/components/WebnovelsCardListByNew";
import CarouselComponentReactSlick from "@/components/CarouselComponentReactSlick";
import MenuItemsComponent from "@/components/MenuItemsComponent";
import WebnovelsCards from "@/components/WebnovelsCards";
import { cookies } from 'next/headers';
import { Webnovel } from "@/components/Types";
import WebnovelsByRank from "@/components/WebnovelsByRank";
import CarouselComponent from "@/components/CarouselComponent";
import PromotionBannerComponent from "@/components/PromotionBannerComponent";
import Footer from "@/components/Footer";
// import Header from '@/components/Header';
import BottomNavigationBar from "./components/BottomNavigation";
async function getCarouselItems() {
  const start = performance.now()
  const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_carousel_items`)
  if (!response.ok) {
    throw new Error("Failed to fetch carousel items", { cause: response.status });
  }
  const end = performance.now()
  console.log('getCarouselItems', end - start)
  return response.json();
}

async function getWebnovelsMetadata() {
  const start = performance.now()
  const response = await fetch(`${process.env.NEXT_PUBLIC_HOST}/api/get_webnovels_metadata`)
  if (!response.ok) {
    throw new Error("Failed to fetch webnovels", { cause: response.status });
  }
  const end = performance.now()
  console.log('getWebnovelsMetadata', end - start)
  return response.json();
}

const temporarilyUnpublished = [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79];


export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const cookieStore = cookies()
  const didSelectLanguage = cookieStore.get('didSelectLanguage')
  const showPreloader = !didSelectLanguage
  let items = await getCarouselItems();
  let webnovels = await getWebnovelsMetadata();
  console.log(webnovels)
  // webnovels = webnovels.filter((novel: Webnovel) => !premium.includes(novel.id));
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
    <div className="flex min-h-screen">
      <div className="hidden md:block"> 
        {/* no sidebar on mobile */}
        <Sidebar />
      </div>
      <div className="block md:hidden">
        <BottomNavigationBar />
      </div>
      <main className="flex-1 md:pl-[72px] md:w-[calc(100vw-72px)] w-full overflow-x-hidden"> {/* pl-[72px] is the left sidebar width */}
        <div className='flex flex-col md:justify-start md:items-start md:px-1 px-0'>
          <CarouselComponentReactSlick items={items} slidesToShow={1} showDots={true} centerPadding={{ desktop: '0px', mobile: '24px' }} />
          {smallGap()}
          <div className='px-4 md:px-0 md:w-[calc(100vw-72px)] w-full'>
            <WebnovelsCards searchParams={searchParams} webnovels={webnovels} sortBy="recommendation" />
            {smallGap()}
            <WebnovelsCardListByNew searchParams={searchParams} webnovels={webnovels} sortBy='date' />
            {largeGap()}
            <WebnovelsByRank searchParams={searchParams} webnovels={webnovels} sortBy='views' />
            {largeGap()}
          </div>
          {/* {largeGap()}
                <TrailerCardComponent /> */}
          {largeGap()}
          <PromotionBannerComponent />
        </div>
        <Footer />
      </main>
    </div>
  )
}


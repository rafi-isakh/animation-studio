'use client'
import { ToonyzPostCards } from '@/components/UI/CollectionGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcnUI/Tabs"
import WebnovelsCards from '@/components/WebnovelsCards';
import WebnovelsByRank from '@/components/WebnovelsByRank';
import WebnovelsCardListByCategory from '@/components/WebnovelsCardListByCategory';
import CarouselComponentShadcn from '@/components/UI/CarouselComponentShadcn';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';

const MainPageWrapper = ({ searchParams, items }: { searchParams: { [key: string]: string | string[] | undefined }, items: any[] }) => {
    const { dictionary, language } = useLanguage();

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
        <div className="relative w-full">
            <Tabs defaultValue="home" className="w-full flex flex-col justify-center items-center mx-auto">
                <TabsList className="flex justify-start w-full md:max-w-screen-xl bg-transparent md:h-12 h-8 overflow-x-auto !no-scrollbar" >
                    <TabsTrigger value="home" className="md:text-lg text-base font-bold rounded-full data-[state=active]:bg-[#DB2777] data-[state=active]:text-white  px-4 py-1">
                        {phrase(dictionary, 'home', language)}
                    </TabsTrigger>
                    <TabsTrigger value="romance" className="md:text-lg text-base font-bold rounded-full data-[state=active]:bg-[#DB2777] data-[state=active]:text-white px-4 py-1">
                        {phrase(dictionary, 'romance', language)}
                    </TabsTrigger>
                    <TabsTrigger value="romanceFantasy" className="md:text-lg text-base font-bold rounded-full data-[state=active]:bg-[#DB2777] data-[state=active]:text-white px-4 py-1">
                        {phrase(dictionary, 'romanceFantasy', language)}
                    </TabsTrigger>
                    <TabsTrigger value="community" className={"md:text-lg text-base font-bold rounded-full data-[state=active]:bg-[#DB2777] data-[state=active]:text-white px-4 py-1"}>
                        {phrase(dictionary, 'community_series', language)}
                    </TabsTrigger>
                    <TabsTrigger value="adult" className={`${language === 'ko' ? '' : 'hidden'} md:text-lg text-base font-bold rounded-full data-[state=active]:bg-[#DB2777] data-[state=active]:text-white px-4 py-1`}>
                        {phrase(dictionary, 'adult_series', language)}
                    </TabsTrigger>
                    <TabsTrigger value="action" className="md:text-lg text-base font-bold rounded-full data-[state=active]:bg-[#DB2777] data-[state=active]:text-white px-4 py-1">
                        {phrase(dictionary, 'action', language)}
                    </TabsTrigger>
                    <TabsTrigger value="bl" className="md:text-lg text-base font-bold rounded-full data-[state=active]:bg-[#DB2777] data-[state=active]:text-white px-4 py-1">
                        {phrase(dictionary, 'bl', language)}
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="home" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
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
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='views' title="communityWebnovels" version="community" />
                            <WebnovelsCards searchParams={searchParams} sortBy="recommendation" title="recommendedWebnovels" mode="main_page" />
                            <LargeGap />
                            <WebnovelsByRank searchParams={searchParams} sortBy='views' title="TOP_SEVEN_WEBNOVELS" />
                            <SmallGap />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romance" sortBy='date' title="romanceWebnovels" />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="fantasy" sortBy='date' title="fantasyWebnovels" />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="bl" sortBy='date' title="BLWebnovels" />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="orientalFantasy" sortBy='date' title="orientalFantasyWebnovels" />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romanceFantasy" sortBy='date' title="romanceFantasyWebnovels" />
                            <ToonyzPostCards />
                            <SmallGap />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="romance" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romance" sortBy='date' title="" />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romanceFantasy" sortBy='date' title="romanceFantasyWebnovels" />
                            <WebnovelsCards searchParams={searchParams} genre="romance" sortBy="recommendation" title="romanceWebnovels" />
                            <LargeGap />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="romanceFantasy" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romanceFantasy" sortBy='date' title="" />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="fantasy" sortBy='date' title="fantasyWebnovels" />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="orientalFantasy" sortBy='date' title="orientalFantasyWebnovels" />
                            <WebnovelsCards searchParams={searchParams} genre="romanceFantasy" sortBy="recommendation" title="romanceFantasyWebnovels" />
                            <LargeGap />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="community" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='date' title="" version="community" />
                            <WebnovelsCards searchParams={searchParams} genre="all" sortBy="recommendation" title="recommendedCommunityWebnovels" version="community" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="adult" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='date' title="" is_adult_material={true} />
                            <WebnovelsCards searchParams={searchParams} genre="all" sortBy="recommendation" title="recommendedAdultWebnovels" is_adult_material={true} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="action" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="orientalFantasy" sortBy='date' title="" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="bl" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="bl" sortBy='date' title=""  />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default MainPageWrapper;
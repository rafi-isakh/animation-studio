'use client'
import { useEffect, useState } from 'react';
import { ToonyzPostCards } from '@/components/UI/CollectionGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcnUI/Tabs"
import WebnovelsCards from '@/components/WebnovelsCards';
import WebnovelsByRank from '@/components/WebnovelsByRank';
import WebnovelsCardListByCategory from '@/components/WebnovelsCardListByCategory';
import CarouselComponentShadcn from '@/components/UI/CarouselComponentShadcn';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { getWebnovelToShow } from '@/utils/webnovelUtils';
import { useWebnovels } from '@/contexts/WebnovelsContext';

const MainPageWrapper = ({ searchParams, items }: { searchParams: { [key: string]: string | string[] | undefined }, items: any[] }) => {
    const { dictionary, language } = useLanguage();
    const { webnovels } = useWebnovels();

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

    const mainTabConfigs = [
        { name: 'home', value: 'home', key: 'home' },
        { name: 'romance', value: 'romance', key: 'romance', is_adult_material: false },
        { name: 'romanceFantasy', value: 'romanceFantasy', key: 'romanceFantasy', is_adult_material: false },
        { name: 'community', value: 'all', key: 'community_series', version: 'community' },
        { name: 'fantasy', value: 'fantasy', key: 'fantasy', is_adult_material: false },
        { name: 'orientalFantasy', value: 'orientalFantasy', key: 'orientalFantasy', is_adult_material: false },
        { name: 'bl', value: 'bl', key: 'bl', is_adult_material: false },
        { name: 'action', value: 'action', key: 'action', is_adult_material: false },
        { name: 'adult', value: 'all', key: 'adult_series', is_adult_material: true } // it's adult_material tab
    ];

    // Filter out tabs that have no webnovels
    const filteredTabConfigs = mainTabConfigs.filter(tab => {
        if (tab.value === 'home') return true; // Always show home tab
        const _webnovels = getWebnovelToShow(webnovels, 'recommendation', null, tab.value, tab.version, tab.is_adult_material);
        console.log(`Tab ${tab.value} has ${_webnovels.length} webnovels, is_adult_material: ${tab.is_adult_material}, version: ${tab.version}`);
        return _webnovels.length > 0;
    });

    return (
        <div className="relative w-full">
            <Tabs defaultValue="home" className="w-full flex flex-col justify-center items-center mx-auto">
                <TabsList className="flex justify-start w-full md:max-w-screen-xl bg-transparent md:h-12 h-8 overflow-x-auto overflow-y-hidden !no-scrollbar" >
                    {filteredTabConfigs.map((tab) => (
                        <TabsTrigger 
                            key={tab.key}
                            value={tab.name} 
                            className="md:text-lg text-base font-bold rounded-full data-[state=active]:bg-[#DB2777] data-[state=active]:text-white px-4 py-1"
                        >
                            {phrase(dictionary, tab.key, language)}
                        </TabsTrigger>
                    ))}
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
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='views' title="communityWebnovels" version="community"  />
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
                            <WebnovelsCards searchParams={searchParams} genre="romance" sortBy="recommendation" title="romanceWebnovels" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="romanceFantasy" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romanceFantasy" sortBy='date' title="" />
                            <WebnovelsCards searchParams={searchParams} genre="romanceFantasy" sortBy="recommendation" title="romanceFantasyWebnovels" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="community" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='date' title="" version="community"  />
                            <WebnovelsCards searchParams={searchParams} genre="all" sortBy="recommendation" title="recommendedCommunityWebnovels" version="community" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="fantasy" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="fantasy" sortBy='date' title="" />
                            <WebnovelsCards searchParams={searchParams} genre="fantasy" sortBy="recommendation" title="fantasyWebnovels" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="orientalFantasy" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="orientalFantasy" sortBy='date' title="" />
                            <WebnovelsCards searchParams={searchParams} genre="orientalFantasy" sortBy="recommendation" title="orientalFantasyWebnovels" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="bl" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="bl" sortBy='date' title=""  />
                            <WebnovelsCards searchParams={searchParams} genre="bl" sortBy="recommendation" title="recommendedBLWebnovels" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="action" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="action" sortBy='date' title=""  />
                            <WebnovelsCards searchParams={searchParams} genre="action" sortBy="recommendation" title="actionWebnovels" />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="adult" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto'>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='date' title="communityAdultWebnovels" is_adult_material={true} version={undefined}/>
                            <WebnovelsCards searchParams={searchParams} genre="all" sortBy="recommendation" title="recommendedCommunityAdultWebnovels" is_adult_material={true} version={undefined} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default MainPageWrapper;
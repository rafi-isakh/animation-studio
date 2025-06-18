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
import { getWebnovelsToShow } from '@/utils/webnovelUtils';
import { useWebnovels } from '@/contexts/WebnovelsContext';


const MainPageWrapper = ({ searchParams, items }: { searchParams: { [key: string]: string | string[] | undefined }, items: any[] }) => {
    const { dictionary, language } = useLanguage();
    const { webnovels, restricted } = useWebnovels();
    const effectiveAdultFilter = restricted ? null : false;
    
    // State to force re-render when needed
    const [forceUpdateKey, setForceUpdateKey] = useState(0);
   
    // Debug logging to track re-renders and state changes
    useEffect(() => {
        console.log('[MainPageWrapper] Component re-rendered. restricted:', restricted, 'effectiveAdultFilter:', effectiveAdultFilter, 'webnovels count:', webnovels?.length || 0);
    });

    useEffect(() => {
        console.log('[MainPageWrapper] restricted changed to:', restricted);
        // Force a re-render to ensure child components update
        setForceUpdateKey(prev => prev + 1);
    }, [restricted]);

    useEffect(() => {
        console.log('[MainPageWrapper] webnovels changed, count:', webnovels?.length || 0);
    }, [webnovels]);
   
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

    // mainTabConfigs defined directly
    const mainTabConfigs = [
        { name: 'home', value: 'home', key: 'home', is_adult_material: restricted },
        { name: 'romance', value: 'romance', key: 'romance', is_adult_material: restricted },
        { name: 'romanceFantasy', value: 'romanceFantasy', key: 'romanceFantasy', is_adult_material: restricted },
        { name: 'community', value: 'all', key: 'community_series', version: 'community', is_adult_material: restricted },
        { name: 'fantasy', value: 'fantasy', key: 'fantasy', is_adult_material: restricted },
        { name: 'orientalFantasy', value: 'orientalFantasy', key: 'orientalFantasy', is_adult_material: restricted },
        { name: 'bl', value: 'bl', key: 'bl', is_adult_material: restricted },
        { name: 'action', value: 'action', key: 'action', is_adult_material: restricted },
    ];

    const filteredTabConfigs = mainTabConfigs.filter(tab => {
        if (tab.value === 'home') return true; // Always show home tab
        const _webnovels = getWebnovelsToShow(webnovels, 'recommendation', null, tab.value, tab.version, effectiveAdultFilter);
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
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto' key={`home-content-${forceUpdateKey}`}>
                            {/* justify-center items-center w-full mx-auto for putting the contents in the center */}
                            {/*{smallGap()}*/}
                            {/*<MyReadingListComponent library={library} />*/}
                            {/*smallGap()/*}
                            {/*WebnovelsCardListByCategory has smallGap in the bottom*/}
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='date' title="newReleasesWebnovels" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='views' title="communityWebnovels" version="community" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCards searchParams={searchParams} sortBy="recommendation" title="recommendedWebnovels" mode="main_page" is_adult_material={effectiveAdultFilter} />
                            <LargeGap /> 
                            <WebnovelsByRank searchParams={searchParams} genre="all" sortBy='views' title="TOP_SEVEN_WEBNOVELS" is_adult_material={effectiveAdultFilter}  />
                            <SmallGap />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romance" sortBy='date' title="romanceWebnovels" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="fantasy" sortBy='date' title="fantasyWebnovels" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="bl" sortBy='date' title="BLWebnovels" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="orientalFantasy" sortBy='date' title="orientalFantasyWebnovels" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romanceFantasy" sortBy='date' title="romanceFantasyWebnovels" is_adult_material={effectiveAdultFilter} />
                            <ToonyzPostCards />
                            <SmallGap />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="romance" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto' key={`romance-content-${forceUpdateKey}`}>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romance" sortBy='date' title="" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCards searchParams={searchParams} genre="romance" sortBy="recommendation" title="romanceWebnovels" is_adult_material={effectiveAdultFilter} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="romanceFantasy" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto' key={`romanceFantasy-content-${forceUpdateKey}`}>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="romanceFantasy" sortBy='date' title="" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCards searchParams={searchParams} genre="romanceFantasy" sortBy="recommendation" title="romanceFantasyWebnovels" is_adult_material={effectiveAdultFilter} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="community" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto' key={`community-content-${forceUpdateKey}`}>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="all" sortBy='date' title="" version="community" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCards searchParams={searchParams} genre="all" sortBy="recommendation" title="recommendedCommunityWebnovels" version="community" is_adult_material={effectiveAdultFilter} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="fantasy" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto' key={`fantasy-content-${forceUpdateKey}`}>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="fantasy" sortBy='date' title="" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCards searchParams={searchParams} genre="fantasy" sortBy="recommendation" title="fantasyWebnovels" is_adult_material={effectiveAdultFilter} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="orientalFantasy" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto' key={`orientalFantasy-content-${forceUpdateKey}`}>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="orientalFantasy" sortBy='date' title="" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCards searchParams={searchParams} genre="orientalFantasy" sortBy="recommendation" title="orientalFantasyWebnovels" is_adult_material={effectiveAdultFilter} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="bl" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto' key={`bl-content-${forceUpdateKey}`}>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="bl" sortBy='date' title="" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCards searchParams={searchParams} genre="bl" sortBy="recommendation" title="recommendedBLWebnovels" is_adult_material={effectiveAdultFilter} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="action" className="flex-1 w-full md:max-w-screen-xl overflow-hidden">
                    <div className='w-full'>
                        <div className='px-2 w-max-screen-xl justify-center items-center w-full mx-auto' key={`action-content-${forceUpdateKey}`}>
                            <WebnovelsCardListByCategory searchParams={searchParams} genre="action" sortBy='date' title="" is_adult_material={effectiveAdultFilter} />
                            <WebnovelsCards searchParams={searchParams} genre="action" sortBy="recommendation" title="actionWebnovels" is_adult_material={effectiveAdultFilter} />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default MainPageWrapper;
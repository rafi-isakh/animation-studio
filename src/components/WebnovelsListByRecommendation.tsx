"use client"
import { useEffect, useState } from 'react';
import { SortBy, Webnovel } from '@/components/Types'
import WebnovelComponentSquare from "@/components/WebnovelComponentSquare"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import moment from 'moment';
import Link from 'next/link';

export const premium = [23, 19, 21, 22, 20, 24]
export const free = [29, 28, 25]

const WebnovelsListByRecommendation = ({ 
    searchParams, 
    sortBy, 
    webnovels 
}: { 
    searchParams: { [key: string]: string | string[] | undefined }, 
    sortBy: SortBy, 
    webnovels: Webnovel[] 
}) => {
    let genre = searchParams.genre;
    let version = searchParams.version;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([]);
    const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
    const [activeSortBy, setActiveSortBy] = useState<SortBy>(sortBy);

    useEffect(() => {
        const processedWebnovels = webnovels.map(novel => ({
            ...novel,
            version: premium.includes(novel.id) ? "premium" : "free"
        }));

        const filteredWebnovels = processedWebnovels
            .filter(item => filter_by_genre(item))
            .filter(item => filter_by_version(item));

        setWebnovelsToShow(filteredWebnovels);
    }, [version, genre, webnovels]);

    const filter_by_genre = (item: Webnovel) => {
        if (genre == "all" || genre == null) {
            return item;
        }
        return genre === item.genre;
    };

    const filter_by_version = (item: Webnovel) => {
        if (version == item.version) {
            return item;
        }
    };

    const sortByFn = (a: Webnovel, b: Webnovel): number => {
        if (activeSortBy === 'views') {
            return b.views - a.views;
        } else if (activeSortBy === 'likes') {
            return b.upvotes - a.upvotes;
        } else if (activeSortBy === 'date') {
            const getLatestDate = (novel: Webnovel) => {
                return Math.max(
                    ...novel.chapters.map(chapter => 
                        moment(chapter.created_at).valueOf()
                    )
                );
            };
            return getLatestDate(b) - getLatestDate(a);
        }
        return 0;
    };

    const handleIntroClick = () => {
        setActiveTab('free');
    };

    const handleViewClick = () => {
        setActiveTab('premium');
    };

    const handleSortChange = (newSortBy: SortBy) => {
        setActiveSortBy(newSortBy);
    };

    const filteredAndSortedNovels = webnovelsToShow
        .filter(novel => novel.version === activeTab)
        .sort(sortByFn);

    return (
        <div className='w-full max-w-screen-xl mx-auto flex flex-col mb-10'>
            <div className='flex flex-col'>
                {/* Tab Navigation */}
                <div className='flex flex-row justify-center items-center mb-6'>
                    <button onClick={handleIntroClick}>
                        <p className={`text-xl w-fit px-4 cursor-pointer ${
                            activeTab === 'free' ? 'font-bold text-[#142448] border-b-2 border-[#142448]' : 'text-gray-500'
                        }`}>
                            오늘10시무료!
                        </p>
                    </button>
                    <button onClick={handleViewClick}>
                        <p className={`text-xl w-fit px-4 cursor-pointer ${
                            activeTab === 'premium' ? 'font-bold text-[#142448] border-b-2 border-[#142448]' : 'text-gray-500'
                        }`}>
                            새로나왔어요
                        </p>
                    </button>
                </div>

                {/* Sort Options */}
                <div className='flex flex-row justify-center gap-4 mb-6'>
                    <button
                        onClick={() => handleSortChange('views')}
                        className={`px-4 py-2 rounded ${
                            activeSortBy === 'views' 
                                ? 'bg-[#142448] text-white' 
                                : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        조회순
                    </button>
                    <button
                        onClick={() => handleSortChange('likes')}
                        className={`px-4 py-2 rounded ${
                            activeSortBy === 'likes' 
                                ? 'bg-[#142448] text-white' 
                                : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        좋아요순
                    </button>
                    <button
                        onClick={() => handleSortChange('date')}
                        className={`px-4 py-2 rounded ${
                            activeSortBy === 'date' 
                                ? 'bg-[#142448] text-white' 
                                : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        최신순
                    </button>
                </div>

                {/* Novels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {filteredAndSortedNovels.map((item, index) => (
                        <WebnovelComponentSquare 
                            webnovel={item} 
                            index={index} 
                            ranking={true} 
                            key={item.id} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WebnovelsListByRecommendation;
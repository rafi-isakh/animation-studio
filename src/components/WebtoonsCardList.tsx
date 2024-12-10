import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WebtoonsCardComponent from '@/components/WebtoonsCardComponent';
import { Webtoon } from '@/components/Types';
import DictionaryPhrase from '@/components/DictionaryPhrase';
import { getSignedUrlForWebtoonImage } from '@/utils/s3';

interface WebtoonsCardListProps {
    webtoons: Webtoon[];
    titleVar: string;
    detail: boolean;
    ranking: boolean;
}

const WebtoonsCardList: React.FC<WebtoonsCardListProps> = async ({
    webtoons,
    titleVar,
    detail,
    ranking
}) => {

    const sortedWebtoons = webtoons.sort((a, b) => a.views - b.views);
    const shownWebtoons = ranking? sortedWebtoons: webtoons;

    const coverArts: string[] = await Promise.all(webtoons.map(async (webtoon) => await getSignedUrlForWebtoonImage(webtoon.root_directory + "/" + webtoon.cover_art)))
    return (
        <div className="relative md:max-w-screen-xl mx-auto group overflow-hidden max-w-full">
            <div className="">
                <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                    <DictionaryPhrase phraseVar={titleVar} />
                </h1>

                <div className="relative">
                    {/* Desktop flexbox layout */}
                    <div className="hidden md:flex justify-start gap-4 overflow-x-auto no-scrollbar">
                        {shownWebtoons.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="w-[calc(16.666%-1rem)] flex-grow-0 flex-shrink-0"
                            >
                                <WebtoonsCardComponent webtoon={item} coverArt={coverArts[index]} detail={detail} ranking={ranking} index={index + 1} />
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    <div className="md:hidden flex overflow-x-auto no-scrollbar scroll-smooth gap-4">
                        {shownWebtoons.map((item, index) => (
                            <div key={item.id || index} className="flex-none">
                                <WebtoonsCardComponent webtoon={item} coverArt={coverArts[index]} detail={detail} ranking={ranking} index={index + 1} />
                            </div>
                        ))}
                    </div>

                    {/* arrows */}
                    <button
                        className="group-hover:opacity-100 transition-opacity duration-300 absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 opacity-0 hidden md:block"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                        className="group-hover:opacity-100 transition-opacity duration-300 absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 opacity-0 hidden md:block"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WebtoonsCardList;
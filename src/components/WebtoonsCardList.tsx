import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import WebtoonsCardComponent from '@/components/WebtoonsCardComponent';
import { Webtoon } from '@/components/Types';

interface WebtoonsCardListProps {
    title: string;
    webtoons: Webtoon[];
}

const WebtoonsCardList: React.FC<WebtoonsCardListProps> = ({
    title,
    webtoons
}) => {
    return (
        <div className="relative md:max-w-screen-xl mx-auto group overflow-hidden max-w-full">
            <div className="">
                <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                    {title}
                </h1>

                <div className="relative">
                    {/* Desktop flexbox layout */}
                    <div className="hidden md:flex justify-start gap-4 overflow-x-auto no-scrollbar">
                        {webtoons.map((item, index) => (
                            <div 
                                key={item.id || index} 
                                className="w-[calc(16.666%-1rem)] flex-grow-0 flex-shrink-0"
                            >
                                <WebtoonsCardComponent webtoon={item} />
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    <div className="md:hidden flex overflow-x-auto no-scrollbar scroll-smooth gap-4">
                        {webtoons.map((item, index) => (
                            <div key={item.id || index} className="flex-none">
                                <WebtoonsCardComponent webtoon={item} />
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
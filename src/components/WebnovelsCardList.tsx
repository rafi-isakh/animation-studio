import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { scroll } from '@/utils/scroll'
import { useMediaQuery } from 'react-responsive';

interface WebnovelsCardListProps {
    title: string;
    subtitle?: string;
    webnovels?: any[];
    renderItem: (item: any, index: number) => JSX.Element;
    scrollRef: React.RefObject<HTMLDivElement>;
    isMobile?: boolean;
    className?: string;
}

const WebnovelsCardList: React.FC<WebnovelsCardListProps> = ({
    title,
    subtitle,
    webnovels = [],
    renderItem,
    scrollRef,
    isMobile = false,
    className = '',
}) => {

    const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

    return (
        <div className={`relative md:max-w-screen-xl w-full mx-auto group overflow-hidden `}>
            <div className="">
                <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                    {title}
                    {/* {subtitle && (
                        <span className="text-gray-400 text-[14px] md:block hidden">
                            {subtitle}
                        </span>
                    )} */}
                </h1>
                
                <div className="relative">
                    <div 
                        ref={scrollRef}
                        className="hidden md:flex justify-start gap-4 overflow-x-auto no-scrollbar"     
                        // card list gap-4
                    > 
                        {webnovels.map((item, index) => (
                            <div 
                                key={item.id || index} 
                                className="w-[calc(16.666%-1rem)] flex-grow-0 flex-shrink-0"
                            >
                                {renderItem(item, index)}
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    <div className="md:hidden flex overflow-x-auto no-scrollbar scroll-smooth gap-4">
                        {webnovels.map((item, index) => (
                            <div key={item.id || index} className="flex-none">
                                {renderItem(item, index)}
                            </div>
                        ))}
                    </div>
                    
                    {!isMobile && (
                        <>
                        <button
                            onClick={() => scroll('left', scrollRef)}
                            className="group-hover:opacity-80 transition-opacity duration-300 absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 opacity-0"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <button
                            onClick={() => scroll('right', scrollRef)}
                            className="group-hover:opacity-80 transition-opacity duration-300 absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full p-2 opacity-0"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-700" />
                        </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebnovelsCardList;
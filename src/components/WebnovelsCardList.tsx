import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
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
        <div className={`relative w-full group ${className} `}>
            <div>
                <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                    {title}
                </h1>
                
                <div className="relative">
                    {/* Desktop layout with fixed 6 cards */}
                    <div 
                        ref={scrollRef}
                        className="hidden md:grid grid-flow-col auto-cols-[160px] overflow-x-auto no-scrollbar gap-1"
                    > 
                        {webnovels.map((item, index) => (
                            <div 
                                key={item.id || index} 
                                className="flex-shrink-0 w-[160px]"
                            >
                                {renderItem(item, index)}
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    <div className="md:hidden flex overflow-x-auto no-scrollbar scroll-smooth gap-1">
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
                            className="bg-white/80 dark:bg-black/80 group-hover:opacity-80 transition-opacity 
                            duration-300 absolute h-80
                            left-0 top-[45%] -translate-y-1/2 z-50 p-2 opacity-0 rounded-full"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <button
                            onClick={() => scroll('right', scrollRef)}
                            className="bg-white/80 dark:bg-black/80 group-hover:opacity-80 transition-opacity 
                            duration-300 absolute h-80
                            right-0 top-[45%] -translate-y-1/2 z-50 p-2 opacity-0 rounded-full"
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
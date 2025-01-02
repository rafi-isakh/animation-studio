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
        <div className={`relative md:max-w-screen-lg w-full mx-auto group overflow-hidden ${className}`}>
            <div>
                <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                    {title}
                </h1>
                
                <div className="relative">
                    {/* Desktop layout with fixed 6 cards */}
                    <div 
                        ref={scrollRef}
                        className="hidden md:grid grid-cols-6 gap-2 overflow-x-auto no-scrollbar"
                    > 
                        {webnovels.map((item, index) => (
                            <div 
                                key={item.id || index} 
                                className="w-full"
                            >
                                {renderItem(item, index)}
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    <div className="md:hidden flex overflow-x-auto no-scrollbar scroll-smooth gap-2">
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
                            className="group-hover:opacity-80 transition-opacity duration-300 absolute left-0 top-[45%] -translate-y-1/2 z-10 bg-white/60 rounded-full p-2 opacity-0"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                        <button
                            onClick={() => scroll('right', scrollRef)}
                            className="group-hover:opacity-80 transition-opacity duration-300 absolute right-0 top-[45%] -translate-y-1/2 z-10 bg-white/60 rounded-full p-2 opacity-0"
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
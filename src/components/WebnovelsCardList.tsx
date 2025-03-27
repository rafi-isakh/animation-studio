import React from 'react';
import { useMediaQuery } from 'react-responsive';
import CardsScroll from '@/components/CardsScroll';

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
                    
                    {!isMobile && <CardsScroll scrollRef={scrollRef} />}
                </div>
            </div>
        </div>
    );
};

export default WebnovelsCardList;
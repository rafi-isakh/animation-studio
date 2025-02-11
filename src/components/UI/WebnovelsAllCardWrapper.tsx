import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { scroll } from '@/utils/scroll'
import { useMediaQuery } from 'react-responsive';

interface WebnovelsCardListProps {
    title: string;
    webnovels?: any[];
    renderItem: (item: any, index: number) => JSX.Element;
    scrollRef: React.RefObject<HTMLDivElement>;
    className?: string;
}

const WebnovelsAllCardWrapper: React.FC<WebnovelsCardListProps> = ({
    title,
    webnovels = [],
    renderItem,
    scrollRef,
    className = '',
}) => {
    const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

    return (
        <div className={`relative  w-full mx-auto group overflow-hidden ${className}`}>
            {/* <div className={`relative md:max-w-screen-lg w-full mx-auto group overflow-hidden ${className}`}> */}
            <div>
                <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                    {title}
                </h1>
                
                <div className="relative">
                    {/* Desktop layout with fixed 6 cards */}
                    <div 
                        ref={scrollRef}
                        className="grid md:grid-cols-6 grid-cols-3 overflow-x-auto no-scrollbar gap-1"
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
                    <div className="md:hidden flex overflow-x-auto no-scrollbar scroll-smooth">
                        {webnovels.map((item, index) => (
                            <div key={item.id || index} className="flex-none">
                                {renderItem(item, index)}
                            </div>
                        ))}
                    </div>
                    
                </div>
            </div>
        </div>
    );
};

export default WebnovelsAllCardWrapper;
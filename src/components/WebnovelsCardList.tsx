import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import CardsScroll from '@/components/CardsScroll';
import { Card } from "@/components/shadcnUI/Card"
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
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    return (
        <div className={`relative w-full group ${className} `}>
            <div>
                {title && <h1 className="flex flex-row justify-between text-xl font-extrabold md:mb-0 mb-3">
                             {title}
                         </h1>}

                <div className="relative">
                    {/* Desktop layout with fixed 6 cards */}
                    <div
                        ref={scrollRef}
                        // {`${title ? "hidden md:grid md:grid-cols-6 grid-cols-3 overflow-x-auto no-scrollbar gap-1 py-8" 
                        // : "hidden md:grid md:grid-cols-6 grid-cols-3 overflow-x-auto no-scrollbar gap-1 pb-8"}`}
                        className={`${title ? "hidden md:grid grid-flow-col auto-cols-[160px] overflow-x-auto no-scrollbar gap-1 py-8" 
                                            : "hidden md:grid grid-flow-col auto-cols-[160px] overflow-x-auto no-scrollbar gap-1 py-4"}`}
                    >
                        {webnovels.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="flex-shrink-0 w-[160px] relative"
                                style={{
                                    transformOrigin: "center center",
                                    zIndex: activeIndex === index ? 10 : 1,
                                }}
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                <Card
                                    className={`bg-transparent overflow-hidden transition-all duration-300 ease-out border-none shadow-none ${activeIndex === index ? "shadow-none scale-110" : ""
                                        }`}
                                >
                                    {renderItem(item, index)}
                                </Card>
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    {/* Mobile view, py-2 for top padding */}
                    <div className="md:hidden grid grid-flow-col auto-cols-[160px] overflow-x-auto no-scrollbar gap-1 md:py-0 py-2">
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
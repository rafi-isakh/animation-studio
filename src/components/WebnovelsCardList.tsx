import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import CardsScroll from '@/components/CardsScroll';
import { Card, CardContent } from "@/components/shadcnUI/Card"
import { Button } from '@/components/shadcnUI/Button';
import { Bookmark, Heart } from 'lucide-react';
import OtherTranslateComponent from "@/components/OtherTranslateComponent"


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
    const [activeIndex, setActiveIndex] = useState<number | null>(null)

    return (
        <div className={`relative w-full group ${className} `}>
            <div>
                <h1 className="flex flex-row justify-between text-xl font-extrabold">
                    {title}
                </h1>

                <div className="relative">
                    {/* Desktop layout with fixed 6 cards */}
                    <div
                        ref={scrollRef}
                        className="hidden md:grid grid-flow-col auto-cols-[160px] overflow-x-auto no-scrollbar gap-1 py-8"
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
                                    {/* {activeIndex === index && (
                                        <div className="absolute bottom-0 left-0 right-0 flex flex-col bg-white dark:bg-black p-3 text-white h-[80px] z-50 justify-between items-center">
                                            <h3 className="dark:text-white text-black font-medium text-sm">
                                                <OtherTranslateComponent
                                                    content={item.title}
                                                    elementId={item.id.toString()}
                                                    elementType="webnovel"
                                                    elementSubtype="title"
                                                    classParams="text-sm md:text-base font-medium text-center line-clamp-2 break-keep korean"
                                                />
                                            </h3>
                                            <div className="flex flex-row gap-2">
                                            </div>
                                        </div>
                                    )} */}
                                    {renderItem(item, index)}
                                </Card>
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    <div className="md:hidden grid grid-flow-col auto-cols-[160px] overflow-x-auto no-scrollbar gap-1">
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
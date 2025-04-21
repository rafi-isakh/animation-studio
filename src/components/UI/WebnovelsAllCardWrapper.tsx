import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Card, CardContent } from '@/components/shadcnUI/Card';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { Button } from '@/components/shadcnUI/Button';
import { Heart, Bookmark } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { koreanToEnglishAuthorName } from '@/utils/webnovelUtils';

interface WebnovelsCardListProps {
    title: string;
    webnovels?: any[];
    renderItem: (item: any, index: number) => JSX.Element;
    scrollRef: React.RefObject<HTMLDivElement>;
    className?: string;
    isMobile?: boolean;
}

const WebnovelsAllCardWrapper: React.FC<WebnovelsCardListProps> = ({
    title,
    webnovels = [],
    renderItem,
    scrollRef,
    className = '',
    isMobile
}) => {
    // const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const { language } = useLanguage();
    return (
        <div className={`relative  w-full mx-auto group overflow-hidden ${className}`}>
            <div>
                <h1 className="flex flex-row justify-between text-xl font-extrabold md:mb-0 mb-3">
                    {title}
                </h1>

                <div className="relative">
                    {/* Desktop layout with fixed 6 cards */}
                    <div
                        ref={scrollRef}
                        className="hidden md:grid md:grid-cols-6 grid-cols-3 overflow-x-auto no-scrollbar gap-1 py-8"
                    >
                        {webnovels.map((item, index) => (
                            <div
                                key={item.id || index}
                                className="w-full relative"
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
                                    {activeIndex === index && (
                                        <div className="absolute bottom-0 left-0 right-0 flex flex-col bg-white dark:bg-black p-1 text-white h-[50px] z-50 justify-between items-center">
                                            <h3 className="dark:text-white text-black font-medium text-sm text-center">
                                                <OtherTranslateComponent
                                                    element={item}
                                                    content={item.title}
                                                    elementId={item.id.toString()}
                                                    elementType="webnovel"
                                                    elementSubtype="title"
                                                    classParams="text-sm md:text-base text-center font-medium line-clamp-2 break-keep korean"
                                                />
                                            </h3>
                                            <div className="flex flex-row gap-2">
                                                <p className="text-xs text-gray-500">{
                                                    language === "ko" ?
                                                        item.author.nickname :
                                                        koreanToEnglishAuthorName[item.author.nickname]
                                                }</p>
                                            </div>
                                        </div>
                                    )}
                                    {renderItem(item, index)}
                                </Card>
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    {isMobile && (
                        <div className="md:hidden grid  grid-cols-3 overflow-x-auto no-scrollbar  gap-1">
                            {webnovels.map((item, index) => (
                                <div key={item.id || index} className="">
                                    {renderItem(item, index)}
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default WebnovelsAllCardWrapper;
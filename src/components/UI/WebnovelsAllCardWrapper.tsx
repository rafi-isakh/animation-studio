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
        <div className={`relative w-full mx-auto group overflow-hidden ${className}`}>
            <div>
                {title && <h1 className="flex flex-row justify-between text-xl font-extrabold md:mb-0 mb-3">
                    {title}
                </h1>}

                <div className="relative">
                    {/* Desktop layout with fixed 6 cards */}
                    <div
                        ref={scrollRef}
                        className={`${title ? "hidden md:grid md:grid-cols-6 grid-cols-3 overflow-x-auto no-scrollbar gap-1 py-8"
                            : "hidden md:grid md:grid-cols-6 grid-cols-3 overflow-x-auto no-scrollbar gap-1 pb-8"}`}
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
                                        <div className="absolute bottom-0 left-0 right-0  bg-white dark:bg-black p-1 text-white h-[80px] z-50 ">
                                            <div className="flex flex-col justify-between items-center">
                                                <div className="dark:text-white text-black font-medium text-sm text-left">
                                                    <OtherTranslateComponent
                                                        element={item}
                                                        content={item.title}
                                                        elementId={item.id.toString()}
                                                        elementType="webnovel"
                                                        elementSubtype="title"
                                                        classParams="text-sm text-center font-medium line-clamp-2 break-keep korean"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <p className="text-xs text-gray-500 flex flex-col items-center gap-1">
                                                        {
                                                            item.premium ?
                                                                item.author.nickname === 'Anonymous' ? '' :
                                                                    language == 'ko' ?
                                                                        item.author.nickname :
                                                                        koreanToEnglishAuthorName[item.author.nickname as string] ?
                                                                            koreanToEnglishAuthorName[item.author.nickname as string]
                                                                            :
                                                                            item.author.nickname
                                                                : item.user.nickname
                                                        }
                                                        <span className="text-xs text-gray-500 flex flex-row items-center gap-1">
                                                            <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#DE2B74] dark:text-[#DE2B74]">
                                                                <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z"
                                                                    fill="#DE2B74" />
                                                            </svg>
                                                            {item.upvotes}
                                                        </span>
                                                    </p>
                                                </div>
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
                        <div className="md:hidden grid  grid-cols-3 overflow-x-auto no-scrollbar gap-1">
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
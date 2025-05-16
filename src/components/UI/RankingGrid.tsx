"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Webnovel } from '@/components/Types';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import Link from 'next/link';
import CardsScroll from '@/components/CardsScroll';
import { Card } from '@/components/shadcnUI/Card';
import { useMediaQuery } from '@mui/material';
import MainPagePictureOrVideoComponent from '@/components/MainPagePictureOrVideoComponent';
import { koreanToEnglishAuthorName } from '@/utils/webnovelUtils';

export default function RankingGrid({ webnovels, isMobile, title }: { webnovels: Webnovel[], isMobile: boolean, title: string }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const { dictionary, language } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <div className="md:w-max-screen-xl w-full mx-auto group relative">
            <h2 className="text-xl font-bold">{phrase(dictionary, title, language)}</h2>
            <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden no-scrollbar">
                <div
                    className="grid grid-flow-col auto-cols-[120px] md:auto-cols-[160px] md:gap-28 gap-20 w-fit md:pl-[120px] pl-[55px] py-8">
                    {webnovels.map((webnovel, index) => (
                        <div
                            key={index}
                            className="relative group"
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}

                        >
                            {/* Ranking number */}
                            <div className="absolute md:-left-[90px] md:-bottom-8 -left-[55px] -bottom-[15px] select-none pointer-events-none -z-10">
                                <span
                                    className="md:text-[15.5rem] text-[9rem] font-black leading-none text-white 
                                                [text-shadow:2px_0_2px_black,_-2px_0_2px_black,_0_2px_2px_black,_0_-2px_2px_black]
                                                dark:text-black
                                                dark:[text-shadow:2px_0_2px_gray,_-2px_0_2px_gray,_0_2px_2px_gray,_0_-2px_2px_gray]"
                                >
                                    {(index + 1).toString()}
                                </span>
                            </div>
                            {/* Card content */}
                            <Link href={`/view_webnovels/${webnovel.id}`}>
                                <Card
                                    className={`bg-transparent overflow-hidden transition-all duration-300 ease-out border-none shadow-none ${activeIndex === index ? "shadow-none scale-110" : ""
                                        }`}
                                >
                                    <MainPagePictureOrVideoComponent webnovel={webnovel} />
                                    {/* Image container - now using full width of the grid column */}
                                    {activeIndex === index && isDesktop && (
                                        <div className="absolute bottom-0 left-0 right-0 flex flex-col bg-white dark:bg-black p-3 text-white h-[50px] z-50 justify-between items-center">
                                            <h3 className="dark:text-white text-black font-medium text-sm">
                                                <OtherTranslateComponent
                                                    element={webnovel}
                                                    content={webnovel.title}
                                                    elementId={webnovel.id.toString()}
                                                    elementType="webnovel"
                                                    elementSubtype="title"
                                                    classParams="text-xs font-medium text-center line-clamp-2 break-keep korean"
                                                />
                                            </h3>
                                            <div className="flex flex-row gap-2">
                                                <p className="text-xs text-gray-500 flex flex-row items-center gap-1">
                                                    {
                                                        language === "ko" ?
                                                            webnovel.author.nickname :
                                                            koreanToEnglishAuthorName[webnovel.author.nickname]
                                                    }
                                                    <span className="text-xs text-gray-500 flex flex-row items-center gap-1">
                                                        <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#DE2B74] dark:text-[#DE2B74]">
                                                            <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z"
                                                                fill="#DE2B74" />
                                                        </svg>
                                                        {webnovel.upvotes}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            </div >

            {!isMobile && (
                <CardsScroll scrollRef={scrollRef} shift={true} />
            )
            }

        </div >
    )
}

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
                                                <p className="text-xs text-gray-500">{
                                                    language === "ko" ?
                                                        webnovel.author.nickname :
                                                        koreanToEnglishAuthorName[webnovel.author.nickname]
                                                }</p>
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

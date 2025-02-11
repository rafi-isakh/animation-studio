"use client"
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { scroll } from '@/utils/scroll'
import { Webnovel } from '@/components/Types';
import { getImageUrl } from "@/utils/urls"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function RankingGrid({ webnovels, isMobile }: { webnovels: Webnovel[], isMobile: boolean }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const { dictionary, language } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);
    return (
        <div className="md:w-max-screen-xl w-full mx-auto group relative">
            <h2 className="text-2xl font-bold mb-6">{phrase(dictionary, "TOP_SEVEN_WEBNOVELS", language)}</h2>
            <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden pb-4 no-scrollbar">
                {/* Auto-cols-[190px] will define the column width */}
                <div
                    className="grid grid-flow-col auto-cols-[120px] md:auto-cols-[160px] md:gap-28 gap-20 w-fit md:pl-[120px] pl-[55px] ">
                    {webnovels.map((webnovel, index) => (
                        <div
                            key={index}
                            className="relative group"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
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
                            <Link href={`/view_webnovels?id=${webnovel.id}`}>
                                <div
                                    className={`relative overflow-hidden rounded-lg transition-all duration-300 pt-1 
                                                hover:scale-105 
                                                ${hoveredIndex === index ? 'transform scale-100' : ''}`}
                                >
                                    {/* Image container - now using full width of the grid column */}
                                    <div className="relative w-[120px] md:w-[160px] aspect-[2/3] bg-gray-900 rounded-lg ">
                                        <Image
                                            fill
                                            src={getImageUrl(webnovel.cover_art)}
                                            alt={webnovel.title}
                                            className="object-cover w-full rounded-lg "
                                            sizes="(max-width: 768px) 120px, 180px"
                                            placeholder="blur"
                                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                            priority={index < 2}
                                        />
                                    </div>
                                    {/* Gradient overlay */}
                                    <div className="w-[120px] md:w-[180px] absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                                    {/* Title and badge */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-white font-semibold line-clamp-2 text-base break-keep">
                                            <OtherTranslateComponent content={webnovel.title} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype='title' />
                                        </h3>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {!isMobile && (
                <>
                    <button
                        onClick={() => scroll('left', scrollRef)}
                        className="bg-white/80 dark:bg-black/80 group-hover:opacity-80 transition-opacity 
                            duration-300 absolute h-72
                            left-0 top-[55%] -translate-y-1/2 z-50 p-2 opacity-0 rounded-full"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                        onClick={() => scroll('right', scrollRef)}
                        className="bg-white/80 dark:bg-black/80 group-hover:opacity-80 transition-opacity 
                            duration-300 absolute h-72
                            right-0 top-[55%] -translate-y-1/2 z-50 p-2 opacity-0 rounded-full"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>
                </>
            )}

        </div>
    )
}

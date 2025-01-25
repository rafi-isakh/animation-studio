"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { Webnovel } from '@/components/Types';
import { getImageUrl } from "@/utils/urls"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import Link from 'next/link';

export default function RankingGrid({ webnovels }: { webnovels: Webnovel[] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const { dictionary, language } = useLanguage();

    return (
        <div className="md:w-max-screen-lg w-full mx-auto">
            <h2 className="text-2xl font-bold mb-6">{phrase(dictionary, "TOP_SEVEN_WEBNOVELS", language)}</h2>
            <div className="overflow-x-auto overflow-y-hidden pb-4">
                {/* Auto-cols-[190px] will define the column width */}
                <div className="grid grid-flow-col auto-cols-[120px] md:gap-28 gap-16 w-fit md:pl-[120px] pl-[39px] ">
                    {webnovels.map((webnovel, index) => (
                        <div
                            key={index}
                            className="relative group"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Ranking number */}
                            <div className="absolute md:-left-[90px] md:-top-8 -left-[40px] -bottom-[10px] select-none pointer-events-none -z-10">
                                <span
                                    className="md:text-[15.5rem] text-[7rem] font-black leading-none text-white 
                                                [text-shadow:2px_0_2px_black,_-2px_0_2px_black,_0_2px_2px_black,_0_-2px_2px_black]
                                                dark:text-gray-700
                                                dark:[text-shadow:2px_0_2px_gray,_-2px_0_2px_gray,_0_2px_2px_gray,_0_-2px_2px_gray]"
                                    >
                                    {(index + 1).toString()}
                                </span>
                            </div>
                            {/* Card content */}
                            <Link href={`/view_webnovels?id=${webnovel.id}`}>
                                <div
                                    className={`relative overflow-hidden rounded-lg transition-all duration-300 pt-1 
                                             ${hoveredIndex === index ? 'transform scale-100' : ''}`}
                                >
                                    {/* Image container - now using full width of the grid column */}
                                    <div className="relative w-[120px] aspect-[2/3] bg-gray-900 rounded-lg">
                                        <Image
                                            fill
                                            src={getImageUrl(webnovel.cover_art)}
                                            alt={webnovel.title}
                                            className="object-cover w-full rounded-lg"
                                            sizes="(max-width: 768px) 150px, 150px"
                                            placeholder="blur"
                                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                            priority={index < 2}
                                        />
                                    </div>
                                    {/* Gradient overlay */}
                                    <div className="w-[150px] absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                                    {/* Title and badge */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                        <h3 className="text-white font-semibold line-clamp-2 text-base break-keep">
                                            <OtherTranslateComponent content={webnovel.title} elementId={webnovel.id.toString()} elementType='webnovel' elementSubtype='title'/>
                                        </h3>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

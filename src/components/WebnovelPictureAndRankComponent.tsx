import { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { Oleo_Script_Swash_Caps } from 'next/font/google'
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases'
import { Card, useMediaQuery } from "@mui/material"
import { ChevronLeft, ChevronRight, TrendingUp, Eye } from "lucide-react"
import React from "react"

const WebnovelPictureAndRankComponent = React.memo(({ webnovel, index, ranking, details, up, isOriginal }: { webnovel: Webnovel, index: number, ranking: boolean, details: boolean, up: boolean, isOriginal: boolean }) => {
    const { language, dictionary } = useLanguage();
    const imageSrc = getImageUrl(webnovel.cover_art)

    return (
        <Link href={`/view_webnovels/${webnovel.id}`}>
            <div className="group relative flex flex-col items-center w-full">
                {/* Image Container - Reduced sizes */}
                <div className="relative shrink-0 overflow-hidden rounded-xl h-full w-full aspect-[180/257]">
                    {/*   */}
                    <Image
                        src={imageSrc}
                        alt={webnovel.cover_art}
                        fill
                        sizes="(max-width: 768px) 100px, 160px"
                        quality={85}
                        className="object-cover"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                    />
                    {/* UP Badge */}
                    {up && (<span className="absolute top-0 left-0 text-[10px] text-white bg-[#DB2777] px-1 py-1">
                        UP
                    </span>)}
                    {/* Ranking Number Overlay */}
                    {ranking && (
                        <div className="absolute md:bottom-14 bottom-8 md:-left-1 left-1 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                            <div className="absolute inset-0 bg-transparent opacity-90"></div>
                            <p className="relative text-9xl md:text-[10vw] font-extrabold text-white outlined-text">
                                {index}
                            </p>
                        </div>
                    )}
                </div>

                {/* Text Content Container */}
                <div className="mt-2 w-full">
                    <div className="flex flex-col items-center text-center">
                        {/* Genre */}
                        <OtherTranslateComponent
                            element={webnovel}
                            content={webnovel.title}
                            elementId={webnovel.id.toString()}
                            elementType="webnovel"
                            elementSubtype="title"
                            classParams="text-[12px] md:text-sm font-medium line-clamp-2 w-[100px] md:w-[160px]"
                        />
                        <p className="text-[10px] md:text-[11px] font-bold w-full truncate text-gray-500 flex flex-col md:flex-row justify-center">
                            {webnovel.author.nickname}
                            <span className="hidden md:block"> • </span>
                            <span className="">{phrase(dictionary, webnovel.genre, language)}</span>
                        </p>

                        {details && (
                            // Total Chapters and Views
                            <div className="flex flex-row justify-center font-bold">
                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-500 ">
                                    <span> {phrase(dictionary, "totalchapters", language)} {webnovel.chapters_length} </span>
                                    <span>{phrase(dictionary, "numchapters", language)}</span>
                                </p>
                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-500 md:flex flex-row items-center ml-2 hidden gap-1 ">
                                    <Eye size={10} />
                                    <span> {webnovel.views} </span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
});

WebnovelPictureAndRankComponent.displayName = 'WebnovelPictureAndRankComponent'; // need this because this is a React.meo
export default WebnovelPictureAndRankComponent
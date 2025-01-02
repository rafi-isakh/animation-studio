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
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import React from "react"

const WebnovelPictureComponent = React.memo(({ webnovel, index, ranking, details, up, isOriginal }: { webnovel: Webnovel, index: number, ranking: boolean, details: boolean, up: boolean, isOriginal: boolean }) => {
    const { language, dictionary } = useLanguage();
    const imageSrc = getImageUrl(webnovel.cover_art)

    return (
        <Link href={`/view_webnovels?id=${webnovel.id}`}>
            <div className="group relative flex flex-col items-center w-full">
                {/* Image Container - Reduced sizes */}
                <div className="relative shrink-0 overflow-hidden rounded-sm h-full">
                    {/*  w-[100px] h-[150px] md:w-[140px] md:h-[200px] */}
                    <Image
                        src={imageSrc}
                        alt={webnovel.cover_art}
                        width={180}
                        height={257}
                        quality={85}
                        className="object-cover w-[100px] h-[143px] md:w-[160px] md:h-[240px]"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                    />

                    {/* UP Badge */}
                    {up && (<span className="absolute top-0 left-0 text-[10px] text-white bg-[#DB2777] px-1 py-1">
                        UP
                    </span>)}
                    {/* Ranking Number Overlay */}
                    {ranking && (
                        <div className="absolute md:bottom-3 bottom-5 md:-left-1 left-1 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                            <div className="absolute inset-0 bg-transparent opacity-90"></div>
                            <p className="relative italic text-6xl md:text-7xl font-extrabold text-white outlined-text">
                                {/*  font-outline-2 */}
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
                            content={webnovel.title}
                            elementId={webnovel.id.toString()}
                            elementType="webnovel"
                            elementSubtype="title"
                            classParams="text-[12px] md:text-sm font-medium line-clamp-2 w-[100px] md:w-[160px]"
                        />
                        <p className="text-[10px] md:text-[11px] font-bold w-full truncate text-gray-500 flex flex-col md:flex-row justify-center">
                            {webnovel.user.nickname}
                            <span className="hidden md:block"> • </span>
                            <span className="">{phrase(dictionary, webnovel.genre, language)}</span>
                        </p>

                        {details && (
                            // Total Chapters and Views
                            <div className="flex flex-row justify-center font-bold">
                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-500 ">
                                    <span> {phrase(dictionary, "totalchapters", language)} {webnovel.chapters.length} </span>
                                    <span>{phrase(dictionary, "numchapters", language)}</span>
                                </p>
                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-500 md:flex flex-row items-center ml-2 hidden gap-1 ">
                                    <TrendingUp size={10} />
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

WebnovelPictureComponent.displayName = 'WebnovelPictureComponent'; // need this because this is a React.meo
export default WebnovelPictureComponent
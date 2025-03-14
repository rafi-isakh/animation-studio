import React from "react"
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

const WebnovelPictureCardWrapper = React.memo(({ webnovel, index, ranking, details, up, isOriginal }: { webnovel: Webnovel, index: number, ranking: boolean, details: boolean, up: boolean, isOriginal: boolean }) => {
    const { language, dictionary } = useLanguage();
    const imageSrc = getImageUrl(webnovel.cover_art)

    return (
        <Link href={`/view_webnovels?id=${webnovel.id}`} className="relative w-full">
            <div className="relative aspect-[180/257] overflow-hidden rounded-xl">
                {/* Image Container */}
                <div className="absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out hover:scale-110">
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
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-10 transition-opacity duration-300 ease-in-out hover:bg-opacity-50">

                        {/* UP Badge */}
                        {up && (<span className="absolute top-0 left-0 text-[10px] text-white bg-[#DB2777] px-1 py-1 z-20">
                            UP
                        </span>)}

                        {/* Ranking Number */}
                        {ranking && (
                            <div className="absolute md:bottom-3 bottom-5 md:-left-1 left-1 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center z-20">
                                <div className="absolute inset-0 bg-transparent opacity-90"></div>
                                <p className="relative italic text-6xl md:text-7xl font-extrabold text-white outlined-text">
                                    {index}
                                </p>
                            </div>
                        )}

                        {/* Description */}
                        <div className="absolute inset-0" />
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-4 opacity-100 transition-all duration-300 z-10">
                            <div className="flex flex-col items-center text-center">
                                <OtherTranslateComponent
                                    content={webnovel.title}
                                    elementId={webnovel.id.toString()}
                                    elementType="webnovel"
                                    elementSubtype="title"
                                    classParams="text-sm md:text-base font-medium line-clamp-2 w-[100px] md:w-[160px] text-white break-keep korean"
                                />
                                <p className="text-[10px] md:text-sm font-bold w-full truncate text-white flex flex-col md:flex-row justify-center">
                                    {webnovel.author.nickname}
                                    <span className="hidden md:block text-white"> • </span>
                                    <span className="text-white">{phrase(dictionary, webnovel.genre, language)}</span>
                                </p>

                                {details && (
                                    <div className="flex flex-row justify-center font-bold mt-2">
                                        <p className="text-[10px] md:text-sm text-white">
                                            <span>{phrase(dictionary, "totalchapters", language)} {webnovel.chapters.length} </span>
                                            <span>{phrase(dictionary, "numchapters", language)}</span>
                                        </p>
                                        <p className="text-[10px] md:text-sm text-white md:flex flex-row items-center ml-2 hidden gap-1">
                                            <TrendingUp size={10} className="text-white" />
                                            <span>{webnovel.views}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
});

WebnovelPictureCardWrapper.displayName = 'WebnovelPictureCardWrapper'; // need this because this is a React.meo
export default WebnovelPictureCardWrapper
import React from "react"
import { Webnovel, Language } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases'
import { useMediaQuery } from "@mui/material"
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Play, Plus, ThumbsUp, TrendingUp } from "lucide-react"

const WebnovelPictureCardWrapper = React.memo(({ webnovel, index, ranking, details, up, isOriginal }: { webnovel: Webnovel, index: number, ranking: boolean, details: boolean, up: boolean, isOriginal: boolean }) => {
    const { language, dictionary } = useLanguage();
    const imageSrc = getImageUrl(webnovel.cover_art)
    const [isHovered, setIsHovered] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')
    return (
        <Link href={`/view_webnovels?id=${webnovel.id}`} className="relative w-full">
            <div className="relative aspect-[180/257] overflow-hidden rounded-xl"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Container */}
                <div className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out 
                                ${isHovered ? "scale-110 shadow-xl duration-500 transition-all" : ""}`}>
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
                                {isHovered && (
                                    <div className="absolute inset-0 flex flex-col bg-white dark:bg-[#211F21]">
                                        <Image 
                                            src={getImageUrl(webnovel.cover_art) || "/placeholder.svg"} 
                                            alt={webnovel.title} 
                                            width={isMobile ? 100 : 170}
                                            height={isMobile ? 70 : 150}
                                            className={`md:h-[170px] h-[100px] w-full object-cover `} />
                                        <div className="flex flex-1 flex-col p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <div className="flex gap-2">

                                                {/* <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-white/90">
                                                    <Play className="h-4 w-4" />
                                                </button> */}
                                                <div className="flex flex-wrap gap-2">
                                                    {webnovel.available_languages
                                                        .replace(/[\"\[\]]/g, '')
                                                        .split(',')
                                                        .map((language, index) => (
                                                            <span key={index} className="md:text-sm text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-2 py-1 rounded-md">
                                                                {phrase(dictionary, language.trim(), language as Language)}
                                                            </span>
                                                        ))}
                                                </div>
                                                </div>
                                               
                                                <button className="flex md:h-8 md:w-8 w-6 h-6 items-center justify-center rounded-full border border-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                    <Heart className="md:h-4 md:w-4 w-3 h-3" />
                                                </button>


                                            </div>
                                            {/* <div className="mb-2 flex items-center gap-2 text-sm">
                                                <span className="text-white font-semibold">{phrase(dictionary, webnovel.genre, language)}</span>
                                            </div> */}

                                            <OtherTranslateComponent
                                                content={webnovel.title}
                                                elementId={webnovel.id.toString()}
                                                elementType="webnovel"
                                                elementSubtype="title"
                                                classParams="text-[10px] md:text-base font-medium line-clamp-2 w-full text-black dark:text-white break-keep korean truncate"
                                            />
                                            <p className="text-[10px] md:text-sm font-bold w-full truncate text-black dark:text-white flex flex-col md:flex-row justify-center">
                                                {webnovel.author.nickname}
                                                <span className="hidden md:block text-black dark:text-white"> • </span>
                                                <span className="text-black dark:text-white">{phrase(dictionary, webnovel.genre, language)}</span>
                                            </p>
                                        </div>
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
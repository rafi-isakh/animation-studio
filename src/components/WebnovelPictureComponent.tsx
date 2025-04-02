"use client"

import React from "react"
import type { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from "@/utils/phrases"
import { TrendingUp } from "lucide-react"

const WebnovelPictureComponent = React.memo(
    ({
        webnovel,
        index,
        ranking,
        details,
        up,
        isOriginal,
    }: { webnovel: Webnovel; index: number; ranking: boolean; details: boolean; up: boolean; isOriginal: boolean }) => {
        const { language, dictionary } = useLanguage()
        const imageSrc = getImageUrl(webnovel.cover_art)

        return (
            <Link href={`/view_webnovels/${webnovel.id}`} className="block w-full">
                <div className="relative flex flex-col items-center w-full">
                    {/* Image Container - Reduced sizes */}
                    <div className="relative shrink-0 overflow-hidden rounded-xl h-full w-full aspect-[180/257] ">
                        {/* Image with hover effect */}
                        <div className="absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out hover:scale-105">
                            <Image
                                src={imageSrc || "/placeholder.svg"}
                                alt={webnovel.cover_art}
                                fill
                                sizes="(max-width: 768px) 100px, 160px"
                                quality={85}
                                className="object-cover"
                                placeholder="blur"
                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                            />

                            {/* Overlay for hover effect */}
                            <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 hover:opacity-50 flex items-center justify-center gap-2 z-10">
                                <p className="text-white text-center text-sm">{phrase(dictionary, "viewnow", language)}</p>
                                <div className="bg-white rounded-full p-1">
                                    <svg width="10" height="10" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M1 1L15 10L1 19V1Z"
                                            fill="black"
                                            stroke="black"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                            </div>

                        </div>

                        {/* UP Badge */}
                        {up && <span className="absolute top-0 left-0 text-[10px] text-white bg-[#DB2777] px-1 py-1">UP</span>}

                        {/* Ranking Number Overlay */}
                        {ranking && (
                            <div className="absolute md:bottom-14 bottom-8 md:-left-1 left-1 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                                <div className="absolute inset-0 bg-transparent opacity-90"></div>
                                <p className="relative text-9xl md:text-[10vw] font-extrabold text-white outlined-text">{index}</p>
                            </div>
                        )}
                    </div>

                    {/* Text Content Container */}
                    <div className="mt-2 w-full">
                        <div className="flex flex-col items-center text-center">
                            {/* Title */}
                            <OtherTranslateComponent
                                content={webnovel.title}
                                elementId={webnovel.id.toString()}
                                elementType="webnovel"
                                elementSubtype="title"
                                classParams="text-sm md:text-base font-medium line-clamp-2 w-[100px] md:w-[160px] break-keep korean"
                            />
                            {/* Author and Genre */}
                            <p className="text-[10px] md:text-sm font-bold w-full truncate text-gray-500 flex flex-col md:flex-row justify-center">
                                {webnovel.author.nickname}
                                <span className="hidden md:block"> • </span>
                                <span className="">{phrase(dictionary, webnovel.genre, language)}</span>
                            </p>

                            {details && (
                                // Total Chapters and Views
                                <div className="flex flex-row justify-center font-bold">
                                    <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-500 ">
                                        <span>
                                            {" "}
                                            {phrase(dictionary, "totalchapters", language)} {webnovel.chapters_length}{" "}
                                        </span>
                                        <span>{phrase(dictionary, "numchapters", language)}</span>
                                    </p>
                                    <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-500 md:flex flex-row items-center ml-2 hidden gap-1 ">
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
    },
)

WebnovelPictureComponent.displayName = "WebnovelPictureComponent"
export default WebnovelPictureComponent
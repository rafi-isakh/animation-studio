"use client"

import React, { useEffect, useRef, useState } from "react"
import type { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from "@/utils/phrases"
import { Pause, Play, TrendingUp, Volume2, VolumeOff } from "lucide-react"
import { koreanToEnglishAuthorName, videoDisallowedForKorean } from "@/utils/webnovelUtils";
import MainPagePictureOrVideoComponent from "./MainPagePictureOrVideoComponent"

const WebnovelPictureComponent = React.memo(
    ({
        webnovel,
    }: { webnovel: Webnovel }) => {
        const { language, dictionary } = useLanguage()

        return (
            <Link href={`/view_webnovels/${webnovel.id}`} className="block w-full">
                <div className="relative flex flex-col items-center w-full">
                    {/* Image Container - Reduced sizes */}
                    <MainPagePictureOrVideoComponent webnovel={webnovel} />
                </div>
                {/* Text Content Container */}
                <div className="mt-2 w-full">
                    <div className="flex flex-col">
                        {
                            // If translation exists, use it; if it doesn't, invoke OtherTranslateComponent
                            webnovel.other_translations?.find(
                                translation => translation.language === language
                                    && translation.element_type === "webnovel"
                                    && translation.element_subtype === "title"
                                    && translation.webnovel_id == webnovel.id.toString()
                            )?.text
                            ||
                            <OtherTranslateComponent
                                element={webnovel}
                                content={webnovel.title}
                                elementId={webnovel.id.toString()}
                                elementType="webnovel"
                                elementSubtype="title"
                                classParams="text-sm md:text-base font-medium line-clamp-2 break-keep korean"
                            />
                        }
                        {/* Author and Genre */}
                        <div className="text-xs line-clamp-2 w-full truncate text-gray-500 flex flex-col">
                            {/* TODO: DO THIS IN A SANE WAY, USING THE DB, INSTEAD OF THIS BESPOKE FUNCTION*/}
                            <span className="mr-1">{language === "en" ? koreanToEnglishAuthorName[webnovel.author.nickname] || webnovel.author.nickname : webnovel.author.nickname}</span>
                            <span className="flex flex-row items-center gap-1">
                                {/* heart icon */}
                                <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#DE2B74] dark:text-[#DE2B74]">
                                    <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z"
                                        fill="#DE2B74" />
                                </svg>
                                {webnovel.upvotes}
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        )
    },
)

WebnovelPictureComponent.displayName = "WebnovelPictureComponent"
export default WebnovelPictureComponent
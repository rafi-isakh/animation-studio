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
                    <div className="flex flex-col items-center text-center">
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
                                content={webnovel.title}
                                elementId={webnovel.id.toString()}
                                elementType="webnovel"
                                elementSubtype="title"
                                classParams="text-sm md:text-base font-medium line-clamp-2 w-[100px] md:w-[160px] break-keep korean"
                            />
                        }
                        {/* Author and Genre */}
                        <p className="text-[10px] md:text-sm font-bold w-full truncate text-gray-500 flex flex-col md:flex-row justify-center">
                            {/* TODO: DO THIS IN A SANE WAY, USING THE DB, INSTEAD OF THIS BESPOKE FUNCTION*/}
                            {language === "en" ? koreanToEnglishAuthorName[webnovel.author.nickname] || webnovel.author.nickname : webnovel.author.nickname}
                            <span className="hidden md:block"> • </span>
                            <span className="">{phrase(dictionary, webnovel.genre, language)}</span>
                        </p>
                    </div>
                </div>
            </Link>
        )
    },
)

WebnovelPictureComponent.displayName = "WebnovelPictureComponent"
export default WebnovelPictureComponent
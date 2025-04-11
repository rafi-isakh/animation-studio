"use client"

import React, { useEffect, useState } from "react"
import type { Webnovel } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from "@/utils/phrases"
import { Pause, Play, TrendingUp, Volume2, VolumeOff } from "lucide-react"
import { koreanToEnglishAuthorName, videoDisallowedForKorean } from "@/utils/webnovelUtils";

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
        const [imageSrc, setImageSrc] = useState<string | null>(null)
        const [videoSrc, setVideoSrc] = useState<string | null>(null)
        const [videoExists, setVideoExists] = useState(false)
        const [isMuted, setIsMuted] = useState(true)
        const [isPlaying, setIsPlaying] = useState(true)
        const [showPlayButton, setShowPlayButton] = useState(false)
        const [isHovered, setIsHovered] = useState(false)

        useEffect(() => {
            if (language === "en" && webnovel.en_cover_art) {
                const imageSrc = getImageUrl(webnovel.en_cover_art)
                const videoSrc = getVideoUrl(webnovel.en_video_cover)
                setImageSrc(imageSrc)
                setVideoSrc(videoSrc)
            } else {
                const imageSrc = getImageUrl(webnovel.cover_art)
                const videoSrc = getVideoUrl(webnovel.video_cover)
                setImageSrc(imageSrc)
                setVideoSrc(videoSrc)
            }
        }, [language])

        useEffect(() => {
            if (videoSrc) {
                setVideoExists(true)
            } else {
                setVideoExists(false)
            }
        }, [videoSrc])

        const handleToggleMute = () => {
            const videoElement = document.getElementById('videoElement');
            if (videoElement) {
                setIsMuted(prev => !prev);
            }
        };

        const handleTogglePlayVideo = () => {
            const videoElement = document.getElementById('videoElement') as HTMLVideoElement;
            if (videoElement) {
                if (isPlaying) {
                    videoElement.pause();
                } else {
                    videoElement.play();
                }
                setIsPlaying(prev => !prev);
            }
        };

        return (
            <Link href={`/view_webnovels/${webnovel.id}`} className="block w-full">
                <div className="relative flex flex-col items-center w-full">
                    {/* Image Container - Reduced sizes */}
                    <div className="relative shrink-0 overflow-hidden rounded-xl h-full w-full aspect-[180/257]"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}>
                        {/* Image with hover effect */}
                        <div className="absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out hover:scale-105">
                            {
                                (!videoExists || !isHovered || (videoDisallowedForKorean.includes(webnovel.id) && language === "ko")) ?
                                    <Image
                                        src={imageSrc || "/placeholder.svg"}
                                        alt={webnovel.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 300px"
                                        className="object-cover rounded-xl"
                                        placeholder="blur"
                                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                    />
                                    :
                                    <div>
                                        <div className="relative aspect-[2/3]">
                                            <video
                                                id="videoElement"
                                                src={videoSrc!}
                                                autoPlay
                                                playsInline
                                                onMouseEnter={() => setShowPlayButton(true)}
                                                onMouseLeave={() => setShowPlayButton(false)}
                                                onClick={handleTogglePlayVideo}
                                                style={{ width: '225px', height: '300px', objectPosition: 'center top' }} // Inline styles
                                                className="object-cover rounded-xl"
                                                muted={isMuted}
                                                loop
                                            />
                                            <button
                                                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${showPlayButton ? 'block' : 'hidden'}`}
                                                onClick={handleTogglePlayVideo}
                                            >
                                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                            </button>
                                        </div>
                                        <button onClick={handleToggleMute} className="mute-button absolute bottom-2 right-2">
                                            {isMuted ? <VolumeOff size={20} /> : <Volume2 size={20} />}
                                        </button>
                                    </div>
                            }

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
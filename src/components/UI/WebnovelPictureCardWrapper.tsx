import React from "react"
import { Webnovel, Language } from "@/components/Types"
import Link from "next/link"
import Image from "next/image"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from '@/utils/phrases'
import { Skeleton } from "@/components/shadcnUI/Skeleton"
import { useMediaQuery } from "@mui/material"
import { Pause, Play, Volume2, VolumeOff } from "lucide-react"
import { videoDisallowedForKorean } from "@/utils/webnovelUtils"
const WebnovelPictureCardWrapper = React.memo(({ webnovel, index, ranking, details, up, isOriginal }: { webnovel: Webnovel, index: number, ranking: boolean, details: boolean, up: boolean, isOriginal: boolean }) => {
    const { language, dictionary } = useLanguage();
    const [isHovered, setIsHovered] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [videoExists, setVideoExists] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [isPlaying, setIsPlaying] = useState(true)
    const [showPlayButton, setShowPlayButton] = useState(false)
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [videoSrc, setVideoSrc] = useState<string | null>(null)

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
        <Link href={`/view_webnovels/${webnovel.id}`} className="relative w-full">
            <div className="relative aspect-[180/257] overflow-hidden rounded-xl"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image Container */}
                <div className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out 
                                ${isHovered ? "scale-110 shadow-xl duration-500 transition-all" : ""}`}>
                    {webnovel.cover_art ?
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
                        :
                        <Skeleton className="w-full h-full" />
                    }

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
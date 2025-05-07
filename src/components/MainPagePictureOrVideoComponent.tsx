import Image from 'next/image'
import { Webnovel } from './Types'
import { useEffect, useRef, useState } from 'react'
import { getImageUrl, getVideoUrl } from '@/utils/urls'
import { videoDisallowedForKorean } from '@/utils/webnovelUtils'
import { useLanguage } from '@/contexts/LanguageContext'

export default function MainPagePictureOrVideoComponent({ webnovel }: { webnovel: Webnovel }) {
    const { language } = useLanguage()
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [videoSrc, setVideoSrc] = useState<string | null>(null)
    const [videoExists, setVideoExists] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const lastHoveredElement = useRef<HTMLDivElement | null>(null)
    const currentHoverTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        setImageSrc(getImageUrl(webnovel.cover_art)) // this one always exists, is default
        if (language === "en") {
            if (webnovel.en_cover_art) {
                const imageSrc = getImageUrl(webnovel.en_cover_art)
                setImageSrc(imageSrc)
            }
            if (webnovel.en_video_cover) {
                const videoSrc = getVideoUrl(webnovel.en_video_cover)
                setVideoSrc(videoSrc)
            }
        } else {
            if (webnovel.video_cover) {
                const videoSrc = getVideoUrl(webnovel.video_cover)
                setVideoSrc(videoSrc)
            }
        }
    }, [language])

    useEffect(() => {
        if (videoSrc) {
            setVideoExists(true)
        } else {
            setVideoExists(false)
        }
    }, [videoSrc])


    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsHovered(true)
        if (lastHoveredElement.current && lastHoveredElement.current !== e.currentTarget) {
            stopVideo(lastHoveredElement.current);
        }

        if (currentHoverTimeout.current) {
            clearTimeout(currentHoverTimeout.current);
        }
        lastHoveredElement.current = e.currentTarget;

        currentHoverTimeout.current = setTimeout(() => {
            if (lastHoveredElement.current) {
                startVideo(lastHoveredElement.current, videoSrc!);
            }
        }, 100); // Add delay to avoid spamming requests
    }

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsHovered(false)
        if (currentHoverTimeout.current) {
            clearTimeout(currentHoverTimeout.current);
        }
        stopVideo(e.currentTarget);
    }

    const stopVideo = (element: HTMLDivElement) => {
        const videoElement = element.querySelector('video');
        if (videoElement) {
            videoElement.pause();
            videoElement.src = "";
            videoElement.load();
        }
    }

    const startVideo = (element: HTMLDivElement, videoUrl: string) => {
        const videoElement = element.querySelector('video');
        if (videoElement) {
            videoElement.src = videoUrl;
            videoElement.load();
            videoElement.play();
        }
    }
    return (
        <div className="relative shrink-0 overflow-hidden rounded-xl h-full w-full aspect-[180/257]"
            onMouseEnter={(e) => { handleMouseEnter(e) }}
            onMouseLeave={(e) => { handleMouseLeave(e) }}>
            {/* Image with hover effect */}
            <div className="absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out hover:scale-105">
                {
                    (!videoExists || !isHovered || (videoDisallowedForKorean.includes(webnovel.id) && language === "ko")) ?
                    <>   
                    <Image
                            src={imageSrc || "/placeholder.svg"}
                            alt={webnovel.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover rounded-xl"
                            placeholder="blur"
                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                        />
                     {webnovel.is_adult_material && (
                        <>
                          { language === "ko" ? (
                            <span className="z-[99] inline-flex absolute top-2 left-2 w-fit px-1.5 py-1 rounded-full bg-white border border-red-600 text-black text-center justify-center items-center font-bold text-xs">
                            19
                            </span>
                            ) : (
                          <span className="z-[99] inline-flex absolute top-2 left-2 w-fit px-2 py-1 rounded-sm bg-red-600 text-white text-center justify-center items-center text-xs">
                            Mature
                          </span>
                            )}
                        </>
                    )}
                     </>
                        :
                        <div>
                            <div className="relative aspect-[2/3]">
                                <video
                                    id="videoElement"
                                    src={videoSrc!}
                                    autoPlay
                                    playsInline
                                    style={{ width: '225px', height: '300px', objectPosition: 'center top' }} // Inline styles
                                    className="object-cover rounded-xl"
                                    muted={true}
                                    loop
                                />
                            </div>
                        </div>
                }
            </div>
        </div>
    )
}
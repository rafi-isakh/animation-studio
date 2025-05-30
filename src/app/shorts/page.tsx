"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar"
import { Button } from "@/components/shadcnUI/Button"
import {
    Heart,
    MessageCircle,
    Send,
    Bookmark,
    MoreHorizontal,
    Music,
    Search, Plus, ChevronDown, ChevronUp,
} from "lucide-react"
import { useMediaQuery } from "@mui/material"
import { Webnovel } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import { truncateText } from "@/utils/truncateText"
import Link from "next/link"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { phrase } from "@/utils/phrases"
import { useLanguage } from "@/contexts/LanguageContext"
import SharingModal from '@/components/UI/SharingModal';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcnUI/Popover"
import ReportButton from "@/components/UI/ReportButton"

export default function InstagramReels() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [shortVideos, setShortVideos] = useState<Array<Webnovel>>([]);
    const [startY, setStartY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isMobile = useMediaQuery("(max-width: 768px)")
    const [allWebnovels, setAllWebnovels] = useState<Array<Webnovel>>([]);
    const { dictionary, language } = useLanguage()
    const [isSharing, setIsSharing] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)

    useEffect(() => {
        const fetchWebnovels = async () => {
            const response = await fetch("/api/get_webnovels_metadata",
                {
                    next: {
                        tags: ['webnovels']
                    }
                }
            );
            if (!response.ok) {
                console.error("Failed to fetch webnovels metadata", response.status);
                return [];
            }
            const data = await response.json();
            const filteredData = data.filter((webnovel: Webnovel) => webnovel.en_video_cover);
            console.log(filteredData)
            setAllWebnovels(filteredData);
        }
        fetchWebnovels()
    }, [])

    // Add useEffect for touch and wheel event listeners
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let scrollTimeout: NodeJS.Timeout;
        let isScrolling = false;

        const handleTouchStart = (e: TouchEvent) => {
            setStartY(e.touches[0].clientY)
            setIsDragging(true)
        }

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return
            e.preventDefault()
        }

        const handleTouchEnd = (e: TouchEvent) => {
            if (!isDragging) return

            const endY = e.changedTouches[0].clientY
            const deltaY = startY - endY
            const threshold = 50

            if (Math.abs(deltaY) > threshold) {
                if (deltaY > 0) {
                    // Swiped up - next reel
                    goToNext()
                } else {
                    // Swiped down - previous reel
                    goToPrevious()
                }
            }

            setIsDragging(false)
        }

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()

            if (isScrolling) return
            isScrolling = true

            // Clear existing timeout
            if (scrollTimeout) {
                clearTimeout(scrollTimeout)
            }

            // Debounce scroll events to prevent rapid page changes (increased to 200ms)
            scrollTimeout = setTimeout(() => {
                if (e.deltaY > 0) {
                    // Scrolled down - next reel
                    goToNext()
                } else {
                    // Scrolled up - previous reel
                    goToPrevious()
                }
                // Reset scrolling flag after animation (increased to 800ms for longer cooldown)
                setTimeout(() => {
                    isScrolling = false
                }, 800)
            }, 500)
        }

        // Add event listeners with passive: false to allow preventDefault
        container.addEventListener('touchstart', handleTouchStart, { passive: false })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd, { passive: false })
        container.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
            container.removeEventListener('wheel', handleWheel)
            if (scrollTimeout) {
                clearTimeout(scrollTimeout)
            }
        }
    }, [isDragging, startY, currentIndex, allWebnovels.length])

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M"
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K"
        }
        return num.toString()
    }

    // Function to calculate total comments across all chapters
    const getTotalComments = (webnovel: Webnovel) => {
        if (!webnovel.chapters || webnovel.chapters.length === 0) {
            return 0
        }
        return webnovel.chapters.reduce((total: number, chapter: any) => {
            return total + (chapter.comments ? chapter.comments.length : 0)
        }, 0)
    }

    const handleShareClick = async (shortVideo: Webnovel) => {
        if (isSharing) return; // Prevent multiple simultaneous share attempt
        if (navigator.share) {
            try {
                setIsSharing(true);
                await navigator.share({
                    title: shortVideo.title,
                    text: phrase(dictionary, "share", language),
                    url: ``
                });
            } catch (error) {
                console.log('Share failed:', error);
            } finally {
                setIsSharing(false);
            }
        } else {
            setShowShareModal(true);
        }
    }

    const handleLike = (reelId: string) => {
        setShortVideos((prev) =>
            prev.map((shortVideo) =>
                shortVideo.id.toString() === reelId
                    ? {
                        ...shortVideo,
                        isLiked: !shortVideo.upvotes,
                        likes: shortVideo.upvotes ? shortVideo.upvotes - 1 : shortVideo.upvotes + 1,
                    }
                    : shortVideo,
            ),
        )
    }

    const goToNext = () => {
        if (currentIndex < allWebnovels.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    // Mouse handlers for desktop testing
    const handleMouseDown = (e: React.MouseEvent) => {
        setStartY(e.clientY)
        setIsDragging(true)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        e.preventDefault()
    }

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDragging) return

        const endY = e.clientY
        const deltaY = startY - endY
        const threshold = 50

        if (Math.abs(deltaY) > threshold) {
            if (deltaY > 0) {
                goToNext()
            } else {
                goToPrevious()
            }
        }

        setIsDragging(false)
    }

    const currentReel = allWebnovels[currentIndex]

    return (
        <div className="relative w-full h-screen bg-white dark:bg-black overflow-hidden select-none">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-4">
                    <h1 className="text-white text-xl font-semibold">Toonyz Shorts</h1>
                    <Link href="#" className="text-white text-sm font-semibold underline">
                        Trailer
                    </Link>
                    <Link href="/feed" className="text-white text-sm font-semibold hover:underline hover:text-gray-500">
                        Feed
                    </Link>
                </div>
                {/* <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Search className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Plus className="w-6 h-6" />
                    </Button>
                </div> */}
            </div>

            {/* Main Content */}
            <div
                ref={containerRef}
                className="relative w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                    transform: `translateY(-${currentIndex * 100}vh)`,
                    transition: isDragging ? "none" : "transform 0.3s ease-out",
                }}
            >
                {allWebnovels && allWebnovels.map((shortVideo, index) => (
                    <div key={shortVideo.id} className="relative w-full h-screen flex-shrink-0 flex justify-center items-center">
                        {/* Video Background */}
                        <div className="md:w-[600px] w-full h-full absolute inset-0 top-2  dark:bg-black flex flex-col items-center justify-center mx-auto p-4">
                            <video
                                src={getVideoUrl(allWebnovels[index].en_video_cover) || "/placeholder.svg"}
                                className="w-full h-full object-cover object-center rounded-lg"
                                autoPlay={true}
                                muted={true}
                                loop={true}
                                playsInline={true}
                            />
                            <div className="absolute bottom-0 w-full flex-1 flex flex-col justify-end px-10 pb-20 z-50">
                                <div className="space-y-3">

                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10 border-2 border-white rounded-sm">
                                            <AvatarImage
                                                src={getImageUrl(shortVideo.cover_art)}
                                                alt={shortVideo.title}
                                                width={40}
                                                height={40}
                                            />
                                            <AvatarFallback>{shortVideo.user.nickname[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-white font-semibold text-sm">
                                            <OtherTranslateComponent
                                                element={shortVideo}
                                                content={shortVideo.title}
                                                elementId={shortVideo.id.toString()}
                                                elementType="webnovel"
                                                elementSubtype="title"
                                                classParams=""
                                            />
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-3 text-xs border-white text-white bg-transparent hover:bg-white hover:text-black"
                                        >
                                            {phrase(dictionary, "viewWebnovels", language)}
                                        </Button>
                                    </div>
                                    {/* Description */}
                                    <p className="text-white text-sm leading-relaxed max-w-xs">
                                        {/* <OtherTranslateComponent
                                            element={shortVideo}
                                            content={truncateText(shortVideo.description, 100)}
                                            elementId={shortVideo.id.toString()}
                                            elementType="webnovel"
                                            elementSubtype="description"
                                            classParams=""
                                        /> */}
                                        {truncateText(shortVideo.description, 100)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 flex">
                            <div className="flex-1 flex flex-col justify-end p-4 pb-20">
                            </div>
                            {/* Right side - Action buttons */}
                            <div className="flex flex-col items-center justify-end gap-6 pr-1 pb-52">
                                {/* Like button */}
                                <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                        onClick={() => handleLike(shortVideo.id.toString())}
                                    >
                                        <Heart className={`w-7 h-7 ${shortVideo.upvotes ? "fill-red-500 text-red-500" : ""}`} />
                                    </Button>
                                    <span className="dark:text-white text-black text-xs font-medium">{formatNumber(shortVideo.upvotes)}</span>
                                </div>

                                {/* Comment button */}
                                <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                    >
                                        <MessageCircle className="w-7 h-7" />
                                    </Button>
                                    <span className="dark:text-white text-black text-xs font-medium">
                                        {formatNumber(getTotalComments(shortVideo))}
                                    </span>
                                </div>

                                {/* Share button */}
                                <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                        onClick={() => handleShareClick(shortVideo)}
                                    >
                                        <Send className="w-7 h-7" />
                                    </Button>
                                </div>

                                {/* Save button */}
                                {/* <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                    >
                                        <Bookmark className="w-7 h-7" />
                                    </Button>
                                </div> */}

                                {/* More options */}
                                <div className="flex flex-col items-center gap-1">
                                    <Popover >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                            >
                                                <MoreHorizontal className="w-7 h-7" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className='w-30'>
                                            <ul>
                                                <li> <ReportButton user={shortVideo.user}  mode="toonyzPost_page" /> </li>
                                            </ul>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Progress indicators */}
            <div className="absolute bottom-20 right-2 z-20">
                <div className='flex flex-col items-center'>
                    {/* Navigation buttons section */}
                    <div className="flex flex-col gap-2">
                        <div className={`w-10 h-10 rounded-full border-2
                                         ${currentIndex === 0 ? "border-gray-400" : "border-white"} overflow-hidden animate-spin-slow`}>
                            <Button
                                onClick={() => { goToPrevious() }}
                                disabled={currentIndex === 0}
                                className="w-full h-full object-cover"
                            >
                                <ChevronUp />
                            </Button>
                        </div>
                        <div className={`w-10 h-10 rounded-full border-2
                                         ${currentIndex === allWebnovels.length - 1 ? "border-gray-400" : "border-white"} overflow-hidden animate-spin-slow`}>
                            <Button
                                onClick={() => { goToNext() }}
                                disabled={currentIndex === allWebnovels.length - 1}
                                className="w-full h-full object-cover"
                            >
                                <ChevronDown />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                {/* Progress indicators section */}
                <div className="flex flex-row gap-1">
                    {allWebnovels.map((_, index) => (
                        <div
                            key={index}
                            className={`w-1 h-1 rounded-full transition-colors ${index === currentIndex ? "bg-white" : "bg-white/30"}`}
                        />
                    ))}
                </div>
            </div>

            {/* Swipe hint for first time users */}
            {!isMobile && currentIndex === 0 && (
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-20 text-white text-sm opacity-70 animate-bounce">
                    Swipe up or scroll down for next reel
                </div>
            )}

            <SharingModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                onConfirm={() => { setShowShareModal(false) }}
                onCancel={() => { setShowShareModal(false) }}
            />
        </div>
    )
}

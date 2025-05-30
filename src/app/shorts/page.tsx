"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar"
import { Button } from "@/components/shadcnUI/Button"
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Music, Search, Plus } from "lucide-react"
import { useMediaQuery } from "@mui/material"
import Image from "next/image"
// import { useWebnovels } from '@/contexts/WebnovelsContext';
import { Webnovel } from "@/components/Types"

interface Reel {
    id: string
    username: string
    avatar: string
    videoUrl: string
    caption: string
    likes: number
    comments: number
    isLiked: boolean
}

const mockReels: Reel[] = [
    {
        id: "1",
        username: "travel_vibes",
        avatar: "/placeholder.svg?height=40&width=40",
        videoUrl: "/placeholder.svg?height=800&width=450",
        caption: "Beautiful sunset in Bali 🌅 #travel #sunset #bali",
        likes: 12500,
        comments: 234,
        isLiked: false,
    },
    {
        id: "2",
        username: "food_lover",
        avatar: "/placeholder.svg?height=40&width=40",
        videoUrl: "/placeholder.svg?height=800&width=450",
        caption: "Making the perfect pasta 🍝 Recipe in bio!",
        likes: 8900,
        comments: 156,
        isLiked: true,
    },
    {
        id: "3",
        username: "fitness_guru",
        avatar: "/placeholder.svg?height=40&width=40",
        videoUrl: "/placeholder.svg?height=800&width=450",
        caption: "30-minute morning workout routine 💪 #fitness #workout",
        likes: 15600,
        comments: 289,
        isLiked: false,
    },
    {
        id: "4",
        username: "art_studio",
        avatar: "/placeholder.svg?height=40&width=40",
        videoUrl: "/placeholder.svg?height=800&width=450",
        caption: "Time-lapse painting process 🎨 #art #painting #creative",
        likes: 7800,
        comments: 123,
        isLiked: false,
    },
]

export default function InstagramReels() {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [reels, setReels] = useState(mockReels)
    const [startY, setStartY] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isMobile = useMediaQuery("(max-width: 768px)")
    const [allWebnovels, setAllWebnovels] = useState();



    useEffect(() => {
        const fetchWebnovels = async () => {
            const response = await fetch("/api/get_webnovels_metadata")
            const data = await response.json()
            setAllWebnovels(data)
        }
        fetchWebnovels()
    }, [])


    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + "M"
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + "K"
        }
        return num.toString()
    }

    const handleLike = (reelId: string) => {
        setReels((prev) =>
            prev.map((reel) =>
                reel.id === reelId
                    ? {
                        ...reel,
                        isLiked: !reel.isLiked,
                        likes: reel.isLiked ? reel.likes - 1 : reel.likes + 1,
                    }
                    : reel,
            ),
        )
    }

    const goToNext = () => {
        if (currentIndex < reels.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
        }
    }

    // Touch handlers for swipe functionality
    const handleTouchStart = (e: React.TouchEvent) => {
        setStartY(e.touches[0].clientY)
        setIsDragging(true)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return
        e.preventDefault()
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
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

    const currentReel = reels[currentIndex]

    return (
        <div className="relative w-full h-screen bg-white dark:bg-black overflow-hidden select-none">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-4">
                    <h1 className="text-white text-xl font-semibold">Toonyz Shorts</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Search className="w-6 h-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div
                ref={containerRef}
                className="relative w-full h-full cursor-grab active:cursor-grabbing"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                style={{
                    transform: `translateY(-${currentIndex * 100}vh)`,
                    transition: isDragging ? "none" : "transform 0.3s ease-out",
                }}
            >
                {reels.map((reel, index) => (
                    <div key={reel.id} className="relative w-full h-screen flex-shrink-0 flex justify-center items-center">
                        {/* Video Background */}
                        <div className="md:w-[600px] w-full absolute inset-0 bg-gray-900 flex flex-col items-center justify-center mx-auto">
                            <Image
                                src={reel.videoUrl || "/placeholder.svg"}
                                alt="Reel content"
                                className=" w-full h-full object-cover"
                            />
                            {/* Play indicator overlay */}
                            <div className="absolute inset-0 bg-black/20" />

                            <div className="relative w-full flex-1 flex flex-col justify-end p-4 pb-20">
                                <div className="space-y-3">
                                    {/* User info */}
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-8 h-8 border-2 border-white">
                                            <AvatarImage src={reel.avatar || "/placeholder.svg"} alt={reel.username} />
                                            <AvatarFallback>{reel.username[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-white font-semibold text-sm">{reel.username}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-3 text-xs border-white text-white bg-transparent hover:bg-white hover:text-black"
                                        >
                                            Follow
                                        </Button>
                                    </div>

                                    {/* Caption */}
                                    <p className="text-white text-sm leading-relaxed max-w-xs">{reel.caption}</p>

                                    {/* Music info */}
                                    {/* <div className="flex items-center gap-2">
                                        <Music className="w-4 h-4 text-white" />
                                      
                                    </div> */}
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
                                        onClick={() => handleLike(reel.id)}
                                    >
                                        <Heart className={`w-7 h-7 ${reel.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                                    </Button>
                                    <span className="dark:text-white text-black text-xs font-medium">{formatNumber(reel.likes)}</span>
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
                                    <span className="dark:text-white text-black text-xs font-medium">{formatNumber(reel.comments)}</span>
                                </div>

                                {/* Share button */}
                                <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                    >
                                        <Send className="w-7 h-7" />
                                    </Button>
                                </div>

                                {/* Save button */}
                                <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                    >
                                        <Bookmark className="w-7 h-7" />
                                    </Button>
                                </div>

                                {/* More options */}
                                <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-black/20 hover:bg-black/40 text-white"
                                    >
                                        <MoreHorizontal className="w-7 h-7" />
                                    </Button>
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
                                className="w-full h-full object-cover" >
                                Previous
                            </Button>
                        </div>
                        <div className={`w-10 h-10 rounded-full border-2
                                         ${currentIndex === reels.length - 1 ? "border-gray-400" : "border-white"} overflow-hidden animate-spin-slow`}>
                            <Button
                                onClick={() => { goToNext() }}
                                disabled={currentIndex === reels.length - 1}
                                className="w-full h-full object-cover" >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute top-10 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                {/* Progress indicators section */}
                <div className="flex flex-row gap-1">
                    {reels.map((_, index) => (
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
                    Swipe up for next reel
                </div>
            )}
        </div>
    )
}

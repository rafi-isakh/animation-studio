"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Play, Radio } from "lucide-react"
import { Card } from "@/components/shadcnUI/Card"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Button } from "@/components/shadcnUI/Button"
import { ToonyzPost, Webnovel, } from "@/components/Types"
import { getImageUrl } from "@/utils/urls"

export default function SpotifyCarousel({libraryItem, matchingPosts}: {libraryItem: Webnovel, matchingPosts: ToonyzPost[]}) {
  const [startIndex, setStartIndex] = useState(0)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
 
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<number, number>>(
    matchingPosts.reduce((acc, post) => ({ ...acc, [post.id]: 0 }), {}),
  )

  // Function to change the cover image for a specific card
  const changeCoverImage = (stationId: number, direction: "prev" | "next") => {
    setCurrentImageIndices((prev) => {
      const post = matchingPosts.find((s) => s.id === stationId)
      if (!post) return prev

      const totalImages = post.image ? 1 : 0
      const currentIndex = prev[post.id] || 0

      let newIndex
      if (direction === "prev") {
        newIndex = (currentIndex - 1 + totalImages) % totalImages
      } else {
        newIndex = (currentIndex + 1) % totalImages
      }

      return { ...prev, [stationId]: newIndex }
    })
  }

  const visibleCards = () => {
    const cards = []
    const endIndex = Math.min(startIndex + getVisibleCardCount(), matchingPosts.length)

    for (let i = startIndex; i < endIndex; i++) {
      cards.push(matchingPosts[i])
    }

    return cards
  }

  const getVisibleCardCount = () => {
    // This would ideally be determined by screen size
    // For simplicity, we're using a fixed number here
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 1 // Mobile
      if (window.innerWidth < 1024) return 2 // Tablet
      return 3 // Desktop
    }
    return 3 // Default for SSR
  }

  const canScrollLeft = startIndex > 0
  const canScrollRight = startIndex + getVisibleCardCount() < matchingPosts.length

  const scrollLeft = () => {
    if (canScrollLeft) {
      setStartIndex(startIndex - 1)
    }
  }

  const scrollRight = () => {
    if (canScrollRight) {
      setStartIndex(startIndex + 1)
    }
  }


  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Popular radio</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full bg-neutral-800 hover:bg-neutral-700",
              !canScrollLeft && "opacity-50 cursor-not-allowed",
            )}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full bg-neutral-800 hover:bg-neutral-700",
              !canScrollRight && "opacity-50 cursor-not-allowed",
            )}
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards().map((station) => (
          <Card
            key={station.id}
            className="bg-neutral-800 hover:bg-neutral-700 transition-all duration-300 overflow-hidden border-none relative group"
            onMouseEnter={() => setHoveredCard(station.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="relative w-full h-[350px] sm:h-[400px]">
              {/* Background image */}
              <Image
                src={getImageUrl(station.image) || ""}
                alt={station.title}
                fill
                className="object-cover transition-opacity duration-300"
                priority
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

              {/* Cover image navigation buttons */}
              {matchingPosts.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      changeCoverImage(station.id, "prev")
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      changeCoverImage(station.id, "next")
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Image indicator dots */}
              {matchingPosts.length > 1 && (
                <div className="absolute top-3 right-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {matchingPosts.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        currentImageIndices[station.id] === index ? "bg-white" : "bg-white/40",
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Thumbnail */}
              <div className="absolute top-4 left-4 w-16 h-16 rounded-md overflow-hidden">
                <div className="absolute inset-0 bg-purple-200 flex items-center justify-center">
                  <Radio className="w-6 h-6 text-purple-900" />
                </div>
                <Image
                 src={getImageUrl(libraryItem.cover_art) || ""} 
                 alt={libraryItem.title}
                  width={64}
                  height={64}
                  className="object-cover opacity-70"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] font-bold text-center py-0.5">
                  RADIO
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="text-2xl font-bold mb-1">{libraryItem.title}</h3>
                <p className="text-sm text-gray-300 mb-3">{libraryItem.genre}</p>
                <p className="text-sm text-gray-400 mb-6">{libraryItem.author.nickname}</p>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    className="rounded-full border-white/30 bg-black/30 hover:bg-black/50 text-white"
                  >
                    Preview
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                        <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2" />
                      </svg>
                    </Button>

                    <Button
                      variant="default"
                      size="icon"
                      className="rounded-full bg-white hover:bg-white/90 text-black h-12 w-12 shadow-lg transition-transform group-hover:scale-110"
                    >
                      <Play className="h-6 w-6 fill-black" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react"
import { Webnovel } from "../Types"
import Image from "next/image"
import { getImageUrl } from "@/utils/urls"

interface ContentCardProps {
  webnovel: Webnovel
}

export default function ContentCard({ webnovel }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative flex-shrink-0 transition-all duration-200 ease-out"
      style={{
        width: isHovered ? "300px" : "200px",
        zIndex: isHovered ? 10 : 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`overflow-hidden rounded-md transition-all duration-300 ${isHovered ? "scale-110 shadow-xl" : ""}`}
      >
        {/* Card Image */}
        <Image src={getImageUrl(webnovel.cover_art) || "/placeholder.svg"} alt={webnovel.title} className="h-full w-full object-cover" />

        {/* Hover Content */}
        {isHovered && (
          <div className="absolute inset-0 flex flex-col bg-zinc-900">
            <Image src={getImageUrl(webnovel.cover_art) || "/placeholder.svg"} alt={webnovel.title} className="h-[150px] w-full object-cover" />

            <div className="flex flex-1 flex-col p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-white/90">
                    <Play className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 hover:border-white">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 hover:border-white">
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 hover:border-white">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-2 flex items-center gap-2 text-sm">
                <span className="text-green-500 font-semibold">{webnovel.genre}</span>
              </div>

              <h3 className="text-sm font-bold">{webnovel.title}</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


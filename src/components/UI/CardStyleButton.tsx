"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/shadcnUI/Button"


interface CardStyleButtonProps {
  title: string
  subtitle: string
  ideaCount: number
  images: string | string[]
  gradientFrom: string
  gradientTo: string
  className?: string
  onClick?: () => void
}

export default function CardStyleButton({
  title,
  subtitle,
  ideaCount,
  images,
  gradientFrom,
  gradientTo,
  className,
  onClick,
}: CardStyleButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Button
      className={cn(
        "relative w-full h-52 rounded-3xl overflow-hidden text-left transition-transform duration-300 ease-out",
        isHovered ? "" : "",
        className,
      )}
      style={{
        background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
        width: "100%",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="relative z-10 p-2 pb-32 h-full">
        <div className="space-y-1">
          <h3 className="text-white text-lg font-medium tracking-wide">{title}</h3>
          <p className="text-white text-sm pt-1 tracking-wide">{subtitle}</p>
          {/* <p className="text-white/80 text-sm pt-1">{ideaCount} for one slideshow</p> */}
        </div>
      </div>

      {/* Image cards at the bottom */}
      <div
        className={cn(
          "absolute bottom-0 right-0 left-0 flex justify-center gap-2 transform transition-transform duration-300 cursor-pointer",
          isHovered ? "translate-y-[-20px]" : "translate-y-0",
        )}
      >
        {Array.isArray(images) ? (
          images.map((image, index) => (
            <div
              key={index}
              className={cn(
                "w-24 h-32 rounded-xl overflow-hidden shadow-lg transform transition-all duration-300",
                isHovered ? `scale-[1.02] translate-y-[-${(index + 1) * 30}px] ` : "",
              )}
              style={{
                transform: isHovered 
                  ? `rotate(${(index - Math.floor(images.length/2)) * 15}deg)` 
                  : `rotate(${(index - Math.floor(images.length/2)) * 5}deg)`,
                zIndex: Array.isArray(images) ? images.length - index : 1,
              }}
            >
              <Image
                src={`data:image/png;base64,${image}`}
                alt={`${title} preview ${index + 1}`}
                width={96}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          ))
        ) : (
          <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg">
            <Image
              src={`/placeholder.svg`}
              alt={`${title} preview`}
              width={96}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </Button>
  )
}


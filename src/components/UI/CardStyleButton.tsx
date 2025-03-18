"use client"

import { useState } from "react"
import { TvMinimalPlay } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/shadcnUI/Button"
import { phrase } from "@/utils/phrases"
import { useLanguage } from "@/contexts/LanguageContext"

interface CardStyleButtonProps {
    title: string
    subtitle?: string
    ideaCount?: number
    images: string | string[]
    gradientFrom: string
    gradientTo: string
    className?: string
    loadingVideoGeneration?: boolean
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
    loadingVideoGeneration,
}: CardStyleButtonProps) {
    const [isHovered, setIsHovered] = useState(false)
    const { dictionary, language } = useLanguage()

    return (
        <Button
            variant="outline"
            className={cn(
                "!w-[150px] rounded-full overflow-hidden text-left transition-transform duration-300 ease-out !text-sm p-3 md:p-2",
                // "bg-gradient-to-b from-pink-600 to-pink-500",
                "bg-gray-300 dark:bg-[#1a1b1f] text-black dark:text-white dark:border-[#2a2b2f] hover:text-white hover:bg-[#2a2b2f] flex gap-2 shrink-0 shadow-none",
                isHovered ? "" : "",
                loadingVideoGeneration ? "opacity-50 cursor-not-allowed" : "",
                className,
            )}
            style={{
                // background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`,
                // width: "100%",
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >

            {/* Image cards at the bottom */}
            <div
                className={cn(
                    " absolute bottom-5 right-0 left-1 inline-flex gap-1 transform transition-transform duration-300 cursor-pointer -z-10",
                    isHovered ? "translate-y-[-5px]" : "translate-y-0",
                )}
            >
                {Array.isArray(images) ? (
                    images.map((image, index) => (
                        <div
                            key={index}
                            className={cn(
                                "w-8 h-8 rounded-md overflow-hidden shadow-lg transform transition-all duration-300",
                                isHovered ? `scale-[1.02] translate-y-[-${(index + 1) * 30}px] ` : "",
                            )}
                            style={{
                                transform: isHovered
                                    ? `rotate(${(index - Math.floor(images.length / 2)) * 15}deg)`
                                    : `rotate(${(index - Math.floor(images.length / 2)) * 5}deg)`,
                                zIndex: Array.isArray(images) ? images.length - index : 1,
                            }}
                        >
                            <Image
                                src={`data:image/png;base64,${image}`}
                                alt={`${title} preview ${index + 1}`}
                                fill
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))
                ) : (
                    <div className="w-8 h-8 rounded-md overflow-hidden shadow-lg">
                        <Image
                            src={`/placeholder.svg`}
                            alt={`${title} preview`}
                            fill
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
            </div>

            <p className="text-white text-sm font-medium tracking-wide inline-flex gap-1 items-center">
                {loadingVideoGeneration ? phrase(dictionary, "generatingPrompt", language) :
                    <div className="flex flex-row gap-1 items-center">
                        <TvMinimalPlay className="w-4 h-4" />
                        {title}
                        <div className="text-gray-600 text-[10px] bg-gray-200 rounded-md px-1">
                            {phrase(dictionary, "readingForFree", language)}
                        </div>
                    </div>
                }
            </p>
        </Button>
    )
}


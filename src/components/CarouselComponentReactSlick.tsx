"use client"
import { useRef, useEffect, useState } from "react"
import { Card, CardContent } from "@/components/shadcnUI/Card"
import { Carousel, CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/shadcnUI/Carousel"
import Image from "next/image"
import type { SlickCarouselItem } from "@/components/Types"
import type { Webnovel } from "@/components/Types"
import { phrase } from "@/utils/phrases"
import { useLanguage } from "@/contexts/LanguageContext"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import Link from "next/link"
import { useMediaQuery } from "@mui/material"
import { useWebnovels } from "@/contexts/WebnovelsContext"
import { getImageUrl } from "@/utils/urls"
import Autoplay from "embla-carousel-autoplay"


interface PaddingConfig {
    desktop?: string
    mobile?: string
}

interface CarouselProps {
    items: SlickCarouselItem[]
    showControls?: boolean
    slidesToShow?: number
    centerPadding?: string | PaddingConfig
    centerMode?: boolean
    aspectRatio?: "square" | "landscape" | "portrait"
}

const CarouselComponentReactSlick = ({
    items,
    slidesToShow = 3,
    showControls = true,
    centerPadding,
    centerMode = true,
    aspectRatio = "landscape",
}: CarouselProps) => {
    const [api, setApi] = useState<CarouselApi>()
    const [currentIndex, setCurrentIndex] = useState(0)
    const [count, setCount] = useState(0)
    const [nextIndex, setNextIndex] = useState(1)
    const isDesktop = useMediaQuery("(min-width:768px)")
    const { language, dictionary } = useLanguage()
    const { webnovels } = useWebnovels()
    const plugin = useRef(
        Autoplay({ delay: 2000, stopOnInteraction: true })
      )
    

    useEffect(() => {
        if (!api) {
            return
        }

        setCount(api.scrollSnapList().length)
        setCurrentIndex(api.selectedScrollSnap())

        const handleSelect = () => {
            setCurrentIndex(api.selectedScrollSnap())
        }

        api.on("select", handleSelect)

        // Cleanup
        return () => {
            api.off("select", handleSelect)
        }
    }, [api])


    // Improved function to get center padding
    function getCenterPadding(): string {
        if (!centerPadding) return "0px"
        if (typeof centerPadding === "number") return `${centerPadding}px`
        if (typeof centerPadding === "string") return centerPadding

        return isDesktop ? centerPadding.desktop || "10px" : centerPadding.mobile || "20px"
    }

    // Calculate the actual padding value
    const actualPadding = getCenterPadding()

    // Calculate slides to show based on screen size
    const effectiveSlidesToShow = isDesktop ? slidesToShow : 1

    function getHref(webnovel_id: number) {
        return `/view_webnovels?id=${webnovel_id}`
    }

    function getGenre(index: number) {
        return [webnovels.find((novel: Webnovel) => novel.id == items[index].webnovel_id)?.genre || ""]
    }

    function breakKeepOrNot() {
        if (
            language == "ko" ||
            language == "ar" ||
            language == "th" ||
            language == "vi" ||
            language == "en" ||
            language == "id"
        ) {
            return "break-keep "
        } else if (language == "ja" || language == "zh-CN" || language == "zh-TW") {
            return ""
        }
        return ""
    }

    const getAspectRatio = () => {
        switch (aspectRatio) {
            case "square":
                return "aspect-square"
            case "portrait":
                return "aspect-[3/4]"
            case "landscape":
            default:
                return "aspect-video"
        }
    }

    return (
        <Carousel
            plugins={[plugin.current]}
            className="max-w-screen-xl items-center mx-auto w-full group"
            opts={{
                align: centerMode ? "center" : "start",
                slidesToScroll: 1,
                skipSnaps: false,
                containScroll: "trimSnaps",
                loop: true,
            }}
            onSelect={() => {
                if (api) {
                    const index = api.selectedScrollSnap()
                    setCurrentIndex(index);
                    setNextIndex((index + 1) % items.length);
                }
            }}
            setApi={setApi}
        >
            <CarouselContent style={centerMode ? { marginLeft: `-${actualPadding}` } : {}}>
                {items.map((item, index) => (
                    <CarouselItem
                        key={item.id}
                        className={` ${currentIndex == index ? "opacity-100" : "opacity-10"}`}
                        style={{
                            paddingLeft: centerMode ? actualPadding : "0px",
                            flex: isDesktop ? "0 0 calc(16/9 * 40vh)" : "0 0 100%", 
                            maxWidth: isDesktop ? "calc(16/9 * 40vh)" : "100%", // Calculate width based on height for 16:9
                            width: isDesktop ? "calc(16/9 * 40vh)" : "100%"
                        }}
                    >
                        <div className="p-1">
                            <Card>
                                <CardContent className="flex flex-col overflow-hidden p-0">
                                    <Link href={getHref(item.webnovel_id)}>
                                        <div className="relative w-full aspect-[16/9] h-[400px] md:h-[400px] pb-[56.25%] md:pb-[56.25%]">
                                            <Image
                                                className="object-cover object-center transition-all duration-300 rounded-xl absolute inset-0 w-full h-full"
                                                src={getImageUrl(item.image) || "/placeholder.svg"}
                                                fill
                                                alt={item.title}
                                                placeholder="blur"
                                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                            />
                                            {/* Overlay */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 md:p-8 rounded-xl overflow-hidden">
                                                <div className="flex flex-col justify-end">
                                                    <OtherTranslateComponent
                                                        key={`title-${index}-${language}`}
                                                        content={item.title}
                                                        elementId={item.id.toString()}
                                                        classParams={`${breakKeepOrNot()} text-lg md:text-xl lg:text-2xl font-extrabold`}
                                                        elementType={"carouselItem"}
                                                        elementSubtype="title"
                                                        showLoading={false}
                                                    />

                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {getGenre(index).map((el: string, idx: number) => (
                                                            <span
                                                                key={idx}
                                                                className="
                                                                bg-white/20 
                                                                px-2 py-1 
                                                                rounded-xl
                                                                text-xs 
                                                                uppercase 
                                                                tracking-wider
                                                            "
                                                            >
                                                                {idx === 0 ? `#${el}` : phrase(dictionary, el, language)}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="text-sm md:text-base line-clamp-2 mt-2">
                                                        <OtherTranslateComponent
                                                            key={`hook-${index}-${language}`}
                                                            content={item.hook}
                                                            elementId={item.id.toString()}
                                                            classParams={`${breakKeepOrNot()}`}
                                                            elementType={"carouselItem"}
                                                            elementSubtype="hook"
                                                            showLoading={false}
                                                        />
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}

            </CarouselContent>
            {showControls && isDesktop && (
                <>
                    <CarouselPrevious className="left-2 md:left-4 dark:border-gray-400 text-gray-400" />
                    <CarouselNext className="right-2 md:right-4 dark:border-gray-400 text-gray-400" />
                </>
            )}
            <div className="absolute bottom-0 left-0 right-0 py-2 text-center">
                <span className={`
                    absolute 
                    md:bottom-10
                    bottom-5
                    right-5    
                    z-10
                    transition-all 
                    duration-300
                    backdrop-blur-sm 
                    px-2 py-1 
                    rounded-xl
                    text-[10px]
                    transform
                    translate-x-0
                    md:right-5
                    text-gray-400
                `}>
                    <span className={``}>
                        {currentIndex + 1}
                    </span>
                    /
                    <span className={``}>
                        {count}
                    </span>
                </span>
            </div>
        </Carousel>
    )
}

export default CarouselComponentReactSlick


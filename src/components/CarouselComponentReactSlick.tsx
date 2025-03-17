"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/shadcnUI/Card"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/shadcnUI/Carousel"
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

interface PaddingConfig {
  desktop?: string
  mobile?: string
}

interface CarouselProps {
  items: SlickCarouselItem[]
  showControls?: boolean
  slidesToShow?: number
  showDots?: boolean
  centerPadding?: string | PaddingConfig
  centerMode?: boolean
  focusOnSelect?: boolean
  variableWidth?: boolean
  slideScale?: number
  aspectRatio?: "square" | "landscape" | "portrait"
}

const CarouselComponentReactSlick = ({
  items,
  slidesToShow = 3,
  showControls = true,
  showDots = true,
  centerPadding = { desktop: "50px", mobile: "20px" },
  centerMode = true,
  focusOnSelect = true,
  variableWidth = false,
  slideScale = 0.85,
  aspectRatio = "landscape",
}: CarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const isDesktop = useMediaQuery("(min-width:768px)")
  const { language, dictionary } = useLanguage()
  const { webnovels } = useWebnovels()

  // Improved function to get center padding
  function getCenterPadding(): string {
    if (!centerPadding) return "0px"
    if (typeof centerPadding === "number") return `${centerPadding}px`
    if (typeof centerPadding === "string") return centerPadding

    return isDesktop ? centerPadding.desktop || "50px" : centerPadding.mobile || "20px"
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
      className="max-w-screen-xl items-center mx-auto w-full group"
      opts={{
        align: centerMode ? "center" : "start",
        slidesToScroll: 1,
        skipSnaps: false,
        containScroll: "trimSnaps",
        loop: true,
      }}
    >
      <CarouselContent style={centerMode ? { marginLeft: `-${actualPadding}` } : {}}>
        {items.map((item, index) => (
          <CarouselItem
            key={item.id}
            style={{
              paddingLeft: centerMode ? actualPadding : "0px",
              flex: effectiveSlidesToShow > 1 ? `0 0 ${100 / effectiveSlidesToShow}%` : "0 0 100%",
              maxWidth: effectiveSlidesToShow > 1 ? `${100 / effectiveSlidesToShow}%` : "100%",
            }}
          >
            <div className="p-1">
              <Card>
                <CardContent className="flex flex-col overflow-hidden p-0">
                  <Link href={getHref(item.webnovel_id)}>
                    <div className="relative w-full h-[500px] md:h-[400px] pb-[56.25%] md:pb-[56.25%]">
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
      {showControls && (
        <>
          <CarouselPrevious className="left-2 md:left-4" />
          <CarouselNext className="right-2 md:right-4" />
        </>
      )}
    </Carousel>
  )
}

export default CarouselComponentReactSlick


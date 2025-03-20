"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/shadcnUI/Card"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { useWebnovels } from "@/contexts/WebnovelsContext"
import { getImageUrl } from "@/utils/urls"
import { phrase } from "@/utils/phrases"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import type { SlickCarouselItem } from "@/components/Types"
import type { Webnovel } from "@/components/Types"
import { useMediaQuery } from "@mui/material"
import Autoplay from "embla-carousel-autoplay"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/shadcnUI/Carousel"

interface CarouselProps {
  items: SlickCarouselItem[]
}

const CarouselComponentShadcn = ({ items }: CarouselProps) => {
  const { language, dictionary } = useLanguage()
  const { webnovels } = useWebnovels()
  const [api, setApi] = useState<any>(null)
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const plugin = useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: true,
    })
  )

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  function getHref(webnovel_id: number) {
    return `/view_webnovels?id=${webnovel_id}`
  }

  function getGenre(index: number) {
    return [webnovels.find((novel: Webnovel) => novel.id === items[index].webnovel_id)?.genre || ""]
  }

  function breakKeepOrNot() {
    if (
      language === "ko" ||
      language === "ar" ||
      language === "th" ||
      language === "vi" ||
      language === "en" ||
      language === "id"
    ) {
      return "break-keep "
    } else if (language === "ja" || language === "zh-CN" || language === "zh-TW") {
      return ""
    }
    return ""
  }

  return (
    <div className="max-w-screen-xl mx-auto w-full relative">
      <Carousel
        plugins={[plugin.current]}
        setApi={setApi}
        className="w-full"
        opts={{
          align: "center",
          loop: true,
          skipSnaps: false,
          inViewThreshold: 0.7,
        }}
      >
        <CarouselContent className="-ml-4">
          {items.map((item, index) => (
            <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/2">
              <div className="p-1">
                <Card>
                  <CardContent className="flex lg:aspect-[16/9] aspect-square items-center justify-center p-6 relative">
                    <Link href={getHref(item.webnovel_id)}>
                      <Image
                        className="object-cover object-center transition-all duration-300 w-full h-full rounded-md"
                        src={getImageUrl(item.image) || "/placeholder.svg"}
                        fill
                        alt={item.title}
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                      />
                      {/* Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4 md:p-8 rounded-md overflow-hidden">
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
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {isDesktop && (
          <>
            <CarouselPrevious className="left-2 md:left-4 dark:border-gray-400 text-gray-400" />
            <CarouselNext className="right-2 md:right-4 dark:border-gray-400 text-gray-400" />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 py-2 text-center">
          <span className={`
                    absolute 
                    bottom-4
                    right-4    
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
              {current}
            </span>
            /
            <span className={``}>
              {count}
            </span>
          </span>
        </div>
      </Carousel>
    </div >
  )
}

export default CarouselComponentShadcn


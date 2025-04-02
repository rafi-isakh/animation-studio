"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Heart } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/shadcnUI/Carousel"
import type { CarouselApi } from "@/components/shadcnUI/Carousel"
import { Webnovel, SortBy } from "@/components/Types"
import _ from "lodash"
import { sortByFn, calculateIndex } from "@/utils/webnovelUtils"
import { getImageUrl } from "@/utils/urls"
import WebnovelComponent from "@/components/WebnovelComponent"
import { useMediaQuery } from "@mui/material"
import { phrase } from "@/utils/phrases"
import { useLanguage } from "@/contexts/LanguageContext"

export default function SearchPageWebnovelsList({ searchParams, webnovels, sortBy }: { searchParams: { [key: string]: string | string[] | undefined }, webnovels: Webnovel[], sortBy: SortBy }) {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const isDesktop = useMediaQuery('(min-width: 768px)')
    const { dictionary, language } = useLanguage()
    // const chunkedItems = _.chunk(webnovelsToShow.length > 0 ? webnovelsToShow : webnovels, 3);

    // Group fictions into pages of 9 items each
    const itemsPerPage = isDesktop ? 9 : 3
    const pages = webnovelsToShow.reduce((acc, webnovel, index) => {
        const pageIndex = Math.floor(index / itemsPerPage)
        if (!acc[pageIndex]) {
            acc[pageIndex] = []
        }
        acc[pageIndex].push(webnovel)
        return acc
    }, [] as Webnovel[][])

    useEffect(() => {
        if (!api) {
            return
        }

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap() + 1)

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1)
        })
    }, [api])


    useEffect(() => {
        const _webnovelsToShow = webnovels
            .sort((a, b) => sortByFn(a, b, sortBy));

        setWebnovelsToShow(_webnovelsToShow);

    }, [version, genre, sortBy, webnovels]);


    return (
        <div className="w-full">
            <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                <span className='text-black dark:text-white'>
                    {phrase(dictionary, "toonyzHot", language)}
                </span>
            </h1>
            <Carousel
                setApi={setApi}
                className="w-full"
                opts={{
                    align: "start",
                    loop: true,
                }}
            >
                <CarouselContent>
                    {pages.map((page, pageIndex) => (
                        <CarouselItem key={pageIndex} className="w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                {page.map((webnovel, index) => (
                                    <div key={webnovel.id} className="flex items-start">
                                        <WebnovelComponent
                                            webnovel={webnovel}
                                            index={calculateIndex(index, pageIndex, pages)}
                                            ranking={true}
                                            chunkIndex={pageIndex}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="absolute -top-10 right-0 flex items-center justify-end gap-2">
                    <CarouselPrevious className="static transform-none" />
                    <span className="text-sm text-muted-foreground">
                        {current} / {pages.length}
                    </span>
                    <CarouselNext className="static transform-none" />
                </div>
            </Carousel>
        </div>
    )
}


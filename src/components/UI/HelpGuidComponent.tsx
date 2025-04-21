"use client"

import { useEffect, useState } from "react"
import { ChevronRight, CirclePlay, X } from "lucide-react"
import { Button } from "@/components/shadcnUI/Button"
import { PopoverClose } from "@/components/shadcnUI/Popover"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { phrase } from "@/utils/phrases"
import { Card, CardContent } from "@/components/shadcnUI/Card"
import {
    type CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/shadcnUI/Carousel"
import Autoplay from "embla-carousel-autoplay"

import Image from "next/image"
export default function HelpGuidComponent() {
    const { dictionary, language } = useLanguage();

    const [api, setApi] = useState<CarouselApi>()
    const [count, setCount] = useState(0)
    const [current, setCurrent] = useState(0)

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


    const youtubeVideoList = [
        {
            id: 1,
            title: "투니즈 플랫폼 이용 가이드",
            title_en: "Toonyz Platform Guide",
            thumbnail: "/carousel/platformGuide/youtube_guide1.webp",
            url: "https://drive.google.com/file/d/1wIKc4yz0ynXVZTFWCu7WiFPXlmrQaXg4/view?usp=sharing",
            url_en: ""
        },

    ]


    const GuideLinkList = [
        {
            id: 1,
            title: "🎥 이미지 생성 강의/매뉴얼",
            title_en: "🎥 Image Generation Tutorial",
            url: "https://drive.google.com/file/d/1aTihIg4sKa5HqRMWMQalVx3vpWRW4KDr/view?usp=sharing",
            url_en: "https://drive.google.com/file/d/1Ce2JA6MmJxZ5KFJPCwSYW68wj_FaPCBH/view?usp=sharing"
        },
        {
            id: 2,
            title: "📖 투니즈 포스트 튜토리얼",
            title_en: "📖 Toonyz Post Tutorial",
            url: "https://drive.google.com/file/d/12_QF3N_dKFpBrmVr71ADWlgfNlU6PPiL/view?usp=sharing",
            url_en: "https://drive.google.com/file/d/12_QF3N_dKFpBrmVr71ADWlgfNlU6PPiL/view?usp=sharing"
        },
        {
            id: 3,
            title: "🍀 투니즈 이용 가이드",
            title_en: "🍀 Toonyz Platform Guide",
            url: "https://drive.google.com/file/d/1wIKc4yz0ynXVZTFWCu7WiFPXlmrQaXg4/view?usp=sharing",
            url_en: "https://drive.google.com/file/d/12_QF3N_dKFpBrmVr71ADWlgfNlU6PPiL/view?usp=sharing"
            //
        },
        {
            id: 4,
            title: "💬 고객 지원 & FAQ",
            title_en: "💬 Customer Support & FAQ",
            url: "/faq",
            url_en: "/faq"
        }
    ]

    return (
        <div className="relative w-full overflow-hidden rounded-lg border-2 border-[#DE2777] bg-white shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#DE2777] p-4 text-white">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                        <span className="text-2xl font-bold text-[#DE2777]">?</span>
                    </div>
                    <span className="text-xl font-light">
                        {/* Toonyz Platform Guide */}
                        {phrase(dictionary, "HelpGuid", language)}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-row items-center justify-end ">
                        {/* Close button */}
                        <PopoverClose>
                            <Button
                                size='icon'
                                variant='link'
                                className="!no-underline !outline-none focus:outline-none w-fit bg-transparent text-lg font-medium hover:bg-transparent text-white dark:text-white"
                            >
                                <X size={24} />
                            </Button>
                        </PopoverClose>
                    </div>
                </div>
            </div>
            {/* Content Area (gray placeholder) */}
            <div className="h-full ">
                <div className="aspect-video flex flex-col gap-4">
                    <Carousel
                        setApi={setApi}
                        plugins={[
                            Autoplay({
                                delay: 2000,
                            }),
                        ]}

                        className="w-full h-full">
                        <CarouselContent>
                            {youtubeVideoList.map((item, index) => (
                                <CarouselItem key={index}>
                                    <Card className="w-full h-full border-none shadow-none">
                                        <CardContent className="flex aspect-[16/9] items-center justify-center border-none shadow-none p-0">
                                            <Link href={item.url} target="_blank" className="relative block w-full h-full group overflow-hidden">
                                                <Image src={item.thumbnail} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                                
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <CirclePlay size={48} className="text-white" />
                                                </div>

                                                <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-t from-transparent to-black/60  text-white text-sm pointer-events-none">
                                                    {language === "ko" ? item.title : item.title_en}
                                                </div>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-50 border-none shadow-none text-white dark:text-white" />
                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-50 border-none shadow-none text-white dark:text-white" />
                    </Carousel>
                </div>

            </div>
            {/* Notification */}
            <div className="relative bg-white p-6">
                <h2 className="py-1 text-2xl font-bold text-gray-500 dark:text-black">{phrase(dictionary, "ToonyzPlatformGuid", language)}</h2>
                <ul className="flex flex-col gap-2">
                    {GuideLinkList.map((item, index) => (
                        <li key={item.id} className="flex items-center gap-2">
                            <ChevronRight size={20} className=" rounded-full bg-gray-200 p-1 text-gray-500 dark:text-black" />
                               {item.id === 4 ? <Link href={item.url} className="text-gray-500 dark:text-black hover:text-[#DB2777] dark:hover:text-[#DB2777] cursor-pointer">
                                    {language === "ko" ? item.title : item.title_en}
                                </Link> : <Link href={language === "ko" ? item.url : item.url_en} target="_blank" className="text-gray-500 dark:text-black hover:text-[#DB2777] dark:hover:text-[#DB2777] cursor-pointer">
                                    {language === "ko" ? item.title : item.title_en}
                                </Link>}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

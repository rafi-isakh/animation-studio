"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/shadcnUI/Dialog"
import { ChevronRight, CirclePlay, X } from "lucide-react"
import { Dictionary, Language } from "@/components/Types"
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
import { cn } from "@/lib/utils"
// Helper function to convert YouTube URLs to embed format
const getYoutubeEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/embed/')) {
        return url;
    }

    // Handle youtube.com/watch?v= format
    const watchRegex = /youtube\.com\/watch\?v=([^&]+)/;
    const watchMatch = url.match(watchRegex);
    if (watchMatch) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`;
    }

    // Handle youtu.be/ format
    const shortRegex = /youtu\.be\/([^?&]+)/;
    const shortMatch = url.match(shortRegex);
    if (shortMatch) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    return url;
};

export default function HelpGuideComponent() {
    const { dictionary, language } = useLanguage();
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showCarouselVideoModal, setShowCarouselVideoModal] = useState(false);
    const [api, setApi] = useState<CarouselApi>()
    const [count, setCount] = useState(0)
    const [current, setCurrent] = useState(0)

    const youtubeVideoList = [
        {
            id: 1,
            title: "ToonyzPlatformGuideTitle",
            thumbnail: "/carousel/platformGuide/youtube_guide1.webp",
            thumbnail_en: "/carousel/platformGuide/youtube_guide1_en.webp",
            url: "https://youtu.be/q-j_FEe5EG0?si=Axuzjeou6wxfHHQD",
            url_en: "https://www.youtube.com/watch?v=V7Fgfc-Fl1A"
        },
    ]

    const [selectedVideoItem, setSelectedVideoItem] = useState<typeof youtubeVideoList[0]>();

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


    const GuideLinkList = [
        {
            id: 1,
            title: "HelpGuideLink_ImageGenerationTutorial",
            url: "https://youtu.be/q-j_FEe5EG0?si=Axuzjeou6wxfHHQD",
            url_en: "https://www.youtube.com/embed/08OixaiTZGw?si=1KiX_FnxOG8LhGfV"
        },
        {
            id: 2,
            title: "HelpGuideLink_CustomerSupport",
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
                                            <Dialog open={showCarouselVideoModal} onOpenChange={setShowCarouselVideoModal}>
                                                <DialogTrigger asChild>
                                                    <div className="relative block w-full h-full group overflow-hidden cursor-pointer" onClick={() => setSelectedVideoItem(item)}>
                                                        <Image src={language === "ko" ? item.thumbnail : item.thumbnail_en} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <CirclePlay size={48} className="text-white" />
                                                        </div>
                                                        <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-t from-transparent to-black/60 text-white text-sm pointer-events-none">
                                                            {phrase(dictionary, item.title, language)}
                                                        </div>
                                                    </div>
                                                </DialogTrigger>
                                                <VideoModal
                                                    isOpen={showCarouselVideoModal}
                                                    onClose={() => setShowCarouselVideoModal(false)}
                                                    header={selectedVideoItem ? phrase(dictionary, selectedVideoItem.title, language) : ''}
                                                    video={selectedVideoItem ? (language === "ko" ? selectedVideoItem.url : selectedVideoItem.url_en) : ''}
                                                    language={language as "en" | "ko"}
                                                    dictionary={dictionary}
                                                />
                                            </Dialog>
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
            <div className="relative bg-white p-6">
                <h2 className="py-1 text-2xl font-bold text-gray-500 dark:text-black">{phrase(dictionary, "ToonyzPlatformGuid", language)}</h2>
                <ul className="flex flex-col gap-2">
                    {GuideLinkList.map((item, index) => (
                        <li key={item.id} className="flex items-center gap-2">
                            <ChevronRight size={20} className=" rounded-full bg-gray-200 p-1 text-gray-500 dark:text-black" />
                            {item.id === 2 ?
                                <Link
                                    href={language === "ko" ? item.url : item.url_en}
                                    className="text-gray-500 dark:text-black hover:text-[#DB2777] dark:hover:text-[#DB2777] cursor-pointer">
                                    {phrase(dictionary, item.title, language)}
                                </Link>
                                : <Dialog key={item.id} open={showVideoModal} onOpenChange={setShowVideoModal}>
                                    <DialogTrigger asChild>
                                        <span className="text-gray-500 dark:text-black hover:text-[#DB2777] dark:hover:text-[#DB2777] cursor-pointer"
                                            onClick={() => {
                                                setShowVideoModal(true)
                                            }}
                                        >
                                            {phrase(dictionary, item.title, language)}
                                        </span>
                                    </DialogTrigger>
                                    <VideoModal
                                        id={item.id.toString()}
                                        isOpen={showVideoModal}
                                        onClose={() => setShowVideoModal(false)}
                                        header={phrase(dictionary, item.title, language)}
                                        video={language === "ko" ? item.url : item.url_en}
                                        language={language as "en" | "ko"}
                                        dictionary={dictionary}
                                    />
                                </Dialog>
                            }
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}


const VideoModal = ({ id, isOpen, onClose, header, video, language, dictionary }: { id?: string, isOpen: boolean, onClose: () => void, header: string, video: string, language: Language, dictionary: Dictionary }) => {
    const embedUrl = getYoutubeEmbedUrl(video);

    return (
        <DialogContent key={id} className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto text-md' showCloseButton={true}>
            <DialogHeader className='text-md p-4'>
                <DialogTitle className='text-md'>{header}</DialogTitle>
            </DialogHeader>
            <DialogDescription className="w-full mx-auto text-md">
                <iframe
                    width="100%"
                    height="315"
                    src={embedUrl}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                ></iframe>
                <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                    <Button
                        onClick={onClose}
                        className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                    >
                        {phrase(dictionary, "close", language)}
                    </Button>
                </DialogFooter>
            </DialogDescription>
        </DialogContent>
    )
}
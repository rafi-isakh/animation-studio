"use client"

import { useState } from "react"
import Image from 'next/image'
import { EmailForm } from "@/components/UI/booktok/EmailForm"
import { Hash, CheckCircle, BookOpen, Video, MailOpen, CirclePlay, } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselApi } from "@/components/shadcnUI/Carousel"
import Autoplay from "embla-carousel-autoplay"
import { Dialog, DialogContent, DialogTrigger, DialogFooter, DialogClose, DialogHeader, DialogTitle } from "@/components/shadcnUI/Dialog"
import { Card, CardContent } from "@/components/shadcnUI/Card"
import { Button } from "@/components/shadcnUI/Button"
import { useLanguage } from "@/contexts/LanguageContext"
import { motion } from "framer-motion"
import Link from "next/link"

const youtubeVideoList = [
    {
        id: 1,
        title: "투니즈 플랫폼 이용 가이드",
        title_en: "Toonyz Platform Guide",
        thumbnail: "/carousel/platformGuide/youtube_guide1.webp",
        thumbnail_en: "/carousel/platformGuide/youtube_guide1_en.webp",
        url: "",
        url_en: "https://www.youtube.com/embed/V7Fgfc-Fl1A?si=gG64HAEGP_WDPeZ_"
    },
    {
        id: 2,
        title: "투니즈 이미지 생성 가이드",
        title_en: "Toonyz Image Generation Guide",
        thumbnail: "/carousel/platformGuide/youtube_guide2.webp",
        thumbnail_en: "/carousel/platformGuide/youtube_guide2_en.webp",
        url: "",
        url_en: "https://www.youtube.com/embed/08OixaiTZGw?si=G4jwVgSlV1S86x5K"
    },
]

export function EmailSignupPage() {
    const [api, setApi] = useState<CarouselApi>()
    const [count, setCount] = useState(0)
    const [current, setCurrent] = useState(0)
    const [selectedVideoItem, setSelectedVideoItem] = useState(youtubeVideoList[0]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { language } = useLanguage()
    const [hoveredCard, setHoveredCard] = useState<number | null>(null)

    const benefits = [
        {
            title: "Paid Partnership",
            description: "Paid partnership and promotion opportunities",
            icon: CheckCircle,
        },
        {
            title: "Gift Cards",
            description: "Receive redeeming giftcards from Amazon/Starbucks",
            icon: CheckCircle,
        },
        {
            title: "Networking",
            description: "Collaborate with popular writers",
            icon: CheckCircle,
        },
    ]

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    }


    return (
        <div className="w-full md:max-w-screen-lg mx-auto p-8 flex flex-col justify-between">
            <div className="flex md:flex-row flex-col w-full gap-10">
                <div className="flex flex-col justify-center items-center">
                    <div className="flex flex-col justify-center items-center">
                        <div className="relative flex flex-row items-center gap-2 font-bold">
                            <Image src='/toonyz_logo_pink.svg' alt="Toonyz Logo" width={100} height={20} className="self-center py-6 " />
                            <span className="text-black dark:text-black text-center">
                                X BookTok
                            </span>
                            <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-[#DE2B74] rounded-full"></span>
                        </div>

                        <p className="text-lg sm:text-xl mb-4 text-black text-center">
                            We invite you a BookTok creator campaign
                        </p>
                        {/* <MailOpen className="text-black text-2xl" /> */}
                        <h2 className="text-4xl font-bold text-center mb-6 relative">
                            <span className="bg-gradient-to-r from-[#DE2B74] to-[#FF6CAB] bg-clip-text text-transparent">
                                BookTok Creator Invitation
                            </span>
                           
                        </h2>
                     
                    </div>
                    <div>
                        <p className="text-lg  text-black mb-2">
                            We are launching a special BookTok creator campaign and would love to collaborate with you!  <br />
                            <span className="text-lg text-black">Just drop your email below and we will reach out to you.</span>
                        </p>
                    </div>
                    <div className="w-full flex flex-col items-center justify-center">
                        <Image src='/stelli/stelli_5.png' alt="Toonyz Logo" width={100} height={100} className="-mb-1" />

                        <EmailForm />
                    </div>

                </div>
                <Image src='/images/toa-heftiba-2NZQmMLo_7Q-unsplash.webp' alt="Toonyz BookTok Creator Campaign" width={500} height={500} />

            </div>
            <div className="flex flex-col max-w-screen-md mx-auto mt-16 justify-center items-center gap-8">
                <Image src='/images/N_logo.svg' alt="Toonyz Logo" width={30} height={30} className="self-center p-1 border border-gray-200 rounded-lg" />
                <h1 className="text-xl font-extrabold mb-4 text-black text-center">
                    Join Toonyz Visual Storytelling Movement! <br />
                    We are looking for your collaboration
                </h1>
                <div>
                    <p className="text-lg sm:text-xl mb-8 text-black">
                        We are calling in all BookTok creators to help readers see their favorite characters with stunning AI-generated visuals (and animations).
                    </p>
                </div>
                <div>

                    {/* Why Collaborate Section */}
                    <section className="mb-16 py-10">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl font-bold text-center mb-10 relative">
                                <span className="bg-gradient-to-r from-[#DE2B74] to-[#FF6CAB] bg-clip-text text-transparent">
                                    Why Collaborate With Us?
                                </span>
                            </h2>

                            <motion.div className="grid md:grid-cols-3 gap-8" variants={container} initial="hidden" animate="show">
                                {benefits.map((benefit, index) => (
                                    <motion.div key={index} variants={item}>
                                        <Card
                                            className={`h-full transition-all duration-300 border-2 ${hoveredCard === index ? "border-[#DE2B74] shadow-lg shadow-[#DE2B74]/20" : "border-transparent"
                                                }`}
                                            onMouseEnter={() => setHoveredCard(index)}
                                            onMouseLeave={() => setHoveredCard(null)}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex flex-col items-center text-center">
                                                    <div
                                                        className={`mb-4 p-3 rounded-full ${hoveredCard === index ? "bg-[#DE2B74] text-white" : "bg-[#DE2B74]/10 text-[#DE2B74]"
                                                            } transition-colors duration-300`}
                                                    >
                                                        <benefit.icon className="h-8 w-8" />
                                                    </div>
                                                    <h3 className="text-xl font-semibold mb-2 text-[#DE2B74]">{benefit.title}</h3>
                                                    <p className="text-gray-700 dark:text-gray-300">{benefit.description}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </section>

                    {/* What You Will Do Section */}
                    <section className="mb-16">
                        <h2 className="text-3xl font-bold text-center mb-10 relative">
                            <span className="bg-gradient-to-r from-[#DE2B74] to-[#FF6CAB] bg-clip-text text-transparent">
                                What You Will Do:
                            </span>
                        </h2>

                        {/* <h2 className="text-2xl font-bold text-[#DE2B74] mb-6"></h2> */}
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <BookOpen className="text-[#DE2B74] mr-3 h-6 w-6 mt-1 flex-shrink-0" />
                                <p className="text-black dark:text-black">Choose a web novel provided by Toonyz</p>
                            </div>
                            <div className="flex items-start">
                                <Video className="text-[#DE2B74] mr-3 h-6 w-6 mt-1 flex-shrink-0" />
                                <p className="text-black dark:text-black">Create TikTok video (15-30s time length) with Toonyz AI-generating tool - video and images</p>
                            </div>
                            <div className="flex items-start">
                                <Hash className="text-[#DE2B74] mr-3 h-6 w-6 mt-1 flex-shrink-0" />
                                <p className="text-black dark:text-black">Add hashtags and a link for your followers to explore Toonyz</p>
                            </div>
                        </div>
                    </section>

                    {/* Suggested Hashtags */}
                    <section className="mb-16">
                        <h2 className="text-xl font-bold text-gray-500 mb-6">Suggested Hashtags:</h2>
                        <div className="flex flex-wrap gap-3">
                            <span className="bg-purple-100 text-[#DE2B74] px-3 py-1 rounded-full">#ToonyzBookTok</span>
                            <span className="bg-purple-100 text-[#DE2B74] px-3 py-1 rounded-full">#MyToonyzHero</span>
                            <span className="bg-purple-100 text-[#DE2B74] px-3 py-1 rounded-full">#WebnovelVisuals</span>
                            <span className="bg-purple-100 text-[#DE2B74] px-3 py-1 rounded-full">#BookTok</span>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold text-center mb-10 relative">
                            <span className="bg-gradient-to-r from-[#DE2B74] to-[#FF6CAB] bg-clip-text text-transparent">
                                How it works? - it&quot;s easy!
                            </span>
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="bg-[#DE2B74] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                    1
                                </div>
                                <p className="text-black dark:text-black">Fill out your email address in the form above</p>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-[#DE2B74] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                    2
                                </div>
                                <p className="text-black dark:text-black">We will reach out to you within 4-5 days</p>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-[#DE2B74] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                    3
                                </div>
                                <p className="text-black dark:text-black">In the meanwhile, explore visuals and animations provided by <Link href="https://toonyz.com" className="text-[#DE2B74]">Toonyz</Link></p>
                            </div>
                        </div>
                    </section>


                    <section className="w-full">
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
                                                    <div
                                                        onClick={() => {
                                                            setSelectedVideoItem(item);
                                                            setIsDialogOpen(true);
                                                        }}
                                                        className="relative block w-full h-full group overflow-hidden cursor-pointer" >
                                                        {/* <Image src={item.thumbnail_en} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" /> */}
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src={item.url_en}
                                                            title="YouTube video player"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                            referrerPolicy="strict-origin-when-cross-origin"
                                                            allowFullScreen
                                                        ></iframe>
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                            <CirclePlay size={48} className="text-white" />
                                                        </div>

                                                        <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-t from-transparent to-black/60 text-white text-sm pointer-events-none">
                                                            {item.title_en}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-50 border-none shadow-none text-white dark:text-white" />
                                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-50 border-none shadow-none text-white dark:text-white" />
                            </Carousel>
                        </div>
                    </section>

                    <section className="w-full flex flex-col justify-center items-center py-10">
                        <Button variant="outline" className="bg-[#DE2B74] text-white text-xl w-fit mx-auto rounded-full">
                            <Link href="https://toonyz.com" className="">
                                Go to Toonyz website
                            </Link>
                        </Button>
                        <p className="text-black text-sm">
                            *Sign up Toonyz
                        </p>
                    </section>
                </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl" showCloseButton={true}>
                    <DialogHeader>
                        <DialogTitle>{selectedVideoItem.title_en}</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-video w-full">
                        <iframe
                            width="100%"
                            height="100%"
                            src={selectedVideoItem.url_en}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

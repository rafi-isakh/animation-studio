"use client"

import { useState, useEffect } from "react"
import Image from 'next/image'
import { EmailForm } from "@/components/UI/booktok/EmailForm"
import { Hash, CheckCircle, BookOpen, Video, MailOpen, CirclePlay } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, CarouselApi } from "@/components/shadcnUI/Carousel"
import Autoplay from "embla-carousel-autoplay"
import { Dialog, DialogContent, DialogTrigger, DialogFooter, DialogClose, DialogHeader, DialogTitle } from "@/components/shadcnUI/Dialog"
import { Card, CardContent } from "@/components/shadcnUI/Card"
import { Button } from "@/components/shadcnUI/Button"
import { useLanguage } from "@/contexts/LanguageContext"

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



    return (
        <div className="w-full md:max-w-screen-lg mx-auto p-8 flex flex-col justify-between">
            <div className="flex md:flex-row flex-col w-full gap-10">
                <div className="flex flex-col justify-center items-center">
                    <div className="flex flex-col justify-center items-center">
                        <div className="flex flex-row items-center gap-2 font-bold">
                            <Image src='/toonyz_logo_pink.svg' alt="Toonyz Logo" width={100} height={20} className="self-center py-6 " />
                            <span className="text-black dark:text-black text-center">
                                X BookTok
                            </span>
                        </div>

                        <p className="text-lg sm:text-xl mb-4 text-black text-center">
                            We invite you a BookTok creator campaign
                        </p>
                        {/* <MailOpen className="text-black text-2xl" /> */}
                        <h2 className="text-2xl sm:text-5xl font-extrabold mb-4 text-black text-center">
                            BookTok Creator Invitation
                        </h2>
                    </div>
                    <div>
                        <p className="text-lg  text-black mb-6">
                            We are launching a special BookTok creator campaign and would love to collaborate with you! <br />
                            <span className="text-lg text-black">Simply, fill out your email address in the form here.</span>
                        </p>
                    </div>
                    <div className="w-full">
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
                        We invite you a BookTok creator to help readers see their favorite characters with stunning AI-generated visuals and animations.
                    </p>
                </div>
                <div>

                    {/* Why Collaborate Section */}
                    <section className="mb-16">
                        <h2 className="text-2xl font-bold text-[#DE2B74] mb-6">Why Collaborate With Us?</h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="flex items-start">
                                <CheckCircle className="text-[#DE2B74] mr-3 h-6 w-6 mt-1 flex-shrink-0" />
                                <p className="text-black dark:text-black">Exclusive early access to AI generating tool</p>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle className="text-[#DE2B74] mr-3 h-6 w-6 mt-1 flex-shrink-0" />
                                <p className="text-black dark:text-black"> Get featured as a &quot;Visual Story Curator&quot; on our global launch page</p>
                            </div>
                            <div className="flex items-start">
                                <CheckCircle className="text-[#DE2B74] mr-3 h-6 w-6 mt-1 flex-shrink-0" />
                                <p className="text-black dark:text-black"> Paid partnership and promotion opportunities</p>
                            </div>
                        </div>
                    </section>

                    {/* What You Will Do Section */}
                    <section className="mb-16">
                        <h2 className="text-2xl font-bold text-[#DE2B74] mb-6">What You Will Do:</h2>
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
                        <h2 className="text-2xl font-bold text-[#DE2B74] mb-6">Suggested Hashtags:</h2>
                        <div className="flex flex-wrap gap-3">
                            <span className="bg-purple-100 text-[#DE2B74] px-3 py-1 rounded-full">#ToonyzBookTok</span>
                            <span className="bg-purple-100 text-[#DE2B74] px-3 py-1 rounded-full">#MyToonyzHero</span>
                            <span className="bg-purple-100 text-[#DE2B74] px-3 py-1 rounded-full">#WebnovelVisuals</span>
                            <span className="bg-purple-100 text-[#DE2B74] px-3 py-1 rounded-full">#BookTok</span>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[#DE2B74] mb-6">How it works? - it&quot;s easy!</h2>
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
                                <p className="text-black dark:text-black">We will get back to you as soon as possible</p>
                            </div>
                            <div className="flex items-start">
                                <div className="bg-[#DE2B74] text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                                    3
                                </div>
                                <p className="text-black dark:text-black">While you are waiting, Join Toonyz and Pick a web novel and explore its visuals and animations</p>
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

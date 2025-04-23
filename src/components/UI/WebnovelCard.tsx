"use client"
import Image from "next/image"
import { Webnovel } from "@/components/Types"
import { getImageUrl } from "@/utils/urls"
import useMediaQuery from '@mui/material/useMediaQuery';
import { Eye, CircleChevronRight } from "lucide-react";
import Link from "next/link";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { useLanguage } from "@/contexts/LanguageContext";

const WebnovelCard = ({
    webnovel,
    index,
    ranking,
    chunkIndex
}:
    { webnovel: Webnovel, index: number, ranking: boolean, chunkIndex: number }) => {
    const imageUrl = getImageUrl(webnovel.cover_art)
    const isMobile = useMediaQuery('(max-width:360px)');
    const { dictionary, language } = useLanguage();

    return (
        <Link href={`/view_webnovels/${webnovel.id}`} className="">
            <div className="group p-1 ">
                <div className="group-hover:scale-105 transition-all duration-500 relative  preserve-3d group-hover:rotate-y-[15deg]">
                    {/* Book Cover */}
                    <div className={`rounded-lg shadow-lg w-full aspect-[3/4] flex flex-col relative overflow-hidden`}>
                        {/* Blurred background */}
                        <div className="absolute inset-0"
                            style={{
                                backgroundImage: `url(${imageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'blur(100px) brightness(0.9)',
                                transform: 'scale(1.1)', // Prevents blur edges from showing
                            }}
                        />

                        {/* Content overlay */}
                        <div className="relative">
                            {/* absolute -top-[15px] -left-[15px] */}
                            <div className="relative w-full h-full mx-auto">
                                <div className={`w-full h-full mx-auto`}>
                                    <Image
                                        src={imageUrl}
                                        alt={webnovel.title}
                                        // fill={true}
                                        // sizes={isMobile ? "(max-width: 640px) 100vw, 30vw" : "30vw"}
                                        width={100}
                                        height={100}
                                        className="object-cover object-center rounded-lg"
                                        quality={80}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="absolute top-0 left-0 w-full h-full rounded-md bg-black opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-t-xl">
                                <div className="flex flex-row items-center justify-center gap-2 rounded-md text-black w-full h-full">
                                    <p className="text-white dark:text-white">View now</p>
                                    <div className="bg-white rounded-full p-1">
                                        <svg width="10" height="10" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 1L15 10L1 19V1Z" fill="black" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Book Spine Shadow */}
                        {/* <div className="absolute inset-y-0 right-0 w-4 bg-black/[0.15] transform-gpu origin-right skew-y-6" /> */}


                    </div>
                </div>

                <div className="relative md:bottom-0 bottom-0 left-0 w-full mt-auto p-1 md:pb-1">
                    <h3 className="md:text-base text-sm font-semibold leading-tight line-clamp-2 break-keep text-center">
                        {/* <OtherTranslateComponent
                            element={webnovel}
                            content={webnovel.title}
                            elementId={webnovel.id.toString()}
                            elementType='webnovel'
                            elementSubtype="title"
                            classParams={language === 'ko' ? "text-md md:text-sm w-full break-words" : "text-md md:text-sm w-full break-words"}
                        /> */}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-keep text-center">{webnovel.author.nickname}</p>
                </div>
            </div>
        </Link>
    )
}

export default WebnovelCard;
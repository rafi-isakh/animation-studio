'use client'
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Modal, Box, Button } from "@mui/material";
import { videoStyle } from "@/styles/ModalStyles";
import Image from "next/image";
import { MoveRight } from 'lucide-react';
import Link from "next/link";

interface WebtoonContent {
    title: string;
    image: string;
    en?: string; 
    link: string;
    video: JSX.Element;
}

export default function Videos() {
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<JSX.Element | null>(null);
    const { dictionary, language } = useLanguage();

    const webtoonContents: WebtoonContent[] = [
        {
            title: '웹툰 커리큘럼 1',
            image: '/curriculum/Thumbnail_WEB_1.png',
            en: '/curriculum/Thumbnail_WEB_1_EN.png',
            link: 'https://www.youtube.com/embed/4fnBIsX9_Dw?si=faCKtGDgbjS2jmn7',
            video: <iframe key={1} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/4fnBIsX9_Dw?si=faCKtGDgbjS2jmn7" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 2',
            image: '/curriculum/Thumbnail_WEB_2.png',
            en: '/curriculum/Thumbnail_WEB_2_EN.png',
            link: 'https://www.youtube.com/embed/bqU8IUq1gZo?si=HoQ7JxrFKlvZV19N',
            video: <iframe key={2} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/bqU8IUq1gZo?si=HoQ7JxrFKlvZV19N" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 3',
            image: '/curriculum/Thumbnail_WEB_3.png',
            en: '/curriculum/Thumbnail_WEB_3_EN.png',
            link: 'https://www.youtube.com/embed/9rakUYd2r7E?si=qwAxjQrW0tI3njL3',
            video: <iframe key={3} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/9rakUYd2r7E?si=qwAxjQrW0tI3njL3" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 4',
            image: '/curriculum/Thumbnail_WEB_4.png',
            en: '/curriculum/Thumbnail_WEB_4_EN.png',
            link: 'https://www.youtube.com/embed/OuhnJ9qZwLY?si=l_B-yRaEZaLhCwEC',
            video: <iframe key={4} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/OuhnJ9qZwLY?si=l_B-yRaEZaLhCwEC" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 5',
            image: '/curriculum/Thumbnail_WEB_5.png',
            en: '/curriculum/Thumbnail_WEB_5_EN.png',
            link: 'https://www.youtube.com/embed/dHIFPNZWqLc?si=tu0EgVAENJ-khnLU',
            video: <iframe key={5} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/dHIFPNZWqLc?si=tu0EgVAENJ-khnLU" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 6',
            image: '/curriculum/Thumbnail_WEB_6.png',
            en: '/curriculum/Thumbnail_WEB_6_EN.png',
            link: 'https://www.youtube.com/embed/6xMllO-8CpM?si=nNuBgInd-xiAIup-',
            video: <iframe key={6} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/6xMllO-8CpM?si=nNuBgInd-xiAIup-" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
    ]

    const webnovelContents: WebtoonContent[] = [
        {
            title: '웹소설 커리큘럼 1',
            image: '/curriculum/Thumbnail_FICTION_1.png',
            en: '/curriculum/Thumbnail_FICTION_1_EN.png',
            link: 'https://www.youtube.com/embed/Mzij9X5uDTY?si=lU9Rgl3p1SsSXoLm',
            video: <iframe key={1} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/Mzij9X5uDTY?si=lU9Rgl3p1SsSXoLm" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 2',
            image: '/curriculum/Thumbnail_FICTION_2.png',
            en: '/curriculum/Thumbnail_FICTION_1_EN.png',
            link: 'https://www.youtube.com/embed/uzQ7ebnUVns?si=2dosrLLuNjkpQaL5',
            video: <iframe key={2} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/bqU8IUq1gZo?si=HoQ7JxrFKlvZV19N" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 3',
            image: '/curriculum/Thumbnail_FICTION_3.png',
            en: '/curriculum/Thumbnail_FICTION_1_EN.png',
            link: 'https://www.youtube.com/embed/C0IjxeDn01A?si=3magNphFLhyG1QsG',
            video: <iframe key={3} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/9rakUYd2r7E?si=qwAxjQrW0tI3njL3" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 4',
            image: '/curriculum/Thumbnail_FICTION_4.png',
            en: '/curriculum/Thumbnail_FICTION_1_EN.png',
            link: 'https://www.youtube.com/embed/OuhnJ9qZwLY?si=l_B-yRaEZaLhCwEC',
            video: <iframe key={4} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/OuhnJ9qZwLY?si=l_B-yRaEZaLhCwEC" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 5',
            image: '/curriculum/Thumbnail_FICTION_5.png',
            en: '/curriculum/Thumbnail_FICTION_1_EN.png',
            link: 'https://www.youtube.com/embed/dHIFPNZWqLc?si=tu0EgVAENJ-khnLU',
            video: <iframe key={5} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/dHIFPNZWqLc?si=tu0EgVAENJ-khnLU" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 6',
            image: '/curriculum/Thumbnail_FICTION_6.png',
            en: '/curriculum/Thumbnail_FICTION_1_EN.png',
            link: 'https://www.youtube.com/embed/6xMllO-8CpM?si=nNuBgInd-xiAIup-',
            video: <iframe key={6} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/6xMllO-8CpM?si=nNuBgInd-xiAIup-" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
    ]


    // const webnovelVideos = [
    //     <iframe key={1} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/Mzij9X5uDTY?si=lU9Rgl3p1SsSXoLm" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
    //     <iframe key={2} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/uzQ7ebnUVns?si=2dosrLLuNjkpQaL5" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
    //     <iframe key={3} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/C0IjxeDn01A?si=3magNphFLhyG1QsG" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
    //     <iframe key={4} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/yMtN4sNHe9E?si=6T4Sjbuf_wIYjr2Z" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
    //     <iframe key={5} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/VO5eKFQ50vs?si=YZ0UTqMNW3uNwVHp" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>,
    //     <iframe key={6} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/rFygTsA83s0?si=WX0uV6KOeLvwEjRJ" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
    // ]


    const handleVideoClick = (video: JSX.Element) => {
        setCurrentVideo(video);
        setShowVideoModal(true);
    };


    return (
        <div className="flex flex-col space-y-16 items-center justify-center">
            <div className="flex flex-col space-y-4">
            <div className='flex flex-col md:flex-row lg:flex-row justify-around '>
            <div className='flex flex-col items-center mb-10 '> 
            <Image
                src="/N_Logo.png"
                alt="Toonyz Logo"
                width={0}
                height={0}
                sizes="100vh"
                style={{ 
                    // marginTop: '15px',
                    height: '35px', 
                    width: '35px', 
                    justifyContent: 'center', 
                    alignSelf: 'center', 
                    borderRadius: '25%', 
                    // border: '1px solid #eee'  
                    }}
                />

            <h1 className="text-left text-[2rem]"> 여러분의 꿈을 Toonyz와 함께 하세요!</h1>
            <h1 className="text-left text-[2rem]"> Your favorite universe, Toonyz</h1>
            </div>
            
             {/* <div className='hero'>
              <Image
                src="/curriculum/curri_hero.png"
                alt="Toonyz curriculum banner"
                width={0}
                height={0}
                sizes="100vh"
                style={{ 
                    // marginTop: '15px',
                    height: '500px', 
                    width: '500px', 
                    // justifyContent: 'center', 
                    // alignSelf: 'center', 
                    // borderRadius: '25%', 
                    // border: '1px solid #eee'  
                    }}
                />
            </div> */}
            </div>
                <h1 className="text-2xl font-bold xl:ml-8 mt-10 md:text-left lg:text-left text-center">웹툰 커리큘럼</h1>
                <div className="flex flex-col md:flex-row lg:flex-row mx-auto gap-4 xl:w-[1280px]">
                    {webtoonContents.map((item, index) => (
                         <div key={index} className="relative group/item">
                           {/* Wrapping Image with relative container */}
                           {language == 'ko' ? <Image
                                                src={item.image}
                                                alt="Toonyz curriculum banner"
                                                width={0}
                                                height={0}
                                                priority
                                                className="cursor-pointer hover:opacity-[0.5] relative"
                                                onClick={() => handleVideoClick(item.video)}
                                                sizes="100vw"
                                                style={{ 
                                                    height: '', 
                                                    width: '350px', 
                                                    }}
                                                    onError={(e) => {
                                                        console.error(`Failed to load image: ${item.image}`);
                                                        // Optionally set a fallback image
                                                        e.currentTarget.src = '/curriculum/placeholder.png';
                                                    }}
                                                    />
                                              : <Image 
                                                src={item.en!}
                                                alt='Toonyz curriculum banner Eng image'
                                                width={0}
                                                height={0}
                                                className="cursor-pointer hover:opacity-[0.5] relative"
                                                onClick={() => handleVideoClick(item.video)}
                                                sizes="100vw"
                                                style={{ 
                                                    height: '', 
                                                    width: '350px', 
                                                    }}
                                                />
                                }
                            {/* Play Icon */}
                            <div className="absolute bottom-5 right-5 md:bottom-1 md:right-1 lg:bottom-1 lg:right-1 transform -translate-x-1/2 -translate-y-1/2 invisible group-hover/item:visible">
                                <MoveRight size={20} className="text-gray-400 text-6xl " />
                            </div>
                        </div> 
                    ))} 
                </div>
            </div>
            <Modal open={showVideoModal} onClose={() => setShowVideoModal(false)}>
                <Box sx={videoStyle}>
                    <div className="flex flex-col space-y-4 items-center justify-center">
                        {currentVideo}
                    </div>
                </Box>
            </Modal>

            <div className="flex flex-col space-y-4">
                <h1 className="text-2xl font-bold xl:ml-8 text-left">웹소설 커리큘럼</h1>
                <div className="grid grid-flow-col auto-cols-max overflow-x-auto mx-auto gap-4 xl:w-[1280px]">
                {webnovelContents.map((item, index) => (
                         <div key={index} className="relative group/item ">
                           {/* Wrapping Image with relative container */}
                           {language == 'ko' ? <Image
                                                src={item.image}
                                                alt="Toonyz curriculum banner"
                                                width={0}
                                                height={0}
                                                priority
                                                className="cursor-pointer hover:opacity-[0.5] relative"
                                                onClick={() => handleVideoClick(item.video)}
                                                sizes="100vw"
                                                style={{ 
                                                    height: '', 
                                                    width: '350px', 
                                                    }}
                                                    onError={(e) => {
                                                        console.error(`Failed to load image: ${item.image}`);
                                                        // Optionally set a fallback image
                                                        e.currentTarget.src = '/curriculum/placeholder.png';
                                                    }}
                                                    />
                                              : <Image 
                                                src={item.en!}
                                                alt='Toonyz curriculum banner Eng image'
                                                width={0}
                                                height={0}
                                                className="cursor-pointer hover:opacity-[0.5] relative"
                                                onClick={() => handleVideoClick(item.video)}
                                                sizes="100vw"
                                                style={{ 
                                                    height: '', 
                                                    width: '350px', 
                                                    }}
                                                />
                                }
                            {/* Play Icon */}
                            <div className="absolute bottom-5 right-5 md:bottom-1 md:right-1 lg:bottom-1 lg:right-1 transform -translate-x-1/2 -translate-y-1/2 invisible group-hover/item:visible">
                                <MoveRight size={20} className="text-gray-400 text-6xl " />
                            </div>
                        </div> 
                    ))} 
                </div>
            </div>
        </div>
    )
}
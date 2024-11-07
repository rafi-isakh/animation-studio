'use client'
import { getCloudfrontURL } from '@/utils/cloudfront';
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { initialWebtoonContents, initialWebnovelContents } from '@/utils/curriculum';
import { VideoModal } from '@/components/VideoModal';
import { ContentGrid } from '@/components/VideoContentGrid';


import HoverVideoPlayer from "react-hover-video-player";
import { Modal, Box, Button } from "@mui/material";
import { videoStyle } from "@/styles/ModalStyles";
import Image from "next/image";
import { MoveRight } from 'lucide-react';
import VideoLoadingOverlay from "@/components/VideoLoadingOverlay";
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function Videos() {
    const file_src = getCloudfrontURL('');
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<JSX.Element | null>(null);
    const { dictionary, language } = useLanguage();

    const handleVideoClick = (video: JSX.Element) => {
        setCurrentVideo(video);
        setShowVideoModal(true);
    };

    const webtoonContents = initialWebtoonContents.map(content => ({
        ...content,
        file_src: getCloudfrontURL(content.file_src)
    }));

    const webnovelContents = initialWebnovelContents.map(content => ({
        ...content,
        file_src: getCloudfrontURL(content.file_src)
    }));

    return (
        <div className="flex flex-col space-y-16 items-center justify-center">
            {/* Curriculum Sections hero */}
            <div className="flex flex-col space-y-4">
            <div className='flex flex-col md:flex-row lg:flex-row justify-around '>
            <div className='flex flex-col mb-10 items-center justify-center md:px-3 lg:py-3 py-10 px-10'> 
         
            <Image
                src="/N_Logo.png"
                alt="Toonyz Logo"
                width={0}
                height={0}
                sizes="100vh"
                className='mt-2 lg:mt-0 md:mt-0'
                style={{ 
                    height: '35px', 
                    width: '35px', 
                    justifyContent: 'center', 
                    alignSelf: 'center', 
                    borderRadius: '25%', 
                    }}
                />

            <h1 className="text-left md:text-[2rem] text-lg mb-1"> 여러분의 꿈을 Toonyz와 함께 하세요!</h1>
            <h1 className="text-left md:text-[2rem] text-lg mb-10"> Your Favorite Story Universe, Toonyz</h1>
                <ul className="flex flex-row gap-10 ">
               
                <Button 
                href="#webtoon"
                variant="outlined"
                color="gray"
                className='border-2 border-gay rounded-md px-10 py-3 hover:border-pink-600 hover:text-pink-600'>
                Webtoon curriculum
                </Button>
                <Button 
                href="#webnovel"
                variant="outlined"
                color="secondary"
                className='border-2 border-gay rounded-md px-10 py-3 hover:border-pink-600 hover:text-pink-600'>
                Webnovel curriculum
                </Button>
                </ul>
            </div>
            
             <div className='hero order-first md:order-last lg:order-last md:h-full w-[200px] md:w-[500px] self-center'>
              <Image
                src="/curriculum/curri_webtoon_book.png"
                alt="Toonyz curriculum banner"
                width={0}
                height={0}
                sizes="(max-width: 768px) 200px" 
                className='w-[250px] md:w-[500px] lg:w-[500px] h-auto'
                style={{ 
                    height: 'auto', 
                    width: '500px', 
                    }}
                />
              </div>
              {/* Curriculum Sections hero end */}
                </div>
                      {/* Video Sections */}
                            <ContentGrid 
                                contents={webtoonContents} 
                                language={language} 
                                onVideoClick={handleVideoClick}
                                imageType="webtoon"
                            />
                            
                            <ContentGrid 
                                contents={webnovelContents} 
                                language={language} 
                                onVideoClick={handleVideoClick}
                                imageType="webnovel"
                            />

                            <VideoModal 
                                isOpen={showVideoModal} 
                                onClose={() => setShowVideoModal(false)} 
                                video={currentVideo}
                            />
                  </div>
            </div>
    )
}
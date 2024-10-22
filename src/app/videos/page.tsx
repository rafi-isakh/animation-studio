'use client'
import { getCloudfrontURL } from '@/utils/cloudfront';
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import HoverVideoPlayer from "react-hover-video-player";
import { Modal, Box, Button } from "@mui/material";
import { videoStyle } from "@/styles/ModalStyles";
import Image from "next/image";
import { MoveRight } from 'lucide-react';
import VideoLoadingOverlay from "@/components/VideoLoadingOverlay";

interface WebtoonContent {
    title: string;
    subtitle: string;
    title_en: string;
    subtitle_en: string;
    image: string;
    en?: string; 
    link: string;
    file_src: string;
    video: JSX.Element;
}

export default function Videos() {
    const file_src = getCloudfrontURL('');
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<JSX.Element | null>(null);
    const { dictionary, language } = useLanguage();

    // https://d5lcofnk46q9e.cloudfront.net/webnovel_00[1-6].mp4
    // https://d5lcofnk46q9e.cloudfront.net/webtoon_00[1-6].mp4


    const initialWebtoonContents: WebtoonContent[] = [
        {
            title: '웹툰 커리큘럼 1',
            subtitle: '개연성',
            title_en: 'Curriculum  01.',
            subtitle_en: 'Likelihood',
            image: '/curriculum/Thumbnail_WEB_1.png',
            en: '/curriculum/Thumbnail_WEB_1_EN.png',
            file_src: 'webtoon_001.mp4',
            link: 'https://www.youtube.com/embed/4fnBIsX9_Dw?si=faCKtGDgbjS2jmn7',
            video: <iframe key={1} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/4fnBIsX9_Dw?si=faCKtGDgbjS2jmn7" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 2',
            subtitle: '상업성',
            title_en: 'Curriculum  02.',
            subtitle_en: 'Marketability',
            image: '/curriculum/Thumbnail_WEB_2.png',
            en: '/curriculum/Thumbnail_WEB_2_EN.png',
            file_src: 'webtoon_002.mp4',
            link: 'https://www.youtube.com/embed/bqU8IUq1gZo?si=HoQ7JxrFKlvZV19N',
            video: <iframe key={2} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/bqU8IUq1gZo?si=HoQ7JxrFKlvZV19N" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 3',
            subtitle: '연속성',
            title_en: 'Curriculum  03.',
            subtitle_en: 'Continuity',
            image: '/curriculum/Thumbnail_WEB_3.png',
            en: '/curriculum/Thumbnail_WEB_3_EN.png',
            file_src: 'webtoon_003.mp4',
            link: 'https://www.youtube.com/embed/9rakUYd2r7E?si=qwAxjQrW0tI3njL3',
            video: <iframe key={3} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/9rakUYd2r7E?si=qwAxjQrW0tI3njL3" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 4',
            subtitle: '시나리오 (콘티)',
            title_en: 'Curriculum  04.',
            subtitle_en: 'Scenario',
            image: '/curriculum/Thumbnail_WEB_4.png',
            en: '/curriculum/Thumbnail_WEB_4_EN.png',
            file_src: 'webtoon_004.mp4',
            link: 'https://www.youtube.com/embed/OuhnJ9qZwLY?si=l_B-yRaEZaLhCwEC',
            video: <iframe key={4} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/OuhnJ9qZwLY?si=l_B-yRaEZaLhCwEC" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 5',
            subtitle: '컷 작업',
            title_en: 'Curriculum  05.',
            subtitle_en: 'Editing',
            image: '/curriculum/Thumbnail_WEB_5.png',
            en: '/curriculum/Thumbnail_WEB_5_EN.png',
            file_src: 'webtoon_005.mp4',
            link: 'https://www.youtube.com/embed/dHIFPNZWqLc?si=tu0EgVAENJ-khnLU',
            video: <iframe key={5} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/dHIFPNZWqLc?si=tu0EgVAENJ-khnLU" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹툰 커리큘럼 6',
            subtitle: '인물 및 말풍선',
            title_en: 'Curriculum  06.',
            subtitle_en: 'Character & Speech Bubble',
            image: '/curriculum/Thumbnail_WEB_6.png',
            en: '/curriculum/Thumbnail_WEB_6_EN.png',
            file_src: 'webtoon_006.mp4',
            link: 'https://www.youtube.com/embed/6xMllO-8CpM?si=nNuBgInd-xiAIup-',
            video: <iframe key={6} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/6xMllO-8CpM?si=nNuBgInd-xiAIup-" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
    ]

    // const initialWebnovelContents: Omit<WebtoonContent, 'file_src'> & { file_src: string }[] = [
    const initialWebnovelContents: WebtoonContent[] = [
        {
            title: '웹소설 커리큘럼 1',
            subtitle: '웹소설 소개',
            title_en: 'Curriculum  07.',
            subtitle_en: 'Introduction',
            image: '/curriculum/Thumbnail_FICTION_1.png',
            en: '/curriculum/Thumbnail_FICTION_1_EN.png',
            file_src: 'webnovel_001.mp4',
            link: 'https://www.youtube.com/embed/Mzij9X5uDTY?si=lU9Rgl3p1SsSXoLm',
            video: <iframe key={1} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/Mzij9X5uDTY?si=lU9Rgl3p1SsSXoLm" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 2',
            subtitle: '소재 선정',
            title_en: 'Curriculum  08.',
            subtitle_en: 'Subject Selection',
            image: '/curriculum/Thumbnail_FICTION_2.png',
            en: '/curriculum/Thumbnail_FICTION_2_EN.png',
            file_src: 'webnovel_002.mp4',
            link: 'https://www.youtube.com/embed/uzQ7ebnUVns?si=2dosrLLuNjkpQaL5',
            video: <iframe key={2} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/uzQ7ebnUVns?si=2dosrLLuNjkpQaL5" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 3',
            subtitle: '프롤로그의 공식',
            title_en: 'Curriculum  09.',
            subtitle_en: 'Prologue',
            image: '/curriculum/Thumbnail_FICTION_3.png',
            en: '/curriculum/Thumbnail_FICTION_3_EN.png',
            file_src: 'webnovel_003.mp4',
            link: 'https://www.youtube.com/embed/C0IjxeDn01A?si=3magNphFLhyG1QsG',
            video: <iframe key={3} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/C0IjxeDn01A?si=3magNphFLhyG1QsG" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 4',
            subtitle: '플롯 구성',
            title_en: 'Curriculum  10.',
            subtitle_en: 'Plot Structure',
            image: '/curriculum/Thumbnail_FICTION_4.png',
            en: '/curriculum/Thumbnail_FICTION_4_EN.png',
            file_src: 'webnovel_004.mp4',
            link: 'https://www.youtube.com/embed/yMtN4sNHe9E?si=6T4Sjbuf_wIYjr2Z',
            video: <iframe key={4} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/yMtN4sNHe9E?si=6T4Sjbuf_wIYjr2Z" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 5',
            subtitle: '인물 만들기',
            title_en: 'Curriculum  11.',
            subtitle_en: 'Character Creation',
            image: '/curriculum/Thumbnail_FICTION_5.png',
            en: '/curriculum/Thumbnail_FICTION_5_EN.png',
            file_src: 'webnovel_005.mp4',
            link: 'https://www.youtube.com/embed/VO5eKFQ50vs?si=YZ0UTqMNW3uNwVHp',
            video: <iframe key={5} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/VO5eKFQ50vs?si=YZ0UTqMNW3uNwVHp" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
        {
            title: '웹소설 커리큘럼 6',
            subtitle: '기타',
            title_en: 'Curriculum  12.',
            subtitle_en: 'Miscellaneous',
            image: '/curriculum/Thumbnail_FICTION_6.png',
            en: '/curriculum/Thumbnail_FICTION_6_EN.png',
            file_src: 'webnovel_006.mp4',
            link: 'https://www.youtube.com/embed/rFygTsA83s0?si=WX0uV6KOeLvwEjRJ',
            video: <iframe key={6} className="w-[320px] md:w-[560px] h-[180px] md:h-[315px]" src="https://www.youtube.com/embed/rFygTsA83s0?si=WX0uV6KOeLvwEjRJ" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        },
    ]

    const handleVideoClick = (video: JSX.Element) => {
        setCurrentVideo(video);
        setShowVideoModal(true);
    };

    const webtoonContents: WebtoonContent[] = initialWebtoonContents.map(content => ({
        ...content,
        file_src: getCloudfrontURL(content.file_src)
    }));

    const webnovelContents: WebtoonContent[] = initialWebnovelContents.map(content => ({
        ...content,
        file_src: getCloudfrontURL(content.file_src)
    }));

    return (
        <div className="flex flex-col space-y-16 items-center justify-center">
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
            <h1 className="text-left md:text-[2rem] text-lg mb-10"> Your favorite universe, Toonyz</h1>
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
            </div>
                <h1 className="text-2xl font-bold xl:ml-8 mt-10 md:text-left lg:text-left text-center">전체보기</h1>
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
                  

                    <Modal open={showVideoModal} onClose={() => setShowVideoModal(false)}>
                        <Box sx={videoStyle}>
                            <div className="flex flex-col space-y-4 items-center justify-center">
                                {currentVideo}
                            </div>
                        </Box>
                    </Modal>
      
                    
                <h1 id="webtoon" className="text-2xl font-bold xl:ml-8 mt-10 md:text-left lg:text-left text-center">웹툰 커리큘럼</h1>
                <div className="scrollbar-hide grid grid-flow-col auto-cols-max overflow-x-auto mx-auto gap-4 xl:w-[1280px] w-[430px]">
                    {webtoonContents.map((item, index) => (
                         <div key={index} className="relative group/item">
                           {/* Wrapping Image with relative container */}
                           {language == 'ko' ? (
                                            <HoverVideoPlayer
                                            videoSrc={item.file_src}
                                            style={{
                                                height: '360px',
                                                width: '280px',
                                                borderRadius: '50%'
                                            }}
                                            playbackRangeStart={12}
                                            videoStyle={{
                                                padding: 10,
                                                borderRadius: '30px',
                                              }}
                                            sizingMode="overlay"
                                            loadingOverlay={<VideoLoadingOverlay />}
                                            loadingOverlayWrapperStyle={{
                                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                height: '360px',
                                                width: '280px',
                                              }}
                                            onClick={() => handleVideoClick(item.video)}
                                            pausedOverlay={
                                                <div className='border border-gray-200 rounded-xl bg-white '>
                                                    <div className='flex '>
                                                    <Image
                                                        src="/curriculum/curri_webtoon_book.png"
                                                        alt="Toonyz curriculum banner"
                                                        width={0}
                                                        height={0}
                                                        sizes="100vh"
                                                        style={{ 
                                                            height: '280px', 
                                                            width: '250px', 
                                                            }}
                                                        />
                                                    </div>
                                                    <p className='text-left text-lg font-semibold mt-3 ml-3'>{item.title}</p>
                                                    <p className='text-left mb-3 ml-3'>{item.subtitle}</p>
                                                </div> 
                                                }  
                                                 />
                                                )
                                              : (
                                                <HoverVideoPlayer
                                                videoSrc={item.file_src}
                                                style={{
                                                    height: '360px',
                                                    width: '280px',
                                                    borderRadius: '30px'
                                                }}
                                                playbackRangeStart={12}
                                                videoStyle={{
                                                    padding: 10,
                                                    borderRadius: '30px',
                                                  }}
                                                sizingMode="overlay"
                                                loadingOverlay={<VideoLoadingOverlay />}
                                                loadingOverlayWrapperStyle={{
                                                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                    height: '360px',
                                                    width: '280px',
                                                  }}
                                                onClick={() => handleVideoClick(item.video)}
                                                pausedOverlay={
                                                    <div className='border border-gray-200 rounded-xl bg-white '>
                                                    <div className='flex '>
                                                    <Image
                                                        src="/curriculum/curri_webtoon_book.png"
                                                        alt="Toonyz curriculum banner"
                                                        width={0}
                                                        height={0}
                                                        sizes="100vh"
                                                        style={{ 
                                                            height: '280px', 
                                                            width: '250px',  
                                                            }}
                                                        />
                                                    </div>
                                                    <p className='text-left text-lg font-semibold mt-3 ml-3'>{item.title_en}</p>
                                                    <p className='text-left mb-3 ml-3'>{item.subtitle_en}</p>
                                                </div> 
                                                }
                                            />
                                            )
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
                <h1 id="webnovel" className="text-2xl font-bold xl:ml-8 text-center lg:text-left md:text-left">웹소설 커리큘럼</h1>
                <div className="scrollbar-hide grid grid-flow-col auto-cols-max overflow-x-auto mx-auto gap-4 xl:w-[1280px] w-[430px]">
                {webnovelContents.map((item, index) => (
                         <div key={index} className="relative group/item ">
                           {/* Wrapping Image with relative container */}
                           {language == 'ko' ? (
                                             <HoverVideoPlayer
                                             videoSrc={item.file_src}
                                             style={{
                                                 height: '360px',
                                                 width: '280px',
                                                 borderRadius: '50%'
                                             }}
                                             playbackRangeStart={12}
                                             videoStyle={{
                                                 padding: 10,
                                                 borderRadius: '30px',
                                               }}
                                             sizingMode="overlay"
                                             loadingOverlay={<VideoLoadingOverlay />}
                                             loadingOverlayWrapperStyle={{
                                                 backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                 height: '360px',
                                                 width: '280px',
                                               }}
                                             onClick={() => handleVideoClick(item.video)}
                                             pausedOverlay={
                                                 <div className='border border-gray-200 rounded-xl bg-white '>
                                                     <div className='flex '>
                                                     <Image
                                                         src="/curriculum/curri_webnovel_book.png"
                                                         alt="Toonyz curriculum banner"
                                                         width={0}
                                                         height={0}
                                                         sizes="100vh"
                                                         style={{ 
                                                             height: '280px', 
                                                             width: '250px', 
                                                             }}
                                                         />
                                                     </div>
                                                     <p className='text-left text-lg font-semibold mt-3 ml-3'>{item.title}</p>
                                                     <p className='text-left mb-3 ml-3'>{item.subtitle}</p>
                                                 </div> 
                                                 }  
                                                  />
                                                 )
                                               : (
                                                 <HoverVideoPlayer
                                                 videoSrc={item.file_src}
                                                 style={{
                                                     height: '360px',
                                                     width: '280px',
                                                     borderRadius: '30px'
                                                 }}
                                                 playbackRangeStart={12}
                                                 videoStyle={{
                                                     padding: 10,
                                                     borderRadius: '30px',
                                                   }}
                                                 sizingMode="overlay"
                                                 loadingOverlay={<VideoLoadingOverlay />}
                                                 loadingOverlayWrapperStyle={{
                                                     backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                                     height: '360px',
                                                     width: '280px',
                                                   }}
                                                 onClick={() => handleVideoClick(item.video)}
                                                 pausedOverlay={
                                                     <div className='border border-gray-200 rounded-xl bg-white '>
                                                     <div className='flex '>
                                                     <Image
                                                         src="/curriculum/curri_webnovel_book.png"
                                                         alt="Toonyz curriculum banner"
                                                         width={0}
                                                         height={0}
                                                         sizes="100vh"
                                                         style={{ 
                                                             height: '280px', 
                                                             width: '250px',  
                                                             }}
                                                         />
                                                     </div>
                                                     <p className='text-left text-lg font-semibold mt-3 ml-3'>{item.title_en}</p>
                                                     <p className='text-left mb-3 ml-3'>{item.subtitle_en}</p>
                                                 </div> 
                                                 }
                                             />
                                            )
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
'use client'
import { WebtoonContent } from './Types';
import Image from 'next/image';
import HoverVideoPlayer from "react-hover-video-player";
import { MoveRight } from 'lucide-react';
// import VideoLoadingOverlay from "./VideoLoadingOverlay";

interface ContentGridProps {
    contents: WebtoonContent[];
    language: string;
    onVideoClick: (video: JSX.Element) => void;
    imageType: 'webtoon' | 'webnovel';
}

export function ContentGrid({ contents, language, onVideoClick, imageType }: ContentGridProps) {
    const bookImage = imageType === 'webtoon' 
        ? "/curriculum/curri_webtoon_book.png" 
        : "/curriculum/curri_webnovel_book.png";

    return (
        <div className="scrollbar-hide grid grid-flow-col auto-cols-max overflow-x-auto mx-auto gap-4 xl:w-[1280px] w-[430px]">
            {contents.map((item, index) => (
                <div key={index} className="relative group/item">
                    {language === 'ko' ? (
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
                                objectFit: 'cover',
                              }}
                            onClick={() => onVideoClick(item.video)}
                            pausedOverlay={
                                <div className='border border-gray-200 rounded-xl bg-white'>
                                    <div className='flex'>
                                        <Image
                                            src={bookImage}
                                            alt="Toonyz curriculum banner"
                                            width={0}
                                            height={0}
                                            sizes="100vh"
                                            className='object-none object-right-bottom rounded-tl-lg'
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
                    ) : (
                        // ENG version
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
                                objectFit: 'cover',
                              }}
                            onClick={() => onVideoClick(item.video)}
                            pausedOverlay={
                                <div className='border border-gray-200 rounded-xl bg-white'>
                                    <div className='flex'>
                                        <Image
                                            src={bookImage}
                                            alt="Toonyz curriculum banner"
                                            width={0}
                                            height={0}
                                            sizes="100vh"
                                            className='object-none object-right-bottom rounded-tl-lg'
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
                    )}
                    <div className="absolute bottom-5 right-5 md:bottom-1 md:right-1 lg:bottom-1 lg:right-1 transform -translate-x-1/2 -translate-y-1/2 invisible group-hover/item:visible">
                        <MoveRight size={20} className="text-gray-400 text-6xl" />
                    </div>
                </div>
            ))}
        </div>
    );
}

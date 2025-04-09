"use client"
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Webnovel } from '@/components/Types';
import { getImageUrl } from "@/utils/urls"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import Link from 'next/link';
import CardsScroll from '@/components/CardsScroll';
import { getVideoUrl } from '@/utils/urls';
import { Pause, Play, VolumeOff, Volume2 } from 'lucide-react';
import { Skeleton } from '@/components/shadcnUI/Skeleton';
import { Card } from '@/components/shadcnUI/Card';
import { useMediaQuery } from '@mui/material';

export default function RankingGrid({ webnovels, isMobile, title }: { webnovels: Webnovel[], isMobile: boolean, title: string }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const { dictionary, language } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [videoStates, setVideoStates] = useState<{ [key: number]: boolean }>({});
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showPlayButton, setShowPlayButton] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    useEffect(() => {
        async function checkCoverArtType(index: number) {
            if (!webnovels?.[index]?.cover_art) return;

            try {
                const response = await fetch(`/api/check_if_video_exists?url=${webnovels[index].cover_art}`);
                const data = await response.json();
                setVideoStates(prev => ({
                    ...prev,
                    [index]: data.videoExists
                }));
            } catch (error) {
                console.error('Error fetching coverArt:', error);
            }
        }

        // Check for hovered or active webnovel
        if (activeIndex !== null) {
            checkCoverArtType(activeIndex);
        }
    }, [activeIndex, webnovels]);

    const handleToggleMute = () => {
        const videoElement = document.getElementById('videoElement');
        if (videoElement) {
            setIsMuted(prev => !prev);
        }
    };

    const handleTogglePlayVideo = () => {
        const videoElement = document.getElementById('videoElement') as HTMLVideoElement;
        if (videoElement) {
            if (isPlaying) {
                videoElement.pause();
            } else {
                videoElement.play();
            }
            setIsPlaying(prev => !prev);
        }
    };

    return (
        <div className="md:w-max-screen-xl w-full mx-auto group relative">
            <h2 className="text-xl font-bold">{phrase(dictionary, title, language)}</h2>
            <div ref={scrollRef} className="overflow-x-auto overflow-y-hidden no-scrollbar">
                <div
                    className="grid grid-flow-col auto-cols-[120px] md:auto-cols-[160px] md:gap-28 gap-20 w-fit md:pl-[120px] pl-[55px] py-8">
                    {webnovels.map((webnovel, index) => (
                        <div
                            key={index}
                            className="relative group"
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseLeave={() => setActiveIndex(null)}

                        >
                            {/* Ranking number */}
                            <div className="absolute md:-left-[90px] md:-bottom-8 -left-[55px] -bottom-[15px] select-none pointer-events-none -z-10">
                                <span
                                    className="md:text-[15.5rem] text-[9rem] font-black leading-none text-white 
                                                [text-shadow:2px_0_2px_black,_-2px_0_2px_black,_0_2px_2px_black,_0_-2px_2px_black]
                                                dark:text-black
                                                dark:[text-shadow:2px_0_2px_gray,_-2px_0_2px_gray,_0_2px_2px_gray,_0_-2px_2px_gray]"
                                >
                                    {(index + 1).toString()}
                                </span>
                            </div>
                            {/* Card content */}
                            <Link href={`/view_webnovels/${webnovel.id}`}>
                                <Card
                                    className={`bg-transparent overflow-hidden transition-all duration-300 ease-out border-none shadow-none ${activeIndex === index ? "shadow-none scale-110" : ""
                                        }`}
                                >
                                    {/* Image container - now using full width of the grid column */}
                                    <div className="relative w-[120px] md:w-[160px] aspect-[2/3] bg-gray-900 rounded-lg ">
                                        {webnovel.cover_art ? (
                                            (!videoStates[index] || activeIndex !== index) ? (
                                                <Image
                                                    src={getImageUrl(webnovel.cover_art)}
                                                    alt={webnovel.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 300px"
                                                    className="object-cover rounded-xl"
                                                    placeholder="blur"
                                                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                                    priority={index < 2}
                                                />
                                            ) : (
                                                <div className="w-full h-full">
                                                    <div className="relative w-full h-full">
                                                        <video
                                                            id={`videoElement-${index}`}
                                                            src={getVideoUrl(webnovel.cover_art)}
                                                            autoPlay
                                                            playsInline
                                                            onMouseEnter={() => setShowPlayButton(true)}
                                                            onMouseLeave={() => setShowPlayButton(false)}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleTogglePlayVideo();
                                                            }}
                                                            className="w-full h-full object-cover rounded-xl"
                                                            muted={isMuted}
                                                            loop
                                                        />
                                                        <button
                                                            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${showPlayButton ? 'block' : 'hidden'}`}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleTogglePlayVideo();
                                                            }}
                                                        >
                                                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleToggleMute();
                                                            }}
                                                            className="mute-button absolute bottom-2 right-2 text-white"
                                                        >
                                                            {isMuted ? <VolumeOff size={20} /> : <Volume2 size={20} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            <Skeleton className="w-full h-full" />
                                        )}
                                    </div>
                            
                                    {activeIndex === index && isDesktop && (
                                        <div className="absolute bottom-0 left-0 right-0 flex flex-col bg-white dark:bg-black p-3 text-white h-[50px] z-50 justify-between items-center">
                                            <h3 className="dark:text-white text-black font-medium text-sm">
                                                <OtherTranslateComponent
                                                    content={webnovel.title}
                                                    elementId={webnovel.id.toString()}
                                                    elementType="webnovel"
                                                    elementSubtype="title"
                                                    classParams="text-xs font-medium text-center line-clamp-2 break-keep korean"
                                                />
                                            </h3>
                                            <div className="flex flex-row gap-2">
                                                <p className="text-xs text-gray-500">{webnovel.author.nickname}</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </Link>
                        </div>
                    ))}
                </div>
            </div >

            {!isMobile && (
                <CardsScroll scrollRef={scrollRef} shift={true} />
            )
            }

        </div >
    )
}

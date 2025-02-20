"use client"
// components/CarouselComponent.tsx
import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from 'next/image'
import styles from '@/styles/CarouselComponent.module.css';
import { SlickCarouselItem } from '@/components/Types'
import { Webnovel } from '@/components/Types'
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import Link from 'next/link';
import { useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useWebnovels } from '@/contexts/WebnovelsContext';
interface PaddingConfig {
    desktop?: string;
    mobile?: string;
}

const CarouselComponentReactSlick = ({
    items,
    slidesToShow = 3,
    showDots = true,
    centerPadding = { desktop: '20px', mobile: '10px' }
}: {
    items: SlickCarouselItem[],
    slidesToShow: number,
    showDots: boolean,
    centerPadding?: string | PaddingConfig
}) => {

    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState(1);
    const isMediumScreen = useMediaQuery('(min-width:768px)')
    const { language, dictionary } = useLanguage();
    const {webnovels } = useWebnovels();

    const getCenterPadding = (padding?: string | PaddingConfig) => {
        if (typeof window === 'undefined') return '0px';

        // If padding is a string, use it for both desktop and mobile
        if (typeof padding === 'string') {
            return padding;
        }

        // If padding is an object with desktop/mobile values
        const paddingConfig = padding as PaddingConfig;
        return isMediumScreen
            ? (paddingConfig?.desktop || '20px')
            : (paddingConfig?.mobile || '10px');
    };

    function SampleNextArrow(props: any) {
        const { onClick } = props;
        return (
            <>
                {
                    isMediumScreen ?
                        <button
                            className='absolute md:right-0 right-8 top-1/2 -translate-y-1/2 z-1 rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 group-hover:bg-black/20 transition-opacity duration-300 -translate-x-1/2 hidden md:block'
                            onClick={onClick}
                        >
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                        :
                        <></>
                }
            </>
        );
    }
    function SamplePrevArrow(props: any) {
        const { onClick } = props;
        return (
            <>
                {
                    isMediumScreen ?
                        <button
                            onClick={onClick}
                            className="absolute md:left-8 left-8 top-1/2 -translate-y-1/2 z-10 rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 group-hover:bg-black/20 transition-opacity duration-300 -translate-x-1/2 hidden md:block"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                        :
                        <></>
                }
            </>
        );
    }

    function getHref(webnovel_id: number) {
        return `/view_webnovels?id=${webnovel_id}`;
    }

    function getGenre(index: number) {
        return [webnovels.find((novel: Webnovel) => novel.id == items[index].webnovel_id)?.genre || '']
    }

    function breakKeepOrNot() {
        if (language == 'ko' || language == "ar" || language == "th" || language == "vi" || language == 'en' || language == 'id') {
            return 'break-keep ';
        } else if (language == 'ja' || language == 'zh-CN' || language == 'zh-TW') {
            return '';
        }
        return '';
    }

    const settings = {
        slidesToShow: slidesToShow,
        swipeToSlide: true,
        infinite: true,
        speed: 300,
        autoplaySpeed: 5000,
        autoplay: true,
        className: "center",
        centerMode: true,
        dots: showDots,
        dotsClass: "slick-dots",
        appendDots: (dots: any) => (
            <div>
                <span className={`
                    absolute 
                    bottom-10   
                    right-8    
                    z-10
                    transition-all 
                    duration-300
                    bg-white/20 
                    backdrop-blur-sm 
                    px-2 py-1 
                    rounded-xl
                    text-[10px]
                    text-white/80
                    transform
                    translate-x-0
                    md:right-80
                `}>
                    <span className={`${currentIndex == 0 ? 'text-white' : 'text-white/80'}`}>
                        {currentIndex + 1}
                    </span>
                    /
                    <span className={`text-white/40`}>
                        {items.length}
                    </span>
                </span>
            </div>
        ),
        centerPadding: getCenterPadding(centerPadding),
        spacing: 0,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
        beforeChange: (current: number, next: number) => {
            setNextIndex(next);
        },
        afterChange: (current: number) => {
            setCurrentIndex(current);
            setNextIndex((current + 1) % items.length);
        },
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: Math.max(1, slidesToShow - 1),
                    dots: showDots,
                }
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    dots: showDots,
                }
            }
        ]
    };

    return (
        <div className={`slider-container max-w-screen-xl items-center mx-auto w-full group`}>
            <div className='flex flex-col relative '>
                <Slider {...settings}>
                    {items.map((item, index) => (
                        <div key={index} className={`carousel-slide ${index === currentIndex ? 'active-slide' : 'inactive-slide'}`}>
                            <div className="relative h-[380px]">
                                {/*  */}
                                <Link href={getHref(item.webnovel_id)}>
                                    <div className="slide-content w-96 h-64 md:max-w-screen-xl md:h-[400px]">
                                        {/* max-w-screen-lg */}
                                        <Image
                                            className="object-cover object-center transition-all duration-300 rounded-xl"
                                            src={item.image}
                                            fill
                                            alt={item.image}
                                            placeholder="blur"
                                            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                        />
                                        {/* Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-8 rounded-xl overflow-hidden ">
                                            <div className="flex flex-col justify-end ">

                                                <OtherTranslateComponent
                                                    key={`title-${index}-${language}`}
                                                    content={item.title}
                                                    elementId={item.id.toString()}
                                                    classParams={`${breakKeepOrNot()} md:text-2xl lg:text-2xl text-xl !min-[400px]:text-[12px] font-extrabold`}
                                                    elementType={'carouselItem'}
                                                    elementSubtype="title"
                                                    showLoading={false}
                                                />


                                                <div className='flex space-x-2 '>
                                                    {getGenre(index).map((el: string, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="
                                                            bg-white/20 
                                                            px-2 py-1 
                                                            rounded-xl
                                                            text-xs 
                                                            uppercase 
                                                            tracking-wider
                                                         ">
                                                            {idx === 0 ? `#${el}` : phrase(dictionary, el, language)}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="text-sm md:text-lg line-clamp-2 mb-3">
                                                    {/* md:mt-3 mt-2 */}
                                                    <OtherTranslateComponent
                                                        key={`hook-${index}-${language}`}
                                                        content={item.hook}
                                                        elementId={item.id.toString()}
                                                        classParams={`${breakKeepOrNot()} md:text-sm lg:text-xl !min-[400px]:text-[12px]`}
                                                        elementType={'carouselItem'}
                                                        elementSubtype="hook"
                                                        showLoading={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
            <style jsx global>
                {`

                 .slider-container {
                    padding-top: 0;
                  }
                 .slick-slide {
                    padding: 0 2px;  
                  }   

                  .carousel-slide {
                      transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
                  }

                  .slide-content {
                    margin-left: 1rem;
                  }

                  .slide-content img {
                    margin-right: 0;
                  }
                   .active-slide img {
                     
                   }

                  .active-slide {        
                      opacity: 1;
                      z-index: 2;

                  }

                  .inactive-slide {
                      opacity: 0.3;
                  } 

                  .slide-content {
                      transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;

                  }

                  .carousel-slide:hover .slide-content {
                      opacity: 0.8;
                  }
                  .active-slide:hover .slide-content {
                      opacity: 1;
                  }
                  .outlined-text {
                      text-shadow: 2px 0 2px black, -2px 0 2px black, 0 2px 2px black, 0 -2px 2px black;
                  }
                  .no-outlined-text {
                      text-shadow: none;
                  }


                
              `}
            </style>
        </div>
    );
}

export default CarouselComponentReactSlick;
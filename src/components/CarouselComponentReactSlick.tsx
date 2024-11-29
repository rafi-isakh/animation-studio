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
import { getLocalImageUrl } from '@/utils/urls';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import Link from 'next/link';
import { useMediaQuery } from '@mui/material';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from "lucide-react"

const CarouselComponentReactSlick = ({ 
    searchParams, 
    webnovels, 
    items,
    slidesToShow = 3,
    indicator = true
}: { searchParams: 
    { [key: string]: string | string[] | undefined }, 
    items: SlickCarouselItem[], 
    webnovels: Webnovel[], 
    slidesToShow: number,
    indicator: boolean
}) => {

    const [key1, setKey1] = useState(0);
    const [key2, setKey2] = useState(1000);
    const [key3, setKey3] = useState(2000);
    const [key4, setKey4] = useState(3000);
    const [key5, setKey5] = useState(4000);
    const [key6, setKey6] = useState(5000);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState(1);
    const router = useRouter();
    const isMediumScreen = useMediaQuery('(min-width:768px)')

    const { language, dictionary } = useLanguage();

    useEffect(() => {
        setKey1(prevKey => prevKey + 1);
        setKey2(prevKey => prevKey + 1);
        setKey3(prevKey => prevKey + 1);
        setKey4(prevKey => prevKey + 1);
        setKey5(prevKey => prevKey + 1);
        setKey6(prevKey => prevKey + 1);
    }, [language])

    function SampleNextArrow(props: any) {
        const { onClick } = props;
        return (
            <>
                {
                    isMediumScreen ?
                        <button
                            className='absolute md:right-0 right-8 top-1/2 -translate-y-1/2 z-1 rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 hidden md:block'
                            onClick={onClick}
                        >
                             <ChevronRight className="w-6 h-6 text-white/80" />
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
                        className="absolute md:left-8 left-8 top-1/2 -translate-y-1/2 z-10 rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 hidden md:block"
                    >
                        <ChevronLeft className="w-6 h-6 text-white/80" />
                   </button>
                        :
                    <></>
                }
            </>
        );
    }

    function getHref(index: number) {
        if (index == 0) {
            return '/view_webnovels?id=25';
        } else if (index == 1) {
            return '/view_webnovels?id=19';
        } else if (index == 2) {
            return '/view_webnovels?id=22';
        } else if (index == 3) {
            return '/view_webnovels?id=28';
        } else if (index == 4) {
            return '/view_webnovels?id=29';
        }
        return '#';
    }

    function getGenre(index: number) {
        if (index == 0) {
            return ['Romance', 'ongoing', 'up'];
        } else if (index == 1) {
            return ['Fantasy', 'ongoing', 'up'];
        } else if (index == 2) {
            return ['Fantasy', 'new', 'free'];
        } else if (index == 3) {
            return ['Sci-Fi', 'new', 'free'];
        } else if (index == 4) {
            return ['Fantasy', 'new', 'up']
        }
        return [];
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
        autoplaySpeed: 3000,
        autoplay: true,
        className: "center",
        centerMode: true,
        centerPadding: '0px',
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
              }
            },
            {
              breakpoint: 768,
              settings: {
                slidesToShow: 1,
              }
            }
          ]
    };

    return (
        <div className={`slider-container max-w-screen-xl items-center mx-auto w-full group`}>
            <div className='flex flex-col relative'>
                <Slider {...settings}>
                    {items.map((item, index) => (
                          <div key={index} className={`carousel-slide  ${index === currentIndex ? 'active-slide' : 'inactive-slide'}`}>
                            <div className="relative aspect-[1/1] md:aspect-[1280/500] mx-auto mr-2">
                                <Link href={getHref(index)}>
                                  <div className="slide-content w-96 h-64 md:w-[1280px] md:h-[430px] ">
                                    <Image 
                                        className="object-cover object-center transition-all duration-300" 
                                        src={getLocalImageUrl(item.image)} 
                                        fill
                                        alt={item.image}
                                        placeholder="blur" 
                                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                    />
                                     {/* Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-8 rounded-sm overflow-hidden">
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

                                             
                                            <div className='flex space-x-2 mb-3 mt-3'>
                                                {getGenre(index).map((el: string, idx: number) => (
                                                    <span 
                                                    key={idx} 
                                                    className="
                                                        bg-white/20 
                                                        px-2 py-1 
                                                        rounded-md 
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
                                               {/* Numeric Indicator */}
                                               { indicator && (
                                               <div 
                                                    className="
                                                    bg-white/20 
                                                    px-3 py-1 
                                                    mt-3
                                                    rounded-full 
                                                    text-sm 
                                                    inline-block
                                                    text-white
                                                    "
                                                >
                                                    {currentIndex + 1} / {items.length}
                                                </div> )
                                                }
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
    
                  .carousel-slide {
                      transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
                      border-radius: 0.25rem;
                  }

                  .slide-content img {
                       border-radius: 0.25rem;
                  }
                   .active-slide img {
                       border-radius: 0.25rem !important;
                   }

                  .active-slide {        
                      opacity: 1;
                      z-index: 2;
                      border-radius: 0.25rem;
                  }

                  .inactive-slide {
                      opacity: 0.5;
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

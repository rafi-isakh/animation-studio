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
import { getImageURL } from '@/utils/cloudfront';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import Link from 'next/link';
import { useMediaQuery } from '@mui/material';

// ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] })
const CarouselComponentReactSlick = ({ searchParams, webnovels, items }: { searchParams: { [key: string]: string | string[] | undefined }, items: SlickCarouselItem[], webnovels: Webnovel[] },) => {

    const [key1, setKey1] = useState(0);
    const [key2, setKey2] = useState(1000);
    const [key3, setKey3] = useState(2000);
    const [key4, setKey4] = useState(3000);
    const [key5, setKey5] = useState(4000);
    const [key6, setKey6] = useState(5000);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nextIndex, setNextIndex] = useState(1);
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
        const { className, style, onClick } = props;
        return (
            <>
                {
                    isMediumScreen ?
                        <div
                            className={className}
                            style={{ ...style, zIndex: "10", transform: 'translateX(-48px) scale(2)', filter: 'drop-shadow(0 0 0.2rem black)' }}
                            onClick={onClick}
                        />
                        :
                        <></>
                }
            </>
        );
    }
    function SamplePrevArrow(props: any) {
        const { className, style, onClick } = props;
        return (
            <>
                {
                    isMediumScreen ?
                        <div
                            className={className}
                            style={{ ...style, zIndex: "10", transform: 'translateX(48px) scale(2)', filter: 'drop-shadow(0 0 0.2rem black)' }}
                            onClick={onClick}
                        />
                        :
                        <></>
                }
            </>
        );
    }

    function getHref(index: number) {
        if (index == 0) {
            return '/view_webnovels?id=2';
        } else if (index == 1) {
            return '/view_webnovels?id=12';
        } else if (index == 2) {
            return '/view_webnovels?id=6';
        }
        return '#';
    }

    function breakKeepOrNot() {
        if (language == 'ko' || language == "ar" || language == "th" || language == "vi" || language == 'en' || language == 'id') {
            return 'break-keep';
        } else if (language == 'ja' || language == 'zh-CN' || language == 'zh-TW') {
            return '';
        }
        return '';
    }

    


    const settings = {
        slidesToShow: 1,
        swipeToSlide: true,
        infinite: true,
        speed: 300,
        autoplaySpeed: 6000,
        autoplay: true,
        className: "center",
        centerMode: true,
        centerPadding: '32px',
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
        beforeChange: (current: number, next: number) => {
            setNextIndex(next);
        },
        afterChange: (current: number) => {
            setCurrentIndex(current);
            setNextIndex((current + 1) % items.length);
        },
    };

    return (
        <div className={`slider-container max-w-screen-xl items-center mx-auto w-full`}>
            <div className='flex flex-col relative'>
                <Slider {...settings}>
                    {items.map((item, index) => (
                        <div key={index} className="px-2 md:px-4">
                            <div className="relative aspect-[1/1] md:aspect-[1280/500] mx-auto">
                                <Link href={getHref(index)}>
                                    <Image className="object-cover object-center rounded-xl" src={getImageURL(item.image)} fill alt={item.image}
                                        placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                    />
                                </Link>
                                <div className='absolute rounded-xl top-4 md:top-8 md:w-96 w-64 left-4 md:left-8 text-white outlined-text'>
                                    <div className='flex flex-col justify-end h-full relative left-0 -bottom-30 md:pt-44 lg:pt-44 !min-[500px]:pt-32 !min-[400px]:pt-20 pt-32'>
                                        <OtherTranslateComponent 
                                            key={`title-${index}-${language}`} 
                                            content={item.title} 
                                            elementId={item.id.toString()} 
                                            classParams={`${breakKeepOrNot()} md:text-4xl lg:text-4xl text-md !min-[400px]:text-[12px] font-extrabold px-2 outlined-text`}
                                            elementType={'carouselItem'} 
                                            elementSubtype='title' 
                                            showLoading={false} 
                                        />
                                        <OtherTranslateComponent 
                                            key={`hook-${index}-${language}`} 
                                            content={item.hook} 
                                            elementId={item.id.toString()} 
                                            classParams={`${breakKeepOrNot()} md:text-xl lg:text-xl !min-[400px]:text-[12px] font-bold px-2 p-4 outlined-text`}
                                            elementType={'carouselItem'} 
                                            elementSubtype='hook' 
                                            showLoading={false} 
                                        />

                                        <div className='category hidden md:block lg:block'>
                                          <span className='text-[10px] w-20 rounded-xl text-white bg-gray-500 px-2 py-1 mr-1 no-outlined-text'>Romance</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
            <style jsx>
                {`
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

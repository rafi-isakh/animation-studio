"use client"
// components/CarouselComponent.tsx
import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from 'next/image'
import styles from '@/styles/CarouselComponent.module.css';
import { SlickCarouselItem } from '@/components/Types'
import { getImageURL } from '@/utils/cloudfront';
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import Link from 'next/link';
import { useMediaQuery } from '@mui/material';


const CarouselComponentReactSlick = ({ items }: { items: SlickCarouselItem[] }) => {

    const [key1, setKey1] = useState(0);
    const [key2, setKey2] = useState(1000);
    const [key3, setKey3] = useState(2000);
    const [key4, setKey4] = useState(3000);
    const [key5, setKey5] = useState(4000);
    const [key6, setKey6] = useState(5000);
    const [itemIndex, setItemIndex] = useState(0);
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
            return '/view_webnovels?id=4';
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
        speed: 1000,
        autoplaySpeed: 6000,
        autoplay: true,
        className: "center",
        centerMode: true,
        centerPadding: '32px',
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />
    };

    return (
        <div className={`slider-container max-w-screen-xl items-center mx-auto w-full`}>
            <div className='flex flex-col relative'>
                <Slider {...settings} afterChange={(current) => { setItemIndex(current) }}>
                    {items.map((item, index) => {
                        return (
                            <div key={index} className="px-2 md:px-4">
                                <div className="relative aspect-[10/5] md:aspect-[1280/500] mx-auto"  >
                                    <Link href={getHref(index)}>
                                        <Image className="object-cover object-center rounded-xl" src={getImageURL(item.image)} fill alt={item.image}
                                            placeholder="blur" blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                        />
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </Slider>
                {/* <div className='absolute rounded-xl bottom-10 right-20 w-96 border-2 border-black bg-white'>
                    <div className='flex flex-col justify-around h-full'>
                        <OtherTranslateComponent key={`title-${itemIndex}-${language}`} content={items[itemIndex].title} elementId={items[itemIndex].id.toString()} classParams={`${breakKeepOrNot()} md:text-2xl text-lg font-bold px-2 p-4`}
                            elementType={'carouselItem'} elementSubtype='title' showLoading={false} />
                        <OtherTranslateComponent key={`hook-${itemIndex}-${language}`} content={items[itemIndex].hook} elementId={items[itemIndex].id.toString()} classParams={`${breakKeepOrNot()} md:text-xl text-sm px-2 p-4`}
                            elementType={'carouselItem'} elementSubtype='hook' showLoading={false} />
                    </div>
                </div> */}
            </div>
        </div>
    );
}

export default CarouselComponentReactSlick;

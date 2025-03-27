"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import Slider, { LazyLoadTypes } from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMediaQuery } from '@mui/material';
import { getColumnLayout, calculateIndex } from '@/utils/webnovelUtils';
import { scroll } from '@/utils/scroll'
import _ from 'lodash';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsList = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const [columns, setColumns] = useState<Webnovel[][]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const [mobileGrid, setMobileGrid] = useState('');
    // const chunkedItems = _.chunk(webnovels, 3);
    const chunkedItems = _.chunk(webnovelsToShow.length > 0 ? webnovelsToShow : webnovels, 3);
    const [currentIndex, setCurrentIndex] = useState(0);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const slider = useRef<Slider | null>(null);

    const settings = {
        dots: false,
        mobileFirst:true,
        infinite: false,
        autoplay: false,
        autoplaySpeed: 1000,
        slidesToShow: 3,
        slidesToScroll: 1,
        swipeToSlide: true,
        centerPadding: '0px',
        className: "center",
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />,
        initialSlide: 0,
        responsive: [
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    rows: 1,
                    arrows: false,
                    centerPadding: '0px',
                    centerMode: false, 
                    autoplay: false,
                    speed: 500,
                    swipe: true,
                    touchMove: true,
                    adaptiveHeight: true,
                    initialSlide: 0,
                }
            }
        ]
    };


    function SampleNextArrow(props: any) {
        const { className, style, onClick } = props;
        return (
            <button
                onClick={onClick}
                className='absolute md:-right-5 -right-6 top-1/2 -translate-y-1/2 z-[99] rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 bg-transparent '
            >
                <ChevronRight className="w-6 h-6 text-gray/80" />
            </button>

        )
    }
    function SamplePrevArrow(props: any) {
        const { className, style, onClick } = props;
        return (
            <button
                onClick={onClick}
                className="absolute md:left-5 left-3 top-1/2 -translate-y-1/2 z-[99] rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 bg-transparent "
            >
                <ChevronLeft className="w-6 h-6 text-gray/80" />
            </button>
        );
    }

    useEffect(() => {
        for (const novel of webnovels) {
            novel.version = premium.includes(novel.id) ? "premium" : "free";
        }
        const _webnovelsToShow = webnovels
        .sort((a, b) => sortByFn(a, b, sortBy));

        setWebnovelsToShow(_webnovelsToShow);   

    }, [version, genre, sortBy, webnovels]);


    const text = sortBy === 'views' ? 'popularWebnovels' :
        sortBy === 'likes' ? 'likedWebnovels' :
            sortBy === 'date' ? 'latestWebnovels' : '';

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    }

    function scroll(e: any) {
        if (!slider.current) return;

        e.wheelDelta > 0 ? (
            slider.current.slickNext()
        ) : (
            slider.current.slickPrev()
        );
    };

    useEffect(() => {
        window.addEventListener("wheel", scroll, true);

        return () => {
            window.removeEventListener("wheel", scroll, true);
        };
    }, []);





    return (
        <div className='relative w-full  mx-auto group font-pretendard'>
            <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                <span className='text-black dark:text-white'>
                    {phrase(dictionary, "toonyzHot", language)}
                </span>
            </h1>
            <Slider {...settings} ref={slider} className="custom-slider">
                {chunkedItems.map((chunk, chunkIndex) => (
                    <div
                        key={chunkIndex}
                        className="grid md:grid-cols-3 gap-4"
                    >
                        {chunk.map((item, index) => (
                            <div
                                key={`${chunkIndex}-${index}`}
                                className={`carousel-slide rounded-lg
                                    bg-white dark:bg-black dark:text-white border-gray-100 
                                    border-b dark:border-gray-700 flex flex-row items-center`}
                            >
                                <WebnovelComponent
                                    webnovel={item}
                                    index={calculateIndex(index, chunkIndex, chunkedItems)}
                                    ranking={true}
                                    chunkIndex={chunkIndex}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </Slider>
         
        </div>
    )
};

export default WebnovelsList;
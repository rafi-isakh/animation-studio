"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import Slider from 'react-slick';
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

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsList = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const [columns, setColumns] = useState<Webnovel[][]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [mobileGrid, setMobileGrid] = useState('');
 

    const settings = {
        dots: false,
        infinite: false,
        autoplay: false,
        slidesToShow: !isMobile ? 1 : 3,
        slidesToScroll: 1,
        rows: !isMobile ? 3 : 3,
        slidesPerRow: !isMobile ? 3 : 1 ,
        nextArrow: <SampleNextArrow />,
        prevArrow: <SamplePrevArrow />
      };


      function SampleNextArrow(props: any) {
        const { className, style, onClick } = props;
        return (
                <button
                    onClick={onClick}
                    className='absolute md:-right-2 right-8 top-1/2 -translate-y-1/2 z-[99] rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 hidden md:block  bg-white/80 '
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
                        className="absolute md:left-8 left-8 top-1/2 -translate-y-1/2 z-[99] rounded-full md:p-2 p-1 opacity-0 group-hover:opacity-80 transition-opacity duration-300 -translate-x-1/2 hidden md:block  bg-white/80 "
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
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version))
            .sort((a, b) => sortByFn(a, b, sortBy));

        setWebnovelsToShow(_webnovelsToShow);
        setColumns(getColumnLayout(_webnovelsToShow, 3, isMobile));
        const divider = Math.ceil(_webnovelsToShow.length / 3)
        const _mobileGrid = `grid-cols-${divider.toString()}`
        setMobileGrid(_mobileGrid)
    }, [version, genre, sortBy, webnovels]);


    const text = sortBy === 'views' ? 'popularWebnovels' :
                 sortBy === 'likes' ? 'likedWebnovels' :
                 sortBy === 'date' ? 'latestWebnovels' : '';

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    return (
        <div className='relative w-full md:max-w-screen-xl mx-auto group'>
                <h1 className="flex flex-row justify-between text-xl font-extrabold mb-3">
                    <span className='bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-400 inline-block text-transparent bg-clip-text'>
                     {/* Title  */}
                     { language === 'ko' ? <>{phrase(dictionary, "onlyToonyz", language)}</> : "Toonyz Original" }
                    </span>
                </h1>
                <Slider {...settings} className="custom-slider">
                    {webnovelsToShow.map((webnovel, index) => (
                        <div key={webnovel.id} className='w-full flex-nowrap shrink-0'>
                            <WebnovelComponent webnovel={webnovel} index={index + 1} ranking={true} />
                        </div>
                    ))} 
                </Slider>
                <style jsx global>
                {`

          
                  .custom-slider {
                     width: 100%;
                     
                     }

                  .slide-content {
                      transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;

                  }


              `}
            </style>
        </div>
    )
};

export default WebnovelsList;
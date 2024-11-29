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
        slidesToShow: 1,
        slidesToScroll: 1,
        slidesPerRow: 3
      };


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
                <Slider {...settings}>
                    {/* <div className="grid grid-cols-3 gap-1 w-full overflow-x-auto"> */}
                        {columns.map((column, colIndex) => (
                            <div key={colIndex} className="space-y-1">
                                {column.map((item, rowIndex) => (
                                    <div key={rowIndex} className='md:w-full w-[800px]'>
                                        <WebnovelComponent webnovel={item} index={calculateIndex(rowIndex, colIndex, columns)} ranking={true} />
                                    </div>
                                ))}
                            </div>
                        ))}                                 
                    {/* </div> */}
                </Slider>
            
        </div>
    )
};

export default WebnovelsList;
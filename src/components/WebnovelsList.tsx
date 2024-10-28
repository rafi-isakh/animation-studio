"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import { filter_by_genre, filter_by_version, sortByFn } from '@/utils/webnovelUtils';
import { ChevronLeft, ChevronRight } from "lucide-react"

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsList = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    const genre = searchParams.genre as string | undefined;
    const version = searchParams.version as string | undefined;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200 * (direction === 'left' ? -1 : 1);
            scrollRef.current.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        for (const novel of webnovels) {
            novel.version = premium.includes(novel.id) ? "premium" : "free";
        }
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item, genre))
            .filter(item => filter_by_version(item, version));

        setWebnovelsToShow(_webnovelsToShow);
    }, [version, genre]);


    const text = sortBy === 'views' ? 'popularWebnovels' :
                 sortBy === 'likes' ? 'likedWebnovels' :
                 sortBy === 'date' ? 'latestWebnovels' : '';

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }


       const getColumnLayout = (webnovels: Webnovel[], numColumns: number) => {
        const columns: Webnovel[][] = Array.from({ length: numColumns }, () => []);
        webnovels.forEach((webnovel, index) => {
            columns[index % numColumns].push(webnovel);
        });
        return columns;
       }

       const columns = getColumnLayout(webnovelsToShow.sort((a, b) => sortByFn(a, b, sortBy)), 3);

    return (
        <div className='relative max-w-screen-xl mx-auto px-4 group mt-10'>
            <div className='flex flex-row justify-between text-xl md:text-xl p-2 font-extrabold'>
                {(webnovels.length > 0) ?
                    phrase(dictionary, text, language) : <></>
                }
                <span className='text-gray-400 text-[14px]'>더 보기</span>
            </div>
               {/* Left Arrow */}
               <button 
                onClick={() => scroll('left')}
                className="absolute md:left-0 left-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-1/2 hidden md:block"
            >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
               </button>

                <div className="overflow-x-auto no-scrollbar" ref={scrollRef}>
                        <div className="grid grid-cols-3 gap-2 min-w-max">
                            {columns.map((column, colIndex) => (
                                 <div key={colIndex} className="space-y-4">
                                       {column.map((item, rowIndex) => (
                                        <div key={rowIndex}>
                                           <WebnovelComponent webnovel={item} index={rowIndex + colIndex * 3} ranking={true} />
                                       </div>
                                    ))}
                                 </div>
                            ))}
                        </div>
                    </div>

                {/* Right Arrow */}
                <button 
                    onClick={() => scroll('right')}
                    className="absolute md:right-0 right-8 top-1/2 -translate-y-1/2 z-10 bg-white/80 rounded-full md:p-2 p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-1/2 "
                >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
          </div>
    )
};

export default WebnovelsList;
"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelComponent from "@/components/WebnovelComponent"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import moment from 'moment';
import { ChevronLeft, ChevronRight } from "lucide-react"

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const WebnovelsList = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    let genre = searchParams.genre;
    let version = searchParams.version;
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
            if (premium.includes(novel.id)) {
                novel.version = "premium"
            }
            else {
                novel.version = "free"
            }
        }
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item))
            .filter(item => filter_by_version(item))

        setWebnovelsToShow(_webnovelsToShow)
    }, [version, genre])

    let text = '';
    if (sortBy == 'views') {
        text = 'popularWebnovels'
    } else if (sortBy == 'likes') {
        text = 'likedWebnovels'
    } else if (sortBy == 'date') {
        text = 'latestWebnovels'
    }

    if (typeof genre === 'string') {
    } else if (Array.isArray(genre)) {
        throw new Error("there should be only one genre param")
    } else {
    }

    const filter_by_genre = (item: Webnovel) => {
        if (genre == "all" || genre == null) {
            return item;
        }
        else {
            if (genre == item.genre) {
                return item;
            }
        }
    }

    const filter_by_version = (item: Webnovel) => {
        if (version == item.version) {
            return item;
        }
    }

    const sortByFn = (a: Webnovel, b: Webnovel): number => {
        if (sortBy == 'views') {
            return b.views - a.views
        } else if (sortBy == 'likes') {
            return b.upvotes - a.upvotes
        } else if (sortBy == 'date') {
            let latestDateA = new Date(0);
            let latestDateB = new Date(0);
            for (let i = 0; i < a.chapters.length; i++) {
                let dateA = moment(a.chapters[i].created_at).toDate();
                if (dateA > latestDateA) {
                    latestDateA = dateA;
                }
            }
            for (let i = 0; i < b.chapters.length; i++) {
                let dateB = moment(b.chapters[i].created_at).toDate();
                if (dateB > latestDateB) {
                    latestDateB = dateB;
                }
            }
            if (latestDateA > latestDateB) {
                return -1;
            } else if (latestDateA == latestDateB) {
                return 0;
            } else {
                return 1;
            }
        } else {
            return 0;
        }
    }


    return (
        <div className='relative max-w-screen-xl mx-auto px-4 group'>
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

                <div className="overflow-x-auto" ref={scrollRef}>
                        <div className="grid grid-cols-3 grid-rows-1 gap-2 min-w-max">
                            {webnovelsToShow
                                .sort(sortByFn)
                                .map((item, index) => (
                                    <div className="" key={index}>
                                        <WebnovelComponent webnovel={item} index={index} ranking={true} />
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
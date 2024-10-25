"use client"
import { SortBy, Webnovel } from '@/components/Types'
import { useEffect, useState, useRef } from 'react';
import WebnovelComponentListForm from "@/components/WebnovelComponentListForm"
import { phrase } from '@/utils/phrases';
import { useLanguage } from '@/contexts/LanguageContext';
import moment from 'moment';
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from 'next/link';

export const premium = [23, 19, 21, 22, 20, 24]

export const free = [29, 28, 25]

const dateList = [
    {id: 1, name: "월요일"},
    {id: 2, name: "화요일"},
    {id: 3, name: "수요일"},
    {id: 4, name: "목요일"},
    {id: 5, name: "금요일"},
    {id: 6, name: "토요일"},
    {id: 7, name: "일요일"},
]

const WebnovelsByDates = ({ searchParams, sortBy, webnovels }: { searchParams: { [key: string]: string | string[] | undefined }, sortBy: SortBy, webnovels: Webnovel[] }) => {
    let genre = searchParams.genre;
    let version = searchParams.version;
    const { dictionary, language } = useLanguage();
    const [webnovelsToShow, setWebnovelsToShow] = useState<Webnovel[]>([])
    const [genreWebnovels, setGenreWebnovels] = useState<Webnovel[]>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const dateMenuRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
    const dateDropdownRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        // Set version for each webnovel
        for (const novel of webnovels) {
            novel.version = premium.includes(novel.id) ? "premium" : "free";
        }

        // Filter and sort webnovels
        const _webnovelsToShow = webnovels
            .filter(item => filter_by_genre(item))
            .filter(item => filter_by_version(item))
            .sort(sortByFn);

        setWebnovelsToShow(_webnovelsToShow);

        // Organize "Read by Genre" list in groups of 3 per row
        const genreRows = [];
        for (let i = 0; i < _webnovelsToShow.length; i += 3) {
            genreRows.push(_webnovelsToShow.slice(i, i + 3));
        }
        setGenreWebnovels(genreRows.flat());

    }, [version, genre, webnovels, sortBy]);

    const filter_by_genre = (item: Webnovel) => {
        if (genre === "all" || !genre) return true;
        return genre === item.genre;
    };
    const filter_by_version = (item: Webnovel) => version === item.version ? item : null;

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


    const toggleBelowHeader = () => {
        const belowHeader = document.getElementById('below-header');
        const aboveHeader = document.getElementById('above-header');
        if (belowHeaderToggle) {
            belowHeader?.classList.add('hidden')
            aboveHeader?.classList.add('pb-4')
        } else {
            belowHeader?.classList.remove('hidden')
            aboveHeader?.classList.remove('pb-4')
        }
        setBelowHeaderToggle(!belowHeaderToggle);
    }

    const openBelowHeader = () => {
        const belowHeader = document.getElementById('below-header');
        const aboveHeader = document.getElementById('above-header');
        belowHeader?.classList.remove('hidden')
        setBelowHeaderToggle(true);
    }


    return (
        <div className='relative max-w-screen-xl mx-auto px-4 group'>

            <div className="overflow-x-auto no-scrollbar flex flex-row justify-between gap-5 mt-10" ref={scrollRef}>
                {/* Primary Webnovels List */}

                <div className='w-full'>
                    <h1 className='flex flex-row justify-between text-xl md:text-xl p-2 font-extrabold'>
                    장르별 인기작<span className='text-gray-400 text-[14px]'>더 보기</span>
                    {/* {(webnovels.length > 0) ?
                        phrase(dictionary, text, language) : <></>
                    } */}
                    
                   </h1>
                    <div className="">
                    {webnovelsToShow.map((item, index) => (
                        <WebnovelComponentListForm key={index} webnovel={item} index={index} ranking={true} />
                    ))}
                    </div>
                </div>

                   {/* "Read by Genre" Section */}
                   <div className='w-full'>
                   <h1 className='flex flex-row justify-between text-xl md:text-xl p-2 font-extrabold'>
                    요일별 인기작 <span className='text-gray-400 text-[14px]'>
                       
                
                    더보기
                     </span>
                    {/* {(webnovels.length > 0) ?
                        phrase(dictionary, text, language) : <></>
                    } */}
                    
                   </h1>
                    <div className="">
                        {genreWebnovels.map((item: Webnovel, index: number) => (
                            <WebnovelComponentListForm key={index} webnovel={item} index={index} ranking={true} />
                        ))}
                    </div>
                </div>

             
            </div>
          </div>
    )
};

export default WebnovelsByDates;
"use client"

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { usePathname, useSearchParams } from 'next/navigation';
import { getUrlWithParams } from '@/utils/stringUtils';
import { Gem, Heart, Laugh, Wine, Star, Rocket } from 'lucide-react';

const KeywordsComponent = () => {
    const { dictionary, language } = useLanguage();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

    useEffect(() => {
        const adjustFontSize = () => {
            linkRefs.current.forEach((link, index) => {
                if (link) {
                    const text = link.querySelector('h6');
                    if (text) {
                        let fontSize = 24; // Starting font size
                        text.style.fontSize = `${fontSize -2}px`;

                        while (text.scrollWidth > link.offsetWidth || text.scrollHeight > link.offsetHeight) {
                            fontSize--;
                            text.style.fontSize = `${fontSize}px`;
                            if (fontSize <= 8) break; // Minimum font size
                        }
                    }
                }
            });
        };

        adjustFontSize();
        window.addEventListener('resize', adjustFontSize);

        return () => window.removeEventListener('resize', adjustFontSize);
    }, [language]); // Re-run when language changes

    const genres = ['all', 'romanceFantasy', 'romance', 'bl', 'fantasy', 'sf'];
    const genresIcon = [<Gem key="gem" />, <Heart key="heart" />, <Laugh key="laugh" />, <Wine key="wine" />, <Star key="star" />, <Rocket key="rocket" />];

    const getGenreUrl = (genre: string) => {
        return getUrlWithParams('genre', genre, pathname, searchParams);
    };

    const highlightGenre = (genre: string) => {
        return searchParams.get("genre") == genre
    }

    return (
        <div className='relative max-w-screen-xl mx-auto px-4 group mt-6 '>
        <div className="w-full h-20 md:h-20 mt-4 md:mt-4 overflow-y-auto no-scrollbar">  
            <div className="flex flex-row w-full md:w-[1280px] ml-2 mx-auto gap-2 !cursor-pointer">  
                {genres.map((genre, index) =>  (
                      <Link
                        key={index}
                        href={getGenreUrl(genre)}
                        className={`border border-gray-400 rounded-sm px-4 !cursor-pointer ${highlightGenre(genre) ? "text-pink-600" : ""}`}
                        ref={el => {
                            if (el) {
                                linkRefs.current[index] = el;
                            }
                        }}
                         >
                        <h6 className="!text-[16px] font-bold tracking-tight hover:text-pink-600 whitespace-nowrap !cursor-pointer">
                          # {phrase(dictionary, genre, language).replaceAll(" ", "-")}
                        </h6>
                    </Link>
                ))}
            </div>

        </div>
      </div>
    );
};

export default KeywordsComponent;

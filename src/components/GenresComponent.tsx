"use client"

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { usePathname, useSearchParams } from 'next/navigation';
import { getUrlWithParams } from '@/utils/stringUtils';
import { Gem, Heart, Laugh, Wine, Star, Rocket } from 'lucide-react';

const GenresComponent = () => {
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
    const genresIcon = [<Gem />, <Heart />, <Laugh />, <Wine />, <Star />, <Rocket />]

    const getGenreUrl = (genre: string) => {
        return getUrlWithParams('genre', genre, pathname, searchParams);
    };

    const highlightGenre = (genre: string) => {
        return searchParams.get("genre") == genre
    }

    return (
        <div className='flex flex-col w-full md:w-[1280px] px-4 justify-center items-center mx-auto'>
        <h1 className='font-extrabold text-xxl text-left justify-start self-start mt-10 '>{phrase(dictionary, "viewByGenre", language)}</h1>
        <div className="w-full h-16 md:h-32 mt-2 md:mt-4 justify-between flex flex-col">
           
            <div className="flex w-full md:w-[1280px] px-4 justify-center items-center mx-auto gap-9">  
                {genres.map((genre, index) =>  (
                  <div key={index} className="flex flex-col justify-center items-center">
                     <div className='flex justify-center items-center w-[50px] h-[50px] md:w-[70px] md:h-[70px] bg-gray-400 rounded-full hover:bg-pink-600 hover:text-white'>
                      {/* Full rounded div */}
                      {genresIcon[index]}
                      </div>
                      <Link
                        href={getGenreUrl(genre)}
                        className={`${highlightGenre(genre) ? "text-pink-600" : ""} flex flex-col items-center justify-center mt-4`}
                        ref={el => {
                            if (el) {
                                linkRefs.current[index] = el;
                            }
                        }}
                         >
                        <h6 className="!text-[16px] font-bold tracking-tight hover:text-pink-600 whitespace-nowrap">
                          {phrase(dictionary, genre, language).replaceAll(" ", "-")}
                        </h6>
                    </Link>
                 </div>
                ))}
            </div>
        </div>
      </div>
    );
};

export default GenresComponent;

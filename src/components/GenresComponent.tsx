"use client"

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { usePathname, useSearchParams } from 'next/navigation';
import { getUrlWithParams } from '@/utils/stringUtils';
// import ToonyzLogo from '@/public/toonyzLogo.png';
import Image from 'next/image';
import { Gem, Heart, Gift, Star, Clapperboard, CalendarDays } from 'lucide-react';

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
                        let fontSize = 16; // Starting font size
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

    const capitalize = (word: string) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }

    const genres = ['all', 'toonyzOnly', 'event', 'toonyzCut', 'studio',];
    const genresIcon = [<CalendarDays key="calendarDays" />, <Image src='/toonyzLogo.png' alt="Toonyz Logo" width={35} height={5} key="heart" />, <Gift key="gift" />, <Clapperboard key="clapperboard" />, <Star key="star" />,];

    const getGenreUrl = (genre: string) => {
        return getUrlWithParams('genre', genre, pathname, searchParams);
    };

    const highlightGenre = (genre: string) => {
        return searchParams.get("genre") == genre
    }

    return (
        <div className='flex flex-col w-full md:w-[1280px] justify-center items-center mx-auto'>
        {/* <h1 className='font-extrabold text-xl md:text-xl text-left justify-start self-start mt-10 '>
            {phrase(dictionary, "viewByGenre", language)}
        </h1>
         */}
        <div className="w-full overflow-x-auto">   
            <div className="flex flex-row w-full md:w-[1280px] px-4 justify-center items-center mx-auto gap-9">  
                {genres.map((genre, index) =>  (
                  <div key={index} className="flex flex-col justify-start items-center h-full">
                     <div className='flex justify-center items-center w-[50px] h-[50px] md:w-[70px] md:h-[70px] bg-gray-200 rounded-full hover:bg-pink-300 hover:text-white text-black dark:text-black'>
                      {/* Full rounded div */}
                      {genresIcon[index]}
                      </div>
                      <Link
                        href={getGenreUrl(genre)}
                        className={`${highlightGenre(genre) ? "text-pink-300" : ""} flex flex-col items-center justify-center mt-4 cursor-pointer`}
                        ref={el => {
                            if (el) {
                                linkRefs.current[index] = el;
                            }
                        }}
                         >
                        <h6 className="flex justify-center tracking-tight keep-all">
                          {capitalize(phrase(dictionary, genre, language))}
                        </h6>
                    </Link>
                 </div>
                ))}

                {/* <div className="flex flex-col justify-end items-center">
                   <div className='flex justify-center items-center w-[50px] h-[50px] md:w-[70px] md:h-[70px] bg-gray-200 rounded-full hover:bg-pink-600 hover:text-white'>
                       <Rocket />
                    </div>  
                    <Link
                        href=''
                        className={` flex flex-col items-center justify-center mt-4`}
                            >
                    <h6 className="flex justify-center tracking-tight hover:text-pink-600 keep-all">
                        new
                    </h6>
                   </Link>
                </div> */}

            </div>

        </div>
      </div>
    );
};

export default GenresComponent;

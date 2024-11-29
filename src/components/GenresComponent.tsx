"use client"

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { usePathname, useSearchParams } from 'next/navigation';
import { getUrlWithParams } from '@/utils/stringUtils';
import Image from 'next/image';
import { CalendarDays, Gift, Clapperboard, Star } from 'lucide-react';

const GenresComponent = () => {
    const { dictionary, language } = useLanguage();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const linkRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const adjustLayout = () => {
            // Reset styles first
            linkRefs.current.forEach(container => {
                if (container) {
                    const icon = container.querySelector('.genre-icon');
                    const text = container.querySelector('.genre-text');
                    if (icon && text) {
                        icon.setAttribute('style', '');
                        text.setAttribute('style', '');
                    }
                }
            });

            // Find max height for icons and texts separately
            const maxIconHeight = Math.max(...linkRefs.current.map(container => 
                container?.querySelector('.genre-icon')?.getBoundingClientRect().height || 0
            ));

            const maxTextHeight = Math.max(...linkRefs.current.map(container => 
                container?.querySelector('.genre-text')?.getBoundingClientRect().height || 0
            ));

            // Apply consistent heights
            linkRefs.current.forEach(container => {
                if (container) {
                    const icon = container.querySelector('.genre-icon');
                    const text = container.querySelector('.genre-text');
                    if (icon && text) {
                        icon.setAttribute('style', `height: ${maxIconHeight}px; min-height: ${maxIconHeight}px;`);
                        text.setAttribute('style', `height: ${maxTextHeight}px; min-height: ${maxTextHeight}px;`);
                    }
                }
            });
        };

        adjustLayout();
        window.addEventListener('resize', adjustLayout);

        return () => window.removeEventListener('resize', adjustLayout);
    }, [language]); // Re-run when language changes

    const capitalize = (word: string) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }

    const genres = ['all', 'toonyzOnly', 'event', 'toonyzCut', 'studio'];
    const genresIcon = [
        <CalendarDays key="calendarDays" />, 
        <Image src='/toonyzLogo.png' alt="Toonyz Logo" width={35} height={35} key="toonyzLogo" />, 
        <Gift key="gift" />, 
        <Clapperboard key="clapperboard" />, 
        <Star key="star" />
    ];

    const getGenreUrl = (genre: string) => {
        return getUrlWithParams('genre', genre, pathname, searchParams);
    };

    const highlightGenre = (genre: string) => {
        return searchParams.get("genre") == genre
    }

    return (
        <div className='w-full h-full md:w-[1280px] mx-auto'>
            <div className="overflow-x-auto">   
                <div className="flex flex-row px-4 md:justify-center justify-start items-center mx-auto gap-9">  
                    {genres.map((genre, index) =>  (
                        <div 
                            key={index} 
                            className="flex flex-col justify-center items-center h-full"
                            ref={el => {
                                if (el) {
                                    linkRefs.current[index] = el;
                                }
                            }}
                        >
                            <Link
                                href={getGenreUrl(genre)}
                                className={`${highlightGenre(genre) ? "" : "text-gray-500"} flex flex-col items-center justify-center cursor-pointer w-full`}
                            >
                                <div className='genre-icon flex justify-center items-center w-[50px] h-[50px] md:w-[70px] md:h-[70px] bg-gray-200 rounded-full hover:bg-pink-300 hover:text-white text-black dark:text-black'>
                                    {genresIcon[index]}
                                </div>
                                <h6 className="genre-text flex justify-center tracking-tight keep-all mt-4 text-[12px] text-center">
                                    {capitalize(phrase(dictionary, genre, language))}
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
"use client"

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { usePathname, useSearchParams } from 'next/navigation';

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

    const getGenreUrl = (genre: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('genre', genre);
        return `${pathname}?${params.toString()}`;
    };

    return (
        <div className='flex flex-col w-full md:w-[1280px] px-4 justify-center items-center mx-auto'>
        <h1 className='font-extrabold text-left justify-start self-start mt-10 '>{phrase(dictionary, "viewByGenre", language)}</h1>
        <div className="scrollbar-hide w-full h-16 md:h-32 mt-2 md:mt-4 justify-between overflow-x-scroll flex flex-col">
           
            <div className="flex w-full md:w-[1280px] px-4 justify-between items-center mx-auto">
                {genres.map((genre, index) => (
                         <Link
                        key={genre}
                        href={getGenreUrl(genre)}
                        className="flex-grow mr-4 p-1 text-center flex flex-col justify-center items-center hover:text-pink-600 bg-gray-400 rounded-full"
                        ref={el => {
                            if (el) {
                                linkRefs.current[index] = el;
                            }
                        }}
                    >
                        <h6 className="!text-[16px] font-bold tracking-tight hover:text-pink-600 text-black whitespace-nowrap">
                          # {phrase(dictionary, genre, language)}
                        </h6>
                    </Link>
                ))}
            </div>
        </div>
      </div>
    );
};

export default GenresComponent;

"use client"

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';

const GenresComponent = () => {
    const { dictionary, language } = useLanguage();

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

    return (
        <div className="scrollbar-hide w-screen bg-[#d9a8ff] h-32 mt-8 justify-between overflow-x-scroll flex">
            <div className="flex justify-evenly items-center mx-auto">
                {genres.map((genre, index) => (
                    <Link
                        key={genre}
                        href={`?genre=${genre}`}
                        className="flex-grow w-1/6 min-w-[120px] min-h-[60px] h-16 mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-white rounded-full"
                        ref={el => {
                            if (el) {
                                linkRefs.current[index] = el;
                            }
                        }}
                    >
                        <h6 className="font-bold tracking-tight hover:text-pink-600 text-[#d9a8ff] whitespace-nowrap">
                            {phrase(dictionary, genre, language)}
                        </h6>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default GenresComponent;

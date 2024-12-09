"use client"

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { usePathname, useSearchParams } from 'next/navigation';
import { getUrlWithParams } from '@/utils/stringUtils';
import Image from 'next/image';
import { CalendarDays, Gift, Clapperboard, Star } from 'lucide-react';
import { useTheme } from '@/contexts/providers';
const CircularMenuItemsComponent = () => {
    const { dictionary, language } = useLanguage();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { theme } = useTheme()
    const linkRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const adjustLayout = () => {
            // Reset styles first
            linkRefs.current.forEach(container => {
                if (container) {
                    const icon = container.querySelector('.circle-icon');
                    const text = container.querySelector('.circle-text');
                    if (icon && text) {
                        icon.setAttribute('style', '');
                        text.setAttribute('style', '');
                    }
                }
            });

            // Find max height for icons and texts separately
            const maxIconHeight = Math.max(...linkRefs.current.map(container => 
                container?.querySelector('.circle-icon')?.getBoundingClientRect().height || 0
            ));

            const maxTextHeight = Math.max(...linkRefs.current.map(container => 
                container?.querySelector('.circle-text')?.getBoundingClientRect().height || 0
            ));

            // Apply consistent heights
            linkRefs.current.forEach(container => {
                if (container) {
                    const icon = container.querySelector('.circle-icon');
                    const text = container.querySelector('.circle-text');
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

    const circles = ['all', 'toonyzOnly', 'event', 'toonyzCut', 'studio'];
    const circlesIcon = [
        <CalendarDays key="calendarDays" />, 
        <Image 
            src={theme === 'dark' ? '/toonyz_logo_pink.svg' : '/toonyzLogo.png'} 
            alt="Toonyz Logo" 
            width={40} 
            height={40} 
            key="toonyzLogo" 
        />, 
        <Gift key="gift" />, 
        <Clapperboard key="clapperboard" />, 
        <Star key="star" />
    ];

    const getCircleUrl = (circle: string) => {
        switch (circle) {
            case 'all':
                return '#'
            case 'toonyzOnly':
                return '#'
            case 'event':
                return '#'
            case 'toonyzCut':
                return '#'
            case 'studio':
                return '/studio'
            default:
                return '#'
        }
    }
    const highlightCircle = (circle: string) => {
        return searchParams.get("circle") == circle
    }

    return (
        <div className='w-full h-full md:max-w-screen-lg mx-auto'>
            <div className="overflow-x-auto">   
                <div className="flex flex-row px-6 md:justify-center justify-start items-center mx-auto gap-9">  
                    {circles.map((circle, index) =>  (
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
                                href={getCircleUrl(circle)}
                                className={`${highlightCircle(circle) ? "" : "text-gray-500 dark:text-gray-400"} 
                                    flex flex-col items-center justify-center cursor-pointer w-full
                                `}
                                >
                                <div className="circle-icon flex justify-center items-center w-[50px] h-[50px] 
                                  md:w-[90px] md:h-[90px] bg-gray-200 dark:bg-gray-500 rounded-full
                                 hover:bg-purple-100 hover:text-white text-black dark:text-white
                                 ">
                                    {circlesIcon[index]}
                                </div>
                                <h6 className="circle-text flex justify-center tracking-tight keep-all 
                                    mt-4 md:text-md text-sm text-center w-full
                                ">
                                    {capitalize(phrase(dictionary, circle, language))}
                                </h6>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CircularMenuItemsComponent;
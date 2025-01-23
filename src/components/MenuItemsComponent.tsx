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
import dynamic from 'next/dynamic';

const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});

const MenuItemsComponent = () => {
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

    const circles = ['publish', 'genre', 'event', 'toonyzCut', 'studio', 'starShop'];
    const circlesIcon = [
        <Image
            src={theme === 'dark' ? '/icons/main_publish_icon.svg' : '/icons/main_publish_icon.svg'}
            alt="Publish Logo"
            width={30}
            height={30}
            key="publishLogo"
            className="opacity-100"
        />,
        <Image
            src={theme === 'dark' ? '/icons/main_genre_icon.svg' : '/icons/main_genre_icon.svg'}
            alt="genre Logo"
            width={30}
            height={30}
            key="genreLogo"
            className="opacity-100"
        />,
        <Image
            src={theme === 'dark' ? '/icons/main_event_icon.svg' : '/icons/main_event_icon.svg'}
            alt="Event Logo"
            width={30}
            height={30}
            key="eventLogo"
            className="opacity-100"
        />,
        <Image
            src={theme === 'dark' ? '/icons/main_toonyzcut_icon.svg' : '/icons/main_toonyzcut_icon.svg'}
            alt="Toonyz Cut Logo"
            width={30}
            height={30}
            key="toonyzCutLogo"
            className="opacity-100"
        />,
        <Image
            src={theme === 'dark' ? '/icons/main_studio_icon.svg' : '/icons/main_studio_icon.svg'}
            alt="Studio Logo"
            width={30}
            height={30}
            key="studioLogo"
            className="opacity-100"
        />,
        <Image
            src={theme === 'dark' ? '/icons/main_starShop.icon.svg' : '/icons/main_starShop.icon.svg'}
            alt="Star Shop Logo"
            width={30}
            height={30}
            key="starShopLogo"
            className="opacity-100"
        />,
    ];

    const getCircleUrl = (circle: string) => {
        switch (circle) {
            case 'all':
                return '#'
            case 'publish':
                return '#'
            case 'genre':
                return '#'
            case 'event':
                return '#'
            case 'toonyzCut':
                return '#'
            case 'studio':
                return '/studio'
            case 'starShop':
                return '/stars'
            default:
                return '#'
        }
    }
    const highlightCircle = (circle: string) => {
        return searchParams.get("circle") == circle
    }

    return (
        <div className='w-full h-full md:max-w-screen-lg mx-auto no-scrollbar'>
            <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
                <div className="flex flex-row md:px-6 px-0 md:justify-center justify-center md:items-center items-center mx-auto gap-1 ">
                    {circles.map((circle, index) => (
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
                                className={`${highlightCircle(circle) ? "" : "text-gray-500 dark:text-gray-500"} 
                                    flex flex-col items-center justify-center cursor-pointer w-full
                                `}
                            >
                                <div className="circle-icon flex justify-center items-center w-[50px] h-[50px] 
                                  md:w-[60px] md:h-[60px] bg-gray-100 dark:bg-gray-500 rounded-xl
                                 hover:bg-opacity-50 hover:text-white text-black dark:text-white
                                 ">
                                    {circlesIcon[index]}
                                </div>
                                <h6 className="circle-text flex justify-center tracking-tight keep-all korean
                                    mt-4 md:text-sm text-sm text-center w-full leading-tight font-pretendard font-bold
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

export default MenuItemsComponent;
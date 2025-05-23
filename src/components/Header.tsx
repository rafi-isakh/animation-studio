"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language, Webnovel } from '@/components/Types';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useDevice } from '@/contexts/DeviceContext';
import Link from 'next/link';
import styles from '@/styles/Header.module.css';
import { phrase } from '@/utils/phrases';
import Image from 'next/image';
import { useMediaQuery } from 'react-responsive';
import { langPairList } from '@/utils/phrases';
import {
    Sun,
    Grip,
    Globe,
    Menu,
    User,
    MoonStar,
    Book,
    CircleHelp,
    Gift,
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/shadcnUI/Popover"
import { Button } from '@/components/shadcnUI/Button';
import { useTheme } from '@/contexts/providers'
import SearchComponent from '@/components/SearchComponent';
import { useSearch } from '@/contexts/SearchContext';
import { useMobileMenu } from '@/contexts/MobileMenuContext';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import UserProfileButton from '@/components/UI/UserProfileButton';
import HelpGuidComponent from '@/components/UI/HelpGuideComponent';
import { ContentRatingSwitch } from '@/components/UI/ContentRatingSwitch';

export const Header = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
    const router = useRouter();
    const [pathnameLoading, setPathnameLoading] = useState(true);
    const { loading, logout } = useAuth();
    const { email, nickname } = useUser();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [belowHeaderToggle, setBelowHeaderToggle] = useState(true);
    const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
    // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
    const device = useDevice();
    const menuRef = useRef<HTMLDivElement>(null);
    const languageDropdownRef = useRef<HTMLDivElement>(null);
    const userDropdownRef = useRef<HTMLDivElement>(null);
    const hamburgerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const languageMenuRef = useRef<HTMLDivElement>(null);
    const { dictionary, language, setLanguageOverride } = useLanguage();
    const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
    const [logoWidth, setLogoWidth] = useState(100);
    const [logoHeight, setLogoHeight] = useState(24);
    const [highlightLanguage, setHighlightLanguage] = useState<Record<Language, boolean>>(
        Object.fromEntries(langPairList.map(lang => [lang.code, false])) as Record<Language, boolean>
    );
    const { theme, toggleTheme } = useTheme()
    const { recentQueries, setRecentQueries, lastIndex, setLastIndex } = useSearch();
    const [searchRemember, setSearchRemember] = useState(true);
    const [recentQueriesBackup, setRecentQueriesBackup] = useState<string[]>([]);
    const [open, setOpen] = useState(false); // toggleSearchDropdown
    const [activeTab, setActiveTab] = useState('premium');
    const [premiumWebnovelIds, setPremiumWebnovelIds] = useState<number[]>([]);
    const { getWebnovelById, restricted = false } = useWebnovels();
    const [webnovel, setWebnovel] = useState<Webnovel>();

    useEffect(() => {
        if (pathname.startsWith("/view_webnovels")) {
            const id = pathname.split("/")[2]; // /view_webnovels/1/chapter_view/1
            getWebnovelById(id).then(setWebnovel);
        }
    }, [pathname]);

    useEffect(() => {
        setActiveTab('premium');
        if (searchParams.get("version") == "free") {
            setActiveTab('free');
        } else if (pathname.startsWith("/view_webnovels")) {
            if (webnovel?.premium) {
                setActiveTab('premium');
            } else {
                setActiveTab('free');
            }
        }
    }, [pathname, searchParams, premiumWebnovelIds, webnovel])

    useEffect(() => {
        // if (pathname == "/") {
        //     router.push(pathname + "?version=premium")
        //     setPathnameLoading(false)
        // } else {
        //     setPathnameLoading(false)
        // }
        const fetchPremiumWebnovelIds = async () => {
            const response = await fetch('/api/get_premium_webnovel_ids');
            const data = await response.json();
            setPremiumWebnovelIds(data.ids);
        }
        fetchPremiumWebnovelIds();
    }, [])


    useEffect(() => {
        for (const lang of langPairList) {
            setHighlightLanguage(prev => ({ ...prev, [lang.code as Language]: false }));
        }
        setHighlightLanguage(prev => ({ ...prev, [language]: true }));
    }, [language])

    useEffect(() => {
        if (isDesktop) {
            setLogoWidth(100);
            setLogoHeight(24);
        } else {
            setLogoWidth(100);
            setLogoHeight(24);
        }
    }, [isDesktop]);

    useEffect(() => {
        const fetchRecentQueries = async () => {
            const response = await fetch(`/api/get_recent_queries?email=${email}`)
            const data = await response.json()
            if (data.queries) {
                setRecentQueries(data.queries)
            }
            if (data.last_index) {
                setLastIndex(data.last_index)
            }
        }
        if (open && email) {
            fetchRecentQueries()
        }
    }, [open, email])

    useEffect(() => {
        // if mobile menu is open, or on desktop, display menu
        if (isMobileMenuOpen || device !== 'mobile') {
            document.getElementById('menu')?.classList.remove('hidden')
        } else {
            document.getElementById('menu')?.classList.add('hidden')
        }
    });

    useEffect(() => {
        // Add event listener to detect clicks outside the menu
        document.addEventListener('mousedown', handleClickOutside);

        // Clean up the event listener when the component unmounts
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            if (hamburgerRef.current && !hamburgerRef.current.contains(event.target as Node)
                && (searchRef.current && !searchRef.current.contains(event.target as Node))) {
                setIsMobileMenuOpen(false);
                openBelowHeader();
            }
        }
        if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserDropdownOpen(false);
            }
        }
        if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
            if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
                setIsLanguageDropdownOpen(false);
            }
        }
    }

    const handleLanguageChange = (event: React.MouseEvent<HTMLElement>, language: Language) => {
        event.preventDefault();
        setLanguageOverride(language);
        setIsLanguageDropdownOpen(false);
        if (device === 'mobile') {
            handleMobileMenuClick();
        }
    }

    const handleUserItemClick = () => {
        setIsUserDropdownOpen(false);
        if (device === 'mobile') {
            handleMobileMenuClick();
        }
    }

    const handleVideosClick = () => {
        router.push('/videos')
        if (device === 'mobile') {
            handleMobileMenuClick();
        }
    }

    const toggleBelowHeader = () => {
        const belowHeader = document.getElementById('below-header');
        const aboveHeader = document.getElementById('above-header');
        if (belowHeaderToggle) {
            belowHeader?.classList.add('hidden')
            aboveHeader?.classList.add('pb-4')
        }
        // else {
        //     belowHeader?.classList.remove('hidden')
        //     aboveHeader?.classList.remove('pb-4')
        // }
        setBelowHeaderToggle(!belowHeaderToggle);
    }

    const openBelowHeader = () => {
        const belowHeader = document.getElementById('below-header');
        const aboveHeader = document.getElementById('above-header');
        belowHeader?.classList.remove('hidden')
        setBelowHeaderToggle(true);
    }

    const handleMobileMenuClick = () => {
        const freePremium = document.getElementById("free-premium")
        let openOrClosed = isMobileMenuOpen
        openOrClosed = !openOrClosed
        if (openOrClosed) {
            freePremium?.classList.add("hidden")
        } else {
            freePremium?.classList.remove("hidden")
        }
        toggleBelowHeader();
        setIsMobileMenuOpen(openOrClosed);
    }

    // const handleMobileMenuSigninClick = () => {
    //     if (isMobileMenuOpen) {
    //         handleMobileMenuClick();
    //     }
    //     router.push('/signin');
    // }

    const toggleLanguageDropdown = () => {
        setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
        setIsUserDropdownOpen(false);
    }

    useEffect(() => {
        if (!searchRemember) {
            setRecentQueriesBackup(recentQueries)
            setRecentQueries([])
        } else {
            setRecentQueries(recentQueriesBackup)
        }
    }, [searchRemember])


    const hideHeaderInPages = () => {
        if (pathname.startsWith('/mockup')) {
            return "hidden"
        }
        if (pathname.startsWith('/search')) {
            return "hidden"
        }
        if (/^\/view_webnovels\/\d+\/chapter_view/.test(pathname)) { // if it starts with, like, /view_webnovels/{webnovel_id}/chapter_view
            return "hidden"
        }
        if (pathname.startsWith('/toonyz_posts/')) {
            return "hidden"
        }
        if (pathname.startsWith('/writing-class')) {
            return "hidden"
        }
        if (pathname.startsWith('/booktok')) {
            return "hidden"
        }
        return ""
    }

    const handleSitemapClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        router.push('/sitemap')
    }

    const handleProfileClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        router.push('/my_profile')
        setIsLanguageDropdownOpen(false);
        setIsMobileMenuOpen(false);
    }

    const handleLibraryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isLoggedIn) {
            event.preventDefault();
            router.push('/library')
            setIsLanguageDropdownOpen(false);
            setIsMobileMenuOpen(false);
        } else {
            router.push('/signin')
        }
    }


    return (
        <>
            <nav className={`${hideHeaderInPages()} md:pl-[72px] md:pt-2 md:pb-0 pb-3 left-0 top-0 right-0 z-[99] mx-auto max-w-screen font-pretendard bg-white text-gray-500 font-bold dark:text-white dark:bg-black `}>
                {/* py-2 pb-3 padding for the header  */}
                <div className="max-w-screen-xl mx-auto">
                    <div id='above-header' className="flex flex-row w-full flex-wrap md:flex-nowrap items-center mx-auto justify-between">

                        {/* header font and icon colour gray-500 */}
                        {/* md:pl-[72px] sidebar width is 72px */}
                        {/* px-3 for the logo's padding on the mobile screen */}
                        {/* logo, webnovels, community,  */}
                        <div className='flex flex-row items-center'>
                            <Link href="/"
                                className="md:hidden flex items-center gap-3 rtl:space-x-reverse md:p-0 pl-1">
                                <Image
                                    src={theme === 'dark' ? '/toonyz_logo_white.svg' : '/toonyz_logo_pink.svg'}
                                    alt="Toonyz Logo"
                                    width={logoWidth}
                                    height={logoHeight}
                                    className="md:hidden"
                                />
                            </Link>
                            {/* <div className="flex flex-row gap-4 items-center justify-center font-pretendard md:text-md text-sm">
                                <Link href="/?version=premium" prefetch={false} >
                                    <p className={`${activeTab === 'premium' ? 'text-[#DB2777] font-bold' : ''} hidden md:block webnovel mt-1 text-lg md:text-xl  dark:hover:text-[#DB2777]  hover:text-[#DB2777]`}>
                                        {phrase(dictionary, "webnovels", language)}</p>
                                </Link>
                                <Link href="/?version=free" prefetch={false} >
                                    <p className={`${activeTab === 'free' ? 'text-[#DB2777] font-bold' : ''} hidden md:block free mt-1 text-lg md:text-xl dark:hover:text-[#DB2777]  hover:text-[#DB2777]`}>
                                        {phrase(dictionary, "free", language)}</p>  
                                </Link>
                            </div> */}
                        </div>
                        <div className="flex gap-x-2 md:mt-2 md:order-1 md:w-full">
                            {/* Search bar in desktop screen */}
                            <div className="relative hidden md:inline-flex w-full ">
                                <SearchComponent mode="header" recentQueriesFetched={recentQueries} lastIndexFetched={lastIndex} />
                            </div>

                            <div ref={hamburgerRef}>
                                {!isLoggedIn ? (
                                    <li className='md:hidden inline-flex absolute top-2 right-14'>
                                        <Link href='/signin' className='!no-underline capitalize rounded-lg ' >
                                            <span className='text-gray-500 dark:text-white hover:text-[#DB2777] dark:hover:text-[#DB2777]'>
                                                {phrase(dictionary, "login", language)}
                                            </span>
                                        </Link>
                                    </li>
                                ) : (
                                    <li className='md:hidden inline-flex items-center justify-center mr-2'>
                                        <Link href='/stars' className='!no-underline capitalize rounded-lg' >
                                            <Gift size={20} className='text-gray-500 dark:text-white hover:text-[#DB2777] dark:hover:text-[#DB2777]' />
                                        </Link>
                                    </li>
                                )}
                                <button
                                    id="mobile-hamburger"
                                    onClick={() => handleMobileMenuClick()}
                                    type="button"
                                    className="inline-flex items-center w-10 h-10 
                                               justify-center text-sm 
                                               rounded-xl text-black md:hidden
                                               focus:outline-none dark:text-black "
                                    aria-controls="navbar-dropdown"
                                    aria-expanded="false">
                                    <Menu size={20} className='dark:text-white text-gray-500' />
                                </button>
                            </div>
                        </div>
                        <div id="menu" ref={menuRef} className="hidden items-center justify-between w-full md:flex md:w-auto md:order-2 ">
                            <div className="relative md:hidden">
                                {/* Search bar in mobile screen (md:hidden) */}
                                <SearchComponent mode="mobileHeader" setIsMobileMenuOpen={setIsMobileMenuOpen} />
                            </div>
                            <ul className="flex justify-center items-center md:gap-4">
                                {/* Mui dark theme color code : divider [#2F2F2F] */}
                                {/* gap-4 for desktop header icons */}
                                <li className='relative hidden md:inline-flex'>
                                    <ContentRatingSwitch language={language} defaultRestrictedChecked={restricted} />
                                </li>
                                <li className='relative hidden md:inline-flex'>
                                {/* Language globe icon menu button - Desktop */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Globe size={20} className='dark:text-white text-gray-500 cursor-pointer' />
                                        </PopoverTrigger>
                                        <PopoverContent className='md:w-30 w-full border-none bg-white dark:bg-[#211F21] shadow-none list-none'>
                                            {langPairList.map((langPair, index) => (
                                                <li
                                                    id={`li-${langPair.code}`}
                                                    key={index}
                                                    className='cursor-pointer flex justify-center items-center'
                                                >
                                                    <Link
                                                        href="#"
                                                        onClick={(event) => handleLanguageChange(event, langPair.code as Language)}
                                                        className={`
                                                           md:hover:bg-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 px-4 py-2
                                                            ${highlightLanguage[langPair.code as Language] ? '!text-[#DB2777] dark:!text-[#DB2777]' : 'dark:text-white dark:hover:text-black'}`}
                                                    >
                                                        {langPair.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </PopoverContent>
                                    </Popover>
                                </li>
                                <li className="relative hidden md:inline-flex">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <CircleHelp size={20} className='text-gray-500 dark:text-white cursor-pointer' />
                                        </PopoverTrigger>
                                        <PopoverContent className='md:w-[350px] w-full border-none bg-transparent shadow-none'>
                                            <HelpGuidComponent />
                                        </PopoverContent>
                                    </Popover>
                                </li>
                                {!isLoggedIn ? (
                                    <li className="relative hidden md:inline-flex">
                                        <Link href="/signin" className='inline-flex justify-center items-center text-gray-500 dark:text-white'>
                                            <span className='text-sm !break-keep'>{phrase(dictionary, "login", language)}</span>
                                        </Link>
                                    </li>
                                ) : (
                                    <li className="relative hidden md:inline-flex">
                                        <UserProfileButton mode='header' className='text-gray-500 dark:text-white' />
                                    </li>
                                )}
                                <li className="relative hidden md:inline-flex">
                                    {/* Site map icon */}
                                    <button onClick={handleSitemapClick} className='inline-flex justify-center items-center text-gray-500 dark:text-white'>
                                        <Grip size={20} className='dark:text-white text-gray-500' />
                                    </button>
                                </li>
                                <li className="relative md:hidden">
                                    {/* User menu button currently showing in mobile screen */}
                                    <div>
                                        <button
                                            id="dropdownNavbarUserLink"
                                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => handleProfileClick(event)}
                                            className="md:hidden md:px-0 md:py-0 px-4 py-4 md:p-0 mw-auto w-full
                                                       flex flex-col items-center justify-center gap-0
                                                       text-gray-500">

                                            <div className='p-1 border border-gray-300 rounded-full flex justify-center items-center
                                                         hover:bg-gray-100 text-gray-500 min-w-10 min-h-10 
                                                           dark:hover:bg-gray-600 transition-all duration-150 ease-in-out'>
                                                <User size={20} className='dark:text-white text-gray-500' />
                                            </div>
                                            <p className='md:hidden text-xs text-center'>
                                                {phrase(dictionary, "profile", language)}
                                            </p>
                                        </button>
                                    </div>
                                </li>
                                <li className='relative md:hidden'>
                                    <div>
                                        <button
                                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => handleLibraryClick(event)}
                                            className="md:hidden md:px-0 md:py-0 px-4 py-4 md:p-0 mw-auto w-full
                                                       flex flex-col items-center justify-center gap-0
                                                       text-gray-500
                                            ">
                                            <div className='p-1 border border-gray-300 rounded-full flex justify-center items-center
                                                          hover:bg-gray-100 text-gray-500 min-w-10 min-h-10 
                                                           dark:hover:bg-gray-600 transition-all duration-150 ease-in-out'>
                                                <Book size={20} className='dark:text-white text-gray-500' />
                                            </div>
                                            <p className='md:hidden text-xs text-center'>
                                                {phrase(dictionary, "library", language)}
                                            </p>
                                        </button>
                                    </div>
                                </li>
                                <li className="relative md:hidden">
                                    <div ref={languageMenuRef}>
                                        <button
                                            id="dropdownNavbarLanguageLink"
                                            onClick={toggleLanguageDropdown}
                                            className="md:hidden md:px-0 md:py-0 px-4 py-4 md:p-0 mw-auto w-full
                                                       flex flex-col items-center justify-center gap-0
                                                       text-gray-500
                                            ">
                                            <div className='p-1 border border-gray-300 rounded-full flex justify-center items-center
                                                          hover:bg-gray-100 text-gray-500 min-w-10 min-h-10 
                                                           dark:hover:bg-gray-600 transition-all duration-150 ease-in-out'>
                                                <Globe size={20} className='dark:text-white text-gray-500' />
                                            </div>
                                            <p className='md:hidden text-xs text-center'>
                                                {phrase(dictionary, "language", language)}
                                            </p>
                                        </button>
                                    </div>
                                    <div
                                        id="language-dropdown"
                                        ref={languageDropdownRef}
                                        className={`${styles.item} absolute rounded-md md:border-0 border border-gray-300
                                                     dark:border-[#2F2F2F] mt-2 font-normal bg-white dark:bg-black
                                                      dark:text-white divide-y divide-gray-100 shadow w-full min-w-28
                                                      dark:divide-gray-600 transform transition-all duration-300 ease-in-out origin-top z-[99]
                                                       ${isLanguageDropdownOpen
                                                ? 'opacity-100 translate-y-0 scale-100'
                                                : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}
                                    >
                                        <ul className="py-2 text-xs text-gray-700 dark:text-white" aria-labelledby="dropdownLargeButton">
                                            {langPairList.map((langPair, index) => (
                                                <li
                                                    id={`li-${langPair.code}`}
                                                    key={index}
                                                    className={`${highlightLanguage[langPair.code as Language] ? 'text-[#DB2777]' : ''}`}
                                                >
                                                    <Link
                                                        href="#"
                                                        onClick={(event) => handleLanguageChange(event, langPair.code as Language)}
                                                        className="block px-4 py-2 md:hover:bg-gray-100 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600 dark:hover:text-black"
                                                    >
                                                        {langPair.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </li>
                                <li className='relative md:hidden'>
                                    <div>
                                        <button
                                            onClick={() => toggleTheme(theme == 'dark' ? 'light' : 'dark')}
                                            className="md:hidden md:px-0 md:py-0 px-4 py-4 md:p-0 mw-auto w-full
                                                       flex flex-col items-center justify-center gap-0
                                                       text-gray-500
                                            ">
                                            <div className='p-1 border border-gray-300 rounded-full flex justify-center items-center
                                                          hover:bg-gray-100 text-gray-500 min-w-10 min-h-10 
                                                           dark:hover:bg-gray-600 transition-all duration-150 ease-in-out'>
                                                {theme === 'dark' ? <Sun size={20} className='dark:text-white text-gray-500' /> : <MoonStar size={20} className='dark:text-white text-gray-500' />}
                                            </div>
                                            <p className='md:hidden text-xs text-center'>
                                                {phrase(dictionary, "mode", language)}
                                            </p>
                                        </button>
                                    </div>
                                </li>
                                <li className='relative md:hidden'>
                                    <div>
                                        <Link
                                            href="/faq"
                                            className="md:hidden md:px-0 md:py-0 px-4 py-4 md:p-0 mw-auto w-full
                                                       flex flex-col items-center justify-center gap-0
                                                       text-gray-500
                                            ">
                                            <div className='p-1 border border-gray-300 rounded-full flex justify-center items-center
                                                          hover:bg-gray-100 text-gray-500 min-w-10 min-h-10 
                                                           dark:hover:bg-gray-600 transition-all duration-150 ease-in-out'>
                                                <CircleHelp size={20} className='dark:text-white text-gray-500' />
                                            </div>
                                            <p className='md:hidden text-xs text-center'>
                                                {phrase(dictionary, "help", language)}
                                            </p>
                                        </Link>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    {/* mobile webnovels, webtoons, tooyzcut bottom menu */}
                    {/* <div id="below-header" className="md:max-w-screen-lg mx-auto flex flex-row md:hidden w-full justify-start space-x-4 px-3">
                        <Link href="/?version=premium" prefetch={false} >
                            <p className={`${activeTab === 'premium' ? 'text-[#DB2777] font-bold pb-1 border-b-2 border-[#DB2777]' : ''} webnovel mt-1 text-md  dark:hover:text-[#DB2777]   hover:text-[#DB2777] `}>   
                                {phrase(dictionary, "webnovels", language)}</p>
                        </Link>
                        <Link href="/?version=free" prefetch={false} >
                            <p className={`${activeTab === 'free' ? 'text-[#DB2777] font-bold pb-1 border-b-2 border-[#DB2777]' : ''} free mt-1 text-md dark:hover:text-[#DB2777]  hover:text-[#DB2777]`}>
                                {phrase(dictionary, "free", language)}</p>
                        </Link>
                    </div> */}
                </div>
                <hr className='md:hidden block border-gray-300 dark:border-[#2F2F2F]' />
            </nav>
        </>
    )
};

export default Header;
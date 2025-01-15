"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/components/Types';
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
import ChargeStarsTemporary from '@/components/ChargeStarsTemporary';
import { getUrlWithParams } from '@/utils/stringUtils';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { SquarePen, 
        Video, 
        Sparkles, 
        Book, 
        SquareLibrary, 
        Search, 
        Globe, 
        Menu, 
        User, 
        HeartHandshake, 
        Clapperboard,
        Bell,
        HandHeart } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/providers'
import { Box, Button, Drawer } from '@mui/material';
import SearchComponent from '@/components/SearchComponent';
import { useSearch } from '@/contexts/SearchContext';
import HeaderTabs from '@/components/UI/HeaderTabs';

export const Header = () => {
    const router = useRouter();
    const [pathnameLoading, setPathnameLoading] = useState(true);
    const { isLoggedIn, loading, logout } = useAuth();
    const { email, nickname } = useUser();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [belowHeaderToggle, setBelowHeaderToggle] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    const { dictionary, language, setLanguage } = useLanguage();
    const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });
    const [logoWidth, setLogoWidth] = useState(100);
    const [logoHeight, setLogoHeight] = useState(24);
    const [highlightLanguage, setHighlightLanguage] = useState<Record<Language, boolean>>(
        Object.fromEntries(langPairList.map(lang => [lang.code, false])) as Record<Language, boolean>
    );
    const { theme } = useTheme()
    const { recentQueries, setRecentQueries, lastIndex, setLastIndex } = useSearch();
    const [searchRemember, setSearchRemember] = useState(true);
    const [recentQueriesBackup, setRecentQueriesBackup] = useState<string[]>([]);
    const [open, setOpen] = useState(false); // toggleSearchDropdown
    const [tabValue, setTabValue] = useState('1');

    const isLoggedInAndRegistered = isLoggedIn && email;

    useEffect(() => {
        if (pathname == "/") {
            router.push(pathname + "?version=premium")
            setPathnameLoading(false)
        } else {
            setPathnameLoading(false)
        }
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

    // // special handling for new_user page
    // const inNewUser = () => {
    //     return pathname == '/new_user'
    // }

    const handleSignOut = async (event: React.FormEvent) => {
        event.preventDefault();
        logout(true, '/');
    };


    const handleLanguageChange = (event: React.MouseEvent<HTMLElement>, language: Language) => {
        event.preventDefault();
        setLanguage(language);
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

    const handleMobileMenuSigninClick = () => {
        if (isMobileMenuOpen) {
            handleMobileMenuClick();
        }
        router.push('/signin');
    }

    const toggleUserDropdown = () => {
        setIsUserDropdownOpen(!isUserDropdownOpen);
        setIsLanguageDropdownOpen(false);
    }
    const toggleLanguageDropdown = () => {
        setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
        setIsUserDropdownOpen(false);
    }

    const isNovelPath = (pathname: string) => {
        return pathname === '/' || pathname.startsWith('/webnovel') || pathname.startsWith('/view_webnovels')
            || pathname.startsWith('/view_profile') || pathname.startsWith('/new_webnovel') || pathname.startsWith('/new_chapter')
            || pathname.startsWith('/my_profile') || pathname.startsWith('/my_webnovels') || pathname.startsWith("/library")
            || pathname.startsWith("/chapter_view") || pathname.startsWith("/view_webnovels")
    }
    // Add this function to determine the active category
    const isActive = (path: string) => {
        if (path === '/') {
            return isNovelPath(pathname);
        }
        return pathname.startsWith(path);
    };

    const highlightFree = () => {
        return searchParams.get("version") == "free"
    }

    const highlightPremium = () => {
        return searchParams.get("version") == "premium"
    }

    const highlightRomance = () => {
        return searchParams.get("genre") == "romance"
    }

    const highlightToonyzCut = () => {
        return searchParams.get("") == "toonyzCut"
    }

    const getFreePremiumUrl = (version: string) => {
        return getUrlWithParams('version', version, pathname, searchParams);
    };


    useEffect(() => {
        if (!searchRemember) {
            setRecentQueriesBackup(recentQueries)
            setRecentQueries([])
        } else {
            setRecentQueries(recentQueriesBackup)
        }
    }, [searchRemember])


    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
        // setShowIsModal(true);
    }

    return (
        <>
            {/* Top font color gray-500 and weight bold */}
            <nav className="fixed left-0 top-0 right-0 z-50 mx-auto max-w-screen font-pretendard bg-white text-gray-500 font-bold dark:text-white dark:bg-black ">
                <div className="max-w-screen-lg mx-auto">
                    <div id='above-header' className="flex flex-row flex-wrap md:flex-nowrap items-center justify-between mx-auto md:pb-0 md:pt-1 pt-1 md:px-0 px-3">
                        {/* md:pb-3 md:pt-3 pt-2 md:px-0 px-3 */}
                        {/* px-3 for the logo's padding on the mobile screen */}
                        {/* logo, webnovels, studio */}
                        <div className='flex flex-row items-center justify-center gap-4 '>
                            <Link href="/?version=premium" className="flex items-center gap-3 rtl:space-x-reverse md:p-0 pl-1">
                            {/* logo padding on mobile screen */}
                            <Image
                                src={theme === 'dark' ? '/toonyz_logo_pink.svg' : '/toonyzLogo.png'}
                                alt="Toonyz Logo"
                                width={logoWidth}
                                height={logoHeight} />
                            </Link>
                            <div className="flex flex-row gap-4 items-center justify-center font-pretendard md:text-md text-sm">
                                <Link href="/?version=premium">
                                    <p className={`${isActive('/') ? 'text-[#DB2777] font-bold' : ''} hidden md:block webnovel mt-1 text-lg md:text-xl  dark:hover:text-[#DB2777]  hover:text-[#DB2777]`}>
                                        {phrase(dictionary, "webnovels", language)}</p>
                                </Link>
                                <Link href="/webtoons">
                                    <p className={`${isActive('/webtoons') ? 'text-[#DB2777] font-bold' : ''} hidden md:block webnovel mt-1 text-lg md:text-xl  dark:hover:text-[#DB2777] hover:text-[#DB2777]`}>
                                        {phrase(dictionary, "webtoons", language)}
                                    </p>
                                </Link>
                                <Link href="/studio">
                                    <p className={`${isActive('/studio') ? 'text-[#DB2777] font-bold' : ''} hidden md:block studio mt-1 text-lg md:text-xl dark:hover:text-[#DB2777]  hover:text-[#DB2777]`}>
                                        {phrase(dictionary, "studio", language)}</p>
                                </Link>
                                <Link href="/toonyzcut">
                                    <p className={`${isActive('/toonyzcut') ? 'text-[#DB2777] font-bold' : ''} hidden md:block studio mt-1 text-lg md:text-xl dark:hover:text-[#DB2777]  hover:text-[#DB2777]`}>
                                        {phrase(dictionary, "toonyzCut", language)}</p>
                                </Link>
                            </div>
                        </div>
                        <div className="flex md:order-1">
                            {/*Globe icon in mobile screen (md:hidden)*/}
                            <div ref={searchRef}>
                                <button id='mobile-search' type="button" onClick={handleMobileMenuClick} aria-controls="navbar-search" aria-expanded="false" className="md:hidden text-black dark:text-white rounded-xl hover:bg-gray-100 md:dark:hover:bg-gray-600 dark:hover:teb focus:outline-none text-sm p-2.5 me-1">
                                    <Globe size={20} className='dark:text-white text-gray-500 ' />
                                </button>
                            </div>
                            {/*hamburger menu in mobile screen (md:hidden)*/}
                            <div ref={hamburgerRef}>
                                <button id="mobile-hamburger" onClick={isLoggedIn ? () => handleMobileMenuClick() : () => handleMobileMenuSigninClick()} type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm rounded-xl text-black md:hidden hover:bg-gray-100 focus:outline-none dark:text-black dark:hover:bg-gray-600" aria-controls="navbar-dropdown" aria-expanded="false">
                                    <Menu size={20} className='dark:text-white text-gray-500' />
                                </button>
                            </div>
                        </div>
                        <div id="menu" ref={menuRef} className="hidden items-center justify-between w-full md:flex md:w-auto md:order-2">
                            {/*Search bar in mobile screen (md:hidden)*/}
                            <div className="relative mt-3 md:hidden">
                                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                   <Search size={20} className='dark:text-white text-black' />
                                </div>
                                   <SearchComponent mode="mobileHeader" setIsMobileMenuOpen={setIsMobileMenuOpen} />
                            </div>
                            {/* Search bar in desktop screen */}
                            <div className="relative hidden md:block mr-3">
                                <button
                                    onClick={toggleDrawer(true)}
                                    className="flex items-center cursor-pointer"
                                >
                                    <Search size={20} className='dark:text-white text-gray-500' />
                                </button>
                                <Drawer
                                    anchor="top"
                                    open={open}
                                    onClose={toggleDrawer(false)}
                                    transitionDuration={100}
                                    ModalProps={{
                                        keepMounted: true,
                                    }}
                                    PaperProps={{
                                        sx: {
                                            marginTop: '60px',
                                            boxShadow: 'none',
                                            backgroundColor: theme === 'dark' ? '#1A1A1A' : '#1A1A1A',
                                            // backgroundColor: 'black',
                                        }
                                    }}
                                >
                                    <Box sx={{ p: 2, }}>
                                        <SearchComponent mode="header" recentQueriesFetched={recentQueries} lastIndexFetched={lastIndex} setOpen={setOpen} />
                                    </Box>
                                </Drawer>
                            </div>
                            <ul className="flex flex-col md:flex-row font-medium mt-4 border border-gray-600 md:gap-1 rtl:space-x-reverse md:mt-0 md:border-0 ">
                                {/* gap-1 for desktop header icons */}
                                {/* Language globe icon menu button - Desktop */}
                                <li className='flex items-center justify-center'>
                                    <button type="button" className="md:inline-flex hidden items-center p-2 w-10 h-10 justify-center text-sm rounded-xl text-black hover:bg-gray-100 focus:outline-none dark:text-black dark:hover:bg-gray-600" >
                                       <Bell size={20} className='dark:text-white text-gray-500' />
                                    </button>
                                </li>
                                <li className="py-2 relative">
                                    <div ref={languageMenuRef}>
                                        <button
                                            id="dropdownNavbarLanguageLink"
                                            onClick={toggleLanguageDropdown}
                                            className="md:px-0 md:py-0 px-4 py-5 md:p-0 md:w-auto flex items-center justify-start md:justify-between w-full text-[#142448] hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-[#DB2777] dark:text-white md:dark:hover:text-[#DB2777] dark:focus:text-white dark:hover:bg-gray-600 md:dark:hover:bg-transparent">
                                            <div className='p-2 rounded-xl md:hover:bg-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-150 ease-in-out'>
                                                <Globe
                                                    size={20}
                                                    className='dark:text-white text-gray-500'
                                                />
                                            </div>
                                            <p className='ml-2 md:hidden self-center'>{phrase(dictionary, "language", language)}</p>
                                        </button>
                                    </div>
                                    <div
                                        id="language-dropdown" 
                                        ref={languageDropdownRef} 
                                        className={`${styles.item} absolute rounded-md md:border-0 border border-gray-500 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y divide-gray-100 shadow w-full md:w-44 dark:divide-gray-600
                                        transform transition-all duration-300 ease-in-out origin-top
                                        ${isLanguageDropdownOpen 
                                            ? 'opacity-100 translate-y-0 scale-100' 
                                            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}
                                    >
                                        <ul className="py-2 text-sm text-gray-700 dark:text-white" aria-labelledby="dropdownLargeButton">
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
                                {/*User menu button - Desktop*/}
                                <li className="py-2 relative">
                                    <div ref={userMenuRef}>
                                        <button 
                                            id="dropdownNavbarUserLink" 
                                            onClick={isLoggedIn ? () => toggleUserDropdown() : () => router.push('/signin')}
                                            className="md:px-0 md:py-0 px-4 py-5 md:p-0 md:w-auto flex items-center justify-start md:justify-between w-full text-[#142448] hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-[#DB2777] dark:text-white md:dark:hover:text-[#DB2777] dark:focus:text-white dark:border-gray-700 dark:hover:bg-gray-600 md:dark:hover:bg-transparent transition duration-150 ease-in-out">
                                            <div className='p-2 rounded-xl md:hover:bg-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition duration-150 ease-in-out'>
                                                <Menu size={20} className='dark:text-white text-gray-500 md:block hidden' />
                                                <User size={20} className='dark:text-white text-gray-500 md:hidden' />
                                            </div>
                                            <p className='ml-2 md:hidden self-center'>{phrase(dictionary, "profile", language)}</p>
                                        </button>
                                    </div>
                                    <div 
                                        id="user-dropdown" 
                                        ref={userDropdownRef} 
                                        className={`${styles.rightmostItem} absolute rounded-md md:border-0 border border-gray-500 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y divide-gray-100 shadow w-full md:w-44 dark:divide-gray-600
                                        transition-[opacity,transform] duration-200 ease-out
                                        ${isUserDropdownOpen 
                                            ? 'opacity-100 translate-y-0 visible' 
                                            : 'opacity-0 -translate-y-4 invisible'}`}
                                    >
                                        <ul className="py-2 text-sm text-gray-700 dark:text-white">
                                            {loading ? (
                                                <li>
                                                    <div role="status">
                                                        <svg aria-hidden="true" className="w-6 h-6 m-2 text-gray-200  animate-spin dark:text-white fill-[#DB2777]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                        </svg>
                                                        <span className="sr-only">Loading...</span>
                                                    </div>
                                                </li>
                                            ) : isLoggedIn && email ? (
                                                <>
                                                    <li>
                                                        <Link href="/my_profile" onClick={() => handleUserItemClick()} 
                                                            className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white text-black dark:hover:text-black">
                                                            <span className='font-extrabold'>{nickname}</span>
                                                            <span className='text-gray-500'>
                                                                {language == 'ko' ? '의' : '\'s'} {phrase(dictionary, "profile", language)}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                    <hr />
                                                    <li className="px-3 py-2 dark:hover:bg-gray-600">
                                                        <Link href="/my_webnovels" onClick={() => handleUserItemClick()} className="flex items-center gap-2 dark:text-white text-black dark:hover:text-black">
                                                            <Book size={18} className='dark:text-white text-black' />
                                                            {phrase(dictionary, "myWebnovels", language)}
                                                        </Link>
                                                    </li>
                                                    <li className="px-3 py-2 dark:hover:bg-gray-600">
                                                        <Link href="/my_library" onClick={() => handleUserItemClick()} className="flex items-center gap-2 dark:text-white text-black dark:hover:text-black">
                                                            <SquareLibrary size={18} className='dark:text-white text-black' />
                                                            {phrase(dictionary, "myLibrary", language)}
                                                        </Link>
                                                    </li>
                                                    <li className="px-3 py-2 flex items-center space-x-2 dark:text-white text-black dark:hover:bg-gray-600 dark:hover:text-black">
                                                        <Sparkles size={18} className='dark:text-white text-black ' />
                                                        <ChargeStarsTemporary />
                                                    </li>
                                                    <li className="px-3 py-2 dark:hover:bg-gray-600">
                                                        <Link href="/videos" onClick={handleVideosClick} className="flex items-center space-x-2 dark:text-white text-black dark:hover:text-black ">
                                                            <Video size={20} className='dark:text-white text-black' />
                                                            <span>{phrase(dictionary, "curriculum", language)}</span>
                                                        </Link>
                                                    </li>
                                                    <li className="">
                                                        <Link href="/new_webnovel" onClick={() => handleUserItemClick()} className="flex items-center justify-center px-4 py-2 dark:text-white  dark:hover:text-black">
                                                            <span className="w-full flex items-center gap-2 justify-center text-center border border-[#DB2777] hover:border-gray-400 rounded-md px-3 py-2 bg-pink-100 text-[#DB2777] hover:text-gray-400">
                                                                <SquarePen size={18} className='' />
                                                                {phrase(dictionary, "newWebnovel", language)}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                    <li className="flex items-center justify-center px-4 py-2 dark:text-white  dark:hover:text-white w-full">
                                                        <ThemeToggle />
                                                    </li>
                                                    <li>
                                                        <Link href="#" onClick={handleSignOut} className="flex items-center px-4 py-2 dark:text-white dark:hover:text-black ">
                                                            <span className="w-full text-center border border-gray-300 rounded-md px-3 py-2 hover:text-[#DB2777]">
                                                                {phrase(dictionary, "logout", language)}
                                                            </span>
                                                        </Link>
                                                    </li>
                                                </>
                                            ) : (
                                                <li>
                                                    <Link href="/signin" onClick={() => handleUserItemClick()} 
                                                        className="block px-4 py-2 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-black">
                                                        {phrase(dictionary, "login", language)}
                                                    </Link>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </li>
                                <li className='md:flex items-center justify-center ml-1 hidden'>
                                    <Button sx={{
                                        backgroundColor: '#DB2777',
                                        color: 'white',
                                        '&:hover': {
                                            color: 'white',
                                        }
                                    }} variant="text" className='capitalize rounded-lg'>
                                          {/* Publish */}
                                          {phrase(dictionary, "publish", language)}
                                    </Button>
                              </li>
                            </ul>
                        </div>
                    </div>
                    {/* mobile webnovels, webtoons, studio mobile bottom menu */}
                    <div id="below-header" className="max-w-screen-lg mx-auto flex flex-row md:hidden w-full justify-start space-x-4 px-4">  {/* pb-2 */}
                        <Link href="/?version=premium">
                            <p className={`${isActive('/') ? 'text-[#DB2777] font-bold pb-2 border-b-2 border-[#DB2777]' : ''} webnovel mt-1 text-xl  dark:hover:text-[#DB2777]   hover:text-[#DB2777] `}>   {/* has-[:clicked]:bg-indigo-50  */}
                                {phrase(dictionary, "webnovels", language)}</p>
                        </Link>
                        <Link href="/webtoons">
                            <p className={`${isActive('/webtoons') ? 'text-[#DB2777] font-bold pb-2 border-b-2 border-[#DB2777]' : ''} webnovel mt-1 text-xl  dark:hover:text-[#DB2777]  hover:text-[#DB2777]`}>
                                {phrase(dictionary, "webtoons", language)}</p>
                        </Link>
                        <Link href="/studio">
                            <p className={`${isActive('/studio') ? 'text-[#DB2777] font-bold pb-2 border-b-2 border-[#DB2777]' : ''} studio mt-1 text-xl dark:hover:text-[#DB2777]  hover:text-[#DB2777]`}>
                                {phrase(dictionary, "studio", language)}</p>
                        </Link>
                    </div>
                    {/* mobile webnovels, webtoons, studio bottom menu */}
                </div>
                <hr className='md:hidden block'/>
            </nav>
            {(pathname == '/' || pathnameLoading) && (
                <>
                    <HeaderTabs 
                    language={language} 
                    dictionary={dictionary} 
                    phrase={phrase} 
                    />
                 <hr className='md:block hidden' />
                </>
            )
            }
        </>
    )
};

export default Header;
"use client"

import React, { MouseEventHandler, useEffect, useRef, useState } from 'react';
// import { MdVideoLibrary } from "react-icons/md";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/components/Types';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { useDevice } from '@/contexts/DeviceContext';
import Link from 'next/link';
import styles from '@/styles/Header.module.css';
import phrases, { phrase } from '@/utils/phrases';
import { signOut } from "next-auth/react"
import Image from 'next/image';
import { useMediaQuery } from 'react-responsive';
import { langPairList } from '@/utils/phrases';
import ChargeStarsTemporary from '@/components/ChargeStarsTemporary';
import ViewVideos from './ViewVideos';
import { free, premium } from "@/components/WebnovelsList"
import { getUrlWithParams } from '@/utils/stringUtils';
import { SquarePen, Video, Sparkles, Book, SquareLibrary, ChevronLeft, X } from 'lucide-react';
import KeywordsComponent from '@/components/KeywordsComponent';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/contexts/providers'


const Header = () => {

    const router = useRouter();
    const { isLoggedIn, loading, logout } = useAuth();
    const { email, nickname } = useUser();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState('');
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
    const [logoWidth, setLogoWidth] = useState(141);
    const [logoHeight, setLogoHeight] = useState(32);
    const [highlightLanguage, setHighlightLanguage] = useState<Record<Language, boolean>>(
        Object.fromEntries(langPairList.map(lang => [lang.code, false])) as Record<Language, boolean>
    );
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const searchDropdownRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme()

    // let keyPressed = false
    const [recentQueries, setRecentQueries] = useState<string[]>([]);
    const [lastIndex, setLastIndex] = useState(0);
    const [keyPressed, setKeyPressed] = useState(false);
    const queriesToShow = 4;
    const [searchRemember, setSearchRemember] = useState(true);
    const [recentQueriesBackup, setRecentQueriesBackup] = useState<string[]>([]);
    const [deletingQuery, setDeletingQuery] = useState(false);

    useEffect(() => {
        if (pathname == "/") {
            router.push(pathname + "?version=free")
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
            setLogoWidth(141);
            setLogoHeight(32);
        } else {
            setLogoWidth(106);
            setLogoHeight(24);
        }
    }, [isDesktop]);

    useEffect(() => {
        const fetchRecentQueries = async () => {
            const response = await fetch(`/api/get_recent_queries?email=${email}`)
            const data = await response.json()
            setRecentQueries(data.queries)
            setLastIndex(data.last_index)
        }
        if (isSearchDropdownOpen && email) {
            fetchRecentQueries()
        }
    }, [isSearchDropdownOpen, email])

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    }

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key == 'Enter') {
            setKeyPressed(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            if (!keyPressed && query !== recentQueries[0]) {
                setKeyPressed(true)
                handleSearch(query)
            }
        }
    }

    const handleSearch = (query: string) => {
        setIsMobileMenuOpen(false);
        if (searchRemember) {
            setRecentQueries(prev => [query, ...prev])
            setLastIndex(prev => prev + 1)
        }
        router.push(`/search?query=${query}&remember=${searchRemember}`);
    }

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

    const handleLanguageChange = (language: Language) => {
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
        setIsSearchDropdownOpen(false);
    }
    const toggleLanguageDropdown = () => {
        setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
        setIsUserDropdownOpen(false);
        setIsSearchDropdownOpen(false);
    }
    const toggleSearchDropdown = () => {
        setIsSearchDropdownOpen(!isSearchDropdownOpen);
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

    const getFreePremiumUrl = (version: string) => {
        return getUrlWithParams('version', version, pathname, searchParams);
    };

    const handleDeleteRecentQuery = async (event: React.MouseEvent<SVGSVGElement>, index: number) => {
        event.stopPropagation()
        if (deletingQuery) {
            return
        }
        const queryToDelete = recentQueries[index]
        setDeletingQuery(true)

        if (isLoggedIn) {
            const response = await fetch(`/api/delete_recent_query?email=${email}&query_index=${lastIndex - (index)}`,
                {
                    method: "DELETE",
                }
            )
            if (!response.ok) {
                setLastIndex(prev => prev + 1)
                setRecentQueries(prev => [...prev, queryToDelete])
                console.error("Error deleting recent query", response)
            }
        }
        setRecentQueries(prev => prev.filter((_, i) => i !== index))
        setLastIndex(prev => prev - 1)
        setDeletingQuery(false)
    }

    const toggleSearchRemember = () => {
        setSearchRemember(prev => !prev)
    }

    useEffect(() => {
        if (!searchRemember) {
            setRecentQueriesBackup(recentQueries)
            setRecentQueries([])
        } else {
            setRecentQueries(recentQueriesBackup)
        }
    }, [searchRemember])


    return (
        <div className=''>
            <nav className="fixed left-0 top-0 right-0 z-50 mx-auto max-w-screen bg-white  dark:text-white  dark:bg-black  ">
                <div className="max-w-screen-xl mx-auto">
                    <div id='above-header' className="max-w-screen flex flex-row flex-wrap md:flex-nowrap items-center justify-between mx-auto md:pb-3 md:pt-3 pt-2 px-4">
                        {/* logo, webnovels, studio */}
                        <div className='flex flex-row items-center justify-center space-x-4'>
                            <Link href="/?version=free" className="flex items-center space-x-3 rtl:space-x-reverse">
                                <Image 
                                // src="/toonyzLogo.png" 
                                src={theme === 'dark' ? '/toonyz_logo_white.svg' : '/toonyzLogo.png'}
                                alt="Toonyz Logo" 
                                width={logoWidth} 
                                height={logoHeight} />
                            </Link>
                            <div className="flex flex-row space-x-4 items-center justify-center">
                                <Link href="/?version=free">
                                    <p className={`${isActive('/') ? 'text-pink-600 font-bold' : ''} hidden md:block webnovel mt-1 text-lg md:text-xl text-black dark:text-white dark:hover:text-pink-600  hover:text-pink-600`}>
                                    {phrase(dictionary, "webnovels", language)}</p>
                                </Link>
                                <Link href="#">
                                    <p className={`${isActive('/webtoons') ? 'text-pink-600 font-bold' : ''} hidden md:block webnovel mt-1 text-lg md:text-xl text-black dark:text-white dark:hover:text-pink-600 hover:text-pink-600`}>
                                        {phrase(dictionary, "webtoons", language)}
                                    </p>
                                </Link>
                                <Link href="/studio">
                                    <p className={`${isActive('/studio') ? 'text-pink-600 font-bold' : ''} hidden md:block studio mt-1 text-lg md:text-xl text-black dark:text-white dark:hover:text-pink-600  hover:text-pink-600`}>
                                    {phrase(dictionary, "studio", language)}</p>
                                </Link>
                            </div>
                        </div>
                        <div className="flex md:order-1">
                            {/*Search icon in mobile screen (md:hidden)*/}
                            <div ref={searchRef}>
                                <button id='mobile-search' type="button" onClick={handleMobileMenuClick} aria-controls="navbar-search" aria-expanded="false" className="md:hidden text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700  text-sm p-2.5 me-1">
                                    {/* <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                </svg>
                                <span className="sr-only">Search</span> */}
                                    <i className="fa-solid fa-globe text-black dark:text-white text-xl "></i>
                                </button>
                            </div>
                            {/*Main menu in mobile screen (md:hidden)*/}
                            <div ref={hamburgerRef}>
                                <button id="mobile-hamburger" onClick={isLoggedIn ? () => handleMobileMenuClick() : () => handleMobileMenuSigninClick()} type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-black md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-black dark:hover:bg-gray-600 dark:focus:ring-gray-600" aria-controls="navbar-dropdown" aria-expanded="false">
                                    <span className="sr-only">Open main menu</span>
                                    <svg className="w-5 h-5 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div id="menu" ref={menuRef} className="hidden items-center justify-between w-full md:flex md:w-auto md:order-2">
                            {/*Search bar in mobile screen (md:hidden)*/}
                            <div className="relative mt-3 md:hidden">
                                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                    <svg className="w-4 h-4 text-black dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                    </svg>
                                </div>
                                <input type="text" id="search-navbar" value={query} onChange={handleChange} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} className="block w-full p-2 ps-10 text-sm text-black border border-black rounded-md dark:bg-black dark:text-white focus:ring-pink-500 focus:border-pink-500 dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-pink-500 dark:focus:border-pink-500" />
                            </div>
                            {/*Search bar visible in screens larger than md (md:block)*/}
                            <div className="relative hidden md:block mr-8">
                                <button
                                    onClick={toggleSearchDropdown}
                                    className="flex items-center ps-3 cursor-pointer hover:text-pink-600"
                                >
                                    <svg
                                        className="w-4 h-4 text-black dark:text-white rounded"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            stroke="currentColor"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                                        />
                                    </svg>
                                    <span className="sr-only">Search icon</span>
                                </button>
                                {isSearchDropdownOpen && (
                                    <div
                                        id="search-dropdown"
                                        ref={searchDropdownRef}
                                        className="z-50 rounded-md absolute right-0 top-full mt-2 font-normal bg-white dark:bg-black dark:text-white divide-y divide-gray-100 shadow w-full md:w-96 dark:divide-gray-600"
                                    >
                                        <div className="flex justify-between px-3 py-3">
                                            <button className='text-black dark:text-white hover:text-pink-600  dark:hover:text-pink-600 justify-start mr-4' onClick={() => setIsSearchDropdownOpen(false)}>
                                                < ChevronLeft />
                                            </button>

                                            {/* Wrap input and icon in a relative container */}
                                            <div className="relative flex-1">
                                                {/* Search Icon */}
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    <svg
                                                        className="w-4 h-4 text-black dark:text-black"
                                                        aria-hidden="true"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            stroke="currentColor"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth="2"
                                                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                                                        />
                                                    </svg>
                                                </div>

                                                {/* Input Field */}
                                                <input
                                                    type="text"
                                                    id="search-navbar"
                                                    value={query}
                                                    onChange={handleChange}
                                                    onKeyDown={handleKeyDown}
                                                    onKeyUp={handleKeyUp}
                                                    placeholder={phrase(dictionary, "searchPlaceholder", language)}
                                                    className="block w-full p-2 pl-10 text-sm text-black border border-black rounded-md focus:ring-pink-500 focus:border-pink-500 dark:border-gray-600 dark:placeholder-gray-400 dark:text-black dark:focus:ring-pink-500 dark:focus:border-pink-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col px-3 py-3">
                                            <div>
                                                <p className='text-gray-500 text-md flex justify-between'>
                                                    {/* 최근 검색어   */}
                                                    {phrase(dictionary, "recentSearch", language)}
                                                    <a href="#"><span className='text-gray-300 text-[10px] text-right' onClick={() => toggleSearchRemember()}>
                                                        {/* search history off  */}
                                                        {searchRemember ? phrase(dictionary, "searchTurnOff", language) : phrase(dictionary, "searchTurnOn", language)}
                                                    </span></a>
                                                </p>
                                                {/* recent search list */}
                                                <div className='h-[100px]'>
                                                    {recentQueries.length > 0 ?
                                                        recentQueries.slice(0, queriesToShow).map((query: string, index: number) => (
                                                            <div key={index} onClick={() => handleSearch(query)} className='flex flex-row items-center justify-between hover:bg-gray-100'>
                                                                <p className='text-gray-400 text-[15px] text-left'>
                                                                    {query}
                                                                </p>
                                                                <p className='text-gray-400 hover:bg-gray-200 text-[15px] text-right'>
                                                                    <X onClick={(event) => handleDeleteRecentQuery(event, index)} />
                                                                </p>
                                                            </div>
                                                        )) :
                                                        <p className='text-gray-500 text-sm flex justify-center items-center h-full text-center'>
                                                            {/* 최근 검색어가 없습니다. */}
                                                            {phrase(dictionary, "noRecentSearch", language)}
                                                        </p>
                                                    }
                                                </div>

                                            </div>
                                            <div>
                                                <p className='text-gray-500 text-md'>
                                                    {/* 인기 검색어 */}
                                                    {phrase(dictionary, "popularSearch", language)}
                                                </p>
                                                {/* popular search list */}
                                            </div>
                                            <div className='h-[100px]'>
                                                <p className='text-gray-500 text-sm flex justify-center items-center h-full text-center'>
                                                    {/* 인기 검색어가 없습니다. */}
                                                    {phrase(dictionary, "noPopularSearch", language)}
                                                </p>

                                            </div>
                                            <div>
                                                <p className='text-gray-500 text-md'>
                                                    {/* keywords, genre : 키워드 별로 보기  */}
                                                    {phrase(dictionary, "genresAndKeyword", language)}
                                                </p>
                                                {/* popular search list */}
                                                <p className='text-gray-500 text-sm mt-5 mb-3 text-center'>
                                                    <KeywordsComponent />
                                                </p>

                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                            <ul className="flex flex-col md:flex-row font-medium p-4 md:p-0 mt-4 border border-gray-600 md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 ">
                                {/* News menu
                            <li>
                                <Link href="/news" className="justify-start flex block px-4 py-5 md:py-1 text-[#142448]  hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-pink-600 md:w-auto dark:text-black md:dark:hover:text-pink-600 dark:focus:text-black dark:border-gray-700 dark:hover:bg-gray-600 md:dark:hover:bg-transparent">
                                    <i className="fas fa-newspaper mt-1"></i><p className='ml-2 md:hidden'>{phrase(dictionary, "news", language)}</p></Link>
                            </li> */}
                                {/*Language menu*/}
                                <li className="py-2 relative">
                                    <div ref={languageMenuRef}>
                                        <button id="dropdownNavbarLanguageLink" onClick={toggleLanguageDropdown} className="block px-4 py-5 flex items-center justify-start md:justify-between w-full text-[#142448]  hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-pink-600 md:p-0 md:w-auto dark:text-white md:dark:hover:text-pink-600 dark:focus:text-white  dark:hover:bg-gray-600 md:dark:hover:bg-transparent">
                                            <i className="fa-solid fa-globe text-black dark:text-white"></i><p className='ml-2 md:hidden'>{phrase(dictionary, "language", language)}</p>
                                            <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                            </svg>
                                        </button>
                                    </div>
                                    {isLanguageDropdownOpen && (
                                        <div id="language-dropdown" ref={languageDropdownRef} className={`${styles.item} rounded-md md:border-0 border border-gray-400 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y divide-gray-100 shadow w-full md:w-44 dark:divide-gray-600`}>
                                            <ul className="py-2 text-sm  text-gray-700 dark:text-white" aria-labelledby="dropdownLargeButton">
                                                {langPairList.map((langPair, index) => (
                                                    <li id={`li-${langPair.code}`} key={index} className={`${highlightLanguage[langPair.code as Language] ? 'text-pink-500' : ''}`}>
                                                        <Link href="#" onClick={() => handleLanguageChange(langPair.code as Language)} className="block px-4 py-2 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600 dark:hover:text-black">
                                                            {langPair.name}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </li>
                                {/*User menu*/}
                                <li className="py-2 relative">
                                    <div ref={userMenuRef}>
                                        <button id="dropdownNavbarUserLink" onClick={isLoggedIn ? () => toggleUserDropdown() : () => router.push('/signin')} className="block px-4 py-5 flex items-center justify-start md:justify-between w-full text-[#142448] hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-pink-600 md:p-0 md:w-auto dark:text-white md:dark:hover:text-pink-600 dark:focus:text-white dark:border-gray-700 dark:hover:bg-gray-600 md:dark:hover:bg-transparent">
                                            <i className="fa-solid fa-user text-black dark:text-white"></i><p className='ml-2 md:hidden'>{phrase(dictionary, "profile", language)}</p>
                                            <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                                            </svg></button>
                                    </div>
                                    {isUserDropdownOpen && (
                                        <div id="user-dropdown" ref={userDropdownRef} className={`${styles.rightmostItem} rounded-md md:border-0 border border-gray-400 mt-2 z-10 font-normal bg-white dark:bg-black dark:text-white divide-y divide-gray-100 shadow w-full md:w-52 dark:divide-gray-600`}>
                                            <ul className="py-2 text-sm   text-gray-700 dark:text-black" aria-labelledby="dropdownLargeButton">
                                                {loading ? (
                                                    <li>
                                                        <div role="status">
                                                            <svg aria-hidden="true" className="w-6 h-6 m-2 text-gray-200  animate-spin dark:text-white fill-pink-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                                                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                                            </svg>
                                                            <span className="sr-only">Loading...</span>
                                                        </div>
                                                    </li>
                                                )
                                                    :
                                                    isLoggedIn ? (
                                                        <>
                                                            <li>
                                                                <Link href="/my_profile" onClick={() => handleUserItemClick()} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white text-black dark:hover:text-black">
                                                               {/* Welcome greeting */}
                                                               {/* <span> {phrase(dictionary, "welcome", language)} </span>  */}
                                                                    <span className='font-extrabold'>{nickname}</span> 
                                                                    <span className='text-gray-500 '>{' '}
                                                                    { language == 'ko' ? '의' : '\'s' }{' '}
                                                                    {phrase(dictionary, "profile", language)} 
                                                                    </span>

                                                                </Link>
                                                            </li>
                                                            <hr/>
                                                           
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
                                                                    <Video size={20}  className='dark:text-white text-black'  />
                                                                    <span>{phrase(dictionary, "curriculum", language)}</span>
                                                                </Link>
                                                            </li>

                                                            <li className="">
                                                                <Link href="/new_webnovel" onClick={() => handleUserItemClick()} className="flex items-center justify-center px-4 py-2 dark:text-white  dark:hover:text-black">
                                                                    <span className="w-full flex items-center gap-2 justify-center text-center border border-pink-600 hover:border-gray-400 rounded-md px-3 py-2 bg-pink-100 text-pink-600 hover:text-gray-400"> 
                                                                        <SquarePen size={18} className=''/>
                                                                        {phrase(dictionary, "newWebnovel", language)}
                                                                    </span>
                                                                </Link>
                                                            </li>
                                                            <li className="flex items-center justify-center px-4 py-2 dark:text-white  dark:hover:text-white w-full">
                                                       
                                                                <ThemeToggle />
                                                             
                                                            </li>
                                                            <li>
                                                                <Link href="#" onClick={handleSignOut} className="flex items-center px-4 py-2 dark:text-white dark:hover:text-black ">
                                                                   <span className="w-full text-center border border-gray-300 rounded-md px-3 py-2 hover:text-pink-600"> 
                                                                        {phrase(dictionary, "logout", language)}
                                                                    </span>
                                                                </Link>
                                                            </li>
                                                        </>
                                                    )
                                                        : (
                                                            <li>
                                                                <Link href="/signin" onClick={() => handleUserItemClick()} className="block px-4 py-2 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-black">{phrase(dictionary, "login", language)}</Link>
                                                            </li>
                                                        )}
                                            </ul>
                                        </div>
                                    )}
                                </li>

                            </ul>
                        </div>
                    </div>
                    {/* mobile webnovels, webtoons, studio mobile bottom menu */}
                    <div id="below-header" className="max-w-screen-xl mx-auto flex flex-row block md:hidden w-full justify-start space-x-4 px-4">  {/* pb-2 */}
                        <Link href="/?version=free">
                            <p className={`${isActive('/') ? 'text-pink-600 font-bold pb-2 border-b-2 border-pink-600' : ''} webnovel mt-1 text-xl text-black dark:text-white dark:hover:text-pink-600   hover:text-pink-600 `}>   {/* has-[:clicked]:bg-indigo-50  */}
                          
                            {phrase(dictionary, "webnovels", language)}</p>
                        </Link>
                        <Link href="/">
                            <p className={`${isActive('/webtoons') ? 'text-pink-600 font-bold pb-2 border-b-2 border-pink-600' : ''} webnovel mt-1 text-xl text-black dark:text-white dark:hover:text-pink-600  hover:text-pink-600`}>
                            {phrase(dictionary, "webtoons", language)}</p>
                        </Link>
                        <Link href="/studio">
                            <p className={`${isActive('/studio') ? 'text-pink-600 font-bold pb-2 border-b-2 border-pink-600' : ''} studio mt-1 text-xl text-black dark:text-white dark:hover:text-pink-600  hover:text-pink-600`}>
                            {phrase(dictionary, "studio", language)}</p>
                        </Link>
                    </div>
                    {/* mobile webnovels, webtoons, studio bottom menu */}
                </div>
                <hr />
            </nav>
            {pathname == '/' && (
                <>
                    <div id="free-premium" className="max-w-screen-xl mx-auto md:mt-[4rem] mt-[5.6rem] z-[99]">
                        <div className="flex flex-row space-x-4 items-center justify-start ml-4 md:p-0 p-1">  {/* md:pt-2 md:pb-2 p-1 px-4 m-1 md:ml-[158px] */}
                            <p className={`text-gray-500 text-md font-bold  ${highlightFree() ? "text-pink-600 md:p-1 md:border-b-2 md:border-pink-600 border-0" : ""}`}>
                                <Link href={getFreePremiumUrl("free")}>{phrase(dictionary, "free", language)}</Link></p>
                            <p className={`text-gray-500 text-md font-bold ${highlightPremium() ? "text-pink-600 md:p-1 md:border-b-2 md:border-pink-600 border-0" : ""}`}>
                                <Link href={getFreePremiumUrl("premium")}>{phrase(dictionary, "premium", language)}</Link></p>
                        </div>
                    </div>
                    <hr />
                </>
            )
            }
        </div>
    )
};
export default Header;
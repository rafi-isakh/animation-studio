"use client"
import { Webnovel } from "@/components/Types";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { X, Search, MoveLeft } from "lucide-react";
import { useSearch } from "@/contexts/SearchContext";
import Link from "next/link";
import { Drawer, Box } from "@mui/material";
import { useTheme } from '@/contexts/providers'
// import SearchComponentWebnovelsList from "@/components/SearchComponentWebnovelsList";
import CircularProgress from '@mui/material/CircularProgress';
import { useWebnovels } from "@/contexts/WebnovelsContext";
import SearchPageWebnovelsList from "@/components/UI/SearchPageWebnovelsList";

function GradientCircularProgress() {
    return (
        <>
            <svg width={0} height={0}>
                <defs>
                    <linearGradient id="my_gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e01cd5" />
                        <stop offset="100%" stopColor="#1CB5E0" />
                    </linearGradient>
                </defs>
            </svg>
            <CircularProgress sx={{ 'svg circle': { stroke: 'url(#my_gradient)' } }} />
        </>
    );
}

export default function SearchComponent({
    mode,
    recentQueriesFetched,
    lastIndexFetched,
    setIsMobileMenuOpen,
}: {
    mode: "mobileHeader" | "header" | "page",
    recentQueriesFetched?: string[],
    lastIndexFetched?: number,
    setIsMobileMenuOpen?: (isOpen: boolean) => void,
}) {
    const { query, setQuery, recentQueries, setRecentQueries, lastIndex, setLastIndex } = useSearch();
    const [searchRemember, setSearchRemember] = useState(true);
    const [triggerSearch, setTriggerSearch] = useState(false);
    const router = useRouter();
    const { dictionary, language } = useLanguage();
    const { email } = useUser();
    const { isLoggedIn } = useAuth();
    const [deletingQuery, setDeletingQuery] = useState(false);
    const queriesToShow = 6;
    const { theme } = useTheme();
    const inputRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false);
    const searchParams = useSearchParams();
    const searchParamsObject = Object.fromEntries(searchParams.entries());
    const { webnovels } = useWebnovels();

    useEffect(() => {
        if (triggerSearch) {
            handleSearch()
            setTriggerSearch(false)
        }
    }, [query, triggerSearch])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    }

    const handleSearch = (event?: React.FormEvent<HTMLFormElement>) => {
        event?.preventDefault();
        if (setIsMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
        if (setOpen) {
            setOpen(false);
        }
        if (searchRemember) {
            setRecentQueries(prev => [query, ...prev])
            setLastIndex(prev => prev + 1)
        }
        router.push(`/search?query=${query}&remember=${searchRemember}`);
    }
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

    const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
        if (event.type === 'keydown' && ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')) {
            return;
        }
        setOpen(open);
    };

    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        }
    }, [open])

    const renderSearchInput = () => (
        <div className="relative max-w-screen-xl flex-1 h-12 mx-auto">
            <Search
                size={20}
                className="dark:text-white text-black absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-50"
            />
            <input
                ref={inputRef}
                type="text"
                id="search-navbar"
                value={query}
                autoFocus
                onChange={handleChange}
                placeholder={query ? query : phrase(dictionary, "searchPlaceholder", language)}
                className="w-full h-full p-2 pl-10 text-sm border-0 
                        text-black bg-gray-200 dark:bg-[#211F21] dark:text-white
                        focus:ring-0 rounded-xl
                        focus:border-[#DB2777]
                        focus:outline-2 focus:outline-offset-2
                        focus:outline-[#DB2777]
                    "
            />
            <div className="absolute top-3 right-3 flex items-center justify-center pointer-cursor">
                <Link href="#"
                    onClick={() => {
                        setQuery('')
                        if (setOpen) {
                            setOpen(false)
                        }
                    }}>
                    <X size={25} className='dark:text-white text-white bg-[#211F21] dark:bg-black rounded-full p-1 font-extrabold' />
                </Link>
            </div>
        </div>
    )

    return (
        <div className="relative w-full overflow-hidden">
            <form onSubmit={handleSearch}>
                {
                    mode === "mobileHeader" &&
                    <div className="relative m-3 mt-5 h-12">
                        <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                            <Search size={20} className='dark:text-white text-gray-500 z-50' />
                        </div>
                        <input
                            type="text"
                            id="search-navbar"
                            value={query}
                            onChange={handleChange}
                            placeholder={query ? query : phrase(dictionary, "searchPlaceholder", language)}
                            className="w-full h-full p-2 pl-10 text-sm border-0 
                                text-black bg-gray-200 dark:bg-[#211F21] dark:text-white
                                focus:ring-0 rounded-lg
                                focus:border-[#DB2777]
                                focus:outline-2 focus:outline-offset-2
                                focus:outline-[#DB2777]
                            "
                        />
                    </div>
                }
                {
                    mode === "header" &&
                    <>
                        <div className='relative flex flex-col items-center justify-center w-full mx-auto'>
                            <div className="w-full mx-auto h-12">
                                <div className="flex flex-row items-center justify-center p-1">
                                    <div className="absolute top-3 left-4 flex items-center justify-center pointer-events-none">
                                        <Search size={20} className='dark:text-white text-black' />
                                    </div>
                                    <input
                                        onClick={(e) => {
                                            toggleDrawer(true)(e);
                                            inputRef.current?.focus();
                                        }}
                                        type="text"
                                        id="search-navbar"
                                        value={query}
                                        onChange={handleChange}
                                        placeholder={query ? query : phrase(dictionary, "searchPlaceholder", language)}
                                        className="w-full h-full p-2 pl-10 text-sm border-0 
                                                    text-black bg-gray-200 dark:bg-[#211F21] dark:text-white
                                                    focus:ring-0 rounded-xl 
                                                    focus:border-[#DB2777]
                                                    focus:outline-2 focus:outline-offset-2
                                                    focus:outline-[#DB2777] active:bg-transparent
                                                    "
                                    />
                                </div>
                                <Drawer
                                    anchor="top"
                                    open={open}
                                    onClose={toggleDrawer(false)}
                                    transitionDuration={0}
                                    ModalProps={{
                                        keepMounted: true,

                                    }}
                                    PaperProps={{
                                        sx: {
                                            boxShadow: 'none',
                                            borderBottomLeftRadius: '15px',
                                            borderBottomRightRadius: '15px',
                                            backgroundColor: theme === 'dark' ? '#1A1A1A' : 'white',
                                            height: {
                                                md: '60%'     // Desktop height
                                            },
                                            width: {
                                                md: '60%'     // 60% width on desktop
                                            },
                                            margin: 'auto',   // Center the drawer
                                        }
                                    }}
                                    className="relative w-full no-scrollbar"
                                >
                                    <Box sx={{ p: 2 }}>
                                        <form onSubmit={handleSearch}>
                                            {renderSearchInput()}
                                        </form>
                                        <div className="flex flex-col md:max-w-screen-xl w-full mx-auto">
                                            <div>
                                                <div className='text-gray-500 text-md flex items-center justify-between'>
                                                    <p className='text-gray-500 text-md pt-3'> {phrase(dictionary, "recentSearch", language)} </p>
                                                    <a href="#">
                                                        <span className='text-gray-300 text-[10px] text-right self-end' onClick={() => toggleSearchRemember()}>
                                                            {searchRemember ? phrase(dictionary, "searchTurnOff", language)
                                                                : phrase(dictionary, "searchTurnOn", language)}
                                                        </span>
                                                    </a>
                                                </div>
                                                <div className='w-full h-[100px]'>
                                                    {recentQueries.length > 0 ?
                                                        recentQueries.slice(0, queriesToShow).map((query: string, index: number) => (
                                                            <div key={index} onClick={() => { setQuery(query); setTriggerSearch(true) }} className='inline-flex gap-2 mt-3'>
                                                                <p className='border border-gray-400 rounded-xl px-6 !cursor-pointer text-black dark:text-white'>
                                                                    {query}
                                                                </p>
                                                                <p className='relative right-7 top-2 !cursor-pointer text-black dark:text-white'>
                                                                    <X onClick={(event) => handleDeleteRecentQuery(event, index)} size={10} />
                                                                </p>
                                                            </div>
                                                        )) :
                                                        <p className='text-gray-500 text-sm flex justify-center items-center h-full text-center'>
                                                            {phrase(dictionary, "noRecentSearch", language)}
                                                        </p>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        {/* webnovel list here */}
                                        <div className='flex md:max-w-screen-xl w-full mx-auto'>
                                            {webnovels && (
                                                <SearchPageWebnovelsList
                                                    webnovels={webnovels}
                                                    searchParams={searchParamsObject}
                                                    sortBy='views'
                                                    mode="component"
                                                />
                                            )}
                                        </div>
                                    </Box>
                                </Drawer>
                            </div>
                        </div>
                    </>
                }
                {
                    mode === "page" &&
                    <>
                        <div className="relative md:max-w-screen-xl w-full my-4 md:px-4 px-4 overflow-hidden no-scrollbar">
                            {/* my-4 md:px-2 px-4 for the margin top and padding of the search bar */}
                            <div className="flex flex-row justify-center items-center min-h-[80px]">
                                <div className="self-center mr-5">
                                    <Link href="/">
                                        <MoveLeft size={20} className='dark:text-white text-black' />
                                    </Link>
                                </div>
                                <div className="relative flex-1 h-12">
                                    <Search
                                        size={20}
                                        className='dark:text-white text-black absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-50'
                                    />
                                    <input
                                        type="text"
                                        id="search-navbar"
                                        value={query}
                                        onChange={handleChange}
                                        placeholder={query ? query : phrase(dictionary, "searchPlaceholder", language)}
                                        className="w-full h-full p-2 pl-10 text-sm border-0 
                                            text-black bg-gray-200 dark:bg-[#211F21] dark:text-white
                                            focus:ring-0 rounded-lg
                                            focus:border-[#DB2777]
                                            focus:outline-2 focus:outline-offset-2
                                            focus:outline-[#DB2777]
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                }
            </form>
        </div>
    )
}
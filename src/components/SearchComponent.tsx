"use client"
import { SetStateAction, Dispatch, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { X, Search, MoveLeft } from "lucide-react";
import { useSearch } from "@/contexts/SearchContext";
import Link from "next/link";
export default function SearchComponent({ mode,
    recentQueriesFetched,
    lastIndexFetched,
    setIsMobileMenuOpen,
    setOpen,
}: {
    mode: "mobileHeader" | "header" | "page",
    recentQueriesFetched?: string[],
    lastIndexFetched?: number,
    setIsMobileMenuOpen?: (isOpen: boolean) => void,
    setOpen?: (isOpen: boolean) => void,
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

    useEffect(() => {
        if (triggerSearch) {
            handleSearch()
            setTriggerSearch(false)
        }
    }, [query, triggerSearch])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("e.target.value", e.target.value)
        console.log("query", query)
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
    return (
        <div className="relative w-full overflow-hidden">
            <form onSubmit={handleSearch}>
                {
                    mode === "mobileHeader" &&
                    <input
                        type="text"
                        id="search-navbar"
                        value={query}
                        onChange={handleChange}
                        className="block w-full p-2 ps-10 text-sm text-black border border-black rounded-md dark:bg-black dark:text-white focus:ring-[#DB2777] focus:border-[#DB2777] dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-[#DB2777] dark:focus:border-[#DB2777]"
                    />
                }
                {
                    mode === "header" &&
                    <>
                        <div className='flex flex-col items-center justify-center md:max-w-screen-xl w-full mx-auto h-80'>
                            <div className="absolute top-5 md:max-w-screen-xl w-full mx-auto">
                                <div className="absolute top-2 left-3 flex items-center justify-center pointer-events-none">
                                    <Search size={20} className='dark:text-white text-black' />
                                </div>
                                <input
                                    type="text"
                                    id="search-navbar"
                                    value={query}
                                    onChange={handleChange}
                                    placeholder={query ? query : phrase(dictionary, "searchPlaceholder", language)}
                                    className="w-full p-2 pl-10 text-sm border-0 
                                     text-black bg-gray-200 dark:bg-[#211F21] dark:text-white
                                     focus:ring-0 rounded-lg
                                     focus:border-[#DB2777]
                                     focus:outline-2 focus:outline-offset-2
                                     focus:outline-[#DB2777] active:bg-transparent
                                     "
                                />
                                <div className="absolute top-2 right-3 flex items-center justify-center pointer-cursor">
                                    <Link href="#"
                                        onClick={() => {
                                            setQuery('')
                                            if (setOpen) {
                                                setOpen(false)
                                            }
                                        }}>
                                        <X size={20} className='dark:text-white text-black ' />
                                    </Link>
                                </div>
                            </div>
                            <div className="flex flex-col w-full">
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

                                {/* <div className='h-[100px]'>
                                    <p className='text-gray-500 text-md'>

                                        {phrase(dictionary, "genresAndKeyword", language)}
                                    </p>

                                    <p className='text-gray-500 text-sm mt-5 mb-3 text-center'>
                                        <KeywordsComponent />
                                    </p>

                                </div> */}

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
                                        className='dark:text-white text-black absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none md:px-0 px-4' 
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
                                            focus:outline-[#DB2777] active:bg-transparent
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
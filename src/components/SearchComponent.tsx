"use client"
import { SetStateAction, Dispatch, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { X } from "lucide-react";
import KeywordsComponent from "@/components/KeywordsComponent";
import { useSearch } from "@/contexts/SearchContext";

export default function SearchComponent({ mode,
    recentQueriesFetched,
    lastIndexFetched,
    setIsMobileMenuOpen,
    setOpen
}: {
    mode: "mobileHeader" | "header" | "page",
    recentQueriesFetched?: string[],
    lastIndexFetched?: number,
    setIsMobileMenuOpen?: (isOpen: boolean) => void,
    setOpen?: (isOpen: boolean) => void,
}) {
    const {query, setQuery, recentQueries, setRecentQueries, lastIndex, setLastIndex} = useSearch();
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
        setQuery(e.target.value);
    }

    const handleSearch = (event?: React.FormEvent<HTMLFormElement>) => {
        if (event) {
            event.preventDefault();
        }
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
        <div>
            <form onSubmit={handleSearch}>
                {
                    mode === "mobileHeader" &&
                    <input
                        type="text"
                        id="search-navbar"
                        value={query}
                        onChange={handleChange}
                        className="block w-full p-2 ps-10 text-sm text-black border border-black rounded-md dark:bg-black dark:text-white focus:ring-pink-500 focus:border-pink-500 dark:border-gray-600 dark:placeholder-gray-400 dark:focus:ring-pink-500 dark:focus:border-pink-500"
                    />
                }
                {
                    mode === "header" &&
                    <>
                        <div className='flex flex-col items-center justify-center max-w-screen-lg mx-auto'>

                            <div className="relative w-full">
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

                                <input
                                    type="text"
                                    id="search-navbar"
                                    value={query}
                                    onChange={handleChange}
                                    placeholder={phrase(dictionary, "searchPlaceholder", language)}
                                    className="w-full p-2 pl-10 text-sm border-0 
                             text-black border-b-4 border-b-black focus:outline-none focus:ring-0
                             focus:border-b-pink-600"
                                />
                            </div>


                            <div className="flex flex-col w-full py-3">
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
                                                <div key={index} onClick={() => {setQuery(query); setTriggerSearch(true)}} className='inline-flex gap-2 mt-3'>
                                                    <p className='border border-gray-400 rounded-xl px-6 !cursor-pointer text-white'>
                                                        {query}
                                                    </p>
                                                    <p className='relative right-7 top-2 !cursor-pointer text-white'>
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

                                <div className='h-[100px]'>
                                    <p className='text-gray-500 text-md'>

                                        {phrase(dictionary, "genresAndKeyword", language)}
                                    </p>

                                    <p className='text-gray-500 text-sm mt-5 mb-3 text-center'>
                                        <KeywordsComponent />
                                    </p>

                                </div>

                            </div>

                        </div>
                    </>
                }
                {
                    mode === "page" &&
                    <>
                        <div className="relative w-full md:px-0 px-4">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none md:px-0 px-4">
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
                            <input
                                type="text"
                                id="search-navbar"
                                value={query}
                                onChange={handleChange}
                                placeholder={query ? query : phrase(dictionary, "searchPlaceholder", language)}
                                className="w-full p-2 pl-10 text-sm border-0 
                        text-black border-b-4 border-b-black 
                        focus:outline-none focus:ring-0
                            focus:border-b-pink-600"
                            />
                        </div>
                    </>
                }
            </form>
        </div>
    )
}
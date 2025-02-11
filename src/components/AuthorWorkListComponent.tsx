import { Webnovel } from "@/components/Types"
import Link from "next/link"
import styles from "@/styles/KoreanText.module.css"
import { phrase } from '@/utils/phrases'
import { useLanguage } from "@/contexts/LanguageContext"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronRight } from 'lucide-react';
import Image from "next/image"
import { getImageUrl } from "@/utils/urls";
import { useQuery } from '@tanstack/react-query'
import { BACKEND_URL } from '../utils/urls'

const AuthorWorkListComponent = ({ authorId }: { authorId: string }) => {
    const { language, dictionary } = useLanguage();
    const [key, setKey] = useState(0);
    const params = useSearchParams();

    const { data: works, isLoading, error } = useQuery({
        queryKey: ['authorWorks', authorId],
        queryFn: async () => {
            const response = await fetch(`${BACKEND_URL}/api/authors/${authorId}/works`)
            if (!response.ok) {
                throw new Error('Network response was not ok')
            }
            return response.json()
        },
        enabled: !!authorId
    })

    useEffect(() => {
        setKey(prevKey => prevKey + 1);
    }, [params, language])

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    if (isLoading) return <div>Loading author works...</div>
    if (error) return <div>Error loading author works</div>

    return (
        <div className="flex flex-row md:w-[670px] w-full overflow-x-auto gap-1">
            {/* <p id="nickname" className={`text-2xl mb-5 font-black ${styles.korean}`}>{nickname} {phrase(dictionary, "whoseWebnovels", language)}</p> */}
            {works?.map((webnovel, index) => (
                <div key={index} className="flex flex-col space-y-1">
                    <Link
                        key={index}
                        href={`/view_webnovels?id=${webnovel.id}`}
                        className="cursor-pointer block py-2 min-w-[150px] max-w-[150px] mx-2 first:ml-0 last:mr-0"
                    >
                        <div className="flex flex-col dark:text-white hover:opacity-80 transition duration-150 ease-in-out rounded-sm h-full">
                            <div className="w-[150px] h-[200px] relative">
                                <Image
                                    src={getImageUrl(webnovel.cover_art)}
                                    alt={webnovel.title}
                                    className="rounded-lg object-cover"
                                    fill
                                    sizes="150px"
                                />
                            </div>
                            <div className="flex flex-row justify-between items-center w-full mt-2">
                                <div className="ml-3 flex flex-col gap-1 text-sm truncate">
                                    <OtherTranslateComponent
                                        content={truncateText(webnovel.title, 20)}
                                        elementId={webnovel.id.toString()} 
                                        elementType='webnovel' 
                                        elementSubtype="title" />
                                    {/* <OtherTranslateComponent content={truncateText(webtoon.title, 20)}  elementId={webtoon.id.toString()} elementType="webtoon" elementSubtype="title"/> */}
                                    <div className="flex flex-row gap-1 flex-shrink-0 flex-grow-0 whitespace-nowrap">
                                        <span className="text-gray-600 text-[10px] flex-shrink-0 ">
                                            {phrase(dictionary, webnovel.genre.toLowerCase(), language)}
                                        </span>
                                        {/* <span className="text-gray-600 text-[10px] max-w-[150px] overflow-hidden overflow-ellipsis whitespace-nowrap inline-block">
                                            {webnovel.user.nickname}
                                        </span> */}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </Link>
                </div>
            ))}
        </div>
    )
}

export default AuthorWorkListComponent
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

const AuthorWorkListComponent = ({ webnovels, nickname }:
    { webnovels: Webnovel[], nickname: string | null | undefined }) => {
    const { language, dictionary } = useLanguage();

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    return (
        <div className="relative w-full">
            <div className="flex flex-row gap-1 overflow-x-auto no-scrollbar">
                {webnovels?.map((webnovel, index) => (
                    <div key={index} className="flex-shrink-1">
                        <Link
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
                                        <div className="flex flex-row gap-1 flex-shrink-0 flex-grow-0 whitespace-nowrap">
                                            <span className="text-gray-600 text-[10px] flex-shrink-0 ">
                                                {phrase(dictionary, webnovel.genre.toLowerCase(), language)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default AuthorWorkListComponent
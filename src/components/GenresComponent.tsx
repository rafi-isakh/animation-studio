"use client"

import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import {phrase} from '@/utils/phrases';

const GenresComponent = () => {
    const { dictionary, language } = useLanguage();
    return (
        <div className="scrollbar-hide max-w-screen-xl mx-auto snap-x justify-between overflow-x-scroll flex px-4 py-4">
            <Link href="?genre=All" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-[#142448] rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">{phrase(dictionary, "genre", language)}</h6>
            </Link>
            <Link href="?genre=Romance Fantasy" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-[#142448] rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">{phrase(dictionary, "romanceFantasy", language)}</h6>
            </Link>
            <Link href="?genre=Romance" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-[#142448] rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">{phrase(dictionary, "romance", language)}</h6>
            </Link>
            <Link href="?genre=BL" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-[#142448] rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">{phrase(dictionary, "bl", language)}</h6>
            </Link>
            <Link href="?genre=Fantasy" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-[#142448] rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">{phrase(dictionary, 'fantasy', language)}</h6>
            </Link>
            <Link href="?genre=Fantasy" className="flex-grow w-1/6 min-w-[120px] min-h-[60px] mr-4 text-center block p-4 flex flex-col justify-center items-center hover:text-pink-600 bg-[#142448] rounded">
                <h6 className="text-lg md:text-2xl font-bold tracking-tight hover:text-pink-600 text-white">{phrase(dictionary, 'sf', language)}</h6>
            </Link>
        </div>
    );
};

export default GenresComponent;

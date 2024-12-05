"use client"
import Image from "next/image";
import Link from "next/link";
import OtherTranslateComponent from "./OtherTranslateComponent";
import DictionaryPhrase from "./DictionaryPhrase";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { useState } from "react";
import { Webtoon } from "@/components/Types";

export default function WebtoonsCardComponent({ webtoon, coverArt, detail }: { webtoon: Webtoon, coverArt: string, detail: boolean }) {

    const { language } = useLanguage();
    const [key, setKey] = useState<number>(0);

    useEffect(() => {
        setKey(prev => prev + 1);
    }, [language]);

    return (
        <div className="flex flex-col">
            <Link href={`/webtoons/${webtoon.id}`}>
                <Image
                    src={coverArt}
                    alt={webtoon.title}
                    width={160}
                    height={225}
                    className="w-[160px] rounded-md h-[225px] md:w-[160px] md:h-[225px]" />
            </Link>
            <div className="flex-grow overflow-hidden">
                <div className="mt-2 w-full">
                    <div className="flex flex-col items-center text-center">
                        {/* Genre */}
                        <OtherTranslateComponent
                            key={key}
                            content={webtoon.title}
                            elementId={webtoon.id.toString()}
                            elementType="webtoon"
                            elementSubtype="title"
                            classParams="text-[12px] md:text-sm font-medium line-clamp-2 w-full"
                        />
                        <p className="text-[10px] md:text-[11px] font-bold w-full truncate text-gray-500 flex flex-col md:flex-row justify-center">
                            {webtoon.user.nickname}
                            <span className="hidden md:block"> • </span>
                            <DictionaryPhrase phraseVar={webtoon.genre} />
                        </p>

                        {/* Total Chapters and Views */}
                        {detail &&
                            <div className="flex flex-row justify-center font-bold">
                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-500 ">
                                    <span><DictionaryPhrase phraseVar={"totalchapters"} /> {webtoon.chapters.length} </span>
                                    <span><DictionaryPhrase phraseVar={"numchapters"} /></span>
                                </p>
                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-500 md:flex flex-row items-center ml-2 hidden gap-1 ">
                                    <TrendingUp size={10} />
                                    <span> {webtoon.views} </span>
                                </p>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
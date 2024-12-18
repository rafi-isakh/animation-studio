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

export default function WebtoonsCardComponent({ webtoon, coverArt, detail, ranking, index }: { webtoon: Webtoon, coverArt: string, detail: boolean, ranking: boolean, index: number }) {

    const { language } = useLanguage();
    const [key, setKey] = useState<number>(0);

    useEffect(() => {
        setKey(prev => prev + 1);
    }, [language]);

    return (
        <div className="group relative flex flex-col items-center">
            <div className="relative shrink-0 overflow-hidden rounded-sm h-full">
            <Link href={`/webtoons/${webtoon.id}`}>
                {/* <Image
                    src={coverArt}
                    alt={webtoon.title}
                    width={160}
                    height={225}
                    className="w-[160px] rounded-md h-[225px] md:w-[160px] md:h-[225px]" /> */}
                <Image
                    src={coverArt}
                    alt={webtoon.title}
                    width={180}
                    height={257}
                    quality={85}
                    className="object-cover w-[100px] h-[143px] md:w-[151px] md:h-[216px]"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                />
            </Link>
                {ranking && (
                    <div className="absolute md:bottom-3 bottom-5 md:-left-1 left-1 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center">
                        <div className="absolute inset-0 bg-transparent opacity-90"></div>
                        <p className="relative italic text-6xl md:text-7xl font-extrabold text-white outlined-text">
                            {/*  font-outline-2 */}
                            {index}
                        </p>
                    </div>
                )}
            </div>
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
                            classParams="text-[12px] md:text-sm font-medium w-[100px] md:w-[150px] line-clamp-2"
                        />
                        <div className="text-[10px] md:text-[11px] font-bold w-full text-gray-500 flex flex-col md:flex-row justify-center">
                            <div className="truncate">{webtoon.user.nickname}</div>
                            <span className="hidden md:block"> • </span>
                            <div className="truncate"><DictionaryPhrase phraseVar={webtoon.genre} /></div>
                        </div>

                        {/* Total Chapters and Views */}
                        {detail &&
                            <div className="flex flex-row justify-center font-bold gap-1">
                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-500 ">
                                    <span><DictionaryPhrase phraseVar={"totalchapters"} /> {webtoon.chapters.length} </span>
                                    <span><DictionaryPhrase phraseVar={"numchapters"} /></span>
                                </p>
                                <p className="text-[10px] md:text-[11px] text-gray-500 dark:text-gray-500 flex flex-row items-center gap-1 ">
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
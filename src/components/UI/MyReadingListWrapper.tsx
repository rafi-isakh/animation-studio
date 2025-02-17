'use client'
import { useRef } from "react";
import { Webnovel } from "@/components/Types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { scroll } from '@/utils/scroll'
import Image from "next/image";
import { Button, useMediaQuery } from "@mui/material";
import Link from "next/link";
import WebnovelsCardList from "@/components/WebnovelsCardList";
import WebnovelPictureComponent from "@/components/WebnovelPictureComponent";

const MyReadingListWrapper = ({ library, nickname }: { library: Webnovel[], nickname: string }) => {
    const { dictionary, language } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
        <div className={`relative md:max-w-screen-lg w-full mx-auto group overflow-hidden`}>
            <div>
                {library.length > 0 ?
                    <div className="flex flex-row justify-between">
                        <h1 className=" text-xl font-extrabold mb-3 text-black dark:text-white">
                            {/* Continue Reading */}
                            {language === "ko" && <span className="text-black dark:text-white">{nickname}님</span>}
                            {phrase(dictionary, "continueReading", language)}
                            {language === "en" && <span className="text-black dark:text-white">{' '}{nickname}</span>}
                        </h1>
                    </div>
                    : <></>
                }
                <div className="relative w-full">
                    {/* Desktop layout with horizontal scroll */}
                    <div ref={scrollRef} className="hidden md:flex overflow-x-auto no-scrollbar gap-1">
                        {library && library.map((item, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 w-[160px]"
                            >
                                <WebnovelPictureComponent
                                    webnovel={item}
                                    index={index + 1}
                                    ranking={false}
                                    details={false}
                                    up={false}
                                    isOriginal={false}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Mobile horizontal scroll */}
                    <div className="md:hidden flex overflow-x-auto no-scrollbar scroll-smooth gap-1">
                        {library && library.map((item, index) =>
                            <div key={index}

                                className="flex-none">
                                <WebnovelPictureComponent
                                    key={index}
                                    webnovel={item}
                                    index={index + 1}
                                    ranking={false}
                                    details={false}
                                    up={false}
                                    isOriginal={false}
                                />
                            </div>
                        )}
                    </div>

                    {!isMobile && (
                        <>
                            <button
                                onClick={() => scroll('left', scrollRef)}
                                className="group-hover:opacity-80 transition-opacity duration-300 absolute left-0 top-[45%] -translate-y-1/2 z-10 bg-transparent rounded-full p-2 opacity-0"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-700" />
                            </button>
                            <button
                                onClick={() => scroll('right', scrollRef)}
                                className="group-hover:opacity-80 transition-opacity duration-300 absolute right-0 top-[45%] -translate-y-1/2 z-10 bg-transparent rounded-full p-2 opacity-0"
                            >
                                <ChevronRight className="w-6 h-6 text-gray-700" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>

    )
}

export default MyReadingListWrapper;
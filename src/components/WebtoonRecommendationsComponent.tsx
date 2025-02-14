"use client"
import DictionaryPhrase from "./DictionaryPhrase";
import { Webtoon } from "./Types";
import Image from "next/image";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import OtherTranslateComponent from "./OtherTranslateComponent";

interface WebtoonRecommendationsComponentProps {
    webtoons: Webtoon[];
    coverArtUrls: string[];
}

export default function WebtoonRecommendationsComponent({ webtoons, coverArtUrls }: WebtoonRecommendationsComponentProps) {
    const { dictionary, language } = useLanguage();
    const [recommendedWebtoons, setRecommendedWebtoons] = useState<Webtoon[]>([]);
    const [recommendedCoverArtUrls, setRecommendedCoverArtUrls] = useState<string[]>([]);

    const [key, setKey] = useState(0);
    const getRecommendations = (webtoons: Webtoon[]) => {
        // Get a copy of the array to avoid mutating the original
        const shuffled = [...webtoons];
        const shuffledUrls = [...coverArtUrls];
        // Fisher-Yates shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            [shuffledUrls[i], shuffledUrls[j]] = [shuffledUrls[j], shuffledUrls[i]];
        }
        // Return first 10 items (or all if less than 10)
        return { webtoons: shuffled.slice(0, 10), coverArtUrls: shuffledUrls.slice(0, 10) };
    }

    useEffect(() => {
        const { webtoons: recommendedWebtoons, coverArtUrls: recommendedCoverArtUrls } = getRecommendations(webtoons);
        setRecommendedWebtoons(recommendedWebtoons);
        setRecommendedCoverArtUrls(recommendedCoverArtUrls);
    }, [webtoons]);

    const truncateText = (text: string, maxLength: number) => {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    };

    return (
        <div className="md:w-[670px] w-full ">
            <div className="flex flex-row gap-1 overflow-x-auto">
                {recommendedWebtoons.map((webtoon: Webtoon, index: number) => (
                    <Link
                        href={`/webtoons/${webtoon.id}`}
                        key={`webtoon-${webtoon.id}`}
                        className="cursor-pointer block py-2 min-w-[150px] max-w-[150px]"
                    >
                        <div className="flex flex-col dark:text-white hover:opacity-80 transition duration-150 ease-in-out rounded-sm h-full">
                            <div className="w-[150px] h-[200px] relative">
                                <Image
                                    src={recommendedCoverArtUrls[index]}
                                    alt={webtoon.title}
                                    className="rounded-lg object-cover"
                                    fill
                                    sizes="150px"
                                />
                            </div>
                            <div className="flex flex-row justify-between items-center w-full mt-2">
                                <div className="ml-3 flex flex-col gap-1 text-sm truncate">
                                    <OtherTranslateComponent content={truncateText(webtoon.title, 20)} elementId={webtoon.id.toString()} elementType="webtoon" elementSubtype="title" />
                                    <div className="flex flex-row gap-1 flex-shrink-0 flex-grow-0 whitespace-nowrap">
                                        <span className="text-gray-600 text-[10px] flex-shrink-0 ">
                                            {phrase(dictionary, webtoon.genre.toLowerCase(), language)}
                                        </span>
                                        <span className="text-gray-600 text-[10px] max-w-[150px] overflow-hidden overflow-ellipsis whitespace-nowrap inline-block">
                                            {webtoon.user.nickname}

                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}
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

    return (
        <div className="px-5">
            <h1 className="text-sm font-bold">
                {/* You might like this : recommend webtoons  */}
                {phrase(dictionary, "youMightLikeThis", language)}
            </h1>
            {recommendedWebtoons.map((webtoon: Webtoon, index: number) => (
                <Link
                    href={`/webtoons/${webtoon.id}`}
                    key={`webtoon-${webtoon.id}`}
                    className={`cursor-pointer block py-2 border-gray-200 last:border-b-0`}
                >
                    <div className="flex flex-row bg-gray-200 hover:opacity-80 transition duration-150 ease-in-out rounded-sm">
                        <Image
                            src={recommendedCoverArtUrls[index]}
                            alt={webtoon.title}
                            className="self-center rounded-l-sm "
                            width={50}
                            height={50}
                        />
                        <div className="flex flex-row justify-between items-center w-full">
                            <div className="ml-3 flex flex-col gap-1 text-sm">
                                <OtherTranslateComponent key={key} content={webtoon.title} elementId={webtoon.id.toString()} elementType="webtoon" elementSubtype="title"/>
                                <p className="flex flex-row gap-1">
                                    <span className="text-gray-100 text-[10px] rounded-full bg-gray-800 px-1">
                                        {phrase(dictionary, webtoon.genre.toLowerCase(), language)}
                                    </span>
                                    <span className="text-gray-600 text-[10px] ">
                                        {webtoon.user.nickname}
                                    </span>
                                </p>
                            </div>
                            {/* <div className="text-sm text-center self-center">
                               
                                <p className="text-gray-600 text-[10px] mr-5">
                                 
                                    {phrase(dictionary, "readingForFree", language)}
                                </p>
                            </div> */}
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
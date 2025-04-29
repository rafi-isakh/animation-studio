import { useRef } from "react";
import { Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar";
import Link from "next/link";
import { Skeleton } from "@/components/shadcnUI/Skeleton";
import CardsScroll from '@/components/CardsScroll';
import { getImageUrl } from "@/utils/urls";

// Helper function to generate a gradient based on a string
const stringToGradientColors = (str: string): [string, string] => {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }

    // Define a palette of distinct colors
    const colors = [
        ['#FFC107', '#FF9800'], // Amber -> Orange
        ['#FF5722', '#FF7043'], // Deep Orange -> Lighter Deep Orange
        ['#E91E63', '#EC407A'], // Pink -> Lighter Pink
        ['#9C27B0', '#AB47BC'], // Purple -> Lighter Purple
        ['#3F51B5', '#5C6BC0'], // Indigo -> Lighter Indigo
        ['#2196F3', '#42A5F5'], // Blue -> Lighter Blue
        ['#00BCD4', '#26C6DA'], // Cyan -> Lighter Cyan
        ['#4CAF50', '#66BB6A'], // Green -> Lighter Green
        ['#CDDC39', '#D4E157'], // Lime -> Lighter Lime
        ['#795548', '#8D6E63'], // Brown -> Lighter Brown
        ['#607D8B', '#78909C'], // Blue Grey -> Lighter Blue Grey
        ['#F44336', '#EF5350'], // Red -> Lighter Red
    ];

    // Use the hash to pick a color pair from the palette
    const index = Math.abs(hash) % colors.length;
    return colors[index] as [string, string]; // Return the pair of colors
};

export default function MyFavoriteAuthorList({ library, nickname, isLoading }: { library: Webnovel[], nickname: string, isLoading: boolean }) {
    const { dictionary, language } = useLanguage();
    const scrollRef = useRef<HTMLDivElement>(null);

    const uniqueAuthors = Array.from(
        new Map(library.map(item => [item.author.id, item.author])).values()
    );

    const smallGap = () => {
        return <div className='md:h-[2rem] h-[1rem]' />
    }

    return (
        <div className='relative w-full'>
            <h1 className="flex flex-row justify-between text-xl font-extrabold md:mb-0 mb-3">
                {phrase(dictionary, "favoriteAuthors", language)}
            </h1>
            {smallGap()}
            <div ref={scrollRef} className="overflow-x-auto no-scrollbar flex flex-row flex-nowrap gap-2">

                {uniqueAuthors.length > 0 ? uniqueAuthors.slice(0, 20).map(author => {
                    const matchingWebnovels = library.find(webnovel => webnovel.author.id === author.id);
                    const profileId = matchingWebnovels ? matchingWebnovels.user.id : author.id;
                    if (!matchingWebnovels) {
                        return <></>
                    }
                    const userId = matchingWebnovels.user.id;
                    const gradientColors = stringToGradientColors(author.nickname);

                    return (
                        <Link
                            key={author.id}
                            href={`/view_profile/${userId}`}
                            className="flex flex-col gap-1 justify-center items-center border-none dark:border-zinc-700 rounded-lg p-1 w-fit"
                        >
                            <Avatar
                                key={author.id}
                                className="relative w-40 h-40 rounded-full border border-white dark:border-black overflow-hidden shadow-sm"
                            >
                                <AvatarImage src={getImageUrl(matchingWebnovels.user.picture)} className="object-cover" />

                                <AvatarFallback
                                    style={{
                                        background: `linear-gradient(to bottom right, ${gradientColors[0]}, ${gradientColors[1]})`
                                    }}
                                    className="flex items-center justify-center text-xs text-black dark:text-black">
                                    <span className='dark:text-white text-black text-xl'>  {author.nickname.charAt(0).toUpperCase()} </span>
                                </AvatarFallback>
                            </Avatar>
                            <p className="text-center text-sm truncate">{author.nickname}</p>
                        </Link>
                    )
                }) : (isLoading ? <div className="flex flex-row justify-start items-start space-x-2">
                    <Skeleton className="w-[70px] h-[30px] rounded-lg" />
                    <Skeleton className="w-[70px] h-[30px] rounded-lg" />
                    <Skeleton className="w-[70px] h-[30px] rounded-lg" />
                </div> : <>{phrase(dictionary, "noFavoriteAuthorsYet", language)}</>)}

            </div>
            {scrollRef && <CardsScroll scrollRef={scrollRef} shift={true} />}
        </div>
    )
}
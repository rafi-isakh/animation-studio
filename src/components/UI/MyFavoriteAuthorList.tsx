import { useRef } from "react";
import { Webnovel } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar";
import Link from "next/link";
import { Skeleton } from "@/components/shadcnUI/Skeleton";
import CardsScroll from '@/components/CardsScroll';
import { getImageUrl } from "@/utils/urls";

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
            <div  className="overflow-x-auto no-scrollbar">
                <div ref={scrollRef} className="flex flex-row flex-nowrap gap-2" >
                    {uniqueAuthors.length > 0 ? uniqueAuthors.slice(0, 20).map(author => {
                        const matchingWebnovels = library.find(webnovel => webnovel.author.id === author.id);
                        const profileId = matchingWebnovels ? matchingWebnovels.user.id : author.id;
                        if (!matchingWebnovels) {
                            return <></>
                        }
                        const userId = matchingWebnovels.user.id;

                        return (
                            <Link
                                key={author.id}
                                href={`/view_profile/${userId}`}
                                className="flex flex-col gap-1 justify-center items-center border-none dark:border-zinc-700 rounded-lg p-1 w-fit"
                            >
                                <Avatar 
                                    key={author.id} 
                                    className="relative w-40 h-40 rounded-full border border-white overflow-hidden"
                                    >
                                        <AvatarImage src={getImageUrl(matchingWebnovels.user.picture)} className="object-cover" />
                                         
                                    <AvatarFallback className="bg-gray-300 flex items-center justify-center text-xs text-black dark:text-black">
                                        {author.nickname.charAt(0).toUpperCase()}
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
            </div>
            {scrollRef && <CardsScroll scrollRef={scrollRef} />}
        </div>
    )
}
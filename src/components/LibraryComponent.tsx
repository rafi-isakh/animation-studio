import { useState, useEffect } from "react";
import { ToonyzPost, Webnovel, } from "@/components/Types";
import WebnovelComponent from "@/components/WebnovelComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar";
import { phrase } from "@/utils/phrases";
import Image from "next/image";
import { Button } from "@/components/shadcnUI/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { LibraryPromotionComponent } from "@/components/PromotionBannerComponent";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { truncateText } from "@/utils/truncateText";
import { Skeleton } from "@/components/shadcnUI/Skeleton";

// Add a helper function for image URLs if it doesn't exist elsewhere
const LibraryComponent = ({ library, nickname }: { library: Webnovel[], nickname: string }) => {
    const { dictionary, language } = useLanguage();
    const [toonyzPosts, setToonyzPosts] = useState<ToonyzPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAndSortToonyzPosts = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/get_toonyz_posts`);
                if (!response.ok) throw new Error('Failed to fetch toonyz posts');
                const data = await response.json();

                const webnovelOrderMap = new Map();
                library.forEach((webnovel, index) => {
                    webnovelOrderMap.set(webnovel.id, index);
                });

                const sortedPosts = [...data].sort((postA, postB) => {
                    const indexA = webnovelOrderMap.has(postA.webnovel_id) ? webnovelOrderMap.get(postA.webnovel_id) : Infinity;
                    const indexB = webnovelOrderMap.has(postB.webnovel_id) ? webnovelOrderMap.get(postB.webnovel_id) : Infinity;

                    if (indexA !== indexB) {
                        return indexA - indexB;
                    }

                    return new Date(postB.created_at).getTime() - new Date(postA.created_at).getTime();
                });

                setToonyzPosts(sortedPosts);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching and sorting posts:', error);
            }
        };

        if (library && library.length > 0) {
            fetchAndSortToonyzPosts();
        } else {
            const fetchToonyzPosts = async () => {
                const response = await fetch(`/api/get_toonyz_posts`);
                const data = await response.json();
                setToonyzPosts(data);
            };
            fetchToonyzPosts();
        }
    }, [library]);


    const uniqueAuthors = Array.from(
        new Map(library.map(item => [item.author.id, item.author])).values()
    );


    const largeGap = () => {
        return (
            <div className='md:h-[3rem] h-[2rem]' />
        )
    }

    const smallGap = () => {
        return (
            <div className='md:h-[2rem] h-[1rem]' />
        )
    }


    return (
        <div className="md:max-w-screen-xl w-full mx-auto">
            <div className="flex flex-col justify-start md:p-0 p-2">
                <LibraryPromotionComponent />
                {smallGap()}
                <p className="text-2xl font-bold !text-start mb-3">
                    {phrase(dictionary, "myLibrary", language)}
                </p>
                {library.length > 0 ?
                    <div className="w-full overflow-x-auto no-scrollbar">
                        <div className="flex gap-2">
                            {library && library.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex flex-col",
                                        "w-fit shrink-0",
                                        "bg-white dark:bg-zinc-900/70",
                                        "rounded-xl",
                                        "border border-zinc-100 dark:border-zinc-800",
                                        "hover:border-zinc-200 dark:hover:border-zinc-700",
                                        "transition-all duration-200",
                                        "shadow-sm backdrop-blur-xl",
                                    )}
                                >
                                    <WebnovelComponent key={index} webnovel={item} index={index} ranking={false} chunkIndex={0} />
                                </div>
                            ))}
                        </div>
                    </div>
                    : (isLoading ?
                        <div className="flex flex-row justify-start items-start space-x-2">
                            <Skeleton className="w-[165px] h-[250px] rounded-lg" />
                            <Skeleton className="w-[165px] h-[250px] rounded-lg" />
                            <Skeleton className="w-[165px] h-[250px] rounded-lg" />
                        </div>
                        : <div className="flex flex-col justify-center items-center space-y-2">
                            <Image src="/stelli/stelli_3.png" alt="noWebnovelsFound" width={150} height={100} />
                            <p className="pt-3 text-md font-bold"> {phrase(dictionary, "noViewingWebnovelsFound", language)} </p>
                            <p className="text-md"> {phrase(dictionary, "noViewingWebnovelsFound_subtitle", language)} </p>
                            <Button className="bg-[#8A2BE2] text-md text-white px-4 py-2 rounded-md mb-10 ">
                                <Link href="/">
                                    {phrase(dictionary, "discoverStories", language)}
                                </Link>
                            </Button>
                        </div>
                    )
                }
            </div>
            {smallGap()}
            <div className="flex flex-col justify-start md:p-0 p-2">
                <p className="text-2xl font-bold !text-start mb-3">
                    {phrase(dictionary, "favoriteAuthors", language)}
                </p>
                
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex flex-row flex-nowrap gap-2" >
                       {uniqueAuthors.length > 0 ? uniqueAuthors.slice(0, 20).map(author => (
                            <div
                                key={author.id}
                                className="flex flex-row gap-1 justify-center items-center border border-zinc-200 dark:border-zinc-700 rounded-lg p-1 w-fit"
                            >
                                <Avatar key={author.id} className="relative w-6 h-6 rounded-full border border-white overflow-hidden">
                                    <AvatarFallback className="bg-gray-300 flex items-center justify-center text-xs text-black dark:text-black">
                                        {author.nickname.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-center text-sm truncate">{author.nickname}</p>
                            </div>
                        )) : (isLoading ? <div className="flex flex-row justify-start items-start space-x-2"> 
                                            <Skeleton className="w-[70px] h-[30px] rounded-lg" /> 
                                            <Skeleton className="w-[70px] h-[30px] rounded-lg" /> 
                                            <Skeleton className="w-[70px] h-[30px] rounded-lg" /> 
                                        </div> : <>{phrase(dictionary, "noFavoriteAuthorsYet", language)}</>)}
                    </div>
                </div>
            </div>
            {largeGap()}
            <div className="flex flex-col justify-start md:p-0 p-2">

                {library.length > 0 ?
                    <div className="flex flex-row justify-between">
                        <h1 className="text-2xl font-bold mb-3 text-black dark:text-white">
                            {/* Continue Reading */}
                            {language === "ko" && <span className="text-black dark:text-white">{nickname}님</span>}
                            {phrase(dictionary, "newToonyzPostsFromYourLibrary", language)}
                        </h1>
                    </div>
                    : <></>
                }

                <div className="overflow-x-auto no-scrollbar ">
                    <div className="flex flex-row flex-nowrap gap-2">
                        {library.map(libraryItem => {
                            const matchingPosts = toonyzPosts
                                .filter(post => String(post.webnovel_id) === String(libraryItem.id))
                                .slice(0, 4);
                            return matchingPosts.length > 0 ? (
                                <div className="relative  border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden w-[250px] flex-shrink-0"
                                // style={{
                                //     backgroundImage: `url(${getImageUrl(libraryItem.cover_art)})`,
                                //     backgroundSize: 'cover',
                                //     backgroundPosition: 'center'
                                // }}
                                >

                                    <div className="relative w-full p-2 text-center flex flex-row items-center gap-2">
                                        <Avatar key={libraryItem.author.id} className="relative w-6 h-6 rounded-full border border-white overflow-hidden">
                                            <AvatarImage src={getImageUrl(libraryItem.cover_art) || ""} alt={libraryItem.title} />
                                            <AvatarFallback className="bg-gray-300 flex items-center justify-center text-xs text-black dark:text-black">
                                                {libraryItem.title.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="w-full flex text-sm font-bold truncate justify-between">
                                            <span className="">
                                                {/* {libraryItem.title} */}
                                                <OtherTranslateComponent
                                                    content={truncateText(libraryItem.title, 15)}
                                                    elementId={libraryItem.id.toString()}
                                                    elementType='webnovel'
                                                    elementSubtype="title"
                                                    classParams={language === 'ko'
                                                        ? "text-md md:text-base w-full break-keep korean truncate text-center"
                                                        : "text-md md:text-base w-full break-words truncate text-center"}
                                                />

                                            </span>
                                            <span className="text-xs text-gray-500 self-end">
                                                {matchingPosts.length} Pins
                                            </span>
                                        </div>

                                    </div>
                                    <div key={libraryItem.id} className="h-[200px]">
                                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                            {matchingPosts.map(post => (
                                                <div key={post.id} className="flex-nowrap  w-32  flex-shrink-0">
                                                    <Link href={`/toonyz_posts/${post.id}`}>
                                                        {post.image ?
                                                            (<Image
                                                                src={getImageUrl(post.image)}
                                                                alt={post.title}
                                                                width={130}
                                                                height={130}
                                                                className="rounded-lg mx-auto"
                                                            />)
                                                            : (<video src={getVideoUrl(post.video)} playsInline autoPlay muted loop className="rounded-lg mx-auto" />
                                                            )}
                                                        <p className="relative mt-2 text-center text-sm">{post.title || `Post #${post.id}`}</p>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : <></>;
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LibraryComponent;
import { useState, useEffect, useRef } from "react";
import { ToonyzPost, Webnovel, } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import Image from "next/image";
import { Button } from "@/components/shadcnUI/Button";
import Link from "next/link";
import { LibraryPromotionComponent } from "@/components/PromotionBannerComponent";
import { Skeleton } from "@/components/shadcnUI/Skeleton";
import WebnovelsCardList from "@/components/WebnovelsCardList";
import WebnovelPictureComponent from "@/components/WebnovelPictureComponent";
import { useMediaQuery } from "@mui/material";
import MyFavoriteAuthorList from "@/components/UI/MyFavoriteAuthorList"
import MyLibraryToonyzPostCard from "@/components/UI/MyLibraryToonyzPostCard";


// Add a helper function for image URLs if it doesn't exist elsewhere
const LibraryComponent = ({ library, nickname, loading }: { library: Webnovel[], nickname: string, loading: boolean }) => {
    const { dictionary, language } = useLanguage();
    const [toonyzPosts, setToonyzPosts] = useState<ToonyzPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const scrollRef = useRef<HTMLDivElement>(null);


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


    const LargeGap = () => {
        return (
            <div className='md:h-[3rem] h-[2rem]' />
        )
    }

    const SmallGap = () => {
        return (
            <div className='md:h-[2rem] h-[1rem]' />
        )
    }

    return (
        <div className="md:max-w-screen-xl w-full h-full mx-auto">
            <div className="flex flex-col justify-start md:p-0 p-2">
                <LibraryPromotionComponent />
                <SmallGap/>
                {library.length > 0 ?
                    <div className='w-full flex'>
                        <WebnovelsCardList
                            title={phrase(dictionary, "myLibrary", language)}
                            subtitle=""
                            webnovels={library}
                            scrollRef={scrollRef}
                            isMobile={isMobile}
                            renderItem={(item: Webnovel, index: number) => (
                                <WebnovelPictureComponent
                                    webnovel={item}
                                />
                            )}
                        />
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
            <SmallGap/>
            {/* <div className="w-full">
                <MyFavoriteAuthorList library={library} nickname={nickname} isLoading={isLoading} />
            </div> */}
            {/* <LargeGap/> */}
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
                <div className="w-full ">
                    <SmallGap/>
                    <MyLibraryToonyzPostCard library={library} toonyzPosts={toonyzPosts} />
                </div>
            </div>
            <div className="h-[20vh]" />
        </div>
    )
}

export default LibraryComponent;
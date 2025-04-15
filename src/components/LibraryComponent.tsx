import { useState, useEffect, useRef } from "react";
import { ToonyzPost, Webnovel, } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar";
import { phrase } from "@/utils/phrases";
import Image from "next/image";
import { Button } from "@/components/shadcnUI/Button";
import Link from "next/link";
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { LibraryPromotionComponent } from "@/components/PromotionBannerComponent";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { truncateText } from "@/utils/truncateText";
import { Skeleton } from "@/components/shadcnUI/Skeleton";

// import LottieLoader from "./LottieLoader";
// import animationData from '@/assets/N_logo_with_heart.json';
import WebnovelsCardList from "@/components/WebnovelsCardList";
import WebnovelPictureComponent from "@/components/WebnovelPictureComponent";
import { useMediaQuery } from "@mui/material";
import MyFavoriteAuthorList from "@/components/UI/MyFavoriteAuthorList";
import { Card } from "@/components/shadcnUI/Card"
import { ChevronLeft, ChevronRight } from "lucide-react";

// Add a helper function for image URLs if it doesn't exist elsewhere
const LibraryComponent = ({ library, nickname, loading }: { library: Webnovel[], nickname: string, loading: boolean }) => {
    const { dictionary, language } = useLanguage();
    const [toonyzPosts, setToonyzPosts] = useState<ToonyzPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const scrollRef = useRef<HTMLDivElement>(null);


    const [hoveredCard, setHoveredCard] = useState<number | null>(null)
    // Initialize state to store the index of the currently displayed post for each library item
    const [currentImageIndices, setCurrentImageIndices] = useState<Record<number, number>>({});

    // Effect to initialize/reset indices when library or posts data changes
    useEffect(() => {
        const initialIndices = library.reduce((acc, item) => {
            const posts = toonyzPosts
                .filter(post => String(post.webnovel_id) === String(item.id))
                .slice(0, 4); // Match the slice used for display
            if (posts.length > 0) {
                acc[item.id] = 0; // Start at index 0 for items with posts
            }
            return acc;
        }, {} as Record<number, number>);
        setCurrentImageIndices(initialIndices);
    }, [library, toonyzPosts]); // Re-run if library or toonyzPosts change


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





    // Function to change the cover image/video for a specific card based on its matching posts
    const changeCoverImage = (libraryItemId: number, direction: "prev" | "next") => {
        const relevantPosts = toonyzPosts
            .filter(post => String(post.webnovel_id) === String(libraryItemId))
            .slice(0, 4); // Use the same slice as the display row
        const totalItems = relevantPosts.length;

        if (totalItems <= 1) return; // No change needed if 0 or 1 item

        setCurrentImageIndices((prev) => {
            // Ensure the library item exists in the state before trying to update
            if (!prev.hasOwnProperty(libraryItemId)) {
                console.warn(`Library item ${libraryItemId} not found in currentImageIndices state.`);
                return prev; // Should not happen with proper initialization, but safety check
            }

            const currentIndex = prev[libraryItemId];
            let newIndex;

            if (direction === "prev") {
                newIndex = (currentIndex - 1 + totalItems) % totalItems;
            } else { // direction === "next"
                newIndex = (currentIndex + 1) % totalItems;
            }

            return { ...prev, [libraryItemId]: newIndex };
        });
    };


    return (
        <div className="md:max-w-screen-xl w-full h-full mx-auto">
            <div className="flex flex-col justify-start md:p-0 p-2">
                <LibraryPromotionComponent />
                {smallGap()}
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
            {smallGap()}
            <div className="flex flex-col justify-start md:p-0 p-2">
                <MyFavoriteAuthorList library={library} nickname={nickname} isLoading={isLoading} />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {library.map(libraryItem => {
                            const matchingPosts = toonyzPosts
                                .filter(post => String(post.webnovel_id) === String(libraryItem.id))
                                .slice(0, 4);
                            return matchingPosts.length > 0 ? (
                                <Card
                                    key={libraryItem.id}
                                    className="bg-neutral-800 hover:bg-neutral-700 transition-all duration-300 overflow-hidden border-none relative group"
                                    onMouseEnter={() => setHoveredCard(libraryItem.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    {/* Determine the current post to display based on the index state */}
                                    {(() => {
                                        const currentIndex = currentImageIndices[libraryItem.id] ?? 0;
                                        const currentPost = matchingPosts[currentIndex];
                                        const mediaSource = currentPost?.video
                                            ? { type: 'video', url: getVideoUrl(currentPost.video) }
                                            : currentPost?.image
                                                ? { type: 'image', url: getImageUrl(currentPost.image) }
                                                : { type: 'image', url: getImageUrl(libraryItem.cover_art) }; // Fallback

                                        return (
                                            <div className="relative w-full h-[350px] sm:h-[400px]">
                                                {/* Background media - Video or Image */}
                                                {mediaSource.type === 'video' ? (
                                                    <video
                                                        key={currentPost?.id || libraryItem.id} // Key for re-rendering
                                                        src={mediaSource.url || ""}
                                                        playsInline
                                                        autoPlay
                                                        muted
                                                        loop
                                                        className="absolute inset-0 w-full h-full object-cover -z-10"
                                                    />
                                                ) : (
                                                    <Image
                                                        key={currentPost?.id || libraryItem.id} // Key for re-rendering
                                                        src={mediaSource.url || ""}
                                                        alt={libraryItem.title}
                                                        fill
                                                        className="object-cover transition-opacity duration-300 z-10"
                                                        priority
                                                    />
                                                )}

                                                {/* Gradient overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
                                                {/* Cover image navigation buttons */}
                                                {matchingPosts.length > 1 && (
                                                    <>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                changeCoverImage(libraryItem.id, "prev")
                                                            }}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                changeCoverImage(libraryItem.id, "next")
                                                            }}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}


                                                <div className="relative w-full p-2 text-center flex flex-row items-center gap-2">
                                                    {/* Thumbnail with title */}
                                                    <div className="absolute top-4 left-4 flex items-start gap-3 z-10">
                                                        <div className="w-16 h-16 rounded-md overflow-hidden relative flex-shrink-0">
                                                            <Image
                                                                src={getImageUrl(libraryItem.cover_art) || ""}
                                                                alt={libraryItem.title}
                                                                width={64}
                                                                height={64}
                                                                className="object-cover opacity-70"
                                                            />
                                                        </div>

                                                        {/* Title next to thumbnail */}
                                                        <div className="text-white pt-1">
                                                            <h4 className="font-bold text-sm">
                                                                <OtherTranslateComponent
                                                                    content={truncateText(libraryItem.title, 15)}
                                                                    elementId={libraryItem.id.toString()}
                                                                    elementType='webnovel'
                                                                    elementSubtype="title"
                                                                    classParams={language === 'ko'
                                                                        ? "text-lg break-keep korean truncate text-center"
                                                                        : "text-lg break-words truncate text-center"}
                                                                />
                                                            </h4>
                                                            <p className="text-xs text-white text-left ">   {matchingPosts.length} Pins </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* <div key={libraryItem.id} className="h-[200px]">
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
                                                </div> */}



                                            </div>
                                        );
                                    })()}
                                </Card>
                            ) : <></>;
                        })}
                    </div>
                </div>
            </div>
            <div className="h-[20vh]" />
        </div>
    )
}

export default LibraryComponent;
'use client'
import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus, Video, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/shadcnUI/Button"
import { ToonyzPost } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import Link from "next/link";
import PhotoCards from "@/components/UI/PhotoCards";
import { MdStars } from "react-icons/md";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useCreateMedia } from "@/contexts/CreateMediaContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/shadcnUI/Toast";
import NotEnoughStarsDialog from "@/components/UI/NotEnoughStarsDialog";

export default function CreateMediaDefaultContents({ stars, source, chapterIds }: { stars: number, source: 'webnovel' | 'chapter', chapterIds?: number[] }) {
    const [initialPosts, setInitialPosts] = useState<ToonyzPost[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { dictionary, language } = useLanguage();
    const { setOpenDialog, loadingVideoGeneration, generateTrailer } = useCreateMedia();
    const { toast } = useToast();
    const [showNotEnoughStarsModal, setShowNotEnoughStarsModal] = useState(false);
    const [createMediaPrice, setCreateMediaPrice] = useState(0);

    useEffect(() => {
        fetch('/api/get_toonyz_posts')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch posts');
                }
                return res.json();
            })
            .then(data => {
                setInitialPosts(data);
                setInitialLoading(false);
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
                setError('Failed to load posts. Please try again later.');
                setInitialLoading(false);
            });
    }, []);

    // Function to shuffle the array
    const shuffleArray = (array: ToonyzPost[]) => {
        return array.sort(() => Math.random() - 0.5);
    };

    // Shuffle the posts
    const shuffledPosts = shuffleArray([...initialPosts]);

    // Select random items for each section
    const randomImages = shuffledPosts.filter(post => post.image).slice(0, 3);
    const randomVideos = shuffledPosts.filter(post => post.video).slice(0, 2);


    return (
        <div className="min-h-screen  p-6 md:p-8">
            {/* bg-gradient-to-r dark:from-black dark:to-transparent from-transparent to-blue-100/50 backdrop-blur-md  */}
            {/* Header Section */}
            <div className="max-w-4xl mx-auto mb-12">
                <h1 className="text-2xl md:text-2xl font-bold mb-4 uppercase text-gray-700 dark:text-gray-300 break-words">
                    {phrase(dictionary, "bringStoriesToLife", language)}
                </h1>
                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-8">
                    {source === 'webnovel' ? phrase(dictionary, "letAIGenerateForFull", language) : phrase(dictionary, "selectTextAndLetAI", language)}
                </p>

                <div className="flex flex-row gap-2">
                    {
                        source == 'webnovel' &&
                        <Button
                            className="rounded-full bg-white text-black hover:bg-gray-200 px-8 py-6 font-medium text-base"
                            disabled={loadingVideoGeneration || !chapterIds || chapterIds.length === 0}
                            onClick={() => {
                                if (stars < 20) {
                                    setCreateMediaPrice(20)
                                    setShowNotEnoughStarsModal(true);
                                    return;
                                }
                                if (chapterIds && chapterIds.length > 0) {
                                    setOpenDialog(true);
                                    generateTrailer(chapterIds);
                                }
                                else {
                                    toast({
                                        title: "Error",
                                        description: "No chapters available to generate trailer",
                                        variant: "destructive",
                                    });
                                }
                            }}
                        >
                            {loadingVideoGeneration ?
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> :
                                null
                            }
                            {phrase(dictionary, "generateButton", language)} <MdStars className="text-lg md:text-xl text-[#D92979]" />20
                        </Button>
                    }

                    <Button className="rounded-full bg-white text-black hover:bg-gray-200 px-8 py-6 font-medium text-base">
                        <Link href="/stars" className="flex items-center gap-1">
                            {phrase(dictionary, "stars", language)} <ArrowRight className="text-lg md:text-xl text-black" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                <Link href="/toonyz_posts" className="rounded-3xl overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 p-6 md:p-8 col-span-1 md:col-span-3 relative min-h-[280px]">
                    <div >
                        <div className="w-full">
                            <h3 className="text-2xl font-bold mb-1">{phrase(dictionary, "post", language)}</h3>
                            <p className="text-md">{phrase(dictionary, "discoverPosts", language)}</p>
                        </div>
                        <div className="absolute -bottom-5 right-0 flex gap-2 h-[180px]">
                            {randomImages.slice(0, 3).map((post, index) => (
                                <Image
                                    key={post.id}
                                    src={getImageUrl(post.image)}
                                    alt={post.title}
                                    width={150}
                                    height={200}
                                    className={`overflow-hidden relative rounded-xl hover:scale-110 transition-all duration-300 ease-in-out ${index !== 0 ? '-ml-10' : ''}`}
                                    style={{ zIndex: randomImages.length - index, rotate: '-6deg' }}
                                />
                            ))}
                            {/* {randomImages && randomImages.length > 0 && (
                                <PhotoCards posts={randomImages} />
                            )} */}
                        </div>
                    </div>
                </Link>

                {/* Share & Remix Card */}
                <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 p-6 md:p-8 col-span-1 md:col-span-3 h-[230px]">
                    <h3 className="text-2xl font-bold mb-1">{phrase(dictionary, "makeVideo", language)}</h3>
                    <p className="text-md mb-6">{phrase(dictionary, "shareYourInfiniteImagination", language)}</p>
                    <div className="flex justify-end gap-2 h-[200px] overflow-hidden">
                        {randomVideos.map((post, index) => (
                            <div
                                key={post.id}
                                className={`overflow-hidden relative ${index !== 0 ? '-ml-8' : ''}`}
                                style={{ zIndex: randomVideos.length - index }}
                            >
                                <video
                                    src={getVideoUrl(post.video)}
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                    className="rounded-full object-cover w-40 h-40 border-2 border-white/30 hover:translate-y-[10px] transition-all duration-300 ease-in-out"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className='h-[10vh]' />
            <NotEnoughStarsDialog showNotEnoughStarsModal={showNotEnoughStarsModal} setShowNotEnoughStarsModal={setShowNotEnoughStarsModal} stars={stars} createMediaPrice={createMediaPrice} />
        </div >
    )
}


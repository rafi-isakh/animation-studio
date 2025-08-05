'use client'
import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus, Video, Loader2, ArrowRight, RefreshCcw, RotateCw, Share } from "lucide-react"
import { Button } from "@/components/shadcnUI/Button"
import { ToonyzPost, Webnovel } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import Link from "next/link";
import { MdStars } from "react-icons/md";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { useCreateMedia } from "@/contexts/CreateMediaContext";
import { useToast } from "@/hooks/use-toast";
import NotEnoughStarsDialog from "@/components/UI/NotEnoughStarsDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/shadcnUI/Tabs";
import { useWebnovels } from "@/contexts/WebnovelsContext";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext"
import MyToonyzPostsList from "@/components/UI/MyToonyzPostsList";


export default function CreateMediaHistoryContents({ stars, source, chapterIds }: { stars: number, source: 'webnovel' | 'chapter', chapterIds?: number[] }) {
    // const [initialPosts, setInitialPosts] = useState<ToonyzPost[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const { english_stars } = useUser();
    const [error, setError] = useState<string | null>(null);
    const { dictionary, language } = useLanguage();
    const { setOpenDialog, loadingVideoGeneration, generateTrailer, setShareType, setShowShareAsPostModal, setPicture } = useCreateMedia();
    const { toast } = useToast();
    const [showNotEnoughStarsModal, setShowNotEnoughStarsModal] = useState(false);
    const [createMediaPrice, setCreateMediaPrice] = useState(0);
    const { webnovels } = useWebnovels();
    const { isLoggedIn } = useAuth();
    const { nickname, email } = useUser();
    const [editingPostId, setEditingPostId] = useState<number | null>(null);


    // useEffect(() => {
    //     fetch('/api/get_toonyz_posts')
    //         .then(res => {
    //             if (!res.ok) {
    //                 throw new Error('Failed to fetch posts');
    //             }
    //             return res.json();
    //         })
    //         .then(data => {
    //             setInitialPosts(data);
    //             setInitialLoading(false);
    //         })
    //         .catch(error => {
    //             console.error('Error fetching posts:', error);
    //             setError('Failed to load posts. Please try again later.');
    //             setInitialLoading(false);
    //         });
    // }, []);

    const initialPosts = [
        {
            id: 1,
            title: "Toonyz Post 1",
            image: "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/0-1739847713252.png",
            user: {
                id: 1,
                name: "John Doe",
                email: "john.doe@example.com",

            },
            webnovel_id: "1",
            chapter_id: "1",
            created_at: new Date(),
            views: 100,
            quote: "This is the first Toonyz Post",
        },
        {
            id: 2,
            title: "Toonyz Post 2",
            image: "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/0-1739848305012.png",
            user: {
                id: 1,
                name: "John Doe",
                email: "john.doe@example.com",

            },
            webnovel_id: "1",
            chapter_id: "1",
            created_at: new Date(),
            views: 100,
            quote: "This is the first Toonyz Post",
        },
        {
            id: 3,
            title: "Toonyz Post 3",
            description: "This is the third Toonyz Post",
            image: "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/0-1739850897741.png",
            user: {
                id: 1,
                name: "John Doe",
                email: "john.doe@example.com",

            },
            webnovel_id: "1",
            chapter_id: "1",
            created_at: new Date(),
            views: 100,
            quote: "This is the first Toonyz Post",
        },
        {
            id: 4,
            title: "Toonyz Post 4",
            description: "This is the fourth Toonyz Post",
            image: "https://toonyzbucket.s3.ap-northeast-2.amazonaws.com/0-1739858132577.png",
            user: {
                id: 1,
                name: "John Doe",
                email: "john.doe@example.com",

            },
            webnovel_id: "1",
            chapter_id: "1",
            created_at: new Date(),
            views: 100,
            quote: "This is the first Toonyz Post",
        },
    ]

    const breakpointCols = {
        default: 2,
    }

    const buttonList = [
        {
            id: 'post',
            icon: <Share size={10} />,
            tooltipText: 'Post to Toonyz',
            onClick: (post: any) => {
                setShareType('image');
                setShowShareAsPostModal(true);
                setPicture(post.image);
            },
            className: 'bg-[#DE2B74] hover:bg-pink-400'
        },
        {
            id: 'edit',
            icon: <RotateCw size={10} />,
            tooltipText: 'Edit Prompt',
            onClick: (postId?: number) => {
                if (postId !== undefined) {
                    setEditingPostId(postId);
                }
            },
            className: 'bg-[#4B5563] hover:bg-gray-500'
        }
    ]


    return (
        <div className="min-h-screen md:px-2">
            <div className="w-full mx-auto h-full">
                <Tabs defaultValue="toonyz_post">
                    <TabsList className="relative w-full bg-gray-200 dark:bg-black rounded-lg gap-1">
                        <TabsTrigger value="toonyz_post" className="w-full data-[state=active]:bg-white dark:data-[state=active]:bg-[#222225] rounded-md ">
                            {phrase(dictionary, "my_posts", language)}
                        </TabsTrigger>
                        <TabsTrigger value="all_media" className="w-full data-[state=active]:bg-white dark:data-[state=active]:bg-[#222225] rounded-md ">
                            {phrase(dictionary, "posts_history", language)}
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="toonyz_post">
                        {isLoggedIn ? <MyToonyzPostsList webnovels={webnovels} nickname={nickname} email={email} />
                            : <div>
                                <div className="relative w-full h-32 bg-[#FECACA] mb-4 rounded-lg">
                                    <Link href="/signin">
                                        <div className="absolute inset-0 overflow-hidden">
                                        </div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-black dark:text-black">
                                            <p className="md:text-lg text-xs mb-1">{phrase(dictionary, "signup_description", language)}</p>

                                            <h2 className="md:text-2xl text-lg font-bold">
                                                <span className="inline-flex items-center justify-center bg-[#D92979] text-white w-6 h-6 rounded-full mx-1">
                                                    <MdStars className="text-lg md:text-xl text-white" />
                                                </span>{" "}
                                                {phrase(dictionary, "do_signup", language)}
                                            </h2>
                                        </div>
                                    </Link>
                                </div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 py-2 text-center">
                                    {phrase(dictionary, "pleaseLogin_description", language)}
                                </p>
                            </div>
                        }
                    </TabsContent>
                    <TabsContent value="all_media">
                        {isLoggedIn ? <div className="relative md:max-w-screen-xl mx-auto w-full min-h-screen">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 py-2 text-center">
                                {phrase(dictionary, "toonyz_post_service_preparing", language)}
                            </p>

                        </div> : <div className="relative md:max-w-screen-xl mx-auto w-full min-h-screen">
                            <div className="absolute inset-0  backdrop-blur-md z-50 rounded-lg">
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 py-2 text-center">
                                    {phrase(dictionary, "toonyz_post_service_preparing", language)}
                                </p>
                            </div>

                        </div>}
                    </TabsContent>
                </Tabs>
                <div className='h-[10vh]' />
            </div>
            <NotEnoughStarsDialog showNotEnoughStarsModal={showNotEnoughStarsModal} setShowNotEnoughStarsModal={setShowNotEnoughStarsModal} stars={stars} english_stars={english_stars} createMediaPrice={createMediaPrice} />
        </div>
    )
}


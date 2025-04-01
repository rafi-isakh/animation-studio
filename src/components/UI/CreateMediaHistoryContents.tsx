'use client'
import { useEffect, useState } from "react"
import Image from "next/image"
import { Plus, Video, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/shadcnUI/Button"
import { ToonyzPost, Webnovel } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import Link from "next/link";
import PhotoCards from "@/components/UI/PhotoCards";
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
    const [initialPosts, setInitialPosts] = useState<ToonyzPost[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { dictionary, language } = useLanguage();
    const { setOpenDialog, loadingVideoGeneration, generateTrailer } = useCreateMedia();
    const { toast } = useToast();
    const [showNotEnoughStarsModal, setShowNotEnoughStarsModal] = useState(false);
    const [createMediaPrice, setCreateMediaPrice] = useState(0);
    const { webnovels } = useWebnovels();
    const { isLoggedIn } = useAuth();
    const { nickname, email } = useUser();


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



    return (
        <div className="min-h-screen md:px-2">
            <div className="w-full mx-auto h-full">
                <Tabs defaultValue="toonyz_post">
                    <TabsList className="relative w-full bg-gray-200 dark:bg-black rounded-lg gap-1">
                        <TabsTrigger value="toonyz_post" className="w-full data-[state=active]:bg-white dark:data-[state=active]:bg-[#222225] rounded-md ">
                            My Toonyz Posts
                        </TabsTrigger>
                        <TabsTrigger value="all_media" className="w-full data-[state=active]:bg-white dark:data-[state=active]:bg-[#222225] rounded-md ">
                            All Contents
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="toonyz_post">
                    {isLoggedIn ? <MyToonyzPostsList webnovels={webnovels} nickname={nickname} email={email} />
                                : "Login to see your Toonyz Posts"}

                    </TabsContent>
                    <TabsContent value="all_media">Change your password here.</TabsContent>
                </Tabs>
                <div className='h-[10vh]' />
            </div>
            <NotEnoughStarsDialog showNotEnoughStarsModal={showNotEnoughStarsModal} setShowNotEnoughStarsModal={setShowNotEnoughStarsModal} stars={stars} createMediaPrice={createMediaPrice} />
        </div >
    )
}


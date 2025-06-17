'use client'
import { useEffect, useState } from "react"
import Image from "next/image"
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
import NotEnoughTicketsDialog from "@/components/UI/NotEnoughTicketsDialog";
import { useUser } from "@/contexts/UserContext";
import { BsFillTicketPerforatedFill } from "react-icons/bs"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/shadcnUI/Tabs";
import { Badge } from "@/components/shadcnUI/Badge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/shadcnUI/Card";
import { Heart, Plus, BookOpen, TrendingUp, Loader2, User, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/shadcnUI/Carousel";

export default function CreateMediaDefaultContents({ source, webnovelId, chapterIds }: { source: 'webnovel' | 'chapter', webnovelId?: string, chapterIds?: number[] }) {
    const [initialPosts, setInitialPosts] = useState<ToonyzPost[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { dictionary, language } = useLanguage();
    const { setOpenDialog, loadingVideoGeneration, generateTrailer, isLoading } = useCreateMedia();
    const { toast } = useToast();
    const [showNotEnoughTicketsModal, setShowNotEnoughTicketsModal] = useState(false);
    const [createMediaPrice, setCreateMediaPrice] = useState(0);
    const { tickets } = useUser();
    const [activeTab, setActiveTab] = useState('home');
    const [userRanking, setUserRanking] = useState<ToonyzPost[]>([]);

    useEffect(() => {
        // TODO: refactor the backend to use webnovel_id
        // TODO: create ToonyzPostsContext like WebnovelsContext
        fetch('/api/get_toonyz_posts')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch posts');
                }
                return res.json();
            })
            .then(data => {
                let posts: ToonyzPost[] = data;
                // if (webnovelId) {
                //     posts = posts.filter(post => post.webnovel_id.toString() === webnovelId);
                // }
                const sorted = [...posts].sort((a, b) => b.upvotes - a.upvotes);
                setUserRanking(sorted);
                setInitialPosts(sorted.slice(0, 15));
                setInitialLoading(false);
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
                setError('Failed to load posts. Please try again later.');
                setInitialLoading(false);
            });
    }, [webnovelId]);




    return (
        <main className="flex-1">
            <Tabs defaultValue="home" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-2">
                    <TabsList className="flex flex-row gap-2 bg-transparent">
                        <TabsTrigger value="home" className="px-4 py-1 font-medium text-base border border-gray-200 rounded-full data-[state=active]:bg-[#DE2979] data-[state=active]:text-white bg-white text-black hover:bg-gray-200">
                            {phrase(dictionary, 'toonyz_post_home', language)}
                        </TabsTrigger>
                        <TabsTrigger value="posts" className="font-medium text-base border border-gray-200 rounded-full data-[state=active]:bg-[#DE2979] data-[state=active]:text-white bg-white text-black hover:bg-gray-200">
                            {phrase(dictionary, 'toonyz_post_feed', language)}
                        </TabsTrigger>
                    </TabsList>
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <TabsContent value="home" className="flex-shrink-0 space-y-8 mt-0">
                            <section>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-pink-400 to-pink-100 p-8 text-white"
                                >
                                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-4">
                                            <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-xl">New</Badge>
                                            <h2 className="text-3xl font-bold break-keep">
                                                {phrase(dictionary, "welcomeToToonyzAI", language)}
                                            </h2>
                                            <p className="max-w-[600px] text-white/80 break-keep">

                                                {
                                                    source === 'webnovel' ? phrase(dictionary, "letAIGenerateForFull", language)
                                                        : phrase(dictionary, "selectTextAndLetAI", language)
                                                }
                                            </p>
                                            <div className="flex flex-wrap gap-3">
                                                <div className="flex gap-2">
                                                    {
                                                        source == 'webnovel' &&
                                                        <Button
                                                            variant="outline"
                                                            className="rounded-full bg-white text-black hover:bg-gray-200 font-medium text-base"
                                                            disabled={loadingVideoGeneration || !chapterIds || chapterIds.length === 0}
                                                            onClick={() => {
                                                                if (tickets < 2) {
                                                                    setCreateMediaPrice(2)
                                                                    setShowNotEnoughTicketsModal(true);
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
                                                            {phrase(dictionary, "generateButton", language)} <BsFillTicketPerforatedFill className="text-lg md:text-xl text-[#D92979]" />2
                                                        </Button>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <div className="hidden lg:block">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 50, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                                className="relative h-40 w-40"
                                            >
                                                <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-md" />
                                                <div className="absolute inset-4 rounded-full bg-white/20" />
                                                <div className="absolute inset-8 rounded-full bg-white/30" />
                                                <Image src='/images/N_logo.svg' alt='toonyz ai logo' width={20} height={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover z-50" />
                                                <div className="absolute inset-12 rounded-full bg-white/40" />
                                                <div className="absolute inset-16 rounded-full bg-white/50" />
                                            </motion.div>
                                        </div>
                                    </div>
                                </motion.div>
                            </section>

                            <section className="flex-shrink-0">
                                <div className="px-4 flex items-center justify-between">
                                    <h2 className="text-2xl font-semibold">{phrase(dictionary, "communityHighlights", language)}</h2>
                                    <Button variant="ghost" className="rounded-2xl">
                                        <Link href="/feed" className="flex items-center gap-2">
                                            {phrase(dictionary, "toonyz_explore", language)} <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>

                                <div className="flex justify-center">
                                    <Carousel
                                        opts={{
                                            align: "start",
                                        }}
                                        className="md:w-[400px] w-full "
                                    >
                                        <CarouselContent>
                                            {initialPosts.map((post, index) => (
                                                <motion.div key={index} className="flex-shrink-0" whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                                    <CarouselItem key={index} className="basis-1/2 md:basis-1/3">
                                                        <div className="pt-4">
                                                            <Link href={`/toonyz_posts/${post.id}`}>
                                                                <Card className="w-full h-full">
                                                                    <CardContent className="relative flex flex-col items-center justify-center p-0">
                                                                        {post.image ?
                                                                            <div className="w-[180px] flex items-center justify-center">
                                                                                <Image
                                                                                    src={getImageUrl(post.image)}
                                                                                    alt={post.title}
                                                                                    width={150}
                                                                                    height={150}
                                                                                    className="w-full h-full object-cover rounded-t-xl"
                                                                                />

                                                                            </div>
                                                                            :
                                                                            <div className="w-[180px] flex items-center justify-center">
                                                                                <video
                                                                                    src={getVideoUrl(post.video)}
                                                                                    autoPlay
                                                                                    muted
                                                                                    loop
                                                                                    playsInline
                                                                                    width={150}
                                                                                    height={150}
                                                                                    className="w-full h-full object-cover rounded-t-xl"
                                                                                />
                                                                            </div>
                                                                        }
                                                                        <div className="flex flex-col items-center justify-center w-full">
                                                                            <div className="text-sm text-gray-500 py-2 px-4 w-full">
                                                                                {post.title}
                                                                            </div>
                                                                            <div className="flex items-center justify-between text-sm text-muted-foreground px-4 py-2 w-full">
                                                                                <div className="flex items-center">
                                                                                    <User className="mr-1 h-4 w-4" />
                                                                                    {post.user.nickname}
                                                                                </div>
                                                                                <div className="flex items-center">
                                                                                    <Heart className="mr-1 h-4 w-4 text-pink-500" />
                                                                                    {post.upvotes}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            </Link>
                                                        </div>
                                                    </CarouselItem>
                                                </motion.div>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious disabled={initialPosts.length <= 1} className={`absolute top-1/2 left-1 transform -translate-y-1/2 border-0 text-gray-200 ${initialPosts.length <= 1 ? "opacity-0" : "opacity-100"}`} />
                                        <CarouselNext disabled={initialPosts.length <= 1} className={`absolute top-1/2 right-1 transform -translate-y-1/2 border-0 text-gray-200 ${initialPosts.length <= 1 ? "opacity-0" : "opacity-100"}`} />
                                    </Carousel>
                                </div>

                            </section>
                        </TabsContent>

                        <TabsContent value="posts" className="space-y-8 mt-0">
                            <section>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600  p-8 text-white"
                                >

                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-bold break-keep">{phrase(dictionary, "recentToonyzPosts", language)}</h2>
                                            <p className="max-w-[600px] text-white/80 break-keep">
                                                {phrase(dictionary, "recentToonyzPostsDescription", language)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            </section>

                            <section className="px-4">
                                <h2 className="pb-4 text-2xl font-semibold">{phrase(dictionary, "recentPosts", language)}</h2>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-2">
                                    {initialPosts.map((post, index) => (
                                        <motion.div key={index} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                            <Link href={`/toonyz_posts/${post.id}`}>
                                                <Card className="overflow-hidden rounded-3xl border hover:border-primary/50 transition-all duration-300">
                                                    <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                                                        {post.image && <Image src={getImageUrl(post.image)} alt={post.title} fill className="object-cover" />}
                                                        {post.video && <video src={getVideoUrl(post.video)} autoPlay muted loop playsInline className="object-cover" />}
                                                    </div>
                                                    <CardHeader>
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle>{post.title || post.id}</CardTitle>
                                                        </div>
                                                        <CardDescription>{post.content}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4 ">
                                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                            <div className="flex items-center">
                                                                <User className="mr-1 h-4 w-4" />
                                                                {post.user.nickname}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Heart className="mr-1 h-4 w-4 text-pink-500" />
                                                                {post.upvotes}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </motion.div>
                                    ))}
                                        <motion.div className="col-span-1" whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                                            {source == 'webnovel' &&
                                                <Button
                                                    variant="link"
                                                    className="!no-underline bg-muted/50 flex w-full h-full flex-col items-center justify-center rounded-3xl border border-dashed hover:border-primary/50 transition-all duration-300"
                                                    disabled={loadingVideoGeneration || !chapterIds || chapterIds.length === 0}
                                                    onClick={() => {
                                                        if (tickets < 2) {
                                                            setCreateMediaPrice(2)
                                                            setShowNotEnoughTicketsModal(true);
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
                                                    {loadingVideoGeneration ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : (
                                                        <>
                                                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-300">
                                                                <Plus className="h-6 w-6" />
                                                            </div>
                                                            <h3 className="text-md font-medium text-center">
                                                                {phrase(dictionary, "createNewSlideShow", language)}
                                                            </h3>
                                                            <p className="mb-4 text-center text-xs text-muted-foreground">
                                                                {phrase(dictionary, "createNewSlideShowDescription", language)}
                                                            </p>
                                                        </>
                                                    )}
                                                </Button>
                                            }
                                        </motion.div>
                                </div>
                            </section>

                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
            <NotEnoughTicketsDialog showNotEnoughTicketsModal={showNotEnoughTicketsModal} setShowNotEnoughTicketsModal={setShowNotEnoughTicketsModal} Tickets={tickets} createMediaPrice={createMediaPrice} />
        </main >
    )
}


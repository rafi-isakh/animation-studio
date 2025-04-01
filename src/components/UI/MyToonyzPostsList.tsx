import { cn } from "@/lib/utils"
import {
    ArrowRight,
    Loader2,
    Ellipsis,
    Flag,
    Share2,
    Trash
} from "lucide-react"
import React, { useRef } from "react"
import { Webnovel, ToonyzPost } from "@/components/Types"
import Link from "next/link"
import { phrase } from '@/utils/phrases'
import { useLanguage } from "@/contexts/LanguageContext"
import OtherTranslateComponent from "@/components/OtherTranslateComponent"
import { useEffect, useState } from "react"
import { useUser } from "@/contexts/UserContext"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { truncateText } from "@/utils/truncateText";
import { Skeleton } from "@/components/shadcnUI/Skeleton";
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { formatRelativeTime } from "@/utils/formatTime"
import moment from "moment";
import { Button } from "@/components/shadcnUI/Button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcnUI/Popover";
import ShareDialog from "@/components/UI/ShareDialog";
import { Dialog } from "@/components/shadcnUI/Dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/shadcnUI/AlertDialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createEmailHash } from "@/utils/cryptography";

const MyToonyzPostsList = ({ webnovels, nickname, email, className }:
    { webnovels: Webnovel[], nickname: string | null | undefined, email: string | null | undefined, className?: string }) => {
    const { language, dictionary } = useLanguage();
    const [posts, setPosts] = useState<ToonyzPost[]>([]);
    const { email_hash } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/get_toonyz_posts');
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                const data = await response.json();
                const filteredPosts = data.filter((post: any) =>
                    post.user.email_hash === email_hash
                );

                setPosts(filteredPosts);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        };
        fetchPosts();
    }, [email_hash]);

    const handleDeletePost = async (postId: string) => {
        try {
            const response = await fetch(`/api/delete_toonyz_post?id=${postId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                toast({
                    title: "Error deleting post",
                    description: "Please try again",
                    variant: "destructive",
                });
                console.error("Error deleting post, try again", response);
            }
            toast({
                title: "Post deleted",
                description: "Your post has been deleted",
                variant: "success",
            });
            router.push("/feeds");
        } catch (error) {
            console.error("Error deleting post", error);
            toast({
                title: "Error deleting post",
                description: "Please try again",
                variant: "destructive",
            });
        }
    }


    return (
        <div className={cn("w-full scrollbar-none flex flex-col gap-3", className)}>
            <div className="flex flex-col gap-3 min-w-full p-1 md:p-0">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Skeleton className="w-full h-[300px]" />
                        <Skeleton className="w-full h-[20px]" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {phrase(dictionary, "noPosts", language)}
                        </p>
                    </div>
                ) : (
                    posts.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col w-full"
                        >

                            <div className="flex flex-col capitalize py-2">
                                <p className="text-xl font-extrabold text-zinc-600 dark:text-zinc-400">
                                    {isToday(new Date(item.created_at))
                                        ? 'Today'
                                        : isYesterday(new Date(item.created_at))
                                            ? 'Yesterday'
                                            : formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                </p>
                            </div>

                            <div className="relative w-full">
                                <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                                    <Link href={`/toonyz_posts/${item.id}`}>
                                        {item.image ? <Image
                                            src={getImageUrl(item.image)}
                                            alt={item.title}
                                            className="rounded-lg object-cover"
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        /> : <video
                                            ref={videoRef}
                                            src={getVideoUrl(item.video)}
                                            className="rounded-lg object-cover w-full h-full"
                                            controls
                                            autoPlay={true}
                                            playsInline={true}
                                            muted={true}
                                            loop={true}
                                            onMouseEnter={(e) => e.currentTarget.play()}
                                            onMouseLeave={(e) => e.currentTarget.pause()}
                                        />}
                                    </Link>
                                </div>

                            </div>
                            <div className="flex flex-row justify-between py-2">

                                <div>
                                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                                        {item.title}
                                    </h3>

                                    <div className="flex flex-row gap-2">
                                        <p className="text-xs font-medium">{item.user.nickname}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {moment(item.created_at).format('MM/DD hh:mm')} •
                                            {formatRelativeTime(item.created_at.toString())}
                                        </p>
                                    </div>
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="dark:text-white text-gray-500 rounded-full"
                                        >
                                            <Ellipsis className="w-3.5 h-3.5 " />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-fit">
                                        <ul className="relative w-full flex flex-col gap-2">
                                            <Link
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setShowShareDialog(true);
                                                }}
                                                className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">
                                                <Share2 size={10} className="dark:text-white text-gray-500" />
                                                {phrase(dictionary, "share", language)}
                                            </Link>
                                            <TooltipProvider delayDuration={0}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link
                                                            href="#"
                                                            className="text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500 ">
                                                            <Flag size={10} className="dark:text-white text-gray-500" />
                                                            {phrase(dictionary, "report", language)}
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {phrase(dictionary, "preparing", language)}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            {email && createEmailHash(email) === item.user.email_hash &&
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild >
                                                        <Link
                                                            href="#"
                                                            key="delete"
                                                            onClick={(e) => {
                                                                e.preventDefault
                                                                setShowDeleteModal(true);
                                                            }}
                                                            className='text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500'>
                                                            <Trash size={10} className="dark:text-white text-gray-500" />
                                                            {phrase(dictionary, "delete", language)}
                                                        </Link>
                                                    </AlertDialogTrigger>

                                                    {/* delete modal */}
                                                    <AlertDialogContent className="dark:bg-[#211F21] bg-white">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{phrase(dictionary, "deletePost", language)}</AlertDialogTitle>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                {phrase(dictionary, "cancel", language)}
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => {
                                                                    handleDeletePost(item.id.toString());
                                                                    setShowDeleteModal(false);
                                                                }}>
                                                                {phrase(dictionary, "delete", language)}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            }
                                        </ul>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                                <ShareDialog url={`${process.env.NEXT_PUBLIC_HOST}/toonyz_posts/${item.id}`} description={`Share this post with your friends and family.`} />
                            </Dialog>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default MyToonyzPostsList;
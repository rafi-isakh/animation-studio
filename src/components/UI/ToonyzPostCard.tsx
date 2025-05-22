"use client"

import { useState } from "react"
import { Heart, Share2, MoreHorizontal, Trash, Flag } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar"
import { Button } from "@/components/shadcnUI/Button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/shadcnUI/Card"
import { ToonyzPost, Webnovel, User } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import { formatRelativeTime } from "@/utils/formatTime"
import moment from "moment"
import Image from "next/image"
import WatermarkedImage from "@/utils/watermark"
import { truncateText } from "@/utils/truncateText"
import ToonyzPostQuoteToggle from "@/components/UI/ToonyzPostQuoteToggle"
import Link from "next/link"
import { Dialog, DialogTrigger } from "@/components/shadcnUI/Dialog"
import ShareDialog from "@/components/UI/ShareDialog"
import { useUser } from '@/contexts/UserContext';
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import CommentToggleButton from "@/components/UI/CommentToggleButton";
import ToonyzPostDropdownButton from "./ToonyzPostDropdownButton"


export default function ToonyzPostCard({ post, webnovel, user, email }: { post: ToonyzPost, webnovel: Webnovel, user?: User, email?: string }) {
    const [liked, setLiked] = useState(false)
    const { id, email_hash } = useUser();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { dictionary, language } = useLanguage();
    const [isSharing, setIsSharing] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const handleShareClick = async () => {
        if (isSharing) return; // Prevent multiple simultaneous share attempt
        if (navigator.share) {
            try {
                setIsSharing(true);
                await navigator.share({
                    title: post.user.nickname,
                    text: phrase(dictionary, "share_post", language),
                    url: `${process.env.NEXT_PUBLIC_HOST}/toonyz_posts/${post.id}`
                });
            } catch (error) {
                console.log('Share failed:', error);
            } finally {
                setIsSharing(false);
            }
        } else {
            setShowShareModal(true);
        }
    }

    return (
        <Card key={post.id} className="max-w-xl w-full mx-auto p-2 shadow-none">
            <CardHeader className="flex flex-row items-center gap-4 p-4">
                <Avatar className="h-10 w-10">
                    {post.user.picture ? <AvatarImage src={getImageUrl(post.user.picture)} alt={post.user.nickname} /> : <AvatarFallback>{post.user.nickname.charAt(0)}</AvatarFallback>}
                </Avatar>
                <div className="flex flex-col">
                    <p className="text-sm font-medium">{post.user.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                        {moment(post.created_at).format('MM/DD hh:mm')} •
                        {formatRelativeTime(post.created_at.toString())}
                    </p>
                </div>
                <div className="ml-auto">
                    <ToonyzPostDropdownButton
                        email={email ?? ""}
                        user={post.user}
                        postId={post.id.toString()}
                        post={post}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">

                <p className="text-sm space-y-2">
                    {post.content}
                    {post.quote && (<ToonyzPostQuoteToggle quote={post.quote} postId={post.id.toString()} defaultExpanded={false} />)}
                </p>

                <div className="flex flex-row gap-2 justify-center">

                    <Button
                        variant="ghost"
                        size="sm"
                        className={`inline-flex items-center gap-1 ${liked ? "text-red-500" : ""}`}
                    // onClick={handleLike}
                    >
                        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                        {post.upvotes > 0 ? `${post.upvotes} ${phrase(dictionary, "likes", language)}` : "Like"}
                    </Button>
                    <Dialog>
                        <Button variant="ghost" size="sm" className="inline-flex items-center gap-1" onClick={handleShareClick}>
                            <Share2 className="h-4 w-4" />
                            {phrase(dictionary, "share", language)}
                        </Button>
                        <ShareDialog url={`${process.env.NEXT_PUBLIC_HOST}/toonyz_posts/${post.id}`} description={`Share this post with your friends and family.`} />
                    </Dialog>
                </div>
                <div className="mt-4 rounded-md overflow-hidden">
                    <Link href={`/toonyz_posts/${post.id}`} >
                        {post.image && (
                            <Image src={getImageUrl(post.image)} alt={post.title} width={800} height={600} className="w-full h-auto object-cover" />
                            // <WatermarkedImage
                            //     imageUrl={getImageUrl(post.image)}
                            //     watermarkUrl="/toonyz_logo_white.svg"
                            //     webnovelTitle={webnovel?.title}
                            //     chapterTitle={webnovel?.chapters.find((chapter: { id: number, title: string }) =>
                            //         chapter.id.toString() === post.chapter_id
                            //     )?.title || post.chapter_id}
                            //     watermarkOpacity={0.2}
                            //     watermarkPosition="centerRight"
                            //     titlePosition="centerLeft"
                            //     titleColor="white"
                            //     className="object-cover overflow-hidden scale-125 transition-all duration-300 group-hover:blur-sm"
                            // />

                        )}
                        {post.video && (
                            <video src={getVideoUrl(post.video)} autoPlay playsInline muted loop className="w-full h-auto object-cover" />
                        )}
                    </Link>
                </div>
            </CardContent>
            <CardFooter className="p-4 border-t flex gap-2 justify-center">
                <CommentToggleButton post={post} />
            </CardFooter>
        </Card>
    )
}


"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash, Flag } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar"
import { Button } from "@/components/shadcnUI/Button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/shadcnUI/Card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcnUI/DropdownMenu"
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
import { createEmailHash } from '@/utils/cryptography'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/shadcnUI/AlertDialog"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import CommentToggleButton from "@/components/UI/CommentToggleButton";

export default function ToonyzPostCard({ post, webnovel, user, email }: { post: ToonyzPost, webnovel: Webnovel, user?: User, email?: string }) {
    const [liked, setLiked] = useState(false)
    const { id, email_hash } = useUser();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const { dictionary, language } = useLanguage();

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
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {/* <DropdownMenuItem>Save post</DropdownMenuItem> */}
                            {createEmailHash(email || "") === user?.email_hash &&
                                <>
                                    <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem onSelect={(e) => {
                                                // This prevents the dropdown from closing
                                                e.preventDefault();
                                                setShowDeleteModal(true);
                                            }}>
                                                <div className='text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500'>
                                                    <Trash size={10} className="dark:text-white text-gray-500" />
                                                    {phrase(dictionary, "delete", language)}
                                                </div>
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
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
                                                        // handleDeleteComment(comment.id.toString());
                                                        setShowDeleteModal(false);
                                                    }}>
                                                    {phrase(dictionary, "delete", language)}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            }
                            <DropdownMenuItem>
                                <div className='text-sm font-base flex flex-row items-center gap-2 dark:text-white text-gray-500'>
                                    <Flag size={10} className="dark:text-white text-gray-500" />
                                    {phrase(dictionary, "report", language)}
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="inline-flex items-center gap-1">
                                <Share2 className="h-4 w-4" />
                                {phrase(dictionary, "share", language)}
                            </Button>
                        </DialogTrigger>
                        <ShareDialog url={`${process.env.NEXT_PUBLIC_HOST}/toonyz_posts/${post.id}`} description={`Share this post with your friends and family.`} />
                    </Dialog>
                </div>
                <div className="mt-4 rounded-md overflow-hidden">
                    <Link href={`/toonyz_posts/${post.id}`} >
                        {post.image && (
                            <WatermarkedImage
                                imageUrl={getImageUrl(post.image)}
                                watermarkUrl="/toonyz_logo_white.svg"
                                webnovelTitle={webnovel?.title}
                                chapterTitle={webnovel?.chapters.find((chapter: { id: number, title: string }) =>
                                    chapter.id.toString() === post.chapter_id
                                )?.title || post.chapter_id}
                                watermarkOpacity={0.2}
                                watermarkPosition="centerRight"
                                titlePosition="centerLeft"
                                titleColor="white"
                                className="object-cover overflow-hidden scale-125 transition-all duration-300 group-hover:blur-sm"
                            />

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


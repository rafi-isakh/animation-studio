"use client"

import { useState } from "react"
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar"
import { Button } from "@/components/shadcnUI/Button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/shadcnUI/Card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcnUI/DropdownMenu"
import { ToonyzPost, Webnovel } from "@/components/Types"
import { getImageUrl, getVideoUrl } from "@/utils/urls"
import { formatRelativeTime } from "@/utils/formatTime"
import moment from "moment"
import Image from "next/image"
import WatermarkedImage from "@/utils/watermark"
import { truncateText } from "@/utils/truncateText"
import ToonyzPostQuoteToggle from "./ToonyzPostQuoteToggle"
import Link from "next/link"

export default function ToonyzPostCard({ post, webnovel }: { post: ToonyzPost, webnovel: Webnovel }) {
    const [liked, setLiked] = useState(false)

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
                            <DropdownMenuItem>Save post</DropdownMenuItem>
                            <DropdownMenuItem>Delete post</DropdownMenuItem>
                            <DropdownMenuItem>Report</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm space-y-2">
                    {post.content}

                    {post.quote && (<ToonyzPostQuoteToggle quote={post.quote} postId={post.id.toString()} />)}

                </p>
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
                            <video src={getVideoUrl(post.video)} autoPlay muted loop className="w-full h-auto object-cover" />
                        )}
                    </Link>
                </div>
            </CardContent>
            <CardFooter className="p-4 border-t flex flex-col gap-2">
                <div className="flex items-center text-xs text-muted-foreground">
                    <span>{post.upvotes} likes</span>
                    <span className="mx-2">•</span>
                    <span>{post.comments.length} comments</span>
                    <span className="mx-2">•</span>
                    {/* <span>shares</span> */}
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`flex items-center gap-1 ${liked ? "text-red-500" : ""}`}
                    // onClick={handleLike}
                    >
                        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                        Like
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        Comment
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        Share
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}


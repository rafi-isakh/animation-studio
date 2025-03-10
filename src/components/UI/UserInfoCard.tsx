'use client'

import { useState, useEffect } from "react";
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent
} from "@/components/shadcnUI/HoverCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcnUI/Avatar";
import { Card, CardContent, CardHeader } from "@/components/shadcnUI/Card"
import { ToonyzPost, User, Webnovel } from "@/components/Types";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import { CalendarIcon } from "lucide-react";
import { truncateText } from "@/utils/truncateText";
import { useUser } from "@/contexts/UserContext";
import { useWebnovels } from '@/contexts/WebnovelsContext';
interface UserInfoCardProps {
    post: ToonyzPost;
    user?: User;
}

const UserInfoCard = ({ post, user }: UserInfoCardProps) => {
    const { getWebnovelsMetadataByUserId } = useWebnovels();
    const { email: currentUserEmail } = useUser();
    const [userWebnovels, setUserWebnovels] = useState<Webnovel[]>([]);
    useEffect(() => {
        getWebnovelsMetadataByUserId(post.user.id.toString()).then((webnovels) => {
            setUserWebnovels(webnovels);
        });
    }, [post.user.id]);

    return (
        <Link href={`/view_profile/${post.user.id}`}>
            <HoverCard openDelay={0} closeDelay={0}>
                <HoverCardTrigger>
                    <Avatar className="w-20 h-20">
                        {post.user.picture ? (
                            <div className="dark:bg-[#211F21] bg-white rounded-full w-20 h-20 flex items-center justify-center overflow-hidden">
                                <div className="relative w-full h-full">
                                    <Image
                                        src={getImageUrl(post.user.picture)}
                                        alt={post.user.nickname || 'User'}
                                        fill
                                        className='object-cover'
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-400 rounded-full w-20 h-20 flex items-center justify-center">
                                <svg
                                    className="w-20 h-20 text-gray-100 rounded-full"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                </svg>
                            </div>
                        )}

                    </Avatar>
                </HoverCardTrigger>
                <HoverCardContent className="w-[300px] bg-transparent border-none shadow-none">
                    <Card className="w-full max-w-md rounded-xl shadow-sm">
                        <CardHeader className="pb-0">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-10 w-10 border-2 border-background self-center ">
                                    {post.user.picture ? <AvatarImage src={getImageUrl(post.user.picture)} alt={post.user.nickname} /> : <AvatarFallback>{post.user.nickname.charAt(0)}</AvatarFallback>}
                                </Avatar>
                                <div className="flex flex-1 justify-between mt-2">
                                    <div className="text-center">
                                        <p className="text-muted-foreground mb-1">Stories</p>
                                        {userWebnovels.length > 0 ? <p className="text-xl font-semibold text-[#DE2B74]">{userWebnovels.length}</p> : <p className="text-xl font-semibold text-[#DE2B74]">0</p>}
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground mb-1">Posts</p>
                                        <p className="text-xl font-semibold text-[#DE2B74]">0</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground mb-1">Liked</p>
                                        <p className="text-xl font-semibold text-[#DE2B74]">0</p>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <h2 className="text-2xl font-bold text-gray-500 dark:text-white mb-1">{post.user.nickname}</h2>
                            {/* <p className="text-muted-foreground mb-6">{jobTitle}</p> */}

                            <h3 className="text-lg font-semibold text-gray-500 dark:text-white  mb-2">About</h3>
                            <p className="text-muted-foreground">
                                {post.user.bio ? post.user.bio : "No bio yet"}
                            </p>
                        </CardContent>
                    </Card>

                </HoverCardContent>
            </HoverCard>
        </Link>
    )
}

export default UserInfoCard;
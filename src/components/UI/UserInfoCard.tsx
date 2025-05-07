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
import { Book, CalendarIcon, Eye, Heart } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { getNumberOfLikes } from "@/utils/webnovelUtils";
interface UserInfoCardProps {
    post: ToonyzPost;
    user?: User;
}

const UserInfoCard = ({ post, user }: UserInfoCardProps) => {
    const { dictionary, language } = useLanguage();
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
                    <Avatar className="w-10 h-10">
                        {post.user.picture ? (
                            <div className="dark:bg-[#211F21] bg-white rounded-full w-10 h-10 flex items-center justify-center overflow-hidden">
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
                            <div className="bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-gray-100 rounded-full"
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
                <HoverCardContent className="w-[360px] bg-transparent border-none shadow-none">
                    <Card className="w-full max-w-md rounded-xl shadow-sm p-0 m-0">
                        <CardHeader className="flex flex-col gap-2 p-2">
                            <div className="flex flex-col justify-center items-center gap-2">
                                <Avatar className="h-10 w-10 border-2 border-background justify-center items-center mx-auto">
                                    {post.user.picture ? <AvatarImage src={getImageUrl(post.user.picture)} alt={post.user.nickname} />
                                                       : <AvatarFallback>{post.user.nickname.charAt(0)}</AvatarFallback>}
                                </Avatar>
                                <div className="flex flex-col">
                                    <h2 className="text-center text-2xl font-bold text-gray-500 dark:text-white mb-1">{post.user.nickname}</h2>
                                    <div className="flex flex-row gap-4 justify-center items-center text-gray-600 dark:text-white">
                                        <div className='flex flex-col justify-center items-center pr-2 border-r border-gray-300 dark:border-gray-700'>
                                            <p className='flex flex-row justify-center items-center gap-1 text-xs'>
                                                <Book size={15} />
                                                <p className='text-sm capitalize'>{phrase(dictionary, "works", language)}</p>
                                                <p className='text-sm text-center text-gray-500'>{userWebnovels.length || 0}</p>
                                            </p>
                                        </div>
                                        <div className='flex flex-col justify-center items-center pr-2 border-r border-gray-300 dark:border-gray-700'>
                                            <p className='flex flex-row justify-center items-center gap-1 text-xs'>
                                                <Eye size={15} />
                                                <p className='text-sm capitalize'>{phrase(dictionary, "views", language)}</p>
                                                <p className='text-sm text-center text-gray-500'>{userWebnovels.reduce((acc: number, novel: Webnovel) => acc + novel.shown_views, 0)}</p>
                                            </p>
                                        </div>
                                        <div className='flex flex-col justify-center items-center'>
                                            <p className='flex flex-row justify-center items-center gap-1 text-xs'>
                                                <Heart size={15} />
                                                <p className='text-sm capitalize'>{phrase(dictionary, "likes", language)}</p>
                                                <p className='text-sm text-center text-gray-500'>{getNumberOfLikes(userWebnovels)}</p>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-9 py-2 pb-4">
                            <div className="flex flex-col text-muted-foreground">
                                <p className="font-bold text-gray-500 dark:text-white"> {phrase(dictionary, "userBio", language)}{" "}</p>
                                <span>{post.user.bio ? <>{post.user.bio}</> : "No bio yet"}</span>
                            </div>
                        </CardContent>
                    </Card>
                </HoverCardContent>
            </HoverCard>
        </Link>
    )
}

export default UserInfoCard;
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent
} from "@/components/shadcnUI/HoverCard";
import { Avatar, AvatarImage } from "@/components/shadcnUI/Avatar";
import { ToonyzPost, User } from "@/components/Types";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/utils/urls";
import { CalendarIcon } from "lucide-react";
import { truncateText } from "@/utils/truncateText";

interface UserInfoCardProps {
    post: ToonyzPost;
    user?: User;
}

const UserInfoCard = ({ post, user }: UserInfoCardProps) => {
    return (
        <Link href={`/view_profile/${post.user.id}`}>
            <HoverCard>
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
                <HoverCardContent className="w-50">
                    <div className="flex  justify-between space-x-4">
                        <Avatar className="w-10 h-10">
                            {post.user.picture ? <AvatarImage src={getImageUrl(post.user.picture)} /> :
                                <div className="bg-gray-400 rounded-full w-10 h-10 flex items-center justify-center">
                                    <svg
                                        className="w-10 h-10 text-gray-100 rounded-full"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                                    </svg>
                                </div>}
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                            <h4 className="text-sm font-semibold">{post.user.nickname}</h4>
                            <p className="text-sm">
                                {truncateText(post.user.bio, 150)}
                            </p>
                            <div className="flex items-center">
                                <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />{" "}
                                <span className="text-xs text-muted-foreground">
                                    Joined 
                                    {/* {post.user.created_at.toLocaleDateString()} */}
                                </span>
                            </div>
                            <div className="flex items-center pt-2 text-sm">
                                <Link href={`/view_profile/${post.user.id}`}>
                                    View Profile
                                </Link>
                            </div>
                        </div>

                    </div>
                </HoverCardContent>
            </HoverCard>
        </Link>
    )
}

export default UserInfoCard;
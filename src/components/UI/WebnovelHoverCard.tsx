'use client'
import Link from "next/link";
import Image from "next/image";
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent
} from "@/components/shadcnUI/HoverCard";
import { Button } from "@/components/shadcnUI/Button";
// Import your utility function
import { getImageUrl } from "@/utils/urls";
import { Webnovel, ToonyzPost } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Star, Share, Heart, Bookmark } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/shadcnUI/Popover";
const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
};

export function WebnovelHoverCard({ webnovel, post }: { webnovel: Webnovel, post: ToonyzPost }) {
    const { dictionary, language } = useLanguage();

    return (
        <HoverCard openDelay={0}>
            <div className="flex flex-row gap-2">
                <HoverCardTrigger asChild>
                    <Button variant="ghost">
                        <p className="text-sm text-gray-500">Novel: {webnovel.title} &#62;</p>
                        {post.chapter_id && (
                            <p className="text-sm text-gray-500">
                                Chapter {webnovel.chapters.find(chapter => chapter.id.toString() === post.chapter_id)?.title || post.chapter_id}
                            </p>
                        )}
                    </Button>
                </HoverCardTrigger>
            </div>
            <HoverCardContent className="w-96"
                onClick={(e) => {
                    e.stopPropagation();
                }} >
                <div className="w-full mx-auto dark:bg-transparent backdrop-blur-sm  bg-white rounded-xl overflow-hidden">
                    <div className="relative  bg-gradient-to-r from-pink-300 to-pink-200/10 dark:from-pink-800 dark:to-purple-900/10 p-6 rounded-t-xl" >
                        <div className="z-10 flex items-start gap-6">
                            {/* Book Cover */}
                            <div className=" min-w-[120px] h-[180px]">
                                <Link href={`/view_webnovels?id=${webnovel.id}`} className="flex-1 md:aspect-[180/257] group">
                                    <Image
                                        src={getImageUrl(webnovel.cover_art)}
                                        alt={webnovel.title}
                                        width={70}
                                        height={100}
                                        className="rounded-md object-cover w-full h-auto"
                                    />
                                    <div className="absolute inset-0 bg-black/80 rounded-md flex flex-col justify-center items-center text-white text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        style={{
                                            backgroundImage: `url(${getImageUrl(webnovel.cover_art)})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            opacity: 0.1
                                        }}
                                    >
                                        {/* <p className="text-center">
                                            View
                                        </p> */}
                                    </div>
                                </Link>
                            </div>
                            {/* Book Info */}
                            <div className="flex-1">
                                <div className="text-gray-700 dark:text-gray-200 text-sm mb-1">{phrase(dictionary, webnovel.genre, language)}</div>
                                <h1 className="text-gray-800 dark:text-white text-xl font-bold mb-1">{webnovel.title}</h1>
                                <div className="text-gray-600 dark:text-gray-200 mb-2">by {webnovel.user.nickname}</div>

                                {/* Rating */}
                                {/* <div className="flex items-center gap-2 mb-6">
                                    <div className="flex">
                                        {[1, 2, 3, 4].map((i) => (
                                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                        <Star className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <span className="text-gray-500 text-sm">314 reviews</span>
                                </div> */}

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                                        <Heart className="w-5 h-5 text-red-500" />
                                    </button>
                                    <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                                        <Bookmark className="w-5 h-5 text-gray-400" />
                                    </button>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                                                <Share className="w-5 h-5 text-gray-400" />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent>
                                            <p>Hello</p>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Engagement Stats */}
                    <div className="grid grid-cols-3 py-4 border-b justify-center">
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{webnovel.upvotes}</div>
                            <div className="text-gray-500 text-sm">Likes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{webnovel.views}</div>
                            <div className="text-gray-500 text-sm">Views</div>
                        </div>
                        {/* <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">103</div>
                            <div className="text-gray-500 text-sm">Reviews</div>
                        </div> */}
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">1024</div>
                            <div className="text-gray-500 text-sm">Redears</div>
                        </div>
                    </div>

                    {/* Synopsis */}
                    <div className="p-6">
                        <p className="text-gray-600 leading-relaxed">
                            {truncateText(webnovel.description, 100)}
                            <Link href={`/view_webnovels?id=${webnovel.id}`} className="">
                                ...Read more
                            </Link>
                        </p>
                    </div>
                </div>
            </HoverCardContent >
        </HoverCard >
    );
}
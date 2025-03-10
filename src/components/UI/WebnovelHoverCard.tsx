'use client'
import Link from "next/link";
import Image from "next/image";
import {
    HoverCard,
    HoverCardTrigger,
    HoverCardContent
} from "@/components/shadcnUI/HoverCard";
import { Button } from "@/components/shadcnUI/Button";
import { getImageUrl } from "@/utils/urls";
import { Webnovel, ToonyzPost } from "@/components/Types";
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Star, Share, Heart, Bookmark, Copy, Eye } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/shadcnUI/DropdownMenu";
import {
    TwitterShareButton,
    TwitterIcon,
    LinkedinShareButton,
    LinkedinIcon,
    TumblrShareButton,
    TumblrIcon,
    TelegramShareButton,
    TelegramIcon,
    WhatsappShareButton,
    WhatsappIcon,
    PinterestShareButton,
    PinterestIcon,
} from "react-share";
import { useCopyToClipboard } from "@/utils/copyToClipboard";
const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
};

// Extract the card content into a separate component
export function WebnovelCard({
    webnovel,
    post,
    showEngagementStats = true,
    showSynopsis = true,
    showActionButtons = true,
    showDetailInfo = true,
    isHoverCard,
}: {
    webnovel: Webnovel,
    post: ToonyzPost,
    showEngagementStats?: boolean,
    showSynopsis?: boolean,
    showActionButtons?: boolean,
    showDetailInfo?: boolean,
    isHoverCard?: boolean
}) {
    const { dictionary, language } = useLanguage();
    const copyToClipboard = useCopyToClipboard();

    function getWebnovelUrl(webnovelId: string) {
        return `${process.env.NEXT_PUBLIC_HOST}/view_webnovels?id=${webnovelId}`;
    }

    return (
        <div className="w-full mx-auto dark:bg-transparent backdrop-blur-sm bg-white rounded-xl overflow-hidden">
            <div className="relative bg-gradient-to-r from-pink-300 to-pink-200/10 dark:from-pink-800 dark:to-purple-900/10 p-6 rounded-t-xl" >
                <div className="z-10 flex items-start gap-6">
                    {/* Book Cover */}
                    <div className="">
                        <Link href={`/view_webnovels?id=${webnovel.id}`} className="flex-1 min-w-[80px] md:aspect-[180/257] group z-[99]">
                            <Image
                                src={getImageUrl(webnovel.cover_art)}
                                alt={webnovel.title}
                                // width={50}
                                // height={70}
                                fill
                                className={`rounded-md object-cover w-full h-auto ${isHoverCard ? 'max-w-[50px]' : 'max-w-[120px]'}`}
                            />
                        </Link>
                        <div className="absolute inset-0 bg-black/80 rounded-md flex flex-col justify-center items-center text-white text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{
                                backgroundImage: `url(${getImageUrl(webnovel.cover_art)})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                opacity: 0.1
                            }}
                        >
                        </div>
                    </div>
                    {/* Book Info */}
                    <div className="flex-1">
                        <div className="text-gray-700 dark:text-gray-200 text-sm mb-1">{phrase(dictionary, webnovel.genre, language)}</div>
                        <h1 className="text-gray-800 dark:text-white text-xl font-bold mb-1">{webnovel.title}</h1>
                        <div className="text-gray-600 dark:text-gray-200 mb-2">by {webnovel.user.nickname}</div>
                        {/* Detail info */}
                        {showDetailInfo && (
                            <div className="text-gray-700 dark:text-gray-200 text-sm mb-1">
                                <p className="inline-flex gap-1"> <Heart className="w-4 h-4 text-red-500" /> {webnovel.upvotes}</p>
                                <p className="inline-flex gap-1"> <Eye className="w-4 h-4 text-gray-400" /> {webnovel.views}</p>
                       
                            </div>
                        )}



                        {/* Action Buttons */}
                        {showActionButtons && (
                            <div className="flex items-center gap-3">
                                <Button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                                    <Heart className="w-5 h-5 text-red-500" />
                                </Button>
                                <Button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                                    <Bookmark className="w-5 h-5 text-gray-400" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="z-[99] w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                            <Share className="w-5 h-5 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="flex flex-col justify-center items-center">
                                        <DropdownMenuLabel>Share this webnovel</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex flex-row gap-2">
                                                <TwitterShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels?id=${webnovel.id}`}>
                                                    <TwitterIcon size={22} round={true} />
                                                </TwitterShareButton>
                                                <WhatsappShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels?id=${webnovel.id}`}>
                                                    <WhatsappIcon size={22} round={true} />
                                                </WhatsappShareButton>
                                                <TelegramShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels?id=${webnovel.id}`}>
                                                    <TelegramIcon size={22} round={true} />
                                                </TelegramShareButton>
                                                <PinterestShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels?id=${webnovel.id}`} media={getImageUrl(webnovel.cover_art)}>
                                                    <PinterestIcon size={22} round={true} />
                                                </PinterestShareButton>
                                                <LinkedinShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels?id=${webnovel.id}`}>
                                                    <LinkedinIcon size={22} round={true} />
                                                </LinkedinShareButton>
                                            </div>
                                            <div className='flex flex-row gap-2 text-center'>
                                                <p className="text-[10px] self-center text-gray-500">{getWebnovelUrl(webnovel.id.toString())}</p>
                                                <Button onClick={() => copyToClipboard(getWebnovelUrl(webnovel.id.toString()))}
                                                    variant="link"
                                                    size="sm"
                                                    className="!no-underline px-3"
                                                >
                                                    <span className="sr-only">Copy</span>
                                                    <Copy />
                                                </Button>
                                            </div>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Engagement Stats */}
            {
                showEngagementStats && (
                    <div className="grid grid-cols-3 py-4 border-b justify-center">
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{webnovel.upvotes}</div>
                            <div className="text-gray-500 text-sm">Likes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{webnovel.views}</div>
                            <div className="text-gray-500 text-sm">Views</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">1024</div>
                            <div className="text-gray-500 text-sm">Redears</div>
                        </div>
                    </div>
                )
            }

            {/* Synopsis */}
            {
             showSynopsis && (
                    <div className="p-6">
                        <p className="text-gray-600 leading-relaxed">
                            {truncateText(webnovel.description, 200)}
                            <Link href={`/view_webnovels?id=${webnovel.id}`} className="">
                                ...Read more
                            </Link>
                        </p>
                    </div>
                )
            }
        </div >
    );
}

// Keep the existing component but use the WebnovelCard inside it with isHoverCard=true
export function WebnovelHoverCard({
    webnovel,
    post,
    showEngagementStats = true,
    showSynopsis = true,
    showActionButtons = true,
    showDetailInfo = true,
    isHoverCard = true
}: {
    webnovel: Webnovel,
    post: ToonyzPost,
    showEngagementStats?: boolean,
    showSynopsis?: boolean,
    showActionButtons?: boolean,
    showDetailInfo?: boolean,
    isHoverCard?: boolean
}) {
    return (
        <HoverCard openDelay={0} closeDelay={0}>
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
            <HoverCardContent className="w-80" onClick={(e) => { e.stopPropagation(); }}>
                <WebnovelCard
                    webnovel={webnovel}
                    post={post}
                    showEngagementStats={showEngagementStats}
                    showSynopsis={showSynopsis}
                    showActionButtons={showActionButtons}
                    showDetailInfo={showDetailInfo}
                    isHoverCard={isHoverCard}
                />
            </HoverCardContent>
        </HoverCard>
    );
}
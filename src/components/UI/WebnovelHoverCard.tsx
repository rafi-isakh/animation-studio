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
import { Star, Share, Heart, Bookmark, Copy, Eye, ChevronRight } from "lucide-react"
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
        return `${process.env.NEXT_PUBLIC_HOST}/view_webnovels/${webnovelId}`;
    }

    return (
        <div className="w-full mx-auto dark:bg-transparent backdrop-blur-sm bg-white rounded-xl overflow-hidden">
        <Link href={`/view_webnovels/${webnovel.id}`}>
            <div className="relative bg-gradient-to-r from-pink-300 to-pink-200/10 dark:from-pink-800 dark:to-purple-900/10 p-6 rounded-t-xl" >
                <div className="z-10 flex items-start gap-6">
                    {/* Book Cover */}
                    <div className="relative w-auto flex-shrink-0">
                        <div className="block relative min-w-[80px] group z-[99]"
                            style={{
                                width: isHoverCard ? '80px' : '120px',
                                height: isHoverCard ? '114px' : '171px', // Maintaining aspect ratio of 180/257
                                aspectRatio: '180/257'
                            }}>
                            <Image
                                src={getImageUrl(webnovel.cover_art)}
                                alt={webnovel.title}
                                fill
                                className="rounded-md object-cover"
                            />
                        </div>
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
                        <div className="text-gray-600 dark:text-gray-200 mb-2">by {webnovel.author.nickname}</div>
                        {/* Detail info */}
                        {showDetailInfo && (
                            <div className="text-gray-700 dark:text-gray-200 text-sm mb-1 flex gap-1 items-center">
                               <Heart className="w-3 h-3 text-gray-400" /> <p className="inline-flex gap-1 text-center">  {webnovel.upvotes}</p>
                               <Eye className="w-3 h-3 text-gray-400" />  <p className="inline-flex gap-1 text-center">  {webnovel.views}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {showActionButtons && (
                            <div className="flex items-center gap-3">
                                <Button className="md:w-10 md:h-10 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                                    <Heart className="w-5 h-5 text-red-500" />
                                </Button>
                                <Button className="md:w-10 md:h-10 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                                    <Bookmark className="w-5 h-5 text-gray-400" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="z-[99] md:w-10 md:h-10 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                            <Share className="w-5 h-5 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="flex flex-col justify-center items-center">
                                        <DropdownMenuLabel>Share this webnovel</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="flex flex-row gap-2">
                                                <TwitterShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels/${webnovel.id}`}>
                                                    <TwitterIcon size={22} round={true} />
                                                </TwitterShareButton>
                                                <WhatsappShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels/${webnovel.id}`}>
                                                    <WhatsappIcon size={22} round={true} />
                                                </WhatsappShareButton>
                                                <TelegramShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels/${webnovel.id}`}>
                                                    <TelegramIcon size={22} round={true} />
                                                </TelegramShareButton>
                                                <PinterestShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels/${webnovel.id}`} media={getImageUrl(webnovel.cover_art)}>
                                                    <PinterestIcon size={22} round={true} />
                                                </PinterestShareButton>
                                                <LinkedinShareButton url={`${process.env.NEXT_PUBLIC_APP_URL}/view_webnovels/${webnovel.id}`}>
                                                    <LinkedinIcon size={22} round={true} />
                                                </LinkedinShareButton>
                                            </div>
                                            <div className='flex flex-row gap-2 text-center px-1'>
                                                <p className="text-[10px] self-center text-gray-500">{getWebnovelUrl(webnovel.id.toString())}</p>
                                                <Button
                                                    onClick={() => copyToClipboard(getWebnovelUrl(webnovel.id.toString()))}
                                                    variant="link"
                                                    size='icon'
                                                    className="!no-underline p-0"
                                                >
                                                    <span className="sr-only">Copy</span>
                                                    <Copy size={10} />
                                                </Button>
                                            </div>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                    <Link href={`/view_webnovels/${webnovel.id}`} className="flex self-center">
                        <ChevronRight className="w-5 h-5 dark:text-white text-gray-300 " />
                    </Link>
                </div>
            </div>
            </Link>

            {/* Engagement Stats */}
            {
                showEngagementStats && (
                    <div className="grid grid-cols-2 py-4 border-b border-gray-200 dark:border-gray-700 justify-center">
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{webnovel.upvotes}</div>
                            <div className="text-gray-500 text-sm">Likes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{webnovel.views}</div>
                            <div className="text-gray-500 text-sm">Views</div>
                        </div>
                        {/* <div className="text-center">
                            <div className="text-xl font-bold text-gray-800 dark:text-gray-200">1024</div>
                            <div className="text-gray-500 text-sm">Readers</div>
                        </div> */}
                    </div>
                )
            }

            {/* Synopsis */}
            {
                showSynopsis && (
                    <div className="p-6">
                        <p className="text-gray-600 leading-relaxed">
                            {truncateText(webnovel.description, 200)}
                            <Link href={`/view_webnovels/${webnovel.id}`} className="">
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
                        <p className="text-sm text-gray-500">{webnovel.title} &#62;</p>
                    </Button>
                </HoverCardTrigger>
            </div>
            <HoverCardContent className="w-80 bg-transparents border-none shadow-none" onClick={(e) => { e.stopPropagation(); }}>
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
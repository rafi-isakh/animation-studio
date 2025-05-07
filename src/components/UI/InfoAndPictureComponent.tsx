"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { Webnovel, ImageOrVideo, Chapter } from "@/components/Types";
import { useMediaQuery, Skeleton, Tooltip } from "@mui/material";
import { Button } from "@/components/shadcnUI/Button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/shadcnUI/AlertDialog";
import Image from "next/image";
import { phrase } from "@/utils/phrases";
import { useLanguage } from "@/contexts/LanguageContext";
import { VolumeOff, Volume2, Heart, Share, Copy, ChevronRight, Trash, PenLine, Eye, Loader2, MoveLeft, Pause, Play } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/shadcnUI/DropdownMenu";
import Link from "next/link";
import OtherTranslateComponent from "@/components/OtherTranslateComponent";
import { MdStars } from "react-icons/md";
import DictionaryPhrase from "@/components/DictionaryPhrase";
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
import { getImageUrl, getVideoUrl } from "@/utils/urls";
import { createEmailHash } from '@/utils/cryptography'
import { useUser } from '@/contexts/UserContext';
import { TranslateWebnovelAllButton } from "@/components/TranslateWebnovelAllButton";
import { useToast } from "@/hooks/use-toast";
import { useCopyToClipboard } from "@/utils/copyToClipboard";
import { useCreateMedia } from "@/contexts/CreateMediaContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NotEnoughStarsDialog from "@/components/UI/NotEnoughStarsDialog";
import ChapterPurchaseDialog from "@/components/UI/ChapterPurchaseDialog";
import { isPurchasedChapter, videoDisallowedForKorean } from "@/utils/webnovelUtils";
import { koreanToEnglishAuthorName } from "@/utils/webnovelUtils";
import UploadNewChapterButton from "@/components/UI/UploadNewChapterButton";
import { cn } from '@/lib/utils';

interface InfoAndPictureProps {
    content: Webnovel;
    coverArt: string;
    children?: React.ReactNode;
    onNewChapter?: () => void;
    onDelete?: () => void;
}

export default function InfoAndPictureComponent({
    content,
    coverArt,
    onNewChapter,
    onDelete
}: InfoAndPictureProps) {
    const { language, dictionary } = useLanguage();
    const [isShareDropdownOpen, setIsShareDropdownOpen] = useState(false);
    const shareDropdownRef = useRef<HTMLDivElement>(null);
    const [currentPageUrl, setCurrentPageUrl] = useState('');
    const [tags, setTags] = useState([]);
    const { id, email, stars, setInvokeCheckUser, purchased_webnovel_chapters } = useUser();
    const isMediumScreen = useMediaQuery('(min-width:768px)');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const copyToClipboard = useCopyToClipboard();
    const { setOpenDialog, setIsLoading, setChapterId, loadingVideoGeneration, generateTrailer } = useCreateMedia();
    const { toast } = useToast();
    const [videoExists, setVideoExists] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showPlayButton, setShowPlayButton] = useState(false);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showNotEnoughStarsModal, setShowNotEnoughStarsModal] = useState(false);
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const showPlayButtonRef = useRef(false);
    const [createMediaPrice, setCreateMediaPrice] = useState(0);
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [videoSrc, setVideoSrc] = useState<string | null>(null)

    useEffect(() => {
        const imageSrc = getImageUrl(content.cover_art) // this one always exists
        setImageSrc(imageSrc)
        if (language === "en") {
            if (content.en_cover_art) {
                const imageSrc = getImageUrl(content.en_cover_art)
                setVideoSrc(null)
                setImageSrc(imageSrc)
            }
            if (content.en_video_cover) {
                const videoSrc = getVideoUrl(content.en_video_cover)
                setVideoSrc(videoSrc)
            }
        } else {
            if (content.video_cover) {
                const videoSrc = getVideoUrl(content.video_cover)
                setVideoSrc(videoSrc)
            } else {
                const imageSrc = getImageUrl(content.cover_art) // this one always exists
                setVideoSrc(null)
                setImageSrc(imageSrc)
            }
        }
    }, [language])

    useEffect(() => {
        if (videoSrc) {
            setVideoExists(true)
        } else {
            setVideoExists(false)
        }
    }, [videoSrc])

    const view_profile_href = content.user.email_hash == content.author.email_hash ?
        `/view_profile/${content.user.id}` : '#';

    const handleMouseEnter = useCallback(() => {
        showPlayButtonRef.current = true;
    }, []);

    const handleMouseLeave = useCallback(() => {
        showPlayButtonRef.current = false;
    }, []);

    const handleTogglePlayVideo = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(prev => !prev);
        }
    }, [isPlaying]);

    const handleToggleMute = useCallback(() => {
        if (videoRef.current) {
            setIsMuted(prev => !prev);
        }
    }, []);


    const handleChapterPurchase = async (chapter: Chapter) => {
        if (!chapter) return;
        if (!isLoggedIn) {
            router.push("/signin");
        }
        else {
            setShowPurchaseModal(false);
            const price = language === "ko" ? content.price_korean : content.price_english;
            if (stars < price!) {
                setShowNotEnoughStarsModal(true);
                return;
            }
            const response = await fetch(`/api/purchase_chapter`, {
                method: 'POST',
                body: JSON.stringify({
                    chapter_id: chapter.id,
                    price: price,
                    language: language
                })
            });
            // TODO: tell user if there's not enough stars
            if (!response.ok) {
                console.error('Failed to purchase chapter');
                alert("Failed to purchase chapter");
            } else {
                const data = await response.json();
                if (data.success) {
                    setInvokeCheckUser(prev => !prev);
                    router.push(`/view_webnovels/${content.id}/chapter_view/${chapter.id}`);
                } else {
                    alert(data.message);
                }
            }
        }
    }


    // useEffect(() => {
    //     async function checkCoverArtType() {
    //         try {
    //             const response = await fetch(`/api/check_if_video_exists?url=${coverArt}`);
    //             const data = await response.json();
    //             setVideoExists(data.videoExists);
    //         } catch (error) {
    //             console.error('Error fetching coverArt:', error);
    //         }
    //     }

    //     if (coverArt) {
    //         checkCoverArtType();
    //     }
    // }, [coverArt]);

    useEffect(() => {
        if (window !== undefined) {
            setCurrentPageUrl(window.location.href);
        }
        setChapterId(content.chapters[0]?.id.toString());
    }, []);

    useEffect(() => {
        if (content.tags) {
            const tagsJSON = JSON.parse(content.tags);
            setTags(tagsJSON);
        }
    }, [content?.tags]);

    const toggleShareDropdown = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        setIsShareDropdownOpen(prev => !prev);
    }

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (shareDropdownRef.current && !shareDropdownRef.current.contains(event.target as Node)) {
                setIsShareDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const isAuthor = (): boolean => {
        return id === content.user.id.toString()
    };

    const isJongmin = () => {
        const userEmailHash = createEmailHash(email);
        const jongminEmailHash = createEmailHash("jongminbaek@stelland.io")
        return userEmailHash == jongminEmailHash
    }

    const handleGenerateTrailer = () => {
        if (stars < 20) {
            setCreateMediaPrice(20)
            setShowNotEnoughStarsModal(true);
            return;
        }
        setOpenDialog(true);
        generateTrailer(content.chapters.map(chapter => chapter.id));
    }

    // TODO: refactor this function as it's copied from FloatingMenuComponent
    return (
        <div className="relative md:h-screen w-full h-full top-0 flex-shrink-0
                        bg-gradient-to-b from-transparent to-transparent 
                        justify-start self-start rounded-xl mx-auto ">
            {/* Blurred background */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-10 rounded-xl md:h-screen h-full"
                style={{
                    backgroundImage: `url(${getImageUrl(coverArt)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-black/80 rounded-xl" />

            {/* Content */}
            <div className="relative z-10 flex md:flex-row flex-col space-y-1 w-full md:h-screen rounded-xl">
                <div className="flex flex-col space-y-2 ">
                    <div className="md:px-4 md:p-2 px-4">
                        {/* Cover Image */}
                        <div className="min-w-[300px] h-[550px] w-full rounded-xl mx-auto md:pt-1 pt-0">
                            <div className="relative w-full h-full max-w-[350px] mx-auto min-h-[550px] rounded-xl">
                                {coverArt ?
                                    !videoExists || (videoDisallowedForKorean.includes(content.id) && language === "ko") ?
                                        <>
                                            <Image
                                                src={imageSrc || ""}
                                                alt={content.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 300px"
                                                className="object-cover rounded-xl"
                                                placeholder="blur"
                                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVR42mN8//HLfwYiAOOoQvoqBABbWyZJf74GZgAAAABJRU5ErkJggg=="
                                            />
                                            {content.is_adult_material && (
                                                <>
                                                    {language === "ko" ? (
                                                        <span className="z-[99] inline-flex absolute top-2 left-2 w-fit px-2 py-1 rounded-full bg-white border border-red-600 text-black text-center justify-center items-center font-bold text-base">
                                                            19
                                                        </span>
                                                    ) : (
                                                        <span className="z-[99] inline-flex absolute top-2 left-2 w-fit px-2 py-1 rounded-sm bg-red-600 text-white text-center justify-center items-center text-base">
                                                            Mature
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </>
                                        :
                                        <div>
                                            <div className="relative">
                                                <video
                                                    ref={videoRef}
                                                    src={videoSrc || ""}
                                                    autoPlay
                                                    onMouseEnter={handleMouseEnter}
                                                    onMouseLeave={handleMouseLeave}
                                                    onClick={handleTogglePlayVideo}
                                                    style={{ width: '450px', height: '550px', objectPosition: 'center bottom' }}
                                                    className="object-cover rounded-xl"
                                                    muted={isMuted}
                                                    playsInline
                                                    loop
                                                />
                                                <button
                                                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${showPlayButtonRef.current ? 'block' : 'hidden'}`}
                                                    onClick={handleTogglePlayVideo}
                                                >
                                                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                                                </button>
                                            </div>
                                            <button onClick={handleToggleMute} className="mute-button absolute bottom-2 right-2">
                                                {isMuted ? <VolumeOff size={20} /> : <Volume2 size={20} />}
                                            </button>
                                        </div>
                                    :
                                    <Skeleton variant="rectangular" width="100%" height="100%" />
                                }
                            </div>
                        </div>

                        {/* Content Info */}
                        <div className="flex flex-col items-center py-10">
                            <OtherTranslateComponent
                                element={content}
                                content={content.title}
                                elementId={content.id.toString()}
                                elementType="webnovel"
                                elementSubtype="title"
                                classParams="text-2xl font-bold self-center text-center"
                            />

                            {/* TEMPORARY FIX WHILE I PUT AUTHOR'S ENGLISH NAME IN THE DB IN A SANE WAY.*/}
                            <p className="text-center">
                                <Link href={view_profile_href}>
                                    {
                                        content.author.nickname === 'Anonymous' ? '' :
                                            language == 'ko' ?
                                                content.author.nickname :
                                                koreanToEnglishAuthorName[content.author.nickname as string]
                                    }
                                </Link>
                            </p>

                            {/*TEMPORARY FIX FOR SHOWING THE NAME OF THE PUBLISHER. DOING THIS BECAUSE
                            THE USER IS THE CONTENT PROVIDER, BUT THE CP MAY HAVE MANY DIFFERENT PUBLISHERS*/}
                            {content.user.nickname && content.user.email_hash !== content.author.email_hash &&
                                <p className="text-center">
                                    {content.title == '여주와 남주의 아이들을 키우게 되었습니다' || content.title == '맛있는 스캔들' || content.title == "마성의 신입사원" ?
                                        language == 'ko' ?
                                            "피앙세"
                                            :
                                            "fiance"
                                        :
                                        content.user.nickname
                                    }
                                </p>
                            }

                            {/* Genre and Type */}
                            <ul className="flex flex-row justify-center items-center">
                                {content.genre && (
                                    <li className="text-sm text-gray-500 flex items-center">
                                        <DictionaryPhrase phraseVar={content.genre.toLowerCase()} />
                                        <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full" />
                                    </li>
                                )}
                                <li className="text-sm text-gray-500">
                                    {content.premium ? phrase(dictionary, "premium", language) : phrase(dictionary, "free", language)}
                                </li>
                            </ul>

                            {/* miscellanous */}
                            <div className="flex flex-row space-x-2 text-sm">
                                <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                    <Eye size={11} /> {content.shown_views}
                                </div>
                                <div className='flex flex-row gap-1 items-center text-[11px] text-gray-500 dark:text-white '>
                                    {/* heart icon - gray #6B7280 */}
                                    <svg width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#DE2B74] dark:text-[#DE2B74]">
                                        <path d="M8.48546 5.591C9.18401 4.9092 9.98235 4.03259 9.98235 2.96119C10.0521 2.36601 9.91388 1.76527 9.5901 1.25634C9.26632 0.747404 8.77594 0.360097 8.19844 0.157182C7.62094 -0.0457339 6.99015 -0.0523672 6.40831 0.138357C5.82646 0.32908 5.32765 0.705985 4.99271 1.20799C4.63648 0.744933 4.13753 0.405536 3.56912 0.239623C3.0007 0.0737095 2.39277 0.0900199 1.83455 0.286159C1.27634 0.482299 0.797245 0.847936 0.467611 1.32939C0.137977 1.81085 -0.0248358 2.38277 0.00307225 2.96119C0.00307225 4.12999 0.801414 4.9092 1.49996 5.6884L4.99271 9L8.48546 5.591Z"
                                            fill="#DE2B74" />
                                    </svg>
                                    {content.upvotes}
                                </div>
                            </div>

                            <div className="mt-2">
                                {/* Description */}
                                <OtherTranslateComponent
                                    element={content}
                                    content={content.description}
                                    elementId={content.id.toString()}
                                    elementType="webnovel"
                                    elementSubtype="description"
                                    classParams="text-sm text-gray-800 dark:text-white"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col w-full">
                                <div className="flex flex-row gap-2 py-5 w-full">
                                    {/* Read Button */}
                                    <Button
                                        variant="default"
                                        className="w-full bg-[#DE2B74] hover:bg-[#DE2B74]/80 text-white"
                                        onClick={() => {
                                            const firstChapter = content.chapters[0];
                                            if (!firstChapter) return;

                                            // Check if user has already purchased the chapter
                                            const hasPurchased = isPurchasedChapter(purchased_webnovel_chapters, firstChapter.id, language);

                                            if (content.premium && !firstChapter.free && !hasPurchased) {
                                                setShowPurchaseModal(true);
                                            } else {
                                                router.push(`/view_webnovels/${content.id}/chapter_view/${firstChapter.id}`);
                                            }
                                        }}
                                    >
                                        {phrase(dictionary, "start_to_read_episode_1", language)}
                                    </Button>

                                    {/* Like Button */}
                                    {/* <Button
                                    size="icon"
                                    className="flex-shrink-0  bg-[#DE2B74] hover:bg-[#DE2B74]/80 text-white dark:text-white rounded-md flex items-center justify-center group"
                                >
                                    <Heart size={20} className="text-white group-hover:text-white" />
                                   </Button> */}

                                    {/* Share Button and Dropdown */}
                                    <div className="relative">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    className="z-[99] flex-shrink-0  bg-[#DE2B74] hover:bg-[#DE2B74]/80 text-white dark:text-white rounded-md flex items-center justify-center group"
                                                    onClick={(e) => e.stopPropagation()}>

                                                    <Share size={20} className="text-white group-hover:text-white" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="flex flex-col justify-center items-center">
                                                <DropdownMenuLabel>Share this webnovel</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex flex-row gap-2">
                                                        <TwitterShareButton url={currentPageUrl}>
                                                            <TwitterIcon size={22} round={true} />
                                                        </TwitterShareButton>
                                                        <WhatsappShareButton url={currentPageUrl}>
                                                            <WhatsappIcon size={22} round={true} />
                                                        </WhatsappShareButton>
                                                        <TelegramShareButton url={currentPageUrl}>
                                                            <TelegramIcon size={22} round={true} />
                                                        </TelegramShareButton>
                                                        <PinterestShareButton url={currentPageUrl} media={getImageUrl(content.cover_art)}>
                                                            <PinterestIcon size={22} round={true} />
                                                        </PinterestShareButton>
                                                        <LinkedinShareButton url={currentPageUrl}>
                                                            <LinkedinIcon size={22} round={true} />
                                                        </LinkedinShareButton>
                                                    </div>
                                                    <div className='flex flex-row gap-2 text-center px-1'>
                                                        <p className="text-[10px] self-center text-gray-500">{currentPageUrl}</p>
                                                        <Button
                                                            onClick={() => copyToClipboard(currentPageUrl.toString())}
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
                                </div>
                                {content.okay_to_create_videos &&
                                    <div className="pb-5 w-full">
                                        <Button
                                            variant="default"
                                            className="w-full bg-[#DE2B74] hover:bg-[#DE2B74]/80 text-white"
                                            disabled={loadingVideoGeneration}
                                            onClick={handleGenerateTrailer}
                                        >
                                            <p>
                                                {loadingVideoGeneration ? <Loader2 className="h-24 w-24 animate-spin text-pink-600" /> : phrase(dictionary, "createVideo", language)}
                                            </p>
                                        </Button>
                                    </div>
                                }
                                {isJongmin() &&
                                    <div className="pb-5 w-full">
                                        <TranslateWebnovelAllButton language={language} webnovel={content as Webnovel} />
                                    </div>
                                }
                                {/* Delete & Write a chapter button */}
                                {(isAuthor() || isJongmin()) &&
                                    <>
                                        <div className='flex flex-col gap-5 w-full justify-center items-center pb-5'>
                                            <UploadNewChapterButton onNewChapter={onNewChapter} />
                                            <Button
                                                color='gray'
                                                variant='outline'
                                                onClick={() => setShowDeleteModal(true)}
                                                className='w-full flex-1 flex items-center justify-center hover:border-[#DB2777] text-black dark:text-white hover:text-[#DB2777]'
                                            >
                                                <span className='inline-flex gap-2 items-center text-black dark:text-white  hover:text-[#DB2777]'>
                                                    <Trash className='hover:text-[#DB2777]' size={18} />{phrase(dictionary, "deleteWebnovel", language)}
                                                </span>
                                            </Button>
                                        </div>
                                        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                                            <AlertDialogContent className="z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none">
                                                <AlertDialogHeader className='p-4'>
                                                    <AlertDialogTitle>{phrase(dictionary, "deleteWebnovelConfirm", language)}</AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 self-end'>
                                                    <Button
                                                        onClick={onDelete}
                                                        className={cn("!rounded-none w-full py-6 text-lg font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                                                    >
                                                        {phrase(dictionary, "yes", language)}
                                                    </Button>
                                                    <Button
                                                        onClick={() => setShowDeleteModal(false)}
                                                        className={cn("!rounded-none w-full py-6 text-lg font-medium bg-[#b8c1d1] hover:bg-[#a9b2c2] text-white")}

                                                    >
                                                        {phrase(dictionary, "no", language)}
                                                    </Button>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                }
                            </div>
                            <div className="flex flex-col gap-2 px-2 py-2 w-full bg-gray-100 dark:bg-gray-900 rounded-lg">
                                <Button variant="link" className="!no-underline font-extrabold text-sm text-gray-500 dark:text-white flex flex-row gap-2 items-center justify-between bg-transparent shadow-none">
                                    <div className="flex flex-row gap-2 items-center cursor-pointer">
                                        <MdStars className="text-xl text-[#D92979]" />
                                        <Link href={`/stars`}>
                                            <span>{phrase(dictionary, "buyStars", language)}</span>
                                        </Link>
                                    </div>
                                    <ChevronRight size={16} className="text-black dark:text-white" />
                                </Button>
                            </div>
                            {/* Purchase Modal */}
                            <ChapterPurchaseDialog
                                showPurchaseModal={showPurchaseModal}
                                setShowPurchaseModal={setShowPurchaseModal}
                                handleChapterPurchase={handleChapterPurchase}
                                content={content}
                                stars={stars}
                                chapter={content.chapters[0]}
                            />
                            {/* Not Enough Stars Modal */}
                            <NotEnoughStarsDialog showNotEnoughStarsModal={showNotEnoughStarsModal} setShowNotEnoughStarsModal={setShowNotEnoughStarsModal} stars={stars} content={content} createMediaPrice={createMediaPrice} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
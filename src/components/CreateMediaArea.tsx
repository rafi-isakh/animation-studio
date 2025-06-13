'use client'
import { useEffect, useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Skeleton } from "./shadcnUI/Skeleton";
import { RefreshCw, Video, X, RefreshCcw, EllipsisVertical, History, House } from "lucide-react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "./shadcnUI/Button";
import GeneratedPicture from "./GeneratedPicture";
import Link from "next/link"
import CardStyleButton from "./UI/CardStyleButton";
import { getImageUrl } from "@/utils/urls";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import ShareAsToonyzPostModal from "./ShareAsToonyzPostModal";
import { ImageOrVideo } from "@/components/Types";
import { useCreateMedia } from "@/contexts/CreateMediaContext";
import { Webnovel } from "@/components/Types";
import { useWebnovels } from "@/contexts/WebnovelsContext";
import CreateMediaDefaultContents from "@/components/UI/CreateMediaDefaultContents"
import { useLanguage } from "@/contexts/LanguageContext";
import { phrase } from "@/utils/phrases";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcnUI/Tooltip"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/shadcnUI/Popover"
import { make_video_price, generate_pictures_price, generate_trailer_price } from "@/utils/stars";
import { MdStars } from "react-icons/md";
import CreateMediaHistoryContents from "@/components/UI/CreateMediaHistoryContents";
import { useUser } from "@/contexts/UserContext";
import { BsFillTicketPerforatedFill } from "react-icons/bs";
// 
export default function CreateMediaArea({
    // TODO: refactor these props; don't need them, because I can just do useCreateMedia()
    isLoading,
    setIsLoading,
    progress,
    savedPrompt,
    prompts,
    pictures,
    webnovel_id,
    chapter_id,
    draggableNodeRef,
    openDialog,
    setOpenDialog,
    setSelection,
    promotionBannerRef,
    source,
    initialNarrations,
}:
    {
        isLoading: boolean,
        setIsLoading: (isLoading: boolean) => void,
        progress: number,
        savedPrompt: string,
        prompts: string[],
        pictures: string[],
        webnovel_id: string,
        chapter_id: string,
        draggableNodeRef: React.RefObject<HTMLDivElement>,
        openDialog: boolean,
        setOpenDialog: (openDialog: boolean) => void,
        setSelection: (selection: string) => void,
        promotionBannerRef: React.MutableRefObject<React.JSX.Element>,
        source: 'webnovel' | 'chapter',
        initialNarrations: string[],
    }) { // source: Whether it's from the webnovel view page with all chapters or the chapter view page with short quote
    const { toast } = useToast();
    const { makeVideo, makeSlideshow, showShareAsPostModal, shareType, setShareType, setLoadingVideoGeneration, setPictures, setShowShareAsPostModal, videoFileName, setVideoFileName, loadingVideoGeneration, narrations, setNarrations, openHistory, setOpenHistory } = useCreateMedia();
    const { getWebnovelIdWithChapterMetadata } = useWebnovels();
    const { dictionary, language } = useLanguage();
    const [webnovel, setWebnovel] = useState<Webnovel>();
    const { tickets, stars } = useUser();

    useEffect(() => {
        if (webnovel_id) {
            getWebnovelIdWithChapterMetadata(webnovel_id).then((webnovel) => {
                setWebnovel(webnovel);
            });
        }
    }, [webnovel_id]);

    const handleClickHistory = () => {
        setOpenHistory(true);
    }

    return (
        <div className="relative z-[500]">
            <div
                ref={draggableNodeRef}
                className={`md:max-w-[425px] sm:w-full xs:w-full w-full h-screen select-none fixed top-0 md:right-1 p-0  
                           dark:bg-[#2C2C2C] bg-[#F5F5F5]
                            rounded-lg no-scrollbar flex flex-col gap-0 transition-opacity duration-300
                            ${openDialog ? 'block z-[100]' : 'hidden'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className='drag-handle flex-shrink-0'>
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center justify-between border-b py-3 px-4 ">
                            <div className="flex items-center">
                                <div className="flex items-center justify-center gap-2">
                                    <h1 className="md:text-xl text-md font-medium uppercase">Toonyz Post</h1>
                                    <h1 className="md:text-xl text-md text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                        <BsFillTicketPerforatedFill className="text-lg md:text-xl text-[#D92979]" />
                                        <span className="text-gray-700 dark:text-gray-300">{phrase(dictionary, "ticket", language)}</span>
                                        <span className="text-gray-700 dark:text-gray-300">{tickets}{phrase(dictionary, "countTickets", language)}</span>
                                    </h1>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                                                        <EllipsisVertical className="h-5 w-5" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="relative w-fit mx-auto p-1">
                                                    <ul className="relative flex flex-col justify-start items-start gap-1 text-sm">
                                                        <Button variant="ghost" className="w-full flex flex-row justify-start items-center"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation()
                                                                setIsLoading(false);
                                                                setLoadingVideoGeneration(false);
                                                                setPictures([]);
                                                                setSelection('');
                                                                setNarrations([]);
                                                                setOpenHistory(false);
                                                            }}>
                                                            <House className="h-5 w-5" />
                                                            <span className="text-gray-700 dark:text-gray-300">{phrase(dictionary, "home", language)}</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full flex flex-row justify-start items-center"
                                                            onClick={handleClickHistory}>
                                                            <History className="h-5 w-5" />
                                                            <span className="text-gray-700 dark:text-gray-300">{phrase(dictionary, "history", language)}</span>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full flex flex-row justify-start items-center"
                                                        >
                                                            <Link href="/stars" className='w-full flex flex-row justify-start items-center' >
                                                                <MdStars className="h-5 w-5 mr-2" />
                                                                <span className="text-gray-700 dark:text-gray-300">{phrase(dictionary, "stars", language)}</span>
                                                            </Link>
                                                        </Button>
                                                    </ul>
                                                </PopoverContent>
                                            </Popover>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            More options
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation()
                                        setOpenDialog(false);
                                        setSelection('');
                                    }}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <ScrollArea className='drag-handle flex-1 overflow-auto no-scrollbar z-[500]'>
                    {openHistory ? (
                        <CreateMediaHistoryContents stars={stars} source={source} chapterIds={webnovel?.chapters.map((chapter) => chapter.id)} />
                    ) : (
                        <div className='relative w-full p-1'>
                            {isLoading ? (
                                <div className="flex flex-col gap-4 xs:w-full sm:w-full md:max-w-[425px] w-full">
                                    <div className="flex flex-col my-6 space-y-4 mb-2">
                                        <div className="flex flex-col select-none">

                                            <div className="space-y-3">
                                            </div>

                                            <div className="space-y-3">
                                                {/* User message bubble */}
                                                <div className="flex justify-end">
                                                    {savedPrompt && <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-pink-600 text-white text-sm">
                                                        {savedPrompt}
                                                    </div>}
                                                </div>

                                                {/* AI response bubble */}
                                                <div className="flex justify-start">
                                                    <div className="h-8 w-8 rounded-full bg-pink-600 flex items-center justify-center text-white shrink-0 mr-1">
                                                        <span className="text-xs font-medium"> <Sparkles className="w-4 h-4" /></span>
                                                    </div>
                                                    <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-300 dark:bg-[#1a1b1f] border dark:border-[#2a2b2f] text-black dark:text-white text-sm">
                                                        {phrase(dictionary, "generatingPrompt", language)} {Math.round(progress)}%
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        <div className="grid grid-cols-2 gap-1">
                                            {[1, 2, 3, 4].map((item) => (
                                                <div
                                                    key={item}
                                                    className={`animate-ping relative aspect-square rounded-md bg-gray-200 dark:bg-gray-700 overflow-hidden opacity-0 animate-fadeIn`}
                                                    style={{ animationDelay: `${(item - 1) * 300}ms`, animationFillMode: 'forwards' }}
                                                >
                                                    <Skeleton className="animate-ping  absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent animate-shimmer" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : pictures.length > 0 ? (
                                <div className="flex flex-col select-none">
                                    {(source === 'webnovel') ? (
                                        <div className="my-6 space-y-4">
                                            <div className="space-y-3">
                                                {/* <p className="text-sm text-gray-400">Generated a scene with</p> */}

                                            </div>
                                            <div className="space-y-3">
                                                {/* User message bubble */}
                                                {savedPrompt && <div className="flex justify-end">
                                                    <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-pink-600 text-white text-sm">
                                                        {savedPrompt}
                                                    </div>
                                                </div>}

                                                {/* AI response bubble */}
                                                <div className="flex justify-start">
                                                    <div className="h-8 w-8 rounded-full bg-pink-600 flex items-center justify-center text-white shrink-0 mr-1">
                                                        <span className="text-xs font-medium"> <Sparkles className="w-4 h-4" /></span>
                                                    </div>
                                                    <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-300 dark:bg-[#1a1b1f] border dark:border-[#2a2b2f] text-black dark:text-white text-sm">
                                                        {phrase(dictionary, "ICreatedVisualizations", language)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-20 flex items-center justify-start  gap-2 overflow-x-auto w-full no-scrollbar scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>

                                                <Button
                                                    variant="outline"
                                                    className="p-4 md:p-3 min-h-[48px] rounded-full bg-gray-300 dark:bg-[#1a1b1f] text-black dark:text-white dark:border-[#2a2b2f] hover:text-white hover:bg-[#2a2b2f] flex gap-2 shrink-0 shadow-none"
                                                    disabled={loadingVideoGeneration}
                                                    onClick={() => {
                                                        makeVideo();
                                                    }}
                                                >
                                                    {loadingVideoGeneration ? <Loader2 className="h-24 w-24 animate-spin text-pink-600" /> : <Video className="w-4 h-4" />}
                                                    {phrase(dictionary, "makeVideo", language)} <p className="text-sm flex flex-row gap-1 items-center"><BsFillTicketPerforatedFill className="text-lg md:text-xl text-[#D92979]" />{pictures.length * make_video_price}</p>
                                                </Button>
                                                <div className='relative'>
                                                    <Link href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            makeSlideshow();
                                                        }}
                                                        className='w-full'>
                                                        <CardStyleButton
                                                            title={phrase(dictionary, "slideshow", language)}
                                                            subtitle="Watch Ads to make a slideshow"
                                                            ideaCount={pictures.length}
                                                            images={pictures}
                                                            gradientFrom="#DE2B74"
                                                            gradientTo="#FF6F91"
                                                            className='w-full min-h-[48px] bg-gray-300 dark:bg-[#1a1b1f] text-black dark:text-white dark:border-[#2a2b2f] hover:text-white'
                                                            loadingVideoGeneration={loadingVideoGeneration}
                                                        />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (savedPrompt && source === 'chapter') && (
                                        <div className="my-6 space-y-4">
                                            <div className="space-y-3">
                                                {/* <p className="text-sm text-gray-400">Generated a scene with</p> */}
                                            </div>

                                            <div className="space-y-3">
                                                {/* User message bubble */}
                                                <div className="flex justify-end">
                                                    {savedPrompt && <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-pink-600 text-white text-sm">
                                                        {savedPrompt}
                                                    </div>}
                                                </div>

                                                {/* AI response bubble */}
                                                <div className="flex justify-start">
                                                    <div className="h-8 w-8 rounded-full bg-pink-600 flex items-center justify-center text-white shrink-0 mr-1">
                                                        <span className="text-xs font-medium"> <Sparkles className="w-4 h-4" /></span>
                                                    </div>
                                                    <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-300 dark:bg-[#1a1b1f] border dark:border-[#2a2b2f] text-black dark:text-white text-sm">
                                                        {phrase(dictionary, "ICreatedVisualizations", language)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="h-20 flex items-center justify-start  gap-2 overflow-auto w-full no-scrollbar scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                                                {pictures.length > 0 && (
                                                    <div className='relative'>
                                                        <Link
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                console.log("making slideshow clicked")
                                                                makeSlideshow();
                                                            }}
                                                            className='w-full'>
                                                            <CardStyleButton
                                                                title="Slideshow"
                                                                subtitle="Watch Ads to make a slideshow"
                                                                ideaCount={pictures.length}
                                                                images={pictures}
                                                                gradientFrom="#DE2B74"
                                                                gradientTo="#FF6F91"
                                                                className='w-full min-h-[48px] bg-gray-300 dark:bg-[#1a1b1f] text-black dark:text-white dark:border-[#2a2b2f] hover:text-white'
                                                                loadingVideoGeneration={loadingVideoGeneration}
                                                            />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-1">
                                        {pictures.map((picture, index) => {
                                            return (
                                                <div
                                                    key={index}
                                                    className="opacity-0 animate-fadeIn"
                                                    style={{
                                                        animationDelay: `${index * 300}ms`,
                                                        animationFillMode: 'forwards'
                                                    }}
                                                >
                                                    <GeneratedPicture
                                                        key={index}
                                                        index={index}
                                                        image={picture}
                                                        webnovel_id={webnovel_id}
                                                        chapter_id={chapter_id}
                                                        quote={savedPrompt}

                                                    />
                                                </div>
                                            )
                                        })}
                                        <div className='h-[10vh]' />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <CreateMediaDefaultContents source={source} webnovelId={webnovel_id} chapterIds={webnovel?.chapters.map((chapter) => chapter.id)} />
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
                {/* Footer input */}
                <div className="flex flex-col space-y-3 backdrop-blur-md bg-gradient-to-r from-blue-50/90 to-gray-50/90 dark:from-black/10 dark:to-gray-900/20 rounded-b-lg flex-shrink-0">
                    {/* Ad banner */}
                    <div className='w-full flex-shrink-0'>
                        <div className='relative top-0 left-0 w-full'>
                            {promotionBannerRef.current}
                        </div>
                    </div>
                </div>
            </div>
            <ShareAsToonyzPostModal
                imageOrVideo={shareType as ImageOrVideo}
                showShareAsPostModal={showShareAsPostModal}
                setShowShareAsPostModal={setShowShareAsPostModal}
                index={0}
                videoFileName={videoFileName!}
                webnovel_id={webnovel_id}
                chapter_id={chapter_id}
                quote={savedPrompt}
            />
        </div>

    )
}
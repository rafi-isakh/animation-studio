'use Client'
import React, { useEffect, useState, useRef } from 'react';
import { cn } from "@/lib/utils"
import useMediaQuery from '@mui/material/useMediaQuery';
import { Button } from "@/components/shadcnUI/Button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/shadcnUI/Dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/shadcnUI/Drawer"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/shadcnUI/Tooltip"
import { Skeleton } from "@mui/material"
import { ToastAction } from "@/components/shadcnUI/Toast";
import { Input } from "@/components/shadcnUI/Input"
import { Label } from "@/components/shadcnUI/Label"
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { X, Video, Copy, Image, Share2, Sparkles, MoreVertical, Maximize2, Loader2, ArrowRight, ChevronDownSquare, Divide, MessageSquare, RefreshCw } from 'lucide-react';
import { useTheme } from '@/contexts/providers'
import BlobButton from '@/components/UI/BlobButton';
import { truncateText } from '@/utils/truncateText';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import Draggable from 'react-draggable';
import { Webnovel, Chapter, ImageOrVideo } from '@/components/Types';
import { useToast } from "@/hooks/use-toast";
import WatermarkedImage from "@/utils/watermark";
import GeneratedPicture from '@/components/GeneratedPicture';
import CardStyleButton from '@/components/UI/CardStyleButton';
import ShareAsToonyzPostModal from './ShareAsToonyzPostModal';
import PromotionBannerComponent from '@/components/PromotionBannerComponent';
import { CustomCircularProgressbar } from '@/components/UI/CustomCircularProgressbar';
import dynamic from 'next/dynamic';
const LottieLoader = dynamic(() => import('@/components/LottieLoader'), {
    ssr: false,
});
import animationData from '@/assets/gradient_loader.json';
import { downloadVideo, uploadVideo } from '@/utils/s3';
import { getImageUrl } from '@/utils/urls';
import CreateMediaArea from './CreateMediaArea';

type Position = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const FloatingMenu: React.FC<{
    children: React.ReactNode;
    webnovel_id: string;
    chapter_id:
    string;
    context: string,
    webnovel: Webnovel,
    chapter: Chapter,
    selectedTextRef: React.MutableRefObject<string>;
}> = ({ children, webnovel_id, chapter_id, context, webnovel, chapter, selectedTextRef }) => {
    const [selection, setSelection] = useState<string>("")
    const [position, setPosition] = useState<Position | undefined>();
    const [showMessage, setShowMessage] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { language, dictionary } = useLanguage();
    const [openDialog, setOpenDialog] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [pictures, setPictures] = useState([]);
    const { theme } = useTheme();
    const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
    const [initialDialogPositionSet, setInitialDialogPositionSet] = useState(false);
    const draggableNodeRef = useRef<HTMLDivElement>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const { toast } = useToast();
    const [savedPrompt, setSavedPrompt] = useState<string>("");
    const [videoFileName, setVideoFileName] = useState<string | null>(null);
    const [showShareAsPostModal, setShowShareAsPostModal] = useState(false);
    const promotionBannerRef = useRef(<PromotionBannerComponent />);
    const [authFailed, setAuthFailed] = useState(false);
    const [testText, setTestText] = useState<string>("")
    const floatingButtonRef = useRef<HTMLButtonElement>(null);
    const shareButtonRef = useRef<HTMLButtonElement>(null);
    const [prompts, setPrompts] = useState<string[]>([]);

    useEffect(() => {

        const handleSelectionChange = () => {
            const activeSelection = document.getSelection()
            if (!activeSelection) return;
            const text = activeSelection.toString().trim()
            if (!text) return;
            const rect = activeSelection.getRangeAt(0).getBoundingClientRect()
            const containerRect = containerRef.current?.getBoundingClientRect();
            if (containerRect) {
                setPosition({
                    x: rect.left - containerRect.left + (rect.width / 2) - (100 / 2),
                    y: rect.top - containerRect.top - 25,
                    width: rect.width,
                    height: rect.height,
                })
                setSelection(text)
                selectedTextRef.current = text

                //setTestText(text)
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleCloseFloatingButton();
                setOpenDialog(false);
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {

            const isClickOutsideFloatingButton = floatingButtonRef.current && !floatingButtonRef.current.contains(event.target as Node);
            const isClickShareButton = shareButtonRef.current && !shareButtonRef.current.contains(event.target as Node);

            if (isClickOutsideFloatingButton && isClickShareButton) {
                handleCloseFloatingButton();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [position]);

    const handleCloseFloatingButton = () => {
        setSelection("");
        setPosition(undefined);
        setShowMessage(false);
    }

    const handlePicturesGenerated = (newPictures: string[]) => {
        setOpenDialog(true);
    };

    useEffect(() => {
        if (!initialDialogPositionSet && draggableNodeRef.current) {
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const dialogWidth = 425; // sm:max-w-[425px]

            // Position within visible area of screen
            const xPos = Math.max(20, Math.min(viewportWidth - dialogWidth - 20, viewportWidth / 2));
            const yPos = Math.max(20, Math.min(viewportHeight - 100, viewportHeight / 4));

            setDialogPosition({
                x: xPos,
                y: yPos,
            });
            setInitialDialogPositionSet(true);
        }
    }, [initialDialogPositionSet]);

    const copyToClipboard = async (text: string) => {
        try {
            // Use the modern Clipboard API if available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                toast({
                    variant: "success",
                    title: "Link copied to clipboard!",
                    description: "You can now paste it anywhere you want.",
                });
            } else {
                // Fallback for browsers (like Safari) that may not support Clipboard API
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.setAttribute("readonly", ""); // Prevent iOS keyboard from appearing
                textArea.style.position = "absolute";
                textArea.style.left = "-9999px"; // Move element off-screen
                document.body.appendChild(textArea);
                textArea.select();

                // Execute the copy command
                const successful = document.execCommand("copy");
                document.body.removeChild(textArea);

                if (successful) {
                    toast({
                        variant: "success",
                        title: "Link copied to clipboard!",
                        description: "You can now paste it anywhere you want.",
                    });
                } else {
                    toast({
                        variant: "destructive",
                        title: "Failed to copy",
                        description: "Please try selecting and copying the text manually.",
                    });
                }
            }
        } catch (err) {
            console.error("Failed to copy text: ", err);
            toast({
                variant: "destructive",
                title: "Failed to copy",
                description: "Please try selecting and copying the text manually.",
            });
        }
    };


    // image generating
    const generatePictures = async () => {
        const confirmed = window.confirm("Are you sure you want to generate pictures? This will use your credits.");
        if (!confirmed) {
            setIsLoading(false);
            setOpenDialog(false);
            return;
        }

        console.log('generating pictures')
        const initialPrompt = selectedTextRef.current;
        setSavedPrompt(truncateText(initialPrompt, 150));
        if (!initialPrompt) {
            toast({
                title: "Error",
                description: "Please provide a prompt",
                variant: "destructive"
            })
            setError('Please provide a prompt');
            return;
        }

        setIsLoading(true);
        setError(null);
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (5 * Math.random());
                return newProgress > 95 ? 95 : newProgress;
            });
        }, 300);

        try {
            // const response = await fetch(`/api/generate_pictures`, {
            //     method: 'POST',
            //     body: JSON.stringify({ text: initialPrompt, n: 4, context: context })
            // })

            const all_chapter_ids = webnovel.chapters.map(chapter => chapter.id)
            const response = await fetch(`/api/generate_trailer_prompts_and_pictures`, {
                method: 'POST',
                body: JSON.stringify({ chapter_ids: all_chapter_ids, trailer_style: "anime", trailer_type: "A" })
            })

            if (!response.ok) {
                switch (response.status) {
                    case 401:
                        setAuthFailed(true); // Set auth failed state
                        toast({
                            title: "Error",
                            description: "Please login to generate pictures",
                            variant: "destructive",
                            action: <ToastAction altText="Try again">Try again</ToastAction>,
                            altText: "Try again"
                        })
                        throw new Error('Please login to generate pictures');
                    case 429:
                        toast({
                            title: "Error",
                            description: "Too many requests. Please try again later.",
                            variant: "destructive"
                        })
                        throw new Error('Too many requests. Please try again later.');
                    default:
                        toast({
                            title: "Error",
                            description: "Error: Failed to generate pictures",
                            variant: "destructive"
                        })
                        throw new Error('Failed to generate pictures');
                }
            }

            const data = await response.json();

            if (!data.images || !Array.isArray(data.images)) {
                toast({
                    title: "Error",
                    description: "Invalid response format from server",
                    variant: "destructive"
                })
                throw new Error('Invalid response format from server');
            }
            setPictures(data.images);
            setPrompts(data.prompts);
            handlePicturesGenerated(data.images);
            setProgress(100);
            clearInterval(progressInterval);
        } catch (err) {
            clearInterval(progressInterval);
            setProgress(0);
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (isDesktop) {
        return (
            <div ref={containerRef} className='relative selection:underline selection:bg-fuchsia-300 selection:text-fuchsia-900 selection:decoration-[#DE2B74] selection:decoration-4' >

                {selection && position && (
                    <div className="absolute z-10"
                        style={{
                            top: `${position.y + position.height + 30}px`,
                            left: `${position.x - 1}px`,
                        }}>
                        <ul className='flex flex-row gap-1 relative rounded-full items-center justify-center dark:bg-black/50 backdrop-blur-sm'>
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <CustomCircularProgressbar
                                        progress={Math.round(progress)}
                                        size={50}
                                        backgroundColor={theme === 'dark' ? '#000000' : '#ffffff'}
                                        progressColor="#DE2B74"
                                        strokeWidth={5}
                                    >
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            ref={floatingButtonRef}
                                            className="!no-underline rounded-full items-center justify-center text-center mx-auto p-1 relative inline-flex group w-10 h-10 hover:bg-transparent border-none"
                                            disabled={isLoading}
                                            onClick={() => { setOpenDialog(true); generatePictures() }}
                                        >
                                            <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
                                            </div>
                                            <BlobButton text={
                                                isLoading ? (
                                                    <Loader2 className="h-24 w-24 animate-spin text-pink-600" />
                                                ) : (
                                                    <Sparkles className="w-24 h-24" strokeWidth={1} />
                                                )
                                            } />
                                        </Button>
                                    </CustomCircularProgressbar>
                                    <TooltipTrigger asChild>
                                        <Button
                                            ref={shareButtonRef}
                                            onClick={() => {
                                                console.log('share dialog clicked')
                                                setShowShareDialog(true)
                                            }
                                            }
                                            variant="ghost"
                                            className="!no-underline rounded-full items-center justify-center text-center mx-auto p-1 relative 
                                                           inline-flex group w-10 h-10 text-black dark:text-white self-center shadow-none
                                                          bg-gray-200/20 dark:bg-gray-500/10 hover:bg-yellow-500/10 dark:hover:bg-yellow-500/10"
                                        >
                                            <Share2 size={46} strokeWidth={1} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Share
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </ul>
                    </div>
                )
                }
                {children}
                <CreateMediaArea
                    isLoading={isLoading}
                    progress={progress}
                    savedPrompt={savedPrompt}
                    prompts={prompts}
                    pictures={pictures}
                    webnovel_id={webnovel_id}
                    chapter_id={chapter_id}
                    setIsLoading={setIsLoading}
                    draggableNodeRef={draggableNodeRef}
                    openDialog={openDialog}
                    setOpenDialog={setOpenDialog}
                    setSelection={setSelection}
                    promotionBannerRef={promotionBannerRef}
                    source='chapter'
                    initialNarrations={[]}
                />
                {/* share dialog */}
                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                    <DialogContent className="sm:max-w-md  bg-gradient-to-r dark:from-blue-900/20 dark:to-blue-900/10  from-purple-100/50 to-blue-100/50 backdrop-blur-md select-none" showCloseButton={true}>
                        <DialogHeader>
                            <DialogTitle>Share link</DialogTitle>
                            <DialogDescription>
                                Share the link with your friends and family.
                            </DialogDescription>
                        </DialogHeader>

                        {/* {selection && <span> {truncateText(selection, 197)}</span>} */}

                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={`${process.env.NEXT_PUBLIC_HOST}/view_webnovels?id=${webnovel_id}`}
                                    readOnly
                                    className='select-none bg-transparent'
                                    disabled
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    const linkText = `${process.env.NEXT_PUBLIC_HOST}/view_webnovels?id=${webnovel_id}`;
                                    const text = `${truncateText(selection, 197)} ${webnovel.title} ${chapter.title} ${linkText}`;
                                    copyToClipboard(text);
                                }}
                            >
                                <span className="sr-only">Copy</span>
                                <Copy />
                            </Button>
                        </div>
                        <DialogFooter className="sm:justify-start">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Close
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <ShareAsToonyzPostModal
                    imageOrVideo={'video' as ImageOrVideo}
                    showShareAsPostModal={showShareAsPostModal}
                    setShowShareAsPostModal={setShowShareAsPostModal}
                    index={0}
                    videoFileName={videoFileName!}
                    webnovel_id={webnovel_id}
                    chapter_id={chapter_id}
                    quote={savedPrompt}
                />
            </div >
        );
    }

    return (
        <Drawer open={openDialog} onOpenChange={setOpenDialog}>
            <div className='relative selection:underline selection:bg-fuchsia-300 selection:text-fuchsia-900 selection:decoration-[#DE2B74] selection:decoration-2' ref={containerRef} >
                {selection && position && (
                    <div
                        className="absolute z-10"
                        style={{
                            top: `${position.y + position.height + 30}px`,
                            left: `${position.x - 30}px`,
                        }}
                    >

                        <ul className='flex flex-row gap-1 relative rounded-full items-center justify-center dark:bg-black/50 backdrop-blur-sm'>
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <CustomCircularProgressbar
                                        progress={Math.round(progress)}
                                        size={50}
                                        backgroundColor={theme === 'dark' ? '#000000' : '#ffffff'}
                                        progressColor="#DE2B74"
                                        strokeWidth={5}
                                    >
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            ref={floatingButtonRef}
                                            className="!no-underline rounded-full items-center justify-center text-center mx-auto p-1 relative inline-flex group w-10 h-10 hover:bg-transparent border-none"
                                            disabled={isLoading}
                                            onClick={() => { setOpenDialog(true); generatePictures() }}
                                        >
                                            <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
                                            </div>
                                            <BlobButton text={
                                                isLoading ? (
                                                    <Loader2 className="h-24 w-24 animate-spin text-pink-600" />
                                                ) : (
                                                    <Sparkles className="w-24 h-24" strokeWidth={1} />
                                                )
                                            } />
                                        </Button>
                                    </CustomCircularProgressbar>
                                    <TooltipTrigger asChild>
                                        <Button
                                            ref={shareButtonRef}
                                            onClick={() => {
                                                console.log('share dialog clicked')
                                                setShowShareDialog(true)
                                            }}
                                            className="!no-underline rounded-full items-center justify-center text-center mx-auto p-1 relative 
                                                       inline-flex group w-10 h-10 text-black dark:text-white self-center shadow-none
                                                     bg-gray-200/20 dark:bg-gray-500/10 hover:bg-yellow-500/10 dark:hover:bg-yellow-500/10"
                                        >
                                            <Share2 size={46} strokeWidth={1} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Share
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </ul>

                    </div>
                )}
                {children}
                <DrawerContent
                    className='h-[98vh] no-scrollbar top-5 right-0'
                    style={{
                        backgroundColor: theme === 'light' ? 'white' : '#211F21',
                    }}
                >
                    <DrawerHeader>
                        {/* Ads banner */}
                        <div className='w-full h-14'>
                            <div className='relative top-0 left-0 w-full'>
                                {promotionBannerRef.current}
                            </div>
                        </div>
                    </DrawerHeader>
                    <DrawerFooter className='w-full h-full'>
                        <ScrollArea className='max-h-[600px] no-scrollbar'>

                            <div className='relative w-full h-full'>
                                {isLoading && (
                                    <div className="flex flex-col w-full gap-4">
                                        <div className="flex flex-col mb-2">
                                            <div className="loader-container inline-flex flex-row">
                                                <LottieLoader width="w-20" centered={false} animationData={animationData} />
                                                <p className="text-sm text-muted-foreground mt-2 self-end">
                                                    Generating images... {Math.round(progress)}%
                                                </p>
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
                                )}
                                {pictures.length > 0 && (
                                    <div className="flex flex-col gap-4 mt-6 select-none">
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
                                        </div>
                                    </div>
                                )}

                                {pictures.length > 0 && (
                                    <div className='flex md:flex-row flex-col gap-4 justify-center mt-1'>
                                        <Button
                                            variant="outline"
                                            onClick={makeVideo}
                                            className='inline-flex md:h-52 w-full bg-pink-600 text-white text-lg font-medium tracking-wide p-2 rounded-3xl border-0'>
                                            Make Video
                                            <ArrowRight className='w-4 h-4' />
                                        </Button>
                                        <Link
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                console.log("making slideshow clicked")
                                                makeSlideshow();
                                            }}
                                            className='relative w-full'>
                                            <CardStyleButton
                                                title="Slideshow"
                                                subtitle="Watch Ads to make a slideshow"
                                                ideaCount={pictures.length}
                                                images={pictures}
                                                gradientFrom="#DE2B74"
                                                gradientTo="#FF6F91"
                                                className='w-full'
                                            />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </DrawerFooter>
                </DrawerContent>

                <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-[#211F21] select-none" showCloseButton={true}>
                        <DialogHeader>
                            <DialogTitle>Share link</DialogTitle>
                            <DialogDescription>
                                Share the link with your friends and family.
                            </DialogDescription>
                        </DialogHeader>

                        {selection && <span> {truncateText(selection, 197)}</span>}

                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={`${process.env.NEXT_PUBLIC_HOST}/view_webnovels?id=${webnovel_id}`}
                                    readOnly
                                    className='select-none bg-transparent'
                                    disabled
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    const linkText = `${process.env.NEXT_PUBLIC_HOST}/view_webnovels?id=${webnovel_id}`;
                                    const text = `${truncateText(selection, 197)} ${webnovel.title} ${chapter.title} ${linkText}`;
                                    copyToClipboard(text);
                                }}
                                type="button"
                                size="sm"
                                className="px-3"
                            >
                                <span className="sr-only">Copy</span>
                                <Copy />
                            </Button>
                        </div>
                        <DialogFooter className="sm:justify-start">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Close
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <ShareAsToonyzPostModal
                imageOrVideo={'video' as ImageOrVideo}
                showShareAsPostModal={showShareAsPostModal}
                setShowShareAsPostModal={setShowShareAsPostModal}
                index={0}
                videoFileName={videoFileName!}
                webnovel_id={webnovel_id}
                chapter_id={chapter_id}
                quote={savedPrompt}
                isDesktop={isDesktop}
            />
        </Drawer >
    )
}

export { FloatingMenu }


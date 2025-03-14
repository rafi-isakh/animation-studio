'use Client'
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/shadcnUI/Tooltip"
import { ToastAction } from "@/components/shadcnUI/Toast";
import { Input } from "@/components/shadcnUI/Input"
import { Label } from "@/components/shadcnUI/Label"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { X, Video, Copy, Image, Share2, Sparkles, MoreVertical, Maximize2, Loader2, ArrowRight, ChevronDownSquare, Divide, MessageSquare, RefreshCw } from 'lucide-react';
import { MdStars } from 'react-icons/md';
import { useTheme } from '@/contexts/providers'
import BlobButton from '@/components/UI/BlobButton';
import { truncateText } from '@/utils/truncateText';
import { Webnovel, Chapter, ImageOrVideo } from '@/components/Types';
import { useToast } from "@/hooks/use-toast";
import { CustomCircularProgressbar } from '@/components/UI/CustomCircularProgressbar';
import { useCreateMedia } from '@/contexts/CreateMediaContext';
import { AIPromotionComponent } from '@/components/PromotionBannerComponent'
import { useUser } from '@/contexts/UserContext';
 
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
    const router = useRouter();
    const [showMessage, setShowMessage] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();
    const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
    const [initialDialogPositionSet, setInitialDialogPositionSet] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const { toast } = useToast();
    const [authFailed, setAuthFailed] = useState(false);
    const floatingButtonRef = useRef<HTMLButtonElement>(null);
    const shareButtonRef = useRef<HTMLButtonElement>(null);
    const {
        isLoading,
        setIsLoading,
        progress,
        setProgress,
        savedPrompt,
        setSavedPrompt,
        prompts,
        setPrompts,
        pictures,
        setPictures,
        draggableNodeRef,
        openDialog,
        setOpenDialog,
        selection,
        setSelection,
        position,
        setPosition,
        promotionBannerRef,
        setChapterId,
        setWebnovelId,
        narrations,
        setNarrations,
    } = useCreateMedia();
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const { dictionary, language } = useLanguage();
    const { stars, setInvokeCheckUser } = useUser();

    useEffect(() => {

        setChapterId(chapter_id);
        setWebnovelId(webnovel_id);
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
        setPosition({ x: 0, y: 0, width: 0, height: 0 });
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
        setShowConfirmDialog(true);
    };

    const handleConfirmGeneration = async () => {
        setShowConfirmDialog(false);
        if (stars < 15) {
            toast({
                title: "Error",
                description: phrase(dictionary, "notEnoughStars", language),
                variant: "destructive"
            })
            return;
        }

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
            const response = await fetch(`/api/generate_pictures`, {
                method: 'POST',
                body: JSON.stringify({ text: initialPrompt, n: 4, context: context })
            })

            // const all_chapter_ids = webnovel.chapters.map(chapter => chapter.id)
            // const response = await fetch(`/api/generate_trailer_prompts_and_pictures`, {
            //     method: 'POST',
            //     body: JSON.stringify({ chapter_ids: all_chapter_ids, trailer_style: "anime", trailer_type: "A" })
            // })
            setInvokeCheckUser(prev => !prev); // invoke to update stars after generating pictures

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
            setNarrations(data.narrations);
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


    return (
        <div ref={containerRef} className='relative selection:underline selection:bg-fuchsia-300 selection:text-fuchsia-900 selection:decoration-[#DE2B74] selection:decoration-4' >
            {selection && position && (
                <div className="absolute z-[100]"
                    style={{
                        top: `${position.y + (position.height || 0) + 30}px`,
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
            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md bg-gradient-to-r dark:from-black dark:to-blue-900/10 from-purple-100/50 to-blue-100/50 backdrop-blur-md select-none">
                    <DialogHeader>
                        <DialogTitle>{phrase(dictionary, "confirmGeneration", language)}</DialogTitle>
                        <DialogDescription>
                            <p className='text-sm text-gray-500 py-2'>{phrase(dictionary, "confirmGenerationDescription", language)}</p>
                            {/* Your stars  */}

                            <AIPromotionComponent />
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex !justify-center">
                        <div className="flex flex-row justify-center items-center gap-2 mt-4">

                            {/* <Button
                                variant="outline"
                                onClick={() => { router.push('/stars') }}
                                className="bg-[#D92979] hover:bg-[#D92979]/50 text-white"
                            >
                                {phrase(dictionary, "buyStars", language)}
                            </Button> */}

                            <Button
                                onClick={handleConfirmGeneration}
                                className="bg-black hover:bg-[#D92979]/50 text-white"
                            >
                                <MdStars className="text-xl text-[#D92979]" />
                                {phrase(dictionary, "deduct", language)}{' '}
                                {phrase(dictionary, "ok", language)}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowConfirmDialog(false);
                                    setIsLoading(false);
                                    setOpenDialog(false);
                                }}
                            >
                                <X className="text-xl dark:text-white text-black" />
                                {phrase(dictionary, "cancel", language)}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

export { FloatingMenu }


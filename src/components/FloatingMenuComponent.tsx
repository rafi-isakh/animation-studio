'use Client'
import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
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
import { ToastAction } from "@/components/shadcnUI/Toast";
import { Input } from "@/components/shadcnUI/Input"
import { Label } from "@/components/shadcnUI/Label"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import PictureGenerator from '@/components/PictureGeneratorComponent';
import Link from 'next/link';
import { styled } from '@mui/material';
import { X, Circle, Copy, Image, Share2, Sparkles, MoreVertical, Maximize2 } from 'lucide-react';
import { useTheme } from '@/contexts/providers'
import BlobButton from '@/components/UI/BlobButton';
import { truncateText } from '@/utils/truncateText';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import Draggable from 'react-draggable';
import { Webnovel, Chapter } from '@/components/Types';
import { useToast } from "@/hooks/use-toast";
import WatermarkedImage from "@/utils/watermark";

type Position = {
    x: number;
    y: number;
    width: number;
    height: number;
    window?: () => Window;
};

interface FloatingMenuNavItem {
    icon: React.ReactNode;
    label: string;
    href: string;
    color: string;
    type: 'normal' | 'blob' | 'lottie';
}



const FloatingMenuNavItems: FloatingMenuNavItem[] = [
    { icon: <BlobButton text={<Sparkles size={30} />} />, label: 'AI', href: '#', color: '', type: 'blob' },
    { icon: <Share2 size={30} />, label: 'Share', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10 hover:bg-yellow-500/10', type: 'normal' },
    { icon: <X size={30} />, label: 'Close', href: '#', color: 'bg-gray-200/20 dark:bg-black text-red-500 dark:text-red-500 hover:bg-red-500/10', type: 'normal' },
];

const FloatingMenuNav = ({
    handleOpenModal,
    handleClose,
    setShowShareDialog,
    generatePictures,
}: {
    handleOpenModal: () => void,
    handleClose?: () => void,
    setShowShareDialog: (showShareDialog: boolean) => void,
    generatePictures: () => Promise<void>,
}) => {

    const MenuContainer = styled('div')`
     .lucide {
        stroke-width: 1;
      }
        position: relative;
        margin: 0 auto;
        z-index: 50;
     `;

    return (
        <TooltipProvider delayDuration={0}>
            <MenuContainer>
                <div className="relative rounded-full dark:bg-black/50 backdrop-blur-sm">
                    <div className="flex justify-evenly">
                        {FloatingMenuNavItems.map((item, index) => (
                            <div key={item.label} className="flex-1 w-full group">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href="#"
                                            className="!no-underline flex items-center justify-center text-center mx-auto p-1">
                                            {item.type === 'blob' ? (
                                                <div className="relative inline-flex group p-1 w-16 h-16"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleOpenModal();
                                                    }}
                                                >
                                                    <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
                                                    </div>
                                                    {item.icon}
                                                </div>
                                            ) : (
                                                <span
                                                    className={`${item.color} backdrop-blur-md flex flex-row rounded-full
                                                            group-hover:text-[#DE2B74] text-black dark:text-white 
                                                            ${item.type === 'normal' ? 'p-4' : ''}
                                                            ${item.type === 'lottie' ? 'w-16 h-16 p-0 overflow-hidden' : ''}`}
                                                    onClick={(e) => {
                                                        if (item.label === 'Close') {
                                                            e.preventDefault();
                                                            handleClose?.();
                                                        }
                                                        if (item.label === 'Share') {
                                                            e.preventDefault();
                                                            console.log("share")
                                                            setShowShareDialog(true)
                                                        }
                                                    }}
                                                >
                                                    {item.icon}
                                                </span>
                                            )}
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ))}
                    </div>
                </div>
            </MenuContainer >
        </TooltipProvider >
    );
};

const FloatingMenu: React.FC<{
    children: React.ReactNode;
    window?: () => Window;
    webnovel_id: string;
    chapter_id:
    string;
    context: string,
    webnovel: Webnovel,
    chapter: Chapter,
    selectedText: string;
    setSelectedText: (text: string) => void;
}> = ({ children, window: windowFn, webnovel_id, chapter_id, context, webnovel, chapter, selectedText, setSelectedText }) => {
    const [selection, setSelection] = useState<string>()
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
    const drawerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
    const [initialDialogPositionSet, setInitialDialogPositionSet] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const { toast } = useToast();
    const [savedPrompt, setSavedPrompt] = useState<string>(selectedText || "");
    useEffect(() => {
        const handleSelectionChange = () => {
            const activeSelection = document.getSelection()
            if (!activeSelection) return;
            const text = activeSelection.toString().trim()
            if (!text) return;
            const rect = activeSelection.getRangeAt(0).getBoundingClientRect()
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (containerRect) {
                setSelection(text)
                setPosition({
                    x: rect.left - containerRect.left + (rect.width / 2) - (100 / 2),
                    y: rect.top - containerRect.top - 25,
                    width: rect.width,
                    height: rect.height,
                })
                setSelectedText(text)

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
                setOpenDialog(false);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                drawerRef.current &&
                !drawerRef.current.contains(event.target as Node) &&
                !nodeRef.current?.contains(event.target as Node)
            ) {
                // Close floating menu only and clear timeout
                setSelection(undefined);
                setPosition(undefined);
                setSelectedText('');
                setShowMessage(false);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            }
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        }
    }, []);

    const handleOpenModal = () => {
        setOpenDialog(true);
    }

    const handleClose = () => {
        setSelection(undefined);
        setPosition(undefined);
        setSelectedText('');
        setShowMessage(false);
    }

    const handlePicturesGenerated = (newPictures: string[]) => {
        setOpenDialog(true);
    };


    useEffect(() => {
        if (!initialDialogPositionSet && nodeRef.current) {
            const viewportWidth = windowFn?.()?.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = windowFn?.()?.innerHeight || document.documentElement.clientHeight;

            setDialogPosition({
                x: viewportWidth - 1000, // Position it near the right edge
                y: viewportHeight / 4,   // Position it a quarter down from the top
            });
            setInitialDialogPositionSet(true);
        }
    }, [initialDialogPositionSet, windowFn]);


    const copyToClipboard = async (text: string) => {
        try {
            // Check if Clipboard API is available
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                toast({
                    variant: "success",
                    title: "Link copied to clipboard!",
                    description: "You can now paste it anywhere you want.",
                })
            } else {
                // Fallback for older browsers
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed"; // Prevent scrolling to bottom of page
                textArea.style.left = "-9999px"; // Hide the textarea
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand("copy");
                    toast({
                        variant: "destructive",
                        title: "Failed to copy",
                        description: "Please try selecting and copying the text manually.",
                    })
                } catch (err) {
                    console.error("Fallback: Unable to copy", err);
                    toast({
                        variant: "destructive",
                        title: "Failed to copy",
                        description: "Please try selecting and copying the text manually.",
                    })
                }
                document.body.removeChild(textArea);
            }
        } catch (err) {
            console.error("Failed to copy text: ", err);
            toast({
                variant: "destructive",
                title: "Failed to copy",
                description: "Please try selecting and copying the text manually.",
            })
        }
    };

    // image generating
    const generatePictures = async () => {
        // setSavedPrompt(selectedText);
        if (!savedPrompt) {
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
                body: JSON.stringify({ text: savedPrompt, n: 4, context: context })
            })

            if (!response.ok) {
                switch (response.status) {
                    case 401:
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
                <Dialog open={openDialog} onOpenChange={setOpenDialog} modal={false}>
                    {selection && position && (
                        <div className="absolute z-10 w-30"
                            style={{
                                top: `${position.y + position.height + 30}px`,
                                left: `${position.x - 1}px`,
                            }}>
                            <DialogTrigger asChild>
                                <FloatingMenuNav
                                    handleOpenModal={handleOpenModal}
                                    handleClose={handleClose}
                                    setShowShareDialog={setShowShareDialog}
                                    generatePictures={generatePictures}
                                />
                            </DialogTrigger>
                        </div>
                    )}
                    {children}
                    <Draggable
                        nodeRef={nodeRef}
                        position={dialogPosition}
                        onStop={(e, data) => {
                            setDialogPosition({ x: data.x, y: data.y });
                        }}
                        handle=".drag-handle"
                        bounds="body"
                    >
                        <DialogContent
                            ref={nodeRef}
                            forceMount
                            className="sm:max-w-[425px] max-h-[90vh] select-none fixed top-10 right-0 p-0 dark:bg-[#211F21] bg-white rounded-lg no-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                            showCloseButton={false}
                        >
                            <DialogHeader className='drag-handle px-2 py-[1.1rem] '>
                                <div className="flex items-center justify-between p-4 border-b">
                                    <div className="flex items-center gap-2">
                                        {/* <Sparkles className="h-5 w-5 text-black dark:text-white" /> */}
                                        <DialogTitle>
                                            <h1 className="text-xl font-medium uppercase">Toonyz Post</h1>
                                        </DialogTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 cursor-move" >
                                            <Maximize2 className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setOpenDialog(false);
                                                e.stopPropagation()
                                                setSelectedText('');
                                            }}>

                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </DialogHeader>
                            <ScrollArea className='drag-handle h-screen items-start flex-1 no-scrollbar '>
                                <div className='relative w-full'>
                                    <PictureGenerator
                                        context={truncateText(context, 197)}
                                        prompt={truncateText(selectedText, 197)}
                                        onComplete={handlePicturesGenerated}
                                        webnovel_id={webnovel_id}
                                        chapter_id={chapter_id}
                                    />
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Draggable>



                    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                        <DialogContent className="sm:max-w-md bg-white dark:bg-[#211F21] select-none" showCloseButton={true}>
                            <DialogHeader>
                                <DialogTitle>Share link</DialogTitle>
                                <DialogDescription>
                                    Share the link with your friends and family.
                                </DialogDescription>
                            </DialogHeader>

                            {selectedText && <span> {truncateText(selectedText, 197)}</span>}

                            <div className="flex items-center space-x-2">
                                <div className="grid flex-1 gap-2">
                                    <Label htmlFor="link" className="sr-only">
                                        Link
                                    </Label>
                                    <Input
                                        id="link"
                                        defaultValue={`${window.location.origin}/webnovel/${webnovel_id}/chapter/${chapter_id}`}
                                        readOnly
                                        className='select-none bg-transparent'
                                        disabled
                                    />
                                </div>
                                <Button
                                    onClick={() => {
                                        const linkText = `${window.location.origin}/webnovel/${webnovel_id}/chapter/${chapter_id}`;
                                        const text = `${truncateText(selectedText, 197)} ${webnovel.title} ${chapter.title} ${linkText}`;
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
                </Dialog>
            </div>
        );
    }

    return (
        <Drawer open={openDialog} onOpenChange={setOpenDialog}>
            <div className='relative selection:underline selection:bg-fuchsia-300 selection:text-fuchsia-900 selection:decoration-[#DE2B74] selection:decoration-2' ref={containerRef} >
                {selection && position && (
                    <div
                        className="absolute z-10 w-30"
                        style={{
                            top: `${position.y + position.height + 30}px`,
                            left: `${position.x - 30}px`,
                        }}
                    >
                        <DrawerTrigger asChild>
                            <FloatingMenuNav
                                handleOpenModal={handleOpenModal}
                                handleClose={handleClose}
                                setShowShareDialog={setShowShareDialog}
                                generatePictures={generatePictures}
                            />
                        </DrawerTrigger>
                    </div>
                )}
                {children}
                <DrawerContent
                    className='h-[90%] no-scrollbar top-5 right-0'
                    style={{
                        backgroundColor: theme === 'light' ? 'white' : '#211F21',
                    }}
                >
                    <DrawerHeader className='px-2 py-[1.1rem] border-b border-gray-200 dark:border-gray-800 '>
                        <DrawerTitle className='absolute top-0 left-0'>
                            <div className='flex flex-row gap-1 items-center justify-center p-2'>
                                <DrawerClose className='rounded-full bg-red-600 hover:bg-red-700 w-5 h-5 flex items-center justify-center border border-transparent'>
                                    <X size={8} className="text-red-600" />
                                </DrawerClose>
                                <div className='rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-600 w-5 h-5 flex items-center justify-center p-0 border border-transparent'>
                                    <Circle size={8} className="text-gray-200 dark:text-gray-700" />
                                </div>
                                <div className='rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-600 w-5 h-5 flex items-center justify-center p-0 border border-transparent'>
                                    <Circle size={8} className="text-gray-200 dark:text-gray-700" />
                                </div>
                            </div>
                        </DrawerTitle>
                    </DrawerHeader>

                    <DrawerFooter className='w-full h-full'>
                        <ScrollArea className='no-scrollbar'>
                            <PictureGenerator
                                context={truncateText(context, 200)}
                                prompt={truncateText(selectedText, 200)}
                                onComplete={handlePicturesGenerated}
                                webnovel_id={webnovel_id}
                                chapter_id={chapter_id}
                            />
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

                        {selectedText && <span> {truncateText(selectedText, 197)}</span>}

                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <Label htmlFor="link" className="sr-only">
                                    Link
                                </Label>
                                <Input
                                    id="link"
                                    defaultValue={`${window.location.origin}/webnovel/${webnovel_id}/chapter/${chapter_id}`}
                                    readOnly
                                    className='select-none bg-transparent'
                                    disabled
                                />
                            </div>
                            <Button
                                onClick={() => {
                                    const linkText = `${window.location.origin}/webnovel/${webnovel_id}/chapter/${chapter_id}`;
                                    const text = `${truncateText(selectedText, 197)} ${webnovel.title} ${chapter.title} ${linkText}`;
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
        </Drawer >
    )
}

export { FloatingMenu }


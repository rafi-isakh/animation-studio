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
import { Input } from "@/components/shadcnUI/Input"
import { Label } from "@/components/shadcnUI/Label"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import PictureGenerator from '@/components/PictureGeneratorComponent';
import Link from 'next/link';
import { styled } from '@mui/material';
import { X, Circle, ArrowRight, WandSparkles, Compass, Clapperboard, Image, Share2, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/providers'
import BlobButton from '@/components/UI/BlobButton';
import { truncateText } from '@/utils/truncateText';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import Draggable from 'react-draggable';

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


const MenuContainer = styled('div')`
  .lucide {
    stroke-width: 1;
  }
  position: relative;
  margin: 0 auto;
  z-index: 50;
`;

const FloatingMenuNavItems: FloatingMenuNavItem[] = [
    // { icon: <LottieLoader animationData={animationData} className='object-cover' />, label: 'Home', href: '#', color: 'bg-black/10 dark:bg-black', isLottie: true },
    // { icon: <Sparkles size={30} />, label: 'Explore', href: '#', color: 'bg-black/10 dark:bg-black  hover:bg-blue-500/10', type: 'normal' },
    { icon: <BlobButton text={<Sparkles size={30} />} />, label: 'ImageStudio', href: '#', color: '', type: 'blob' },
    { icon: <Image size={30} />, label: 'VideoStudio', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10  hover:bg-blue-500/10', type: 'normal' },
    { icon: <Share2 size={30} />, label: 'Share', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10 hover:bg-yellow-500/10', type: 'normal' },
    { icon: <X size={30} />, label: 'Close', href: '#', color: 'bg-gray-200/20 dark:bg-black text-red-500 dark:text-red-500 hover:bg-red-500/10', type: 'normal' },
];

const FloatingMenuNav = ({ handleOpenModal, handleClose }: { handleOpenModal: () => void, handleClose?: () => void }) => {
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
    context: string
}> = ({ children, window: windowFn, webnovel_id, chapter_id, context }) => {
    const [selection, setSelection] = useState<string>()
    const [position, setPosition] = useState<Position | undefined>();
    const [selectedText, setSelectedText] = useState<string>('');
    const [showMessage, setShowMessage] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { language, dictionary } = useLanguage();
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [showPleaseLogin, setShowPleaseLogin] = useState(false);
    const [isGeneratingPictures, setIsGeneratingPictures] = useState(false);
    const [showError, setShowError] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [pictures, setPictures] = useState([]);
    const [value, setValue] = React.useState('1');
    const drawerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
    const [initialDialogPositionSet, setInitialDialogPositionSet] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);

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

                // timeoutRef.current = setTimeout(() => {
                //     handleClose();
                // }, 5000);
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
                setOpen(false);
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
        setOpen(true);
    }

    const handleClose = () => {
        // First, add a fade-out animation
        // if (containerRef.current) {
        //     containerRef.current.style.transition = 'opacity 0.3s ease';
        //     containerRef.current.style.opacity = '0';
        // }

        // Wait for the animation to complete before closing
        setTimeout(() => {
            setSelection(undefined);
            setPosition(undefined);
            setSelectedText('');
            setShowMessage(false);

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Reset the opacity for next open
            // if (containerRef.current) {
            //     containerRef.current.style.opacity = '1';
            // }
        }, 300); // Match this duration with the transition duration
    }

    const handlePicturesGenerated = (newPictures: string[]) => {
        setOpen(true);
    };


    useEffect(() => {
        if (!initialDialogPositionSet && nodeRef.current) {
            const viewportWidth = windowFn?.()?.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = windowFn?.()?.innerHeight || document.documentElement.clientHeight;
            // Code is cut off here
        }
    }, [initialDialogPositionSet]);
    // Update your useEffect for initial positioning
    useEffect(() => {
        if (!initialDialogPositionSet && nodeRef.current) {
            const viewportWidth = windowFn?.()?.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = windowFn?.()?.innerHeight || document.documentElement.clientHeight;

            setDialogPosition({
                x: viewportWidth - 450, // Position it near the right edge
                y: viewportHeight / 4,   // Position it a quarter down from the top
            });
            setInitialDialogPositionSet(true);
        }
    }, [initialDialogPositionSet, windowFn]);



    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={setOpen} modal={false}>
                <div className='relative' ref={containerRef} >
                    {selection && position && (
                        <div
                            className="absolute z-10 w-30"
                            style={{
                                top: `${position.y + position.height + 30}px`,
                                left: `${position.x - 1}px`,
                            }}
                        >
                            <style jsx global>{`
                            ::selection {
                                @apply ${theme === 'light' && theme === 'light' ? 'bg-[#FEF0D4]' : 'dark:bg-[rgba(25,118,210,0.1)] bg-[rgba(25,118,210,0.1)]'}
                                @apply ${theme === 'dark' && theme === 'dark' ? 'bg-[rgba(25,118,210,0.1)]' : 'bg-[#FEF0D4]'};
                                text-decoration: underline;
                                text-decoration-color: #DE2B74;
                                text-decoration-thickness: 2px;
                                text-decoration-style: solid;
                            }                            
                        `}</style>
                            <DialogTrigger asChild>
                                <FloatingMenuNav handleOpenModal={handleOpenModal} handleClose={handleClose} />
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
                            className="sm:max-w-[425px] h-screen select-none fixed top-10 right-0 p-0 dark:bg-[#211F21] bg-white rounded-lg no-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                            showCloseButton={false}
                        >
                            <DialogHeader className='drag-handle cursor-move  px-2 py-[1.1rem] border-b border-gray-200 dark:border-gray-800 '>
                                <DialogTitle className='absolute top-0 left-0 '>
                                    <div className='flex flex-row gap-1 items-start justify-start p-2'>
                                        <DialogClose
                                            className='rounded-full bg-red-600 hover:bg-red-700 w-5 h-5 flex items-center justify-center p-0 border border-transparent'
                                            onClick={handleClose}>
                                            <X size={8} className="text-red-600" />
                                        </DialogClose>
                                        <DialogClose disabled className='rounded-full bg-gray-200  dark:bg-gray-700 hover:bg-gray-600 w-5 h-5 flex items-center justify-center p-0 border border-transparent'>
                                            <Circle size={8} className="text-gray-200 dark:text-gray-700" />
                                        </DialogClose>
                                        <DialogClose disabled className='rounded-full bg-gray-200  dark:bg-gray-700 hover:bg-gray-600 w-5 h-5 flex items-center justify-center p-0 border border-transparent'>
                                            <Circle size={8} className="text-gray-200 dark:text-gray-700" />
                                        </DialogClose>
                                    </div>
                                </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className='drag-handle h-screen items-start flex-1 no-scrollbar'>
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
                </div>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <div className='relative' ref={containerRef} >
                {selection && position && (
                    <div
                        className="absolute z-10 w-30"
                        style={{
                            top: `${position.y + position.height + 30}px`,
                            left: `${position.x - 30}px`,
                        }}
                    >
                        <style jsx global>{`
                        ::selection {
                             @apply ${theme === 'light' && theme === 'light' ? 'bg-[#FEF0D4]' : 'dark:bg-[rgba(25,118,210,0.1)] bg-[rgba(25,118,210,0.1)]'}
                             @apply ${theme === 'dark' && theme === 'dark' ? 'bg-[rgba(25,118,210,0.1)]' : 'bg-[#FEF0D4]'};
                            text-decoration: underline;
                            text-decoration-color: #DE2B74;
                            text-decoration-thickness: 2px;
                            text-decoration-style: solid;
                        }
                        `}</style>
                        <DrawerTrigger asChild>
                            <FloatingMenuNav handleOpenModal={handleOpenModal} handleClose={handleClose} />
                        </DrawerTrigger>
                    </div>
                )}
                {children}
                <DrawerContent
                    className='h-[90%] no-scrollbar'
                    style={{
                        backgroundColor: theme === 'light' ? 'white' : '#211F21',
                    }}
                >
                    <DrawerHeader className='px-2 py-[1.1rem] border-b border-gray-200 dark:border-gray-800 '>
                        <DrawerTitle className='absolute top-0 left-0'>
                            <div className='flex flex-row gap-1 items-center justify-center p-2'>
                                <DrawerClose className='rounded-full bg-red-600 hover:bg-red-700 w-5 h-5 flex items-center justify-center border border-transparent' onClick={handleClose}>
                                    <X size={8} className="text-red-600" />
                                </DrawerClose>
                                <div className='rounded-full bg-gray-200  dark:bg-gray-700 hover:bg-gray-600 w-5 h-5 flex items-center justify-center p-0 border border-transparent'>
                                    <Circle size={8} className="text-gray-200 dark:text-gray-700" />
                                </div>
                                <div className='rounded-full bg-gray-200  dark:bg-gray-700 hover:bg-gray-600 w-5 h-5 flex items-center justify-center p-0 border border-transparent'>
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
            </div>
        </Drawer>
    )
}

export { FloatingMenu }


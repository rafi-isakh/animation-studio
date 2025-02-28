'use Client'
import React, { useEffect, useState, useRef } from 'react';
import { cn } from "@/lib/utils"
import useMediaQuery from '@mui/material/useMediaQuery';
import { Button } from "@/components/shadcnUI/Button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/shadcnUI/AlertDialog"
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
import { Input } from "@/components/shadcnUI/Input"
import { Label } from "@/components/shadcnUI/Label"
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import PictureGenerator from '@/components/PictureGeneratorComponent';
import Link from 'next/link';
import { X, Circle, ArrowRight, WandSparkles, Compass, Clapperboard, Image, Share2, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/providers'
import BlobButton from '@/components/UI/BlobButton';
import { truncateText } from '@/utils/truncateText';

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
    // { icon: <LottieLoader animationData={animationData} className='object-cover' />, label: 'Home', href: '#', color: 'bg-black/10 dark:bg-black', isLottie: true },
    // { icon: <Sparkles size={30} />, label: 'Explore', href: '#', color: 'bg-black/10 dark:bg-black  hover:bg-blue-500/10', type: 'normal' },
    { icon: <BlobButton text={<Sparkles size={30} />} />, label: 'ImageStudio', href: '#', color: '', type: 'blob' },
    { icon: <Image size={30} />, label: 'VideoStudio', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10  hover:bg-blue-500/10', type: 'normal' },
    { icon: <Share2 size={30} />, label: 'Share', href: '#', color: 'bg-gray-200/20 dark:bg-gray-500/10 hover:bg-yellow-500/10', type: 'normal' },
];

const FloatingMenuNav = ({ handleOpenModal }: { handleOpenModal: () => void }) => {
    return (
        <div className="relative mx-auto z-150">
            <style jsx global>{`
                    .lucide {
                        stroke-width: 1px;
                    }
                `}</style>
            <div className="relative rounded-full dark:bg-black/50 backdrop-blur-sm">
                <div className="flex justify-evenly">
                    {FloatingMenuNavItems.map((item, index) => (
                        <div key={item.label} className="flex-1 w-full group">
                            <Link
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleOpenModal();
                                }}
                                className="!no-underline flex items-center justify-center text-center mx-auto p-1">
                                {item.type === 'blob' ? (
                                    // Special rendering for blob type items
                                    <div className="relative inline-flex group p-1 w-16 h-16">
                                        <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
                                        </div>
                                        {item.icon}
                                    </div>
                                ) : (
                                    // Regular rendering for other types
                                    <span
                                        className={`${item.color} backdrop-blur-md flex flex-row rounded-full
                                                            group-hover:text-[#DE2B74] text-black dark:text-white 
                                                            ${item.type === 'normal' ? 'p-4' : ''}
                                                            ${item.type === 'lottie' ? 'w-16 h-16 p-0 overflow-hidden' : ''}`}>
                                        {item.icon}
                                    </span>
                                )}
                            </Link>

                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};


const FloatingMenu: React.FC<{
    children: React.ReactNode;
    window?: () => Window;
    webnovel_id: string;
    chapter_id:
    string;
    context: string
}> = ({ children, window, webnovel_id, chapter_id, context }) => {
    const [selection, setSelection] = useState<string>()
    const [position, setPosition] = useState<Position | undefined>();
    const [selectedText, setSelectedText] = useState<string>('');
    const [showMessage, setShowMessage] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showIsModal, setShowIsModal] = useState(false);
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
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const dialogRef = useRef<HTMLDivElement>(null);

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
                    x: rect.left - containerRect.left + (rect.width / 2) - (30 / 2),
                    y: rect.top - containerRect.top - 30,
                    width: rect.width,
                    height: rect.height,
                })
                setSelectedText(text)

                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    handleClose();
                }, 8000);
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
                !drawerRef.current.contains(event.target as Node)
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

    useEffect(() => {
        if (dialogRef.current && !initialDialogPositionSet) {
            // Get the viewport dimensions
            const viewportWidth = window?.()?.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window?.()?.innerHeight || document.documentElement.clientHeight;

            // Calculate the center position
            const centerX = viewportWidth / 2;
            const centerY = viewportHeight / 2;

            setDialogPosition({ x: centerX, y: centerY });
            setInitialDialogPositionSet(true);
        }
    }, [dialogRef.current, initialDialogPositionSet]);

    const handleOpenModal = () => {
        setOpen(true);
    }

    const handleClose = () => {
        setSelection(undefined);
        setPosition(undefined);
        setSelectedText('');
        setShowMessage(false);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }

    const handlePicturesGenerated = (newPictures: string[]) => {
        setOpen(true);
    };


    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (dialogRef.current) {
            setIsDragging(true);
            const boundingRect = dialogRef.current.getBoundingClientRect();

            // Store the offset between mouse position and dialog top-left corner
            setDragOffset({
                x: e.clientX - boundingRect.left,
                y: e.clientY - boundingRect.top
            });
        }
    };

    const handleDragMove = (e: MouseEvent) => {
        if (isDragging) {
            // Calculate new position considering scroll position
            const win = typeof window !== 'undefined' ? (window?.() || window) : null;
            const scrollX = win?.scrollX || 0;
            const scrollY = win?.scrollY || 0;

            setDialogPosition({
                x: e.clientX - dragOffset.x + scrollX,
                y: e.clientY - dragOffset.y + scrollY
            });
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window?.()?.document.addEventListener('mousemove', handleDragMove);
            window?.()?.document.addEventListener('mouseup', handleDragEnd);
        }

        return () => {
            window?.()?.document.removeEventListener('mousemove', handleDragMove);
            window?.()?.document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging, dragOffset]);

    if (isDesktop) {
        return (
            <AlertDialog open={open} onOpenChange={setOpen}>
                <div className='relative' ref={containerRef} >
                    {selection && position && (
                        <div
                            className="absolute z-10 w-30"
                            style={{
                                top: `${position.y + position.height + 30}px`,
                                left: `${position.x - 30}px`,
                            }}
                        // onClick={handleClose}
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
                            <AlertDialogTrigger asChild>
                                <FloatingMenuNav handleOpenModal={handleOpenModal} />
                            </AlertDialogTrigger>
                        </div>
                    )}
                    {children}
                    <AlertDialogContent
                        ref={dialogRef}
                        className="sm:max-w-[425px] select-none p-0 dark:bg-[#211F21] bg-white"
                        style={{
                            position: 'fixed',
                            left: isDragging || initialDialogPositionSet ? `${dialogPosition.x}px` : '50%',
                            top: isDragging || initialDialogPositionSet ? `${dialogPosition.y}px` : '50%',
                            transform: isDragging || initialDialogPositionSet
                                ? 'translate(-50%, -50%)'
                                : 'translate(-50%, -50%)',
                            cursor: isDragging ? 'grabbing' : 'pointer'
                        }}
                        onMouseDown={handleDragStart}
                           >
                        <AlertDialogHeader className='px-2 py-[1.1rem] border-b border-gray-200 dark:border-gray-800 '>
                            <AlertDialogTitle className='absolute top-0 left-0 '>
                                <div className='flex flex-row gap-1 items-center justify-center p-2'>
                                    <AlertDialogCancel className='rounded-full bg-red-600 hover:bg-red-700 w-5 h-5 flex items-center justify-center p-0 border border-transparent' onClick={handleClose}>
                                        <X size={8} className="text-white p-[1px]" />
                                    </AlertDialogCancel>
                                    <AlertDialogAction className='rounded-full bg-gray-200  dark:bg-gray-700 hover:bg-gray-600 w-5 h-5 flex items-center justify-center p-0 border border-transparent'>
                                        <Circle size={8} className="text-gray-200 dark:text-gray-700" />
                                    </AlertDialogAction>
                                    <AlertDialogAction className='rounded-full bg-gray-200  dark:bg-gray-700 hover:bg-gray-600 w-5 h-5 flex items-center justify-center p-0 border border-transparent'>
                                        <Circle size={8} className="text-gray-200 dark:text-gray-700" />
                                    </AlertDialogAction>
                                </div>
                            </AlertDialogTitle>

                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <div className='relative w-full'>
                                <PictureGenerator
                                    context={truncateText(context, 200)}
                                    prompt={truncateText(selectedText, 200)}
                                    onComplete={handlePicturesGenerated}
                                    webnovel_id={webnovel_id}
                                    chapter_id={chapter_id}
                                />
                            </div>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </div>
            </AlertDialog>
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
                    // onClick={handleClose}
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
                            <FloatingMenuNav handleOpenModal={handleOpenModal} />
                        </DrawerTrigger>
                    </div>
                )}
                {children}
                <DrawerContent
                    className='h-[80%]'
                    style={{
                        backgroundColor: theme === 'light' ? 'white' : '#211F21',
                    }}
                >
                    <DrawerHeader className='px-2 py-[1.1rem] border-b border-gray-200 dark:border-gray-800 '>
                        <DrawerTitle className='absolute top-0 left-0'>
                            <div className='flex flex-row gap-1 items-center justify-center p-2'>
                                <DrawerClose className='rounded-full bg-red-600 hover:bg-red-700 w-5 h-5 flex items-center justify-center border border-transparent' onClick={handleClose}>
                                    <X size={8} className="text-white" />
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
                        <div className='relative'>
                            <PictureGenerator
                                context={truncateText(context, 200)}
                                prompt={truncateText(selectedText, 200)}
                                onComplete={handlePicturesGenerated}
                                webnovel_id={webnovel_id}
                                chapter_id={chapter_id}
                            />
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </div>
        </Drawer>
    )
}

export { FloatingMenu }

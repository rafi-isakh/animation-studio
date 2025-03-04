"use client"

import React, { useEffect, useState, useRef } from 'react';
import { Chapter, Webnovel } from '@/components/Types';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogClose
} from "@/components/shadcnUI/Dialog";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
    NavigationMenuViewport
} from "@/components/shadcnUI/NavigationMenu"
import { Button } from "@/components/shadcnUI/Button";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { useReader } from '@/contexts/ReaderContext';
import { useTheme } from '@/contexts/providers'
import { ChevronLeft, ChevronRight, Sparkles, X, Circle } from 'lucide-react';
import BlobButton from '@/components/UI/BlobButton';
import Draggable from 'react-draggable';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcnUI/Tooltip';
import { useFloatingMenuContext } from '@/components/FloatingMenuComponent';


const ViewerFooter = ({ webnovel, chapter, context, prompt }: { webnovel: Webnovel, chapter: Chapter, context: string, prompt: string }) => {
    const [webnovelId, setWebnovelId] = useState(0);
    const [chapterId, setChapterId] = useState(0);
    const { language, dictionary } = useLanguage();
    const [showIsLastChapterModal, setShowIsLastChapterModal] = useState(false);
    const [showIsFirstChapterModal, setShowIsFirstChapterModal] = useState(false);
    const [nextChapterLink, setNextChapterLink] = useState('');
    const [prevChapterLink, setPrevChapterLink] = useState('');
    const chapters = webnovel.chapters.sort((a, b) => a.id - b.id);
    const [isVisible, setIsVisible] = useState(true); // State to track visibility
    const [lastScrollY, setLastScrollY] = useState(0); // Track the last scroll position
    const { scrollType, setPage } = useReader();
    const [openMenu, setOpenMenu] = useState(false)
    const menuContentRef = useRef<HTMLDivElement>(null);
    const [allowClose, setAllowClose] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [webnovel, chapter])

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        // If scrollType is horizontal, always show the footer
        // if (scrollType === 'horizontal') {
        //     setIsVisible(true);
        //     return; // Exit early, no need to add scroll listener
        // }

        const handleScroll = () => {
            if (scrollType === 'vertical' || scrollType === 'horizontal') {
                const currentScrollY = window.scrollY;
                if (currentScrollY < lastScrollY) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }

                setLastScrollY(currentScrollY);

                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    setIsVisible(false); // Hide after a delay when scrolling stops
                }, 2000);
            }
        };

        // Add scroll event listener
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId); // Clear timeout when component unmounts
        };
    }, [scrollType, lastScrollY]);


    useEffect(() => {
        setWebnovelId(webnovel.id);
        setChapterId(chapter.id);

        const nextId = getNextChapterId(chapter.id);
        const prevId = getPrevChapterId(chapter.id);

        setNextChapterLink(`/chapter_view/${nextId.toString()}`);
        setPrevChapterLink(`/chapter_view/${prevId.toString()}`);
    }, [webnovel, chapter])


    const getNextChapterId = (currentChapterId: number) => {
        const index = webnovel.chapters.findIndex(ch => ch.id === currentChapterId);
        if (index === webnovel.chapters.length - 1) {
            return currentChapterId; // Stay on the same chapter if it's the last one
        }
        return chapters[index + 1].id;
    }

    const getPrevChapterId = (currentChapterId: number) => {
        const index = webnovel.chapters.findIndex(ch => ch.id === currentChapterId);
        if (index === 0) {
            return currentChapterId; // Stay on the same chapter if it's the first one
        }
        return chapters[index - 1].id;
    }

    const handleNextChapter = () => {
        if (chapterId === webnovel.chapters[webnovel.chapters.length - 1].id) {
            setShowIsLastChapterModal(true);
        }
    }

    const handlePrevChapter = () => {
        if (chapterId === webnovel.chapters[0].id) {
            setShowIsFirstChapterModal(true);
        }
    }

    const handleOpenMenu = () => {
        setAllowClose(false);
        setOpenMenu(true);
    }

    // Function to close the menu
    const handleCloseMenu = () => {
        setAllowClose(true);
        setOpenMenu(false);
    }

    // useEffect(() => {
    //     if (!initialDialogPositionSet && nodeRef.current) {
    //         const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    //         const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    //         setDialogPosition({
    //             x: viewportWidth - 450, // Position it near the right edge
    //             y: viewportHeight / 4,   // Position it a quarter down from the top
    //         });
    //         setInitialDialogPositionSet(true);
    //     }
    // }, [initialDialogPositionSet]);


    return (
        <>
            <NavigationMenu className="fixed w-full md:max-w-screen-sm md:pl-[72px] bottom-0 left-1/2 -translate-x-1/2 select-none z-[1250]">
                <NavigationMenuList
                    className={`w-full mx-auto justify-center rounded-t-lg max-w-[350px]
                              bg-white  dark:bg-[#211F21] bg-white text-black
                                 dark:text-white font-base !text-base
                                bottom-0 left-0 pt-2 pb-2 mr-0 ml-0 
                                transition-transform duration-300 
                                ${scrollType === 'horizontal' ? 'translate-y-0' : ''}
                                ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>

                                    {/*   ${theme === 'light' ? 'bg-white text-black' : 'dark:bg-[#211F21] bg-[#211F21]'}
                                          ${theme === 'dark' ? 'dark:bg-[#211F21] dark:text-white' : 'bg-white text-black'}
                                 */}
                    <NavigationMenuItem>
                        <div className={` text-black dark:text-white flex gap-5 items-center justify-evenly mx-auto p-2 z-[1150]`}>
                            <Link href={prevChapterLink} onClick={handlePrevChapter} className='z-[1250]' >
                                <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center'>
                                    <ChevronLeft size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                                    {phrase(dictionary, "prevChapter", language)}
                                </div>
                            </Link>
                        </div>
                    </NavigationMenuItem>

                    {/* middle post button */}
                    <NavigationMenuItem>
                        <NavigationMenuTrigger
                            onClick={(e) => {
                                e.preventDefault();
                                handleOpenMenu();
                            }}
                            showChevron={false}
                            className='bg-transparent hover:bg-transparent dark:hover:bg-transparent'>
                            <div className="relative inline-flex group p-1 w-12 h-12">
                                <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
                                </div>
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <BlobButton text={<TooltipTrigger asChild>
                                            <Sparkles size={20} />
                                        </TooltipTrigger>
                                        }/>
                                        <TooltipContent>
                                            post
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent
                            className="data-[motion=from-start]:animate-enterFromBottom data-[motion=from-end]:animate-enterFromBottom data-[motion=to-start]:animate-exitToBottom data-[motion=to-end]:animate-exitToBottom"
                        >
                            {prompt}
                        </NavigationMenuContent>
                        </NavigationMenuItem>


                        <NavigationMenuItem>
                            <Link href={nextChapterLink} onClick={handleNextChapter}>
                                <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center'>
                                    {phrase(dictionary, "nextChapter", language)}
                                <ChevronRight size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                            </div>
                        </Link>
                    </NavigationMenuItem>
                </NavigationMenuList >
                <NavigationMenuViewport className="bottom-0 left-0 z-[1250]" />
            </NavigationMenu >
            {/* Dialogs for last and first chapter */}
            < Dialog open={showIsLastChapterModal} onOpenChange={setShowIsLastChapterModal} >
                <DialogContent
                    className="sm:max-w-[425px] select-none dark:bg-[#211F21] bg-white rounded-lg no-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                    showCloseButton={true}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {phrase(dictionary, "isLastChapter", language)}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        <div className='flex flex-col space-y-4'>
                            <p>{phrase(dictionary, "isLastChapter", language)}</p>
                            <Button color="gray" variant="outline" className='border-0 text-white w-full bg-[#DE2B74]' onClick={() => setShowIsLastChapterModal(false)}>
                                {phrase(dictionary, "ok", language)}
                            </Button>
                        </div>
                    </DialogDescription>
                </DialogContent>
            </Dialog >
            <Dialog open={showIsFirstChapterModal} onOpenChange={setShowIsFirstChapterModal}>
                <DialogContent
                    className="sm:max-w-[425px] select-none dark:bg-[#211F21] bg-white rounded-lg no-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                    showCloseButton={true}
                >
                    <DialogHeader>
                        <DialogTitle>
                            {phrase(dictionary, "isFirstChapter", language)}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        <div className='flex flex-col space-y-4'>
                            <p>{phrase(dictionary, "isFirstChapter", language)}</p>
                            <Button color="gray" variant="outline" className='border-0 text-white w-full bg-[#DE2B74]' onClick={() => setShowIsFirstChapterModal(false)}>
                                {phrase(dictionary, "ok", language)}
                            </Button>
                        </div>
                    </DialogDescription>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ViewerFooter;
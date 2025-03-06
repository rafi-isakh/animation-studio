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
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/shadcnUI/Menubar";
import { Button } from "@/components/shadcnUI/Button";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { useReader } from '@/contexts/ReaderContext';
import { useTheme } from '@/contexts/providers'
import {
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X,
    BookOpen,
} from 'lucide-react';
import { Slider } from '@/components/shadcnUI/Slider';
import { Switch } from '@/components/shadcnUI/Switch';
import { Label } from '@/components/shadcnUI/Label';
import BlobButton from '@/components/UI/BlobButton';
import { ScrollArea } from '@/components/shadcnUI/ScrollArea';
import useMediaQuery from '@mui/material/useMediaQuery';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/shadcnUI/Tooltip';
import { truncateText } from '@/utils/truncateText';



const ViewerFooter = ({ webnovel, chapter, selectedText, page, maxPage }:
    { webnovel: Webnovel, chapter: Chapter, selectedText: string, page: number, maxPage: number }) => {
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
    const [scrollPercent, setScrollPercent] = useState(0);

    useEffect(() => {
        if (scrollType === 'horizontal') {
            // Handle horizontal pagination
            if (page && maxPage) {
                setScrollPercent(Math.floor((page / maxPage) * 100));
            }
        } else {
            // Handle vertical scrolling
            const handleScroll = () => {
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight - windowHeight;
                const scrolled = window.scrollY;
                const percent = Math.floor((scrolled / documentHeight) * 100);
                setScrollPercent(percent);
            };

            // Add scroll event listener
            window.addEventListener('scroll', handleScroll);
            // Initial calculation
            handleScroll();

            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, [page, maxPage, scrollType]);


    useEffect(() => {
        setPage(1);
    }, [webnovel, chapter])

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

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

    const handleOpenChange = (e: React.MouseEvent<HTMLDivElement>) => {
        // If the menu is trying to close but the flag isn't set, ignore the change
        if (!openMenu && !allowClose) {
            setOpenMenu(true);
            return;
        }
        // Otherwise, update the state normally
        setOpenMenu(false);
    };

    return (
        <>
            <div className="z-[999] fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl rounded-full border shadow-lg bg-background/90 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
                <Menubar className="flex justify-between border-none rounded-full px-3 py-1.5 select-none shadow-none">
                    <MenubarMenu>

                        <Link href={prevChapterLink} onClick={handlePrevChapter} className='z-[1250]' >
                            <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center rounded-full p-2 data-[state=open]:bg-accent'>
                                <ChevronLeft size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                                <span className='uppercase text-sm'>{phrase(dictionary, "prevChapter", language)}</span>
                            </div>
                        </Link>

                    </MenubarMenu>
                    {/* middle post button */}
                    <div className="flex items-center gap-1">
                        <MenubarMenu>
                            <MenubarTrigger onClick={handleOpenMenu} className="border-none hover:bg-transparent dark:hover:bg-transparent focus:bg-transparent bg-transparent dark:bg-transparent">
                                <div className="relative inline-flex group p-1 w-12 h-12 border-none" >
                                    <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200"></div>
                                    <TooltipProvider delayDuration={0}>
                                        <Tooltip>
                                            <BlobButton text={<TooltipTrigger asChild>
                                                <Sparkles size={20} />
                                            </TooltipTrigger>
                                            } />
                                            <TooltipContent>
                                                post
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </MenubarTrigger>
                            <MenubarContent
                                hideWhenDetached={false}
                                sideOffset={15}
                                onInteractOutside={(e) => handleOpenChange(e as unknown as React.MouseEvent<HTMLDivElement>)}
                                className={`border-none absolute bottom-14 left-1/2 -translate-x-1/2 w-full md:pl-[74px] md:w-[640px] 
                                        bg-transparent dark:bg-transparent hover:bg-transparent
                                        transition-all duration-300 ease-in-out shadow-none
                                        ${openMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'}`}
                            >
                                <MenubarItem
                                    ref={menuContentRef}
                                    className="border-none rounded-xl w-full bg-gray-200 dark:bg-[#211F21]">
                                    <div className="relative w-full md:w-full h-full">
                                        <button
                                            className="absolute top-1 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                            onClick={handleCloseMenu}
                                        >
                                            <X size={18} />
                                        </button>
                                        <div className="flex w-full">
    
                                            {truncateText(selectedText, 100)}

                                        </div>
                                    </div>
                                </MenubarItem>
                            </MenubarContent>
                        </MenubarMenu>
                    </div>


                    {/* view next and prev btn */}
                    <MenubarMenu>
                        <Link href={nextChapterLink} onClick={handleNextChapter}>
                            <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center rounded-full p-2 data-[state=open]:bg-accent'>
                                <span className="uppercase text-sm">{phrase(dictionary, "nextChapter", language)}</span>
                                <ChevronRight size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                            </div>
                        </Link>
                    </MenubarMenu>
                    {/* </div > */}
                </Menubar >
                <div className="flex items-center justify-center py-1 text-xs text-muted-foreground">
                    <BookOpen className="mr-1 h-3 w-3" />
                    <span>
                        Page {page} of {scrollPercent}&#37;
                    </span>
                </div>
            </div>
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
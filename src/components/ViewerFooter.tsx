"use client"

import React, { useEffect, useState, useRef } from 'react';
import { Chapter, Webnovel, ToonyzPost } from '@/components/Types';
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
import ToonyzPostViewer from './UI/ToonyzPostViewer';

const ViewerFooter = ({ webnovel, chapter, selectedTextRef, page, maxPage, posts }:
    { webnovel: Webnovel, chapter: Chapter, selectedTextRef: React.MutableRefObject<string>, page: number, maxPage: number, posts: ToonyzPost[] }) => {
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

                // Check if the menu is open
                if (!openMenu) {
                    if (currentScrollY < lastScrollY) {
                        setIsVisible(true);
                    } else {
                        setIsVisible(false);
                    }

                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        setIsVisible(false);
                    }, 2000);
                }

                setLastScrollY(currentScrollY);
            }
        };

        // Add scroll event listener
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId); 
        };
    }, [scrollType, lastScrollY, openMenu]);


    useEffect(() => {
        setWebnovelId(webnovel.id);
        setChapterId(chapter.id);

        const nextId = getNextChapterId(chapter.id);
        const prevId = getPrevChapterId(chapter.id);

        setNextChapterLink(`/view_webnovels/chapter_view/${nextId.toString()}`);
        setPrevChapterLink(`/view_webnovels/chapter_view/${prevId.toString()}`);
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


    const handleToggleMenu = () => {
        setOpenMenu(prevState => !prevState);
        setAllowClose(!openMenu); 
    }    

    // Function to close the menu
    const handleCloseMenu = () => {
        setAllowClose(true);
        setOpenMenu(false);
    }


    return (
        <>
            <div className={`${isVisible ? 'z-[480] fixed left-0 bottom-1 w-full px-2 py-0 flex justify-center border-none bg-transparent animation-fade duration-300 select-none mx-auto' : 'hidden'}`}>
                <div className="md:w-[350px]  flex justify-between items-center rounded-xl px-3 py-3 select-none shadow-none w-full bg-white dark:bg-[#211F21]">
                    {/* bg-background/90 backdrop-blur-md */}
                    <div>
                        <Link href={prevChapterLink} onClick={handlePrevChapter} >
                            <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center rounded-full p-2 data-[state=open]:bg-accent'>
                                <ChevronLeft size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                                <span className='uppercase text-sm'>{phrase(dictionary, "prevChapter", language)}</span>
                            </div>
                        </Link>
                    </div>
                    {/* view next and prev btn */}
                    <div>
                        <Link href={nextChapterLink} onClick={handleNextChapter}>
                            <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center rounded-full p-2 data-[state=open]:bg-accent'>
                                <span className="uppercase text-sm">{phrase(dictionary, "nextChapter", language)}</span>
                                <ChevronRight size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                            </div>
                        </Link>
                    </div>

                </div >

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
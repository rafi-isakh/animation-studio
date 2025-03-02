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
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/shadcnUI/Drawer"
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


const ViewerFooter = ({ webnovel, chapter }: { webnovel: Webnovel, chapter: Chapter }) => {
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
    const { theme } = useTheme();
    const { scrollType, setPage } = useReader();
    const [open, setOpen] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);
    const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 });
    const [initialDialogPositionSet, setInitialDialogPositionSet] = useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [mobileDialogOpen, setMobileDialogOpen] = useState(false);

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

    const handleClose = () => {
        setOpen(false);
    }

    const handleOpen = () => {
        if (isDesktop) {
            setOpen(true);
        } else {
            setMobileDialogOpen(true);
        }

    }


    useEffect(() => {
        if (!initialDialogPositionSet && nodeRef.current) {
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

            setDialogPosition({
                x: viewportWidth - 450, // Position it near the right edge
                y: viewportHeight / 4,   // Position it a quarter down from the top
            });
            setInitialDialogPositionSet(true);
        }
    }, [initialDialogPositionSet]);


    return (
        <div className="fixed w-full md:max-w-screen-sm md:pl-[72px] bottom-[3.5rem] md:bottom-0 left-1/2 -translate-x-1/2 select-none z-50">
            {/* */}
            <div className={`w-full mx-auto  justify-center rounded-t-lg
                            ${theme === 'light' ? 'bg-white text-black' : 'dark:bg-[#211F21] bg-[#211F21]'}
                            ${theme === 'dark' ? 'dark:bg-[#211F21] dark:text-white' : 'bg-white text-black'}
                             text-black dark:text-white font-base !text-base
                             bottom-0 left-0 pt-2 pb-2 mr-0 ml-0 
                             transition-transform duration-300 
                             ${scrollType === 'horizontal' ? 'translate-y-0' : ''}
                             ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>

                <div className={`max-w-[350px] text-black dark:text-white flex gap-5 items-center justify-evenly mx-auto p-2 z-[1150]`}>
                    <Link href={prevChapterLink} onClick={handlePrevChapter} className='z-[1250]' >
                        <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center'>
                            <ChevronLeft size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                            {phrase(dictionary, "prevChapter", language)}
                        </div>
                    </Link>
                    {/* middle post button */}
                    <div
                        className="relative inline-flex group p-1 w-32 h-10"
                        onClick={(e) => {
                            e.preventDefault();
                            handleOpen();
                        }}
                    >
                        <div className="absolute transitiona-all duration-1000 opacity-50 -inset-px bg-gradient-to-r from-[#44BCFF] via-[#FF44EC] to-[#FF675E] rounded-full blur-lg filter group-hover:opacity-100 group-hover:-inset-1 group-hover:duration-200">
                        </div>
                        <BlobButton text={<span className='text-sm inline-flex gap-1'><Sparkles size={20} />Post</span>} />
                    </div>
                    {isDesktop && (
                        <Dialog open={open} onOpenChange={setOpen} modal={false}>
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
                                            {/* <PictureGenerator
                                        context={truncateText(context, 197)}
                                        prompt={truncateText(selectedText, 197)}
                                        onComplete={handlePicturesGenerated}
                                        webnovel_id={webnovel_id}
                                        chapter_id={chapter_id}
                                    /> */}
                                        </div>
                                    </ScrollArea>
                                </DialogContent>
                            </Draggable>
                        </Dialog>
                    )}
                    {!isDesktop && (
                        <Drawer open={mobileDialogOpen} onOpenChange={setMobileDialogOpen}>
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
                                            contents area
                                    </ScrollArea>
                                </DrawerFooter>
                            </DrawerContent>
                        </Drawer>
                    )}
                    {/* view next and prev btn */}
                    <Link href={nextChapterLink} onClick={handleNextChapter}>
                        <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center'>
                            {phrase(dictionary, "nextChapter", language)}
                            <ChevronRight size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                        </div>
                    </Link>
                </div >
            </div >

            <Dialog open={showIsLastChapterModal} onOpenChange={setShowIsLastChapterModal}>
                <DialogContent
                    className="sm:max-w-[425px] select-none dark:bg-[#211F21] bg-white rounded-lg no-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                    showCloseButton={true}
                >
                    <div className='flex flex-col space-y-4'>
                        <p>{phrase(dictionary, "isLastChapter", language)}</p>
                        <Button color="gray" variant="outline" className='border-0 text-white w-full bg-[#DE2B74]' onClick={() => setShowIsLastChapterModal(false)}>
                            {phrase(dictionary, "ok", language)}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showIsFirstChapterModal} onOpenChange={setShowIsFirstChapterModal}>
                <DialogContent
                    className="sm:max-w-[425px] select-none dark:bg-[#211F21] bg-white rounded-lg no-scrollbar"
                    onClick={(e) => e.stopPropagation()}
                    showCloseButton={true}
                >
                    <div className='flex flex-col space-y-4'>
                        <p>{phrase(dictionary, "isFirstChapter", language)}</p>
                        <Button color="gray" variant="outline" className='border-0 text-white w-full bg-[#DE2B74]' onClick={() => setShowIsFirstChapterModal(false)}>
                            {phrase(dictionary, "ok", language)}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default ViewerFooter;
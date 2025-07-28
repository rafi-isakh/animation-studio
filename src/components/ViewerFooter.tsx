"use client"

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Chapter, Webnovel, ToonyzPost } from '@/components/Types';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/shadcnUI/Dialog";
import { Button } from "@/components/shadcnUI/Button";
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { useReader } from '@/contexts/ReaderContext';
import {
    ChevronLeft,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateMedia } from '@/contexts/CreateMediaContext';
import { isPurchasedChapter } from '@/utils/webnovelUtils';
import { useRouter } from 'next/navigation'; 
import { useUser } from '@/contexts/UserContext';
import ChapterPurchaseDialog from '@/components/UI/ChapterPurchaseDialog';
import NotEnoughStarsDialog from '@/components/UI/NotEnoughStarsDialog';

const ViewerFooter = ({ webnovel, chapter, selectedTextRef, page, maxPage, posts, handleChapterPurchase }:
    { webnovel: Webnovel, chapter: Chapter, selectedTextRef: React.MutableRefObject<string>, page: number, maxPage: number, posts: ToonyzPost[], handleChapterPurchase: (chapter: Chapter) => void }) => {
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
    const [allowClose, setAllowClose] = useState(false);
    const [scrollPercent, setScrollPercent] = useState(0);
    const { purchased_webnovel_chapters, checking, stars, setInvokeCheckUser, english_stars } = useUser();
    const [chapterToPurchase, setChapterToPurchase] = useState<Chapter | null>(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [showNotEnoughStarsModal, setShowNotEnoughStarsModal] = useState(false);
    const router = useRouter();
    const {
        isLoading,
        setIsLoading,
        progress,
        savedPrompt,
        prompts,
        pictures,
        openDialog,
        setOpenDialog,
        setSelection,
        promotionBannerRef,
        draggableNodeRef,
        chapter_id,
        // setWebnovelId,
    } = useCreateMedia();

    // Memoize chapter calculations to avoid recalculating on every render
    const { currentIndex, nextChapter, prevChapter } = useMemo(() => {
        const index = webnovel.chapters.findIndex(ch => ch.id === chapter.id);
        const next = index > -1 && index < webnovel.chapters_length - 1
            ? webnovel.chapters[index + 1]
            : null;
        const prev = index > 0 ? webnovel.chapters[index - 1] : null;
        
        return {
            currentIndex: index,
            nextChapter: next,
            prevChapter: prev
        };
    }, [webnovel.chapters, chapter.id, webnovel.chapters_length]);

    const handleToggleMenu = () => {
        setOpenDialog((prevState: boolean) => !prevState);
    }


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

        setNextChapterLink(`/view_webnovels/${webnovel.id}/chapter_view/${nextId.toString()}`);
        setPrevChapterLink(`/view_webnovels/${webnovel.id}/chapter_view/${prevId.toString()}`);
    }, [webnovel, chapter])


    const getNextChapterId = (currentChapterId: number) => {
        const index = webnovel.chapters.findIndex(ch => ch.id === currentChapterId);
        if (index === -1 || index === webnovel.chapters_length - 1) {
            return currentChapterId; // Stay on the same chapter if it's the last one or not found
        }
        const nextChapter = chapters[index + 1];
        return nextChapter ? nextChapter.id : currentChapterId;
    }

    const getPrevChapterId = (currentChapterId: number) => {
        const index = webnovel.chapters.findIndex(ch => ch.id === currentChapterId);
        if (index <= 0) {
            return currentChapterId; // Stay on the same chapter if it's the first one or not found
        }
        const prevChapter = chapters[index - 1];
        return prevChapter ? prevChapter.id : currentChapterId;
    }


    const handleNextChapter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();

        if (chapterId === webnovel.chapters[webnovel.chapters_length - 1].id) {
            setShowIsLastChapterModal(true);
            return;
        }

        if (!nextChapter) {
            return;
        }

        // Check if next chapter is paid and not purchased
        if (!nextChapter?.free && !isPurchasedChapter(purchased_webnovel_chapters, nextChapter.id, language)) {
            setChapterToPurchase(nextChapter);
            setShowPurchaseModal(true);
        } else {
            // Navigate to the next chapter
            router.push(`/view_webnovels/${nextChapter.webnovel_id}/chapter_view/${nextChapter.id}`);
        }
    }

    const handlePrevChapter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        if (chapterId === webnovel.chapters[0].id) {
            setShowIsFirstChapterModal(true);
        }

        if (!prevChapter) {
            return;
        }

        if (!prevChapter.free && !isPurchasedChapter(purchased_webnovel_chapters, prevChapter.id, language)) {
            setChapterToPurchase(prevChapter);
            setShowPurchaseModal(true);
        } else {
            router.push(`/view_webnovels/${prevChapter.webnovel_id}/chapter_view/${prevChapter.id}`);
        }
    }

    return (
        <>
            <div className={`${isVisible ? 'z-[480] fixed left-0 !bottom-0 w-full px-2 py-0 flex justify-center border-none bg-transparent animation-fade duration-300 select-none mx-auto' : 'hidden'}`}>
                <div className="md:w-[350px] flex justify-between items-center rounded-xl px-3 py-3 select-none shadow-none w-full bg-white dark:bg-[#211F21]">
                    <div>
                        <Link href={prevChapterLink} onClick={handlePrevChapter} >
                            <div className='group hover:text-[#DB2777] flex flex-row items-center justify-center rounded-full p-2 data-[state=open]:bg-accent'>
                                <ChevronLeft size={16} className='text-gray-500 self-center group-hover:text-[#DB2777]' />
                                <span className='uppercase text-sm'>{phrase(dictionary, "prevChapter", language)}</span>
                            </div>
                        </Link>
                    </div>
                    <div className="relative inline-flex group flex-shrink-0">
                        <Button
                            variant='link'
                            onClick={handleToggleMenu}
                            //  className="transtion group flex h-10 w-32 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 p-[1.5px] text-black dark:text-white duration-300 hover:bg-gradient-to-l hover:shadow-2xl hover:shadow-purple-600/30">
                            className='group h-10 w-32 !no-underline bg-gradient-to-r from-purple-500 via-red-500 to-yellow-500 p-[1.5px] text-black dark:text-white duration-300 hover:bg-gradient-to-l hover:shadow-2xl hover:shadow-purple-600/30 rounded-full'
                        >

                            <div className="flex h-full w-full items-center justify-center gap-1 rounded-full bg-white dark:bg-black transition duration-300 ease-in-out group-hover:bg-gradient-to-br group-hover:from-white dark:group-hover:from-black group-hover:to-purple-50 group-hover:transition group-hover:duration-300 group-hover:ease-in-out">
                                <Sparkles className="w-4 h-4" />
                                {phrase(dictionary, "toonyzAI", language)}
                            </div>
                        </Button>
                        <span className="absolute -top-2 -right-2 bg-[#DB2777] text-white text-xs px-2 py-0 rounded-full">
                            New
                        </span>
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
            </div >
            {/* Dialogs for last and first chapter */}
            < Dialog open={showIsLastChapterModal} onOpenChange={setShowIsLastChapterModal} >
                <DialogContent
                    className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto select-none text-md'
                    showCloseButton={true}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className='text-md p-4'>
                        <DialogTitle className='text-md'>
                            {phrase(dictionary, "isLastChapter", language)}
                        </DialogTitle>
                        <DialogDescription className='text-md'>
                            <div className='flex flex-col space-y-4'>
                                <p>{phrase(dictionary, "isLastChapter", language)}</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                        <Button
                            onClick={() => setShowIsLastChapterModal(false)}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                        >
                            {phrase(dictionary, "ok", language)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
            <Dialog open={showIsFirstChapterModal} onOpenChange={setShowIsFirstChapterModal}>
                <DialogContent
                    className='z-[2500] !gap-0 !p-0 overflow-hidden bg-white dark:bg-[#211F21] border-none shadow-none md:h-auto h-auto select-none text-md'
                    showCloseButton={true}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader className='text-md p-4'>
                        <DialogTitle className='text-md'>
                            {phrase(dictionary, "isFirstChapter", language)}
                        </DialogTitle>
                        <DialogDescription className='text-md'>
                            <div className='flex flex-col space-y-4'>
                                <p>{phrase(dictionary, "isFirstChapter", language)}</p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='flex flex-row !space-x-0 !p-0 !flex-grow-0 !flex-shrink-0 w-full self-end text-md'>
                        <Button
                            onClick={() => setShowIsFirstChapterModal(false)}
                            className={cn("!rounded-none flex-1 w-full py-6 text-md font-medium bg-[#DE2B74] hover:bg-[#DE2B74] text-white")}
                        >
                            {phrase(dictionary, "ok", language)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ChapterPurchaseDialog showPurchaseModal={showPurchaseModal} setShowPurchaseModal={setShowPurchaseModal} handleChapterPurchase={handleChapterPurchase} content={webnovel} stars={stars} english_stars={english_stars} chapter={chapterToPurchase!} />
            <NotEnoughStarsDialog showNotEnoughStarsModal={showNotEnoughStarsModal} setShowNotEnoughStarsModal={setShowNotEnoughStarsModal} stars={stars} english_stars={english_stars} content={webnovel} />
        </>
    );
};

export default ViewerFooter;
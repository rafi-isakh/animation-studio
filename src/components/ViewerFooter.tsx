"use client"

import React, { useEffect, useState } from 'react';
import { Chapter, Webnovel } from '@/components/Types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Box, Button, Modal, ThemeProvider } from '@mui/material';
import { bwTheme, grayTheme } from '@/styles/BlackWhiteButtonStyle';
import { style } from '@/styles/ModalStyles';

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

  useEffect(() => {
    let timeoutId;

    const handleScroll = () => {
      // Get the current scroll position
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        // Scrolling down - show the footer
        setIsVisible(true);
      } else {
        // Scrolling up - hide the footer
        setIsVisible(false);
      }

      // Set the new scroll position
      setLastScrollY(currentScrollY);

      // Set a timeout to hide the footer if scrolling stops
      clearTimeout(timeoutId); // Clear previous timeout
      timeoutId = setTimeout(() => {
        setIsVisible(false); // Hide after a delay when scrolling stops
      }, 2000); // Adjust delay as needed (2000 ms = 2 seconds)
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId); // Clear timeout when component unmounts
    };
  }, [lastScrollY]); // Dependency array to trigger when lastScrollY changes



    useEffect(() => {
        setWebnovelId(webnovel.id);
        setChapterId(chapter.id);

        const nextId = getNextChapterId(chapter.id);
        const prevId = getPrevChapterId(chapter.id);

        setNextChapterLink(`/chapter_view/${nextId.toString()}`);
        setPrevChapterLink(`/chapter_view/${prevId.toString()}`);
    }, [webnovel, chapter])

    const adjustViewSettings = () => {

    }

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

    return (
        <ThemeProvider theme={grayTheme}>
            <div className={`z-50 fixed max-w-screen-sm mx-auto mb-2 bg-white border-black border-2 bottom-0 left-2 right-2 rounded-lg transition-transform duration-300 
            ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-lg text-black flex flex-wrap items-center justify-between mx-auto p-2">
                    <Link href={prevChapterLink} onClick={handlePrevChapter}>
                        <p className='hover:text-pink-600'>{phrase(dictionary, "prevChapter", language)}</p>
                    </Link>
                    {/* <Link href={`/view_webnovels?id=${webnovelId.toString()}`}>
                        <p className='hover:text-pink-600'>{phrase(dictionary, "list", language)}</p></Link>
                    <Link href={`/my_library`}>
                        <p className='hover:text-pink-600'>{phrase(dictionary, "myLibrary", language)}</p></Link> */}
                    <Link href={`/comments?chapter_id=${chapterId.toString()}`}>
                        <p className='hover:text-pink-600'>{phrase(dictionary, "comments", language)}</p></Link>
                    {/* <p onClick={adjustViewSettings} className='hover:text-pink-600'>{phrase(dictionary, "viewSettings", language)}</p> */}
                    <Link href={nextChapterLink} onClick={handleNextChapter}>
                        <p className='hover:text-pink-600'>{phrase(dictionary, "nextChapter", language)}</p>
                    </Link>
                </div>
            </div>
            <Modal open={showIsLastChapterModal} onClose={() => setShowIsLastChapterModal(false)}>
                <Box sx={style}>
                    <div className='flex flex-col space-y-4'>
                        <p>{phrase(dictionary, "isLastChapter", language)}</p>
                        <Button color="gray" variant="outlined" onClick={() => setShowIsLastChapterModal(false)}>{phrase(dictionary, "ok", language)}</Button>
                    </div>
                </Box>
            </Modal>
            <Modal open={showIsFirstChapterModal} onClose={() => setShowIsFirstChapterModal(false)}>
                <Box sx={style}>
                    <div className='flex flex-col space-y-4'>
                        <p>{phrase(dictionary, "isFirstChapter", language)}</p>
                        <Button color="gray" variant="outlined" onClick={() => setShowIsFirstChapterModal(false)}>{phrase(dictionary, "ok", language)}</Button>
                    </div>
                </Box>
            </Modal>
        </ThemeProvider>
    );
};

export default ViewerFooter;
"use client"

import React, { useEffect, useState } from 'react';
import { Chapter, Webnovel } from '@/components/Types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Button, Modal, ThemeProvider } from '@mui/material';
import { bwTheme, grayTheme } from '@/styles/BlackWhiteButtonStyle';

const ViewerFooter = ({ webnovel, chapter }: { webnovel: Webnovel, chapter: Chapter }) => {
    const [webnovelId, setWebnovelId] = useState(0);
    const [chapterId, setChapterId] = useState(0);
    const { language, dictionary } = useLanguage();
    const [showIsLastChapterModal, setShowIsLastChapterModal] = useState(false);
    const [showIsFirstChapterModal, setShowIsFirstChapterModal] = useState(false);
    const [nextChapterLink, setNextChapterLink] = useState('');
    const [prevChapterLink, setPrevChapterLink] = useState('');
    const chapters = webnovel.chapters.sort((a, b) => a.id - b.id);

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
            <div className="z-50 fixed w-[95vw] mx-auto mb-8 bg-white border-black border-2 bottom-0 left-0 right-0">
                <div className="max-w-lg text-black flex flex-wrap items-center justify-between mx-auto p-4">
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
                <div className='flex flex-col space-y-4'>
                    <p>{phrase(dictionary, "isLastChapter", language)}</p>
                    <Button onClick={() => setShowIsLastChapterModal(false)}>{phrase(dictionary, "ok", language)}</Button>
                </div>
            </Modal>
            <Modal open={showIsFirstChapterModal} onClose={() => setShowIsFirstChapterModal(false)}>
                <div className='flex flex-col space-y-4'>
                    <p>{phrase(dictionary, "isFirstChapter", language)}</p>
                    <Button onClick={() => setShowIsFirstChapterModal(false)}>{phrase(dictionary, "ok", language)}</Button>
                </div>
            </Modal>
        </ThemeProvider>
    );
};

export default ViewerFooter;
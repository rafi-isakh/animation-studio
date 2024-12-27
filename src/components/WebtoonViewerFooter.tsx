"use client"
import Link from "next/link"
import { Webtoon, WebtoonChapter } from "./Types"
import DictionaryPhrase from "./DictionaryPhrase"
import { useState, useEffect } from "react"
import { useModalStyle } from "@/styles/ModalStyles"
import { Box } from "@mui/material"
import { Button } from "@mui/material"
import { Modal } from "@mui/material"
import { MessageCircle } from "lucide-react"

export default function WebtoonViewerFooter({ webtoon, episode }: { webtoon: Webtoon, episode: string }) {
    const [isVisible, setIsVisible] = useState(true)
    const [lastScrollY, setLastScrollY] = useState(0)
    const [showIsLastChapterModal, setShowIsLastChapterModal] = useState(false)
    const [showIsFirstChapterModal, setShowIsFirstChapterModal] = useState(false)

    const sortedChapters = [...webtoon.chapters].sort((a: WebtoonChapter, b: WebtoonChapter) => a.directory.localeCompare(b.directory))
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleScroll = () => {
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
        };
        window.addEventListener('scroll', handleScroll);

        // Cleanup function to remove the event listener
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId); // Clear timeout when component unmounts
        };
    }, [lastScrollY]); // Dependency array to trigger when lastScrollY changes

    const getNextChapterId = (currentChapterId: string) => {
        const index = sortedChapters.findIndex((ch: WebtoonChapter) => ch.directory === currentChapterId);
        if (index === sortedChapters.length - 1) {
            return currentChapterId; // Stay on the same chapter if it's the last one
        }
        return sortedChapters[index + 1].directory;
    }

    const getPrevChapterId = (currentChapterId: string) => {
        const index = sortedChapters.findIndex((ch: WebtoonChapter) => ch.directory === currentChapterId);
        if (index === 0) {
            return currentChapterId; // Stay on the same chapter if it's the first one
        }
        return sortedChapters[index - 1].directory;
    }

    const handlePrevChapter = () => {
        if (episode === sortedChapters[0].directory) {
            setShowIsFirstChapterModal(true);
        }
    }

    const handleNextChapter = () => {
        if (episode === sortedChapters[sortedChapters.length - 1].directory) {
            setShowIsLastChapterModal(true);
        }
    }

    const getCurrentChapterId = (episode: string) => {
        return sortedChapters.find((ch: WebtoonChapter) => ch.directory === episode)?.id;
    }

    const getCurrentChapterCommentsLength = (episode: string) => {
        return sortedChapters.find((ch: WebtoonChapter) => ch.directory === episode)?.comments?.length;
    }

    const prevChapterLink = `/webtoons/${webtoon.id}/${getPrevChapterId(episode)}`
    const nextChapterLink = `/webtoons/${webtoon.id}/${getNextChapterId(episode)}`

    return (
        <>
            <div className={`z-50 fixed w-full justify-center
                             bg-white dark:bg-black text-black
                             dark:text-white border-t bottom-0 left-0 pt-2 pb-2 
                             transition-transform duration-300"
                             ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-lg text-black dark:text-white flex flex-wrap items-center justify-evenly mx-auto">
                    <Link href={prevChapterLink} onClick={handlePrevChapter}>
                        <p className='group hover:text-pink-600'>
                            <i className="fas fa-angle-left  text-gray-500 self-center group-hover:text-pink-600 mr-4"></i>
                            {<DictionaryPhrase phraseVar="prevChapter" />}
                        </p>
                    </Link>
                    <Link href={`/comments?chapter_id=${getCurrentChapterId(episode)?.toString() ?? ''}&webnovel_or_webtoon=false`}>
                        {/*webnovel_or_webtoon=false means webtoon*/}
                        <p className='hover:text-[#DB2777] relative'>
                            <MessageCircle size={16} />
                            <span className='absolute -top-[1px] -right-1 text-[9px] bg-[#DB2777] text-white rounded-full px-1'>{getCurrentChapterCommentsLength(episode)}</span>
                        </p>
                    </Link>
                    <Link href={nextChapterLink} onClick={handleNextChapter}>
                        <p className='group hover:text-pink-600'>
                            {<DictionaryPhrase phraseVar="nextChapter" />}
                            <i className="fas fa-angle-right  text-gray-500 self-center group-hover:text-pink-600 ml-4"></i>
                        </p>
                    </Link>
                </div>
            </div>
            <Modal open={showIsLastChapterModal} onClose={() => setShowIsLastChapterModal(false)}>
                <Box sx={useModalStyle}>
                    <div className='flex flex-col space-y-4'>
                        <p><DictionaryPhrase phraseVar="isLastChapter" /></p>
                        <Button color="gray" variant="outlined" onClick={() => setShowIsLastChapterModal(false)}><DictionaryPhrase phraseVar="ok" /></Button>
                    </div>
                </Box>
            </Modal>
            <Modal open={showIsFirstChapterModal} onClose={() => setShowIsFirstChapterModal(false)}>
                <Box sx={useModalStyle}>
                    <div className='flex flex-col space-y-4'>
                        <p><DictionaryPhrase phraseVar="isFirstChapter" /></p>
                        <Button color="gray" variant="outlined" onClick={() => setShowIsFirstChapterModal(false)}><DictionaryPhrase phraseVar="ok" /></Button>
                    </div>
                </Box>
            </Modal>
        </>
    )

}
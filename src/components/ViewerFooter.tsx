"use client"

import React, { useEffect, useState } from 'react';
import { Chapter, Webnovel } from '@/components/Types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases'
import { Box, Button, Modal, ThemeProvider } from '@mui/material';
import { bwTheme, grayTheme } from '@/styles/BlackWhiteButtonStyle';
import { style, useViewSettingsStyle } from '@/styles/ModalStyles';

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
    const [showIsViewerModal, setShowIsViewerModal] = useState(false);
    const viewSettingsStyle = useViewSettingsStyle();


  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Get the current scroll position
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY) {
        // Scrolling up - show the footer
        setIsVisible(true);
      } else {
        // Scrolling down - hide the footer
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

    // const adjustViewSettings = () => {

    // }

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

    const handleViewSettings = () => {
        setShowIsViewerModal(true);
    }

    return (
        <ThemeProvider theme={grayTheme}>
            <div className={`z-50 fixed w-full justify-center bg-white border-t bottom-0 left-2 pb-2 right-2 md:mr-0 mr-[15px] md:ml-0 transition-transform duration-300 
            ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="max-w-lg text-black flex flex-wrap items-center justify-between mx-auto p-2">
                    <Link href={prevChapterLink} onClick={handlePrevChapter}>
                        <p className='group hover:text-pink-600'>
                        <i className="fas fa-angle-left  text-gray-500 self-center group-hover:text-pink-600"></i>
                            {phrase(dictionary, "prevChapter", language)}
                        </p>
                    </Link>
                    {/* <Link href={`/view_webnovels?id=${webnovelId.toString()}`}>
                        <p className='hover:text-pink-600'>{phrase(dictionary, "list", language)}</p></Link>
                    <Link href={`/my_library`}>
                        <p className='hover:text-pink-600'>{phrase(dictionary, "myLibrary", language)}</p></Link> */}
                    <Link href={`/comments?chapter_id=${chapterId.toString()}`}>
                        <p className='hover:text-pink-600 relative'><i className="far fa-comment"></i>
                        <span className='absolute -top-[1px] -right-1 text-[9px] bg-pink-600 text-white rounded-full px-1'>{chapter.comments.length}</span>
                        </p>
                    </Link>
                    {/* <p onClick={adjustViewSettings} className='hover:text-pink-600'>{phrase(dictionary, "viewSettings", language)}</p> */}
                   
                    {/* view settings : viewer toggle btn */}
                    <Link href={``} onClick={handleViewSettings}>
                    <p className='hover:text-pink-600 relative'>
                        <i className="fas fa-cog "></i>
                        <span className='self-center group-hover:text-pink-600 absolute -top-[5px] -right-2 text-[12px] text-pink-600 rounded-full'>
                          <i className="fas fa-language "></i>
                        </span>
                    </p>
                    </Link>
                    {/* view settings : viewer toggle btn */}

                    <Link href={nextChapterLink} onClick={handleNextChapter} className='md:mr-0 mr-[15px]'>
                        <p className='group hover:text-pink-600'>
                            {phrase(dictionary, "nextChapter", language)}
                            <i className="fas fa-angle-right text-gray-500 self-center group-hover:text-pink-600"></i>
                        </p>
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
            {/* view settings modal */}
            <Modal open={showIsViewerModal} onClose={() => setShowIsViewerModal(false)}
                 BackdropProps={{
                    style: {
                      backgroundColor: 'transparent', // Custom backdrop opacity
                    },
                  }}
                >
                <Box sx={viewSettingsStyle}>
                    <div className='flex flex-col space-y-4'>
                        <p className='flex justify-between'>
                            View Settings 
                        <button onClick={() => setShowIsViewerModal(false)}>
                         <i className="fas fa-times"></i>
                        </button>
                        </p>
                        <hr className='my-2 border-gray-200'/>

                        <p className='text-sm flex justify-between'> 넘김 방식
                           <div className='flex flex-row gap-2'>  
                             <Link href='' className='text-gray-300'>스크롤</Link>
                             <Link href='' className='text-gray-500'>페이지</Link>
                           </div>
                        </p>
                        <p className='text-sm flex justify-between'> 테마 
                           <div className='flex flex-row gap-2'>  
                             <Link href='' className='text-[10px] bg-white text-black rounded-full border border-gray-400 px-2 py-1 self-center text-center'>Aa</Link>
                             <Link href='' className='text-[10px] bg-black text-white rounded-full border border-gray-400 px-2 py-1 self-center text-center'>Aa</Link>
                             <Link href='' className='text-[10px] bg-orange-200 text-white rounded-full px-2 py-1 self-center text-center'>Aa</Link>
                             <Link href='' className='text-[10px] bg-gray-500 text-gray-400 rounded-full border px-2 py-1 self-center text-center'>Aa</Link>
                           </div>
                        </p>


                        <p className='text-sm flex justify-between'> 글꼴 
                           <div className='flex flex-row gap-2'>  
                             <Link href='' className='text-gray-300'>기본</Link>
                             <Link href='' className='text-gray-500'>바탕체</Link>
                             <Link href='' className='text-gray-500'>고딕체</Link>
                           </div>
                        </p>
                        <p className='text-sm flex justify-between'> 글자 크기
                        <div className='flex flex-row gap-2'>  
                             <Link href='' className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-plus"></i>
                             </Link>
                             10
                             <Link href='' className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-minus"></i>
                             </Link>
                           </div>
                        </p>
                        <p className='text-sm flex justify-between'> 줄 간격
                           <div className='flex flex-row gap-2'>  
                             <Link href='' className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-plus"></i>
                             </Link>
                             10
                             <Link href='' className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-minus"></i>
                             </Link>
                           </div>
                        </p>
                        <p className='text-sm flex justify-between'> 문단 여백
                           <div className='flex flex-row gap-2'>  
                             <Link href='' className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-plus"></i>
                             </Link>
                             10
                             <Link href='' className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-minus"></i>
                             </Link>
                           </div>
                        </p>

                    </div>
                </Box>
            </Modal>
        </ThemeProvider>
    );
};

export default ViewerFooter;
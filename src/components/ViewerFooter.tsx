"use client"

import React, { useEffect, useState } from 'react';
import { Chapter, Webnovel } from '@/components/Types';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import phrases, { phrase } from '@/utils/phrases'
import { Box, Button, Modal, ThemeProvider } from '@mui/material';
import { bwTheme, grayTheme } from '@/styles/BlackWhiteButtonStyle';
import { style, useViewSettingsStyle } from '@/styles/ModalStyles';
import OtherTranslateComponent from '@/components/OtherTranslateComponent';
import { useReader } from '@/contexts/ReaderContext';
import { useTheme } from '@/contexts/providers'
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
    const [showIsViewerModal, setShowIsViewerModal] = useState(false);
    const viewSettingsStyle = useViewSettingsStyle();
    const { fontSize, 
            setFontSize, 
            fontFamily = 'default', 
            setFontFamily, 
            lineHeight, 
            setLineHeight, 
            margin, 
            setMargin,
            padding,
            setPadding,
            setScrollType,
            containerWidth = 600,
            setContainerWidth } = useReader();
    const { theme, toggleTheme } = useTheme()

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
        <>
            <div className={`z-50 fixed w-full justify-center bg-white text-black dark:text-black border-t bottom-0 left-2 pb-2 right-2 md:mr-0 mr-[15px] md:ml-0 transition-transform duration-300 
               ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* <div className='flex flex-row justify-center border-b py-3 md:hidden'>
                    <OtherTranslateComponent content={chapter.title} elementId={chapter.id.toString()} elementType='chapter' elementSubtype="title" classParams="text-[12px]" /> 
                </div> */}
                <div className="max-w-lg text-black dark:text-black flex flex-wrap items-center justify-between mx-auto p-2">
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
                >
                <Box sx={viewSettingsStyle}>
                    <div className='flex flex-col space-y-4 text-black dark:text-black'>
                        <p className='flex justify-between'>
                            {/* View Settings  */}
                            {phrase(dictionary, "viewSettings", language)}
                        <button onClick={() => setShowIsViewerModal(false)}>
                         <i className="fas fa-times"></i>
                        </button>
                        </p>
                        <hr className='my-2 border-gray-200'/>

                        <p className='text-sm justify-between md:flex hidden'> 
                            {/* 넘김 방식 */}
                            {phrase(dictionary, "scrollType", language)}
                           <div className='flex flex-row gap-2'>  
                             <Link href='' className='text-gray-300' onClick={() => setScrollType('vertical')}>
                             {/* 스크롤 */}
                             {phrase(dictionary, "viewSettings_scroll", language)}
                             </Link>
                             <Link href='' className='text-gray-500' onClick={() => setScrollType('horizontal')}>
                             {/* 페이지 */}
                             {phrase(dictionary, "viewSettings_page", language)}
                             </Link>
                           </div>
                        </p>
                        <p className='text-sm flex justify-between'> 
                            {/* 테마  */}
                            {phrase(dictionary, "theme", language)}
                           <div className='flex flex-row gap-2'>  
                             <Link 
                             href='' 
                             onClick={() => toggleTheme('light')}
                             className='text-[10px] bg-white text-black rounded-full border border-gray-400 px-2 py-1 self-center text-center'>
                                Aa
                             </Link>
                             <Link 
                                href='' 
                                onClick={() => toggleTheme('dark')}
                                className='text-[10px] bg-black text-white rounded-full border border-gray-400 px-2 py-1 self-center text-center'>
                                    Aa
                                </Link>
                             <Link 
                                href='' 
                                onClick={() => toggleTheme('sepia')}
                                className='text-[10px] bg-orange-200 text-white rounded-full px-2 py-1 self-center text-center'>
                                    Aa
                                </Link>
                             {/* <Link 
                                href='' 
                                onClick={() => toggleTheme('gray')}
                                className='text-[10px] bg-gray-500 text-gray-400 rounded-full border px-2 py-1 self-center text-center'>
                                    Aa
                                </Link> */}
                           </div>
                        </p>

                        <p className='text-sm flex justify-between'> 
                            {/* 글꼴  */}
                            {phrase(dictionary, "font", language)}
                           <div className='flex flex-row gap-2'>  
                             <Link 
                               href='' 
                               onClick={() => {
                                    setFontFamily('default');
                                    console.log('Font family set to:', 'default');
                                    }} 
                               className={`${fontFamily === 'default' ? 'text-gray-300' : 'text-gray-500'}`}
                                >
                                    {/* 기본 */}
                                    {phrase(dictionary, "defaultFont", language)}
                                </Link>
                             <Link 
                                href='' 
                                onClick={() => setFontFamily('gowun-batang')}
                                className={`${fontFamily === 'gowun-batang' ? 'text-gray-300 gowun-batang' : 'text-gray-500'}`}
                                >
                                    {/* 바탕체 */}
                                    <span className='gowun-batang text-[12px]'> {phrase(dictionary, "batangFont", language)} </span>
                                </Link>
                             <Link 
                                href=''
                                onClick={() => {
                                    setFontFamily('nanum-gothic');
                                    console.log('Font family set to:', 'nanum-gothic');
                                  }} className={`${fontFamily === 'nanum-gothic' ? 'text-gray-300 nanum-gothic' : 'text-gray-500'}`}
                                >
                                    {/* 고딕체 */}
                                    <span className='nanum-gothic text-[12px]'> {phrase(dictionary, "gothicFont", language)} </span>
                                </Link>
                           </div>
                        </p>
                        <p className='text-sm flex justify-between'> 
                            {/* 글자 크기 */}
                            {phrase(dictionary, "fontSize", language)}
                        <div className='flex flex-row gap-2'>  
                             <Link 
                                href=''
                                onClick={() => setFontSize(fontSize + 2)}
                                className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-plus"></i>
                             </Link>
                             {fontSize}
                             <Link 
                                href='' 
                                onClick={() => setFontSize(fontSize - 2)}
                                className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-minus"></i>
                             </Link>
                           </div>
                        </p>
                        <p className='text-sm flex justify-between'> 
                            {/* 줄 간격 */}
                            {phrase(dictionary, "lineHeight", language)}
                           <div className='flex flex-row gap-2'>  
                             <Link 
                             href='' 
                             onClick={(e) => setLineHeight(lineHeight + 0.1)}
                             className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-plus"></i>
                             </Link>
                             {Math.round(lineHeight * 10)}%
                             <Link 
                             href='' 
                             onClick={(e) => setLineHeight(lineHeight - 0.1)}
                             className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-minus"></i>
                             </Link>
                           </div>
                        </p>
                        <p className='text-sm flex justify-between'> 
                            {/* 문단 여백 */}
                            {phrase(dictionary, "paragraphSpacing", language)}
                           <div className='flex flex-row gap-2'>  
                             <Link 
                                href='' 
                                onClick={() => {
                                    setMargin(margin + 1)
                                    setPadding(padding + 1)
                                    setContainerWidth(containerWidth * 1.1); 
                                }} 
                                className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-plus"></i>
                             </Link>
                             {Math.round(margin)}
                             <Link 
                                href='' 
                                onClick={() => {
                                    setMargin(margin - 1)
                                    setPadding(padding - 1)
                                    setContainerWidth(containerWidth * 0.9); 
                                }} 
                                className='text-gray-400 rounded-full border border-gray-400 px-2 self-center text-center'>
                             <i className="fas fa-minus"></i>
                             </Link>
                           </div>
                        </p>

                    </div>
                </Box>
            </Modal>
        </>
    );
};

export default ViewerFooter;
"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import { Webnovel } from '@/components/Types';
import AuthorAndWebnovelsAsideComponent from '@/components/AuthorAndWebnovelsAsideComponent';
import '@/styles/globals.css'
import { useModalStyle } from '@/styles/ModalStyles'
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { Button, ThemeProvider, Modal, Typography, Box } from '@mui/material';
import AIEditorComponent from '@/components/AIEditorComponent';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css'; // Add this import
import { grayTheme } from '@/styles/BlackWhiteButtonStyle';
import Link from 'next/link';

const AddChapterComponent = ({ webnovelId, webnovels, novelLanguage }: { webnovelId: string, webnovels: Webnovel[], novelLanguage: string }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const { email, nickname } = useUser();
    const { language, dictionary } = useLanguage();
    const router = useRouter();
    const maxText = 20000;
    const [maxExceeded, setMaxExceeded] = useState(false);
    const [currText, setCurrText] = useState(0);
    const [openAIEditor, setOpenAIEditor] = useState(false);
    const titleRef = useRef<ReactQuill>(null);
    const contentRef = useRef<ReactQuill>(null);
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        setCurrText(content.length);
        if (content.length > maxText) {
            setMaxExceeded(true);
        } else {
            setMaxExceeded(false);
        }
    }, [content])

    useEffect(() => {
        if (titleRef.current) {
            const quillEditor = titleRef.current.getEditor();
            if (quillEditor) {
                quillEditor.root.dataset.placeholder = phrase(dictionary, "chapterTitle", language);
            }
        }
        if (contentRef.current) {
            const quillEditor = contentRef.current.getEditor();
            if (quillEditor) {
                quillEditor.root.dataset.placeholder = phrase(dictionary, "contentDescription", language);
            }
        }
    }, [dictionary, language, titleRef.current, contentRef.current])


    const handleAddChapter = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();
        
        // Get plain text from title editor
        const titleEditor = titleRef.current?.getEditor();
        const titleText = titleEditor?.getText().trim() || "";
        
        // Get plain text from content editor
        const contentEditor = contentRef.current?.getEditor();
        const contentText = contentEditor?.getText().trim() || "";
        console.log(contentText);

        formData.append('title', titleText);
        formData.append('content', contentText);

        if (!titleText || !contentText) {
            return;
        }

        formData.append('webnovel_id', webnovelId);
        if (!maxExceeded) {
            const res = await fetch('/api/add_chapter', {
                method: 'POST',
                body: formData,
            });
            router.push(`/view_webnovels?id=${webnovelId}`)
            router.refresh();
        }
    };

    const handleClickAIEditor = (event: React.FormEvent) => {
        event.preventDefault();
        setOpenAIEditor(true);
    };

    const replaceSmartQuotes = (str: string) => {
        return str.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
    };

    const webnovel = webnovels.find((novel) => novel.id === Number(webnovelId));

    return (
        <div className='md:w-[720px] p-6 mb-10 flex flex-col justify-center mx-auto border-gray-300 border rounded-xl'>
            <form onSubmit={handleAddChapter}>
                <div className='flex flex-row justify-between'>
                    <h1 className='text-2xl font-bold mb-10'>{phrase(dictionary, "addChapter", language)}</h1>
                    <div>
                        <Button color="gray" className='text-sm text-gray-400 px-0 py-0' onClick={() => setOpenModal(true)}> 
                            {/* 임시 저장글  */}
                            {phrase(dictionary, "draft", language)}
                        </Button>
                    </div>
                </div>
                    <ThemeProvider theme={grayTheme}>
                        <div className="mr-4 flex flex-col space-y-4 w-full">
                        <div className='flex flex-col space-y-4 items-start'>
                            <p className='text-2xl font-bold'> {webnovel?.title} </p>
                            {/* <p className='text-sm'> {webnovel?.description} </p> */}
                            <p className='text-sm'>
                                 {/* 총 .. 화 : total */}
                                 {phrase(dictionary, "total", language)}
                                 {' '}{webnovel?.chapters.length} 
                                 {language == 'ko' ? <>{' '}화</> : <></>}
                                 </p>
                        </div>
                            <hr />
                        <div className="flex flex-col space-y-4 border border-gray-300 rounded-xl">
                            <ReactQuill ref={titleRef} theme="bubble" value={title} onChange={setTitle} className="title-editor" />
                        </div>
                       
                        <div className="flex flex-col space-y-4">
                            <div className="flex flex-row justify-between">
                                <h1 className='text-sm font-bold'>{phrase(dictionary, "content", language)}</h1>
                                <p className='text-sm text-[#DB2777]'>{currText} / {maxText}</p>
                            </div>
                            <div className='w-full max-w-full rounded-xl border border-gray-300'>
                                <ReactQuill ref={contentRef} theme="bubble" value={content} onChange={setContent} className="content-editor" />
                            </div>

                            <div className='flex flex-row justify-end gap-4 items-end'>
                                <Button
                                 type="submit" 
                                 variant="outlined" 
                                 color="gray"
                                 className='whitespace-nowrap hover:border-black hover:bg-black hover:text-white mb-10'
                                 >{phrase(dictionary, "save", language)}</Button>
                                <Button
                                 type="submit" 
                                 variant="outlined" 
                                 color="gray"
                                 className='whitespace-nowrap hover:border-[#DB2777] hover:bg-[#DB2777] hover:text-white mb-10'
                                 >{phrase(dictionary, "publish", language)}</Button>
                                {/* <Button variant="contained" color="bw" onClick={handleClickAIEditor}>{phrase(dictionary, "aieditor", language)}</Button> */}
                            </div>
                        </div>

                    </div>
                </ThemeProvider>
            </form>
            {/* <AIEditorComponent openModal={openAIEditor} setOpenModal={setOpenAIEditor} text={content} novelLanguage={novelLanguage}/> */}
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <Box sx={useModalStyle}>
                    <Typography className="text-center">
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                           임시 저장글


                        </h3>
                    </Typography>
                     <hr/>
                         
                       <p className='text-center mb-28 mt-28'>   임시 저장글이 없습니다...       </p>          


                       
                           <div className="flex justify-center">
                            <Button 
                            className=' hover:border-[#DB2777] hover:bg-[#DB2777] hover:text-white'
                            color='gray' 
                            variant='outlined' 
                            onClick={() => setOpenModal(false)}>
                                {phrase(dictionary, "ok", language)}
                            </Button>             
                           </div>       
                </Box>
              </Modal>
        </div>
    )
}

export default AddChapterComponent;

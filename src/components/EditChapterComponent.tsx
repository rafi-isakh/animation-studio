"use client"

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext';
import { Chapter, Webnovel } from '@/components/Types';
import '@/styles/globals.css'
import { useLanguage } from '@/contexts/LanguageContext';
import { phrase } from '@/utils/phrases';
import { Button, ThemeProvider } from '@mui/material';
import AIEditorComponent from '@/components/AIEditorComponent';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import 'react-quill/dist/quill.snow.css';
import '@/styles/quill-custom.css'; // Add this import
import { grayTheme } from '@/styles/BlackWhiteButtonStyle';
import { useWebnovels } from '@/contexts/WebnovelsContext';
import { useToast } from "@/hooks/use-toast";


const EditChapterComponent = ({ webnovelId, webnovelTitle, webnovelContent, lastEdited }: { webnovelId: string, webnovelTitle: string, webnovelContent: string, lastEdited: string }) => {
    const [title, setTitle] = useState(webnovelTitle || '');
    const [content, setContent] = useState(webnovelContent || '');
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
    const { getWebnovelById, getWebnovelIdWithChapterMetadata } = useWebnovels();
    const [chapter, setChapter] = useState<Chapter | undefined>(undefined);
    const { invalidateCache } = useWebnovels();
    const clicked = useRef(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchChapter = async () => {
            setIsLoading(true);
            try {
                const chapter = await fetch(`/api/get_chapter_by_id?id=${webnovelId}`).then(res => res.json());
                if (chapter) {
                    setChapter(chapter);
                    if (chapter.title) {
                        setTitle(chapter.title);
                        setContent(chapter.content);
                    } else {
                        toast({
                            title: "Error",
                            description: "Chapter not found",
                            variant: "destructive",
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching webnovel:', error);
                toast({
                    title: "Error",
                    description: error instanceof Error ? error.message : "Failed to fetch webnovel data",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchChapter();
    }, [webnovelId])

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


    const handleEditChapter = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData();

        // Get plain text from title editor
        const titleEditor = titleRef.current?.getEditor();
        const titleText = titleEditor?.getText().trim() || "";

        // Get plain text from content editor
        const contentEditor = contentRef.current?.getEditor();
        const contentText = contentEditor?.getText().trim() || "";

        formData.append('title', titleText);
        formData.append('content', contentText);

        if (!titleText || !contentText) {
            return;
        }

        formData.append('webnovel_id', webnovelId);
        formData.append('last_edited', lastEdited);

        if (!maxExceeded) {
            let resPromise;
            if (!clicked.current) {
                resPromise = fetch('/api/edit_chapter', {
                    method: 'POST',
                    body: formData,
                });
                clicked.current = true;
            }
            Promise.resolve(resPromise).then(() => {
                invalidateCache();
                router.push(`/view_webnovels/${webnovelId}/chapter_view/${chapter?.id}`)
                router.refresh();
            })
        }
    };

    const handleClickAIEditor = (event: React.FormEvent) => {
        event.preventDefault();
        setOpenAIEditor(true);
    };

    const replaceSmartQuotes = (str: string) => {
        return str.replace(/[""]/g, '"').replace(/['']/g, "'");
    };

    return (
        <div className='md:w-[720px] p-6 mb-10 flex flex-col justify-center mx-auto border-none'>
            <form onSubmit={handleEditChapter}>
                <div className='flex flex-row justify-between'>
                    <h1 className='text-2xl font-bold mb-10'>{phrase(dictionary, "editChapter", language)}</h1>
                </div>
                <ThemeProvider theme={grayTheme}>
                    <div className="mr-4 flex flex-col space-y-4 w-full">
                        <div className='flex flex-col space-y-4 items-start'>
                            <p className='text-2xl font-bold'> {chapter?.title} </p>
                            {/* <p className='text-sm'> {webnovel?.description} </p> */}
                            <p className='text-sm'>
                                {chapter?.id}
                                {/* {language == 'ko' ? <>{' '}화</> : <></>} */}
                            </p>
                        </div>
                        <hr />
                        <div className="flex flex-col space-y-4 border border-gray-300 rounded-xl">
                            <ReactQuill
                                ref={titleRef}
                                theme="bubble"
                                value={title}
                                onChange={setTitle}
                                placeholder={webnovelTitle}
                                className="title-editor" />
                        </div>

                        <div className="flex flex-col space-y-4">
                            <div className="flex flex-row justify-between">
                                <h1 className='text-sm font-bold'>{phrase(dictionary, "content", language)}</h1>
                                <p className='text-sm text-[#DB2777]'>{currText} / {maxText}</p>
                            </div>
                            <div className='w-full max-w-full rounded-xl border border-gray-300'>
                                <ReactQuill
                                    ref={contentRef}
                                    theme="bubble"
                                    value={content}
                                    onChange={setContent}
                                    placeholder={chapter?.content || webnovelContent}
                                    className="content-editor" />
                            </div>

                            <div className='flex flex-row justify-end gap-4 items-end'>
                                <Button
                                    type="submit"
                                    variant="outlined"
                                    color="gray"
                                    className='whitespace-nowrap hover:border-[#DB2777] hover:bg-[#DB2777] hover:text-white mb-10'
                                >{phrase(dictionary, "edit", language)}</Button>
                                {/* <Button variant="contained" color="bw" onClick={handleClickAIEditor}>{phrase(dictionary, "aieditor", language)}</Button> */}
                            </div>
                        </div>

                    </div>
                </ThemeProvider>
            </form>
            {/* <AIEditorComponent openModal={openAIEditor} setOpenModal={setOpenAIEditor} text={content} novelLanguage={novelLanguage}/> */}
        </div>
    )
}

export default EditChapterComponent;
